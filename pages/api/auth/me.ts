// pages/api/auth/me.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { verifyUserToken, createUserToken, userCookieOptions, clearUserCookie, USER_COOKIE } from '../../../lib/userAuth'
import type { Plan, Statut } from '../../../lib/userAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ''

const PAID_PLANS = ['pro', 'premium', 'enterprise']

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token   = req.cookies[USER_COOKIE]
  const payload = verifyUserToken(token)

  if (!payload) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  // ✅ FIX — même logique que login.ts : priorité à la colonne 'role' en base,
  // fallback sur la comparaison ADMIN_EMAIL.
  //
  // ✅ Verrouillage de session (2026-08-29) : comparaison de current_session_id
  // avec le sessionId du jeton (connexion plus récente ailleurs → rejet).
  //
  // ✅ Abonnements (2026-11-01) : plan, statut et échéances sont relus EN BASE
  // à chaque appel. Avant, ils n'existaient que dans le cookie signé à la
  // connexion : un plan activé depuis le backoffice n'était visible qu'après
  // reconnexion du client (jusqu'à 7 jours). Si la base diffère du cookie, le
  // cookie est réémis avec les nouvelles valeurs — le middleware Edge, qui ne
  // lit que le cookie, voit alors aussi le nouveau plan.
  const { data: dbUser, error: dbError } = await supabase
    .from('users')
    .select('role, current_session_id, numero_abonne, plan, statut, trial_ends_at, plan_ends_at, prenom, nom, societe')
    .eq('email', payload.email.toLowerCase())
    .single()

  // ✅ Compte supprimé depuis le backoffice (2026-11-01) : la session encore
  // ouverte est refusée et le cookie effacé (sinon le middleware, qui ne lit
  // que le cookie, laisserait l'accès jusqu'à expiration du jeton). PGRST116 =
  // aucune ligne ; une simple erreur réseau ne déconnecte personne.
  if (!dbUser && dbError?.code === 'PGRST116') {
    res.setHeader('Set-Cookie', clearUserCookie())
    return res.status(401).json({ error: 'Ce compte n\'existe plus.' })
  }

  if (dbUser?.current_session_id && dbUser.current_session_id !== payload.sessionId) {
    return res.status(401).json({ error: 'Session invalidée — une connexion plus récente a eu lieu sur ce compte.' })
  }

  const role: string =
    dbUser?.role ?? (payload.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user')

  let plan      = (dbUser?.plan   ?? payload.plan)   as Plan
  let statut    = (dbUser?.statut ?? payload.statut) as Statut
  const trialEnds = dbUser
    ? (dbUser.trial_ends_at ? new Date(dbUser.trial_ends_at).getTime() : undefined)
    : payload.trialEnds
  const planEnds  = dbUser?.plan_ends_at ? new Date(dbUser.plan_ends_at).getTime() : null

  // Échéance dépassée mais tâche quotidienne pas encore passée : on applique
  // l'expiration immédiatement côté session (la base sera mise à jour par
  // /api/cron/expire-subscriptions).
  if (statut === 'active' && PAID_PLANS.includes(plan) && planEnds && planEnds < Date.now()) statut = 'expired'
  if (statut === 'trial' && trialEnds && trialEnds < Date.now()) statut = 'expired'

  if (dbUser && (plan !== payload.plan || statut !== payload.statut || trialEnds !== payload.trialEnds)) {
    const fresh = createUserToken({
      userId:    payload.userId,
      email:     payload.email,
      plan,
      statut,
      sessionId: payload.sessionId,
      trialEnds,
    })
    res.setHeader('Set-Cookie', userCookieOptions(fresh))
  }

  return res.status(200).json({
    role,
    numero:    dbUser?.numero_abonne ?? null,
    email:     payload.email,
    prenom:    dbUser?.prenom ?? null,
    nom:       dbUser?.nom ?? null,
    societe:   dbUser?.societe ?? null,
    plan,
    statut,
    trialEnds: trialEnds ?? null,
    planEnds,
  })
}
