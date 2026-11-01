// pages/api/cron/expire-subscriptions.ts
// ─────────────────────────────────────────────────────────────────────────────
// Tâche quotidienne (vercel.json → crons) : passe en « expired » les
// abonnements annuels et essais arrivés à échéance, et journalise chaque
// changement dans subscription_events.
//
// Sécurité : Vercel envoie « Authorization: Bearer <CRON_SECRET> » quand la
// variable d'environnement CRON_SECRET est définie sur le projet. Un admin
// connecté (cookie das_admin) peut aussi déclencher la tâche à la main.
// ─────────────────────────────────────────────────────────────────────────────
import type { NextApiRequest, NextApiResponse } from 'next'
import { COOKIE_NAME, verifyToken } from '../../../lib/adminAuth'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const secret = process.env.CRON_SECRET
  const bearerOk = !!secret && req.headers.authorization === `Bearer ${secret}`
  const adminOk  = verifyToken(req.cookies[COOKIE_NAME])
  if (!bearerOk && !adminOk) return res.status(401).json({ error: 'Non autorisé' })

  const { data, error } = await supabaseAdmin().rpc('expire_subscriptions')
  if (error) {
    console.error('[cron/expire-subscriptions]', error)
    return res.status(500).json({ error: error.message })
  }
  return res.status(200).json({ ok: true, expired: data })
}
