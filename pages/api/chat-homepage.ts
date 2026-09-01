// pages/api/chat-homepage.ts
// ─────────────────────────────────────────────────────────────────────────────
// Pipeline RAG pour le bouton "Soumettre" de la homepage.
// 1) Embedding de la question (OpenAI text-embedding-3-small)
// 2) Recherche des chunks pertinents dans knowledge_chunks (Supabase pgvector,
//    via la fonction SQL match_knowledge_chunks)
// 3) Génération de la réponse (Anthropic claude-sonnet-4-6), à partir
//    UNIQUEMENT du contexte retrouvé
// ─────────────────────────────────────────────────────────────────────────────

import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabase'
import { embedText } from '../../lib/ingestion'
import { verifyUserToken, canAccessModule, USER_COOKIE } from '../../lib/userAuth'
import { buildAssistantSystemPrompt, enforceResponseConstraints } from '../../lib/assistantPrompt'

type ChatResponse = {
  answer?: string
  sources?: { titre: string; numero: string | null; type_document: string | null }[]
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const { message } = req.body as { message?: string; history?: unknown[] }
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message requis' })
  }
  // Module chat réservé aux comptes abonnés (essai ou payant) — pas d'accès anonyme
  const session = verifyUserToken(req.cookies[USER_COOKIE])
  if (!session || !canAccessModule(session.plan, session.statut, 'chat-homepage', session.trialEnds)) {
    return res.status(403).json({
      error: 'Cette fonctionnalité est réservée aux abonnés. Connectez-vous ou souscrivez un abonnement.',
    })
  }
  try {
    // 1) Embedding de la question
    const queryEmbedding = await embedText(message)

    // 2) Recherche vectorielle dans knowledge_chunks
    const { data: chunks, error: searchError } = await supabase.rpc(
      'match_knowledge_chunks',
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.35,
        match_count: 6,
      }
    )

    if (searchError) {
      console.error('Erreur recherche vectorielle:', searchError)
      return res.status(500).json({ error: 'Erreur lors de la recherche documentaire' })
    }

    if (!chunks || chunks.length === 0) {
      return res.status(200).json({
        answer:
          "Je n'ai pas trouvé d'élément suffisamment pertinent dans la base documentaire pour répondre avec certitude à cette question. Pourriez-vous la reformuler ou préciser le régime douanier concerné ?",
        sources: [],
      })
    }

    // 3) Construction du contexte et génération de la réponse
    // Le type de document (circulaire / note) est injecté dans le libellé de
    // chaque source : c'est ce terme que le prompt système utilise (règle 5)
    // pour décider d'afficher ou de masquer la référence. Par prudence, un
    // type manquant ou inconnu est étiqueté "note" (jamais l'inverse).
    const context = chunks
      .map(
        (
          c: { titre: string; numero: string | null; contenu: string; type_document: string | null },
          i: number
        ) => {
          const typeLabel = c.type_document?.toLowerCase().includes('circulaire')
            ? 'circulaire'
            : 'note'
          return `[Source ${i + 1} - ${typeLabel}] ${c.titre}${c.numero ? ' (n° ' + c.numero + ')' : ''}\n${c.contenu}`
        }
      )
      .join('\n\n---\n\n')

    const systemPrompt = buildAssistantSystemPrompt(session.plan, context)

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
      anthropicData?.content?.find((b: { type: string }) => b.type === 'text')?.text ??
      "Aucune réponse générée."
    const answer = enforceResponseConstraints(rawAnswer, session.plan)

    const sources = chunks.map(
      (c: { titre: string; numero: string | null; type_document: string | null }) => ({
        titre: c.titre,
        numero: c.numero,
        type_document: c.type_document,
      })
    )

    return res.status(200).json({ answer, sources })
  } catch (err) {
    console.error('Erreur chat-homepage:', err)
    return res.status(500).json({ error: 'Erreur serveur lors du traitement de la question' })
  }
}
