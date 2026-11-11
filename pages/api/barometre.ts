// pages/api/barometre.ts — Baromètre 2026.
//   GET  → nombre de répondants et agrégats (pourcentages diffusés à partir de 10 répondants)
//   POST → enregistre une réponse (anonyme ; coordonnées seulement avec consentement)
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../lib/supabaseAdmin'
import { QUESTIONS } from '../../lib/barometre'
import { agregatsBarometre } from '../../lib/barometreAgregats'

const vus = new Map<string, number[]>()
function tropDeDemandes(ip: string, max: number) {
  const t = Date.now(), l = (vus.get(ip) || []).filter(x => t - x < 3600_000)
  l.push(t); vus.set(ip, l)
  return l.length > max
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    return res.status(200).json(await agregatsBarometre())
  }
  if (req.method === 'POST') {
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'inconnu'
    if (tropDeDemandes(ip, 15)) return res.status(429).json({ error: 'Trop de réponses envoyées depuis ce poste.' })
    const a = req.body?.reponses || {}
    const propres: Record<string, number[]> = {}
    for (const q of QUESTIONS) {
      const v = a[q.id]
      if (!Array.isArray(v) || !v.length) continue
      let idx = Array.from(new Set(v.map((x: any) => Number(x)).filter((x: number) => Number.isInteger(x) && x >= 0 && x < q.o.length)))
      if (q.type === 'one') idx = idx.slice(0, 1)
      if (q.max) idx = idx.slice(0, q.max)
      if (idx.length) propres[q.id] = idx
    }
    if (QUESTIONS.slice(0, 10).some(q => !propres[q.id])) return res.status(400).json({ error: 'Répondez au moins aux 10 premières questions.' })
    const c = req.body?.contact
    const mail = c?.mail && req.body?.consentement === true && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(c.mail)) ? String(c.mail).slice(0, 200) : null
    const { error } = await supabaseAdmin().from('barometre_reponses').insert({
      reponses: propres, contact_email: mail, contact_nom: mail && c?.nom ? String(c.nom).slice(0, 160) : null,
      source: req.body?.source === 'collecte' ? 'collecte' : 'web',
    })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(await agregatsBarometre())
  }
  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Méthode non autorisée' })
}
