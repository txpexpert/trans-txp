// pages/api/auth/me.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { verifyUserToken, USER_COOKIE } from '../../../lib/userAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ''

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token   = req.cookies[USER_COOKIE]
  const payload = verifyUserToken(token)

  if (!payload) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  // ✅ FIX — même logique que login.ts : priorité à la colonne 'role' en base,
  // fallback sur la comparaison ADMIN_EMAIL. Avant ce patch, me.ts ignorait
  // totalement la colonne 'role' et un admin défini uniquement via cette
  // colonne redevenait 'user' au premier rafraîchissement de page.
  //
  // ✅ Verrouillage de session (2026-08-29) : on récupère aussi
  // current_session_id pour la comparer au sessionId du jeton. Si elles
  // diffèrent, une connexion plus récente a eu lieu ailleurs sur ce compte
  // — cette session-ci est donc périmée, même si le jeton est encore
  // valide et non expiré.
  const { data: dbUser } = await supabase
    .from('users')
    .select('role, current_session_id')
    .eq('email', payload.email.toLowerCase())
    .single()

  if (dbUser?.current_session_id && dbUser.current_session_id !== payload.sessionId) {
    return res.status(401).json({ error: 'Session invalidée — une connexion plus récente a eu lieu sur ce compte.' })
  }

  const role: string =
    dbUser?.role ?? (payload.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user')

  return res.status(200).json({
    role,
    email:     payload.email,
    plan:      payload.plan,
    statut:    payload.statut,
    trialEnds: payload.trialEnds ?? null,
  })
}
