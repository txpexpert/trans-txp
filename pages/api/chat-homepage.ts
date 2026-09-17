// pages/api/chat-homepage.ts
// ─────────────────────────────────────────────────────────────────────────────
// Pipeline RAG pour le bouton "Soumettre" de la homepage.
// 1) Embedding de la question (OpenAI text-embedding-3-small)
// 2) Recherche des chunks pertinents dans knowledge_chunks (documentation
//    publique, via match_knowledge_chunks, client anon)
// 3) NOUVEAU — Recall mémoire : recherche dans user_memories (mémoire privée
//    du client, via match_user_memories, client service_role) pour
//    personnaliser la réponse avec des faits déjà connus sur ce client.
// 4) Génération de la réponse (Anthropic claude-sonnet-4-6)
// 5) Persistance de la conversation et des messages
// 6) NOUVEAU — Capture mémoire : si le message contient une formule du type
//    "retiens que...", le fait est extrait et sauvegardé dans user_memories
//    avec son embedding, pour rappel dans une future conversation.
// ─────────────────────────────────────────────────────────────────────────────

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { embedText } from '../../lib/ingestion'
import { verifyUserToken, canAccessModule, USER_COOKIE } from '../../lib/userAuth'
import { buildAssistantSystemPrompt, enforceResponseConstraints } from '../../lib/assistantPrompt'
import { extractMemoryFromMessage, generateMemoryKey } from '../../lib/memoryTriggers'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

type ChatResponse = {
  answer?: string
  sources?: { titre: string; numero: string | null; type_document: string | null }[]
  conversationId?: string
  memorySaved?: boolean
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const { message, conversationId, dossierId } = req.body as {
    message?: string
    history?: unknown[]
    conversationId?: string
    dossierId?: string
  }
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message requis' })
  }

  const session = verifyUserToken(req.cookies[USER_COOKIE])
  if (!session || !canAccessModule(session.plan, session.statut, 'chat-homepage', session.trialEnds)) {
    return res.status(403).json({
      error: 'Cette fonctionnalité est réservée aux abonnés. Connectez-vous ou souscrivez un abonnement.',
    })
  }

  try {
    // ------------------------------------------------------------
    // 0. Récupérer ou créer la conversation
    // ------------------------------------------------------------
    let activeConversationId = conversationId

    if (!activeConversationId) {
      const { data: newConv, error: convError } = await supabaseAdmin
        .from('conversations')
        .insert({ user_id: session.userId, dossier_id: dossierId ?? null, title: message.slice(0, 60) })
        .select('id')
        .single()

      if (convError) {
        console.error('Erreur création conversation:', convError)
      } else {
        activeConversationId = newConv.id
      }
    }

    if (activeConversationId) {
      await supabaseAdmin.from('messages').insert({
        conversation_id: activeConversationId,
        user_id: session.userId,
        role: 'user',
        content: message,
      })
    }

    // 1) Embedding de la question — réutilisé pour la recherche
    //    documentaire ET le recall mémoire (on ne paie l'embedding qu'une fois)
    const queryEmbedding = await embedText(message)

    // 2) Recherche vectorielle dans knowledge_chunks (documentation publique)
    const { data: chunks, error: searchError } = await supabase.rpc(
      'match_knowledge_chunks',
      { query_embedding: queryEmbedding, match_threshold: 0.35, match_count: 6 }
    )

    if (searchError) {
      console.error('Erreur recherche vectorielle:', searchError)
      return res.status(500).json({ error: 'Erreur lors de la recherche documentaire' })
    }

    // 3) Recall mémoire — échoue silencieusement (log only) : la mémoire
    //    est un plus, jamais un point de blocage du chat.
    let memoryContext = ''
    const { data: memories, error: memError } = await supabaseAdmin.rpc('match_user_memories', {
      p_user_id: session.userId,
      query_embedding: queryEmbedding,
      match_threshold: 0.75,
      match_count: 3,
      p_dossier_id: dossierId ?? null,
    })

    if (memError) {
      console.error('Erreur recall mémoire (non bloquant):', memError)
    } else if (memories && memories.length > 0) {
      memoryContext =
        `[CONTEXTE CLIENT — informations personnelles connues sur cet utilisateur, ` +
        `à utiliser UNIQUEMENT pour personnaliser le ton ou adapter la réponse à sa situation, ` +
        `jamais à citer comme une source documentaire]\n` +
        memories.map((m: { content: string }) => `- ${m.content}`).join('\n') +
        `\n\n`
    }

    if (!chunks || chunks.length === 0) {
      const fallbackAnswer =
        "Je n'ai pas trouvé d'élément suffisamment pertinent dans la base documentaire pour répondre avec certitude à cette question. Pourriez-vous la reformuler ou préciser le régime douanier concerné ?"

      if (activeConversationId) {
        await supabaseAdmin.from('messages').insert({
          conversation_id: activeConversationId,
          user_id: session.userId,
          role: 'assistant',
          content: fallbackAnswer,
        })
      }

      return res.status(200).json({ answer: fallbackAnswer, sources: [], conversationId: activeConversationId })
    }

    // 4) Construction du contexte (mémoire client + documentation) et génération
    const documentContext = chunks
      .map(
        (
          c: { titre: string; numero: string | null; contenu: string; type_document: string | null },
          i: number
        ) => {
          const typeLabel = c.type_document?.toLowerCase().includes('circulaire') ? 'circulaire' : 'note'
          return `[Source ${i + 1} - ${typeLabel}] ${c.titre}${c.numero ? ' (n° ' + c.numero + ')' : ''}\n${c.contenu}`
        }
      )
      .join('\n\n---\n\n')

    const systemPrompt = buildAssistantSystemPrompt(session.plan, memoryContext + documentContext)

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }],
      }),
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      console.error('Erreur Anthropic:', errText)
      return res.status(502).json({ error: 'Erreur lors de la génération de la réponse' })
    }

    const anthropicData = await anthropicRes.json()
    const rawAnswer =
      anthropicData?.content?.find((b: { type: string }) => b.type === 'text')?.text ?? 'Aucune réponse générée.'
    const answer = enforceResponseConstraints(rawAnswer, session.plan)

    const sources = chunks.map(
      (c: { titre: string; numero: string | null; type_document: string | null }) => ({
        titre: c.titre,
        numero: c.numero,
        type_document: c.type_document,
      })
    )

    if (activeConversationId) {
      await supabaseAdmin.from('messages').insert({
        conversation_id: activeConversationId,
        user_id: session.userId,
        role: 'assistant',
        content: answer,
        sources,
      })
    }

    // 5) Capture mémoire — si le message contient "retiens que...", on
    //    sauvegarde le fait extrait avec son propre embedding.
    let memorySaved = false
    const memoryToSave = extractMemoryFromMessage(message)
    if (memoryToSave) {
      try {
        const memoryEmbedding = await embedText(memoryToSave)
        const { error: saveError } = await supabaseAdmin.from('user_memories').insert({
          user_id: session.userId,
          dossier_id: dossierId ?? null,
          key: generateMemoryKey(memoryToSave),
          content: memoryToSave,
          embedding: memoryEmbedding,
        })
        memorySaved = !saveError
        if (saveError) console.error('Erreur sauvegarde mémoire (non bloquant):', saveError)
      } catch (e) {
        console.error('Erreur embedding mémoire (non bloquant):', e)
      }
    }

    return res.status(200).json({ answer, sources, conversationId: activeConversationId, memorySaved })
  } catch (err) {
    console.error('Erreur chat-homepage:', err)
    return res.status(500).json({ error: 'Erreur serveur lors du traitement de la question' })
  }
}
