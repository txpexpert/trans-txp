// lib/compteAbonne.ts
// Session utilisateur + droit aux fonctions du compte (fiches, progression, score).
// Abonné = essai en cours ou offre payante en cours, ou administrateur.
// Découverte = tout autre compte non suspendu (compte gratuit, essai terminé sans
// abonnement, abonnement échu) : fiches produits dans la limite de lib/quotas.ts,
// veille sur ses produits, progression. Les fonctions payantes restent réservées.
import type { NextApiRequest } from 'next'
import { verifyUserToken, USER_COOKIE } from './userAuth'
import { supabaseAdmin } from './supabaseAdmin'

export type CompteAbonne = { id: string; email: string; plan: string; statut: string; role: string | null; abonne: boolean; decouverte: boolean }

export async function compteAbonne(req: NextApiRequest): Promise<CompteAbonne | null> {
  const session = verifyUserToken(req.cookies[USER_COOKIE])
  if (!session) return null
  const { data: u } = await supabaseAdmin().from('users')
    .select('id, email, plan, statut, role, current_session_id, trial_ends_at').eq('id', session.userId).single()
  if (!u) return null
  if (u.current_session_id && u.current_session_id !== session.sessionId) return null
  const admin = u.role === 'admin' || u.role === 'generaladmin'
  const essaiEnCours = u.plan === 'trial' && u.statut === 'trial' && (!u.trial_ends_at || new Date(u.trial_ends_at) > new Date())
  const payant = ['pro', 'premium', 'enterprise'].includes(u.plan) && u.statut === 'active'
  const abonne = admin || essaiEnCours || payant
  return { id: u.id, email: u.email, plan: u.plan, statut: u.statut, role: u.role, abonne, decouverte: !abonne && u.statut !== 'suspended' }
}
