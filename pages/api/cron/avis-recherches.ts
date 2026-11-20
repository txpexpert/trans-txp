// pages/api/cron/avis-recherches.ts — toutes les 10 minutes (vercel.json → crons) :
// e-mail au client quand la réponse validée devient visible (1 h à 2 h après la demande),
// et demandes restées « en génération » au-delà de 20 minutes passées en erreur.
import type { NextApiRequest, NextApiResponse } from 'next'
import { COOKIE_NAME, verifyToken, siteUrl } from '../../../lib/adminAuth'
import { runAvisRecherches } from '../../../lib/rechercheExperte'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const secret = process.env.CRON_SECRET
  const bearerOk = !!secret && req.headers.authorization === `Bearer ${secret}`
  if (!bearerOk && !verifyToken(req.cookies[COOKIE_NAME])) return res.status(401).json({ error: 'Non autorisé' })
  try {
    const n = await runAvisRecherches(siteUrl(req))
    return res.status(200).json({ ok: true, avis: n })
  } catch (e: any) {
    console.error('[cron/avis-recherches]', e)
    return res.status(500).json({ error: e?.message || 'Erreur' })
  }
}
