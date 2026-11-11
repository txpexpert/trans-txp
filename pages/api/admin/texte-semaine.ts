// pages/api/admin/texte-semaine.ts — « Le texte de la semaine » : brouillon court (5 lignes) expliquant
// une circulaire ou une note récente, à relayer sur WhatsApp ou LinkedIn après relecture.
// Le brouillon est rédigé à partir du seul texte officiel ; aucune donnée personnelle n'est envoyée.
import type { NextApiRequest, NextApiResponse } from 'next'
import { COOKIE_NAME, verifyToken } from '../../../lib/adminAuth'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export const config = { maxDuration: 60 }

const CONSIGNE = `Tu rédiges « Le texte de la semaine » d'Import-eXPert, plateforme de conformité import au Maroc.
À partir du seul texte officiel fourni, écris en français un message de 5 lignes au plus, destiné à des importateurs, transitaires et directions financières :
1. Le texte : type, numéro et date, en une ligne.
2. Ce qui change, concrètement.
3. Qui est concerné (produits, codes SH, régimes, opérateurs).
4. Ce qu'il faut faire, ou vérifier.
5. Une dernière ligne : « Vérifiez vos produits concernés sur import-expert.ma ».
Règles : n'invente rien, ne cite que ce qui figure dans le texte ; pas d'adjectifs promotionnels ; si une information manque, ne la mentionne pas. Réponds par le message seul.`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!verifyToken(req.cookies[COOKIE_NAME])) return res.status(401).json({ error: 'Non autorisé' })
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })
  const numero = String(req.body?.numero || '').slice(0, 60)
  if (!numero) return res.status(400).json({ error: 'Numéro du texte requis' })
  const { data: chunks } = await supabaseAdmin().from('knowledge_chunks')
    .select('type_document, numero, date_document, titre, contenu, chunk_index').eq('numero', numero).order('chunk_index').limit(8)
  if (!chunks?.length) return res.status(404).json({ error: 'Texte introuvable dans la base' })
  const t = chunks[0]
  const corps = chunks.map(c => c.contenu).join('\n').slice(0, 9000)
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'Clé de l’assistant non configurée sur cet environnement' })
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6', max_tokens: 600, system: CONSIGNE,
      messages: [{ role: 'user', content: `Type : ${t.type_document}\nNuméro : ${t.numero}\nDate : ${t.date_document || ''}\nTitre : ${t.titre || ''}\n\nTexte :\n${corps}` }],
    }),
  })
  if (!r.ok) return res.status(502).json({ error: 'Rédaction impossible pour le moment' })
  const j = await r.json()
  const texte = (j?.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n').trim()
  return res.status(200).json({ texte })
}
