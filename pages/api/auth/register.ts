
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { createUserToken, userCookieOptions } from '../../../lib/userAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!    // ← clé SERVICE (pas anon) pour bypasser RLS
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, password, nom, prenom, societe, profil } = req.body

  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' })
  if (password.length < 8) return res.status(400).json({ error: 'Mot de passe trop court (8 caractères minimum)' })

  // Vérifier si l'email existe déjà
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase())
    .single()

  if (existing) return res.status(409).json({ error: 'Cet email est déjà utilisé' })

  // Hasher le mot de passe
  const password_hash = await bcrypt.hash(password, 12)

  // Créer l'utilisateur
  const { data: user, error } = await supabase
    .from('users')
    .insert({
      email: email.toLowerCase(),
      password_hash,
      nom, prenom, societe,
      profil: profil || 'autre',
      plan: 'trial',
      statut: 'trial',
      trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select('id, email, plan, statut, trial_ends_at')
    .single()

  if (error) {
    console.error('[register]', error)
    return res.status(500).json({ error: 'Erreur lors de la création du compte' })
  }

  // Créer la session immédiatement
  const token = createUserToken({
    userId:    user.id,
    email:     user.email,
    plan:      user.plan,
    statut:    user.statut,
  })

  res.setHeader('Set-Cookie', userCookieOptions(token))
  return res.status(201).json({
    success: true,
    user: { id: user.id, email: user.email, plan: user.plan, statut: user.statut },
  })
}
