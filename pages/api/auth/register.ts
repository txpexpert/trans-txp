// pages/api/auth/register.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { createUserToken, userCookieOptions, TRIAL_TTL_MS } from '../../../lib/userAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!    // ← clé SERVICE (pas anon) pour bypasser RLS
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, password, nom, prenom, societe, profil } = req.body

  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' })
  if (password.length < 8) return res.status(400).json({ error: 'Mot de passe trop court (8 caractères minimum)' })

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase())
    .single()

  if (existing) return res.status(409).json({ error: 'Cet email est déjà utilisé' })

  const password_hash = await bcrypt.hash(password, 12)

  const { data: user, error } = await supabase
    .from('users')
    .insert({
      email: email.toLowerCase(),
      password_hash,
      nom, prenom, societe,
      profil: profil || 'autre',
      plan: 'trial',
      statut: 'trial',
      trial_ends_at: new Date(Date.now() + TRIAL_TTL_MS).toISOString(),
    })
    .select('id, email, plan, statut, trial_ends_at')
    .single()

  if (error) {
    console.error('[register]', error)
    return res.status(500).json({ error: 'Erreur lors de la création du compte' })
  }

  const token = createUserToken({
    userId:    user.id,
    email:     user.email,
    plan:      user.plan,
    statut:    user.statut,
    // ✅ FIX — même logique que login.ts : trialEnds transmis dès la création
    // du compte, disponible immédiatement dans le dashboard.
    trialEnds: user.trial_ends_at ? new Date(user.trial_ends_at).getTime() : undefined,
  })

  res.setHeader('Set-Cookie', userCookieOptions(token))
  return res.status(201).json({
    success: true,
    user: { id: user.id, email: user.email, plan: user.plan, statut: user.statut },
  })
}
