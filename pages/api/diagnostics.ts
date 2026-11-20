// pages/api/diagnostics.ts
// ─────────────────────────────────────────────────────────────────────────────
// Score d'exposition conservé dans le compte (refonte SaaS, étape 1).
//   GET  → historique des diagnostics du compte connecté (essai et offres payantes)
//   POST → enregistre le diagnostic qui vient d'être calculé dans l'outil
// Le compte Découverte (plan « free ») n'enregistre pas : l'outil lui propose
// l'essai Pro pour conserver son score. Session : cookie utilisateur signé.
// ─────────────────────────────────────────────────────────────────────────────
import type { NextApiRequest, NextApiResponse } from 'next'
import { verifyUserToken, USER_COOKIE } from '../../lib/userAuth'
import { supabaseAdmin } from '../../lib/supabaseAdmin'

const KEEP_PLANS = ['trial', 'pro', 'premium', 'enterprise']

function num(v: unknown): number | null {
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isFinite(n) ? n : null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = verifyUserToken(req.cookies[USER_COOKIE])
  if (!session) return res.status(401).json({ error: 'Non connecté', conserve: false })

  const db = supabaseAdmin()
  const { data: user } = await db.from('users').select('id, plan, statut').eq('id', session.userId).single()
  if (!user) return res.status(401).json({ error: 'Compte introuvable', conserve: false })

  const conserve = KEEP_PLANS.includes(user.plan) && user.statut !== 'expired'

  if (req.method === 'GET') {
    if (!conserve) return res.status(200).json({ conserve: false, plan: user.plan, historique: [] })
    const { data, error } = await db.from('diagnostics')
      .select('id, created_at, indice, ecarts, critiques, exposition_basse, exposition_haute, estimee, hypotheses')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(24)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ conserve: true, plan: user.plan, historique: data })
  }

  if (req.method === 'POST') {
    if (!conserve) return res.status(200).json({ conserve: false, plan: user.plan })
    const b = req.body || {}
    const row = {
      user_id: user.id,
      indice: num(b.indice),
      domaines: b.domaines && typeof b.domaines === 'object' ? b.domaines : null,
      ecarts: num(b.ecarts),
      critiques: num(b.critiques),
      exposition_basse: num(b.exposition_basse),
      exposition_haute: num(b.exposition_haute),
      estimee: !!b.estimee,
      hypotheses: typeof b.hypotheses === 'string' ? b.hypotheses.slice(0, 1000) : null,
      profil: b.profil && typeof b.profil === 'object' ? b.profil : null,
    }
    const { data, error } = await db.from('diagnostics').insert(row).select('id, created_at').single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ conserve: true, plan: user.plan, enregistre: data })
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Méthode non autorisée' })
}
