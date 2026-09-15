// pages/api/auth/verify-email.ts
// ─────────────────────────────────────────────────────────────────────────────
// Point d'arrivée du lien envoyé par lib/email.ts (sendVerificationEmail).
// GET /api/auth/verify-email?token=...
//
// Si le token est valide et non expiré : marque le compte comme vérifié,
// connecte automatiquement l'utilisateur (évite une étape de reconnexion
// manuelle juste après avoir cliqué le lien), puis redirige vers l'accueil.
// ─────────────────────────────────────────────────────────────────────────────

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { createUserToken, userCookieOptions } from '../../../lib/userAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.query

  if (!token || typeof token !== 'string') {
    return res.redirect(302, '/auth/login?verify=missing')
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, plan, statut, trial_ends_at, verify_token_expires')
    .eq('verify_token', token)
    .single()

  if (error || !user) {
    return res.redirect(302, '/auth/login?verify=invalid')
  }

  if (user.verify_token_expires && new Date(user.verify_token_expires) < new Date()) {
    return res.redirect(302, '/auth/login?verify=expired')
  }

  const sessionId = crypto.randomUUID()

  await supabase
    .from('users')
    .update({
      email_verified: true,
      verify_token: null,
      verify_token_expires: null,
      current_session_id: sessionId,
      last_login_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  const authToken = createUserToken({
    userId: user.id,
    email: user.email,
    plan: user.plan,
    statut: user.statut,
    sessionId,
    trialEnds: user.trial_ends_at ? new Date(user.trial_ends_at).getTime() : undefined,
  })

  res.setHeader('Set-Cookie', userCookieOptions(authToken))
  return res.redirect(302, '/?verified=1')
}
