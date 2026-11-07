// pages/api/analyses.ts
// ============================================================
// Assistant de la page Piloter « Analyses stratégiques ».
// Remplace l'appel à /api/analytics, route qui n'a jamais existé.
//
// Pipeline (même principe que /api/chat-homepage) :
//   1) embedding de la question enrichie du secteur et du périmètre ;
//   2) recherche des textes pertinents dans knowledge_chunks ;
//   3) analyse rédigée par le modèle à partir de ces seuls textes,
//      avec renvoi aux sources [n] ;
//   4) sources réelles renvoyées au navigateur (titre, numéro, date).
// Accès : module « analyses ». Limite : 5 questions / minute / IP.
// ============================================================

import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabase'
import { embedText } from '../../lib/ingestion'
import { checkAnyModuleAccess } from '../../lib/apiAuth'
import { rateLimitStrategic, getClientIP } from '../../lib/rate-limit'

const SECTEURS: Record<string, string> = {
  general: 'tous secteurs',
  textile: 'textile et habillement (chapitres 50 à 63)',
  automobile: 'automobile et équipements (chapitre 87)',
  agro: 'agroalimentaire et agriculture',
  industrie: 'industrie (chimie, plastiques, métaux, machines)',
  electro: 'électronique et électroménager (chapitres 84-85)',
  logistique: 'logistique et services',
}
const PERIMETRES: Record<string, string> = {
  monde: 'toutes origines',
  ue: 'Union européenne',
  turquie: 'Turquie',
  usa: 'États-Unis',
  uk: 'Royaume-Uni',
  arabe: 'pays arabes (Agadir, zone arabe)',
  afrique: 'Afrique (ZLECAf)',
  asie: 'Asie (Chine et autres, sans accord préférentiel)',
}

type Chunk = { titre: string; numero: string | null; contenu: string; type_document: string | null; date_document?: string | null }

const SYSTEM = (secteur: string, perimetre: string) => `Tu es l'analyste d'Import-eXPert, plateforme marocaine de conformité douanière et fiscale à l'import.
Tu rédiges une analyse courte et opérationnelle pour un dirigeant ou un responsable import.
Contexte de l'utilisateur : secteur « ${secteur} », origine des marchandises « ${perimetre} ».

Règles :
- Réponds uniquement à partir des textes fournis entre balises <sources>. N'invente aucun taux, numéro de circulaire, date ou chiffre.
- Cite chaque affirmation avec le numéro de la source entre crochets, par exemple [2].
- Si les textes ne suffisent pas, dis-le clairement et indique quelle vérification faire (texte à consulter, service à interroger).
- Structure : une phrase de réponse directe, puis « Ce que cela implique » (2 à 4 points), puis « À vérifier » (1 à 3 points).
- Français professionnel, phrases courtes, 250 mots au maximum. Pas de formule de politesse ni de signature.`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })

  const access = await checkAnyModuleAccess(req, 'analyses')
  if (!access.ok) return res.status(access.status).json({ error: access.error })

  try {
    const { success } = await rateLimitStrategic.limit(getClientIP(req))
    if (!success) return res.status(429).json({ error: 'Trop de questions en une minute. Patientez un instant.' })
  } catch (e) {
    console.error('[API analyses] limiteur indisponible', e) // le limiteur ne doit jamais bloquer l'analyse
  }

  const question = String(req.body?.question || '').trim().slice(0, 600)
  if (question.length < 8) return res.status(400).json({ error: 'Posez une question plus précise.' })
  const secteur = SECTEURS[String(req.body?.secteur)] || SECTEURS.general
  const perimetre = PERIMETRES[String(req.body?.perimetre)] || PERIMETRES.monde

  try {
    const emb = await embedText(`${question}\nSecteur : ${secteur}. Origine : ${perimetre}.`)
    const { data, error } = await supabase.rpc('match_knowledge_chunks', {
      query_embedding: emb,
      match_threshold: 0.33,
      match_count: 8,
    })
    if (error) throw error
    const chunks = (data ?? []) as Chunk[]

    const context = chunks
      .map((c, i) => `[${i + 1}] ${c.titre}${c.numero ? ` (n° ${c.numero})` : ''}\n${c.contenu}`)
      .join('\n\n---\n\n')

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1200,
        system: SYSTEM(secteur, perimetre),
        messages: [{ role: 'user', content: `<sources>\n${context || 'Aucun texte pertinent trouvé.'}\n</sources>\n\nQuestion : ${question}` }],
      }),
    })
    if (!r.ok) {
      console.error('[API analyses] modèle', r.status, await r.text())
      return res.status(502).json({ error: 'Analyse indisponible pour le moment. Réessayez dans un instant.' })
    }
    const out = await r.json()
    const text: string = (out?.content ?? []).filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('\n').trim()

    // Sources réellement citées dans la réponse, dans l'ordre des numéros
    const cited = Array.from(new Set((text.match(/\[(\d+)\]/g) || []).map(m => Number(m.slice(1, -1)))))
      .filter(n => n >= 1 && n <= chunks.length)
      .sort((a, b) => a - b)
    const sources = cited.map(n => {
      const c = chunks[n - 1]
      return { n, titre: c.titre, numero: c.numero, type: c.type_document }
    })

    return res.status(200).json({ text, sources })
  } catch (err) {
    console.error('[API analyses]', err)
    return res.status(500).json({ error: 'Erreur lors de l’analyse.' })
  }
}
