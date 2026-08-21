// pages/api/admin/stats.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getDailyCost, getDashboardStats, checkCostAlert } from '../../../lib/services/logger'
import { COOKIE_NAME, verifyToken } from '../../../lib/adminAuth'

export const config = { api: { bodyParser: false } }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  // Corrigé — vérifiait auparavant le cookie dia_session (verifyAdminToken),
  // incompatible avec le cookie das_admin réellement posé par /api/admin/login.
  // Se connecter via le vrai formulaire ne donnait donc jamais accès ici.
  const authorized = verifyToken(req.cookies[COOKIE_NAME])
  if (!authorized) return res.status(401).json({ error: 'Non autorisé' })

  try {
    const { date } = req.query
    const targetDate = typeof date === 'string' ? date : undefined

    const [dailyCost, dashStats, alertTriggered] = await Promise.all([
      getDailyCost(targetDate),
      getDashboardStats(),
      checkCostAlert(parseInt(process.env.COST_ALERT_THRESHOLD_USD ?? '5', 10)),
    ])

    return res.status(200).json({
      date:        targetDate ?? new Date().toISOString().split('T')[0],
      dailyCost,
      dashboard:   dashStats,
      alerts:      { costAlert: alertTriggered, threshold: process.env.COST_ALERT_THRESHOLD_USD ?? '5' },
      generatedAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[admin/stats] error:', err)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}