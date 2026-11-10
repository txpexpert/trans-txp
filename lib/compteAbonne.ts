// lib/compteAbonne.ts
// Session utilisateur + droit aux fonctions du compte (fiches, progression, score).
// Abonné = essai ou offre payante en cours, ou administrateur.
import type { NextApiRequest } from 'next'
import { verifyUserToken, USER_COOKIE } from './userAuth'
import { supabaseAdmin } from './supabaseAdmin'

export type CompteAbonne = { id: string; email: string; plan: string; statut: string; role: string | null; abonne: boolean }

export async function compteAbonne(req: NextApiRequest): Promise<CompteAbonne | null> {
  const session = verifyUserToken(req.cookies[USER_COOKIE])
  if (!session) return null
  const { data: u } = await supabaseAdmin().from('users')
    .select('id, email, plan, statut, role, current_session_id').eq('id', session.userId).single()
  if (!u) return null
  if (u.current_session_id && u.current_session_id !== session.sessionId) return null
  const admin = u.role === 'admin' || u.role === 'generaladmin'
  const actif = ['trial', 'pro', 'premium', 'enterprise'].includes(u.plan) && (u.statut === 'active' || u.statut === 'trial')
  return { id: u.id, email: u.email, plan: u.plan, statut: u.statut, role: u.role, abonne: admin || actif }
}
