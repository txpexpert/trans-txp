// pages/api/cron/expire-subscriptions.ts
// ─────────────────────────────────────────────────────────────────────────────
// Tâche quotidienne (vercel.json → crons) :
//   1. passe en « expired » les abonnements annuels et essais arrivés à
//      échéance, et journalise chaque changement dans subscription_events ;
//   2. facturation (lib/billingCron.ts) : pro-forma de fin d'essai, pro-forma
//      de renouvellement à J-30, rappels J-7 / J-0, relance des pro-formas
//      impayées.
//
// Sécurité : Vercel envoie « Authorization: Bearer <CRON_SECRET> » quand la
// variable d'environnement CRON_SECRET est définie sur le projet. Un admin
// connecté (cookie das_admin) peut aussi déclencher la tâche à la main.
// ─────────────────────────────────────────────────────────────────────────────
import type { NextApiRequest, NextApiResponse } from 'next'
import { COOKIE_NAME, verifyToken, siteUrl } from '../../../lib/adminAuth'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { runBillingCron } from '../../../lib/billingCron'
import { runTrialEndReports } from '../../../lib/scoreReport'

export const config = { maxDuration: 60 }

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

  let billing: Awaited<ReturnType<typeof runBillingCron>> | { error: string }
  try {
    billing = await runBillingCron(siteUrl(req))
    if (billing.erreurs.length) console.error('[cron/billing]', billing.erreurs)
  } catch (e: any) {
    console.error('[cron/billing]', e)
    billing = { error: e?.message || 'Erreur facturation' }
  }
  // Rapport de score d'exposition à la fin de l'essai (refonte SaaS, étape 1)
  let scores: Awaited<ReturnType<typeof runTrialEndReports>> | { error: string }
  try {
    scores = await runTrialEndReports(siteUrl(req))
    if (scores.erreurs.length) console.error('[cron/scores]', scores.erreurs)
  } catch (e: any) {
    console.error('[cron/scores]', e)
    scores = { error: e?.message || 'Erreur rapport de score' }
  }
  return res.status(200).json({ ok: true, expired: data, billing, scores })
}
