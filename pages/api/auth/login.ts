// pages/api/auth/login.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { createUserToken, userCookieOptions } from '../../../lib/userAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// ✅ Email admin lu depuis .env — jamais hardcodé dans le code
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ''

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, password } = req.body

  if (process.env.NODE_ENV === 'development') {
    console.log('[login] email:', email, '| password length:', password?.length)
  }

  if (!email || !password) return res.status(400).json({ error: 'Champs requis' })

  const { data: user, error: dbError } = await supabase
    .from('users')
    .select('id, email, password_hash, plan, statut, trial_ends_at, login_attempts, locked_until, role')
    .eq('email', email.toLowerCase())
    .single()

  if (process.env.NODE_ENV === 'development') {
    console.log('[login] user found:', !!user, '| db error:', dbError?.message)
  }

  if (!user) {
    await new Promise(r => setTimeout(r, 200))
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' })
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[login] statut:', user.statut, '| attempts:', user.login_attempts)
  }

  if (user.statut === 'suspended')
    return res.status(403).json({ error: 'Compte suspendu.' })

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const mins = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000)
    return res.status(429).json({ error: `Compte verrouillé ${mins} min.` })
  }

  const valid = await bcrypt.compare(password, user.password_hash)

  if (process.env.NODE_ENV === 'development') {
    console.log('[login] bcrypt valid:', valid)
  }

  if (!valid) {
    const attempts = (user.login_attempts || 0) + 1
    const locked_until = attempts >= 5
      ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
      : null
    await supabase
      .from('users')
      .update({ login_attempts: attempts, locked_until })
      .eq('id', user.id)
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' })
  }

  let statut = user.statut
  if (statut === 'trial' && user.trial_ends_at && new Date(user.trial_ends_at) < new Date()) {
    statut = 'expired'
    await supabase.from('users').update({ statut: 'expired' }).eq('id', user.id)
  }

  // ✅ Verrouillage de session — un identifiant unique par connexion. Toute
  // connexion ultérieure (même compte, autre appareil) écrase cette valeur
  // en base, ce qui invalide automatiquement la session précédente dès son
  // prochain passage par /api/auth/me (voir ce fichier pour la vérification).
  const sessionId = crypto.randomUUID()

  await supabase.from('users').update({
    login_attempts:      0,
    locked_until:        null,
    last_login_at:       new Date().toISOString(),
    current_session_id:  sessionId,
  }).eq('id', user.id)

  const role: string = user.role ?? (email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user')

  const token = createUserToken({
    userId: user.id,
    email:  user.email,
    plan:   user.plan,
    statut,
    sessionId,
    // ✅ FIX — trialEnds renseigné depuis la base : permet au dashboard client
    // d'afficher la date de fin d'essai / renouvellement sans requête supplémentaire.
    trialEnds: user.trial_ends_at ? new Date(user.trial_ends_at).getTime() : undefined,
  })
  res.setHeader('Set-Cookie', userCookieOptions(token))

  if (process.env.NODE_ENV === 'development') {
    console.log('[login] SUCCESS — role:', role)
  }

  return res.status(200).json({ success: true, role })
}
