// pages/api/auth/register.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { TRIAL_TTL_MS } from '../../../lib/userAuth'
import { sendVerificationEmail } from '../../../lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!    // ← clé SERVICE (pas anon) pour bypasser RLS
)

const VERIFY_TOKEN_TTL_MS = 48 * 60 * 60 * 1000 // 48h

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, password, nom, prenom, societe, telephone, profil } = req.body

  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' })
  if (password.length < 8) return res.status(400).json({ error: 'Mot de passe trop court (8 caractères minimum)' })

  // ✅ Exception d'abonnement (2026-08-29) : les adresses administration
  // marocaine (.gov.ma) ne sont pas acceptées pour l'inscription. Vérifié
  // ici (backend), pas seulement dans le formulaire — sinon un appel direct
  // à cette API contournerait la restriction.
  if (email.toLowerCase().trim().endsWith('.gov.ma')) {
    return res.status(403).json({ error: 'Les adresses email .gov.ma ne sont pas acceptées pour cet abonnement.' })
  }

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase())
    .single()

  if (existing) return res.status(409).json({ error: 'Cet email est déjà utilisé' })

  const password_hash = await bcrypt.hash(password, 12)

  // ── Vérification d'email ──────────────────────────────────────────────────
  // Le compte est créé immédiatement (essai de 14 jours calculé dès
  // maintenant, cf. TRIAL_TTL_MS), mais NE PEUT PAS se connecter tant que
  // l'email n'est pas confirmé — voir la vérification ajoutée dans login.ts.
  // Le compteur d'essai démarre à l'inscription, pas à la confirmation :
  // laisser traîner un email non confirmé ne prolonge pas l'essai gratuit.
  const verifyToken = crypto.randomBytes(32).toString('hex')
  const verifyTokenExpires = new Date(Date.now() + VERIFY_TOKEN_TTL_MS).toISOString()

  const { data: user, error } = await supabase
    .from('users')
    .insert({
      email: email.toLowerCase(),
      password_hash,
      nom, prenom, societe,
      telephone: telephone || null,
      profil: profil || 'autre',
      plan: 'trial',
      statut: 'trial',
      trial_ends_at: new Date(Date.now() + TRIAL_TTL_MS).toISOString(),
      email_verified: false,
      verify_token: verifyToken,
      verify_token_expires: verifyTokenExpires,
    })
    .select('id, email, prenom')
    .single()

  if (error) {
    console.error('[register]', error)
    return res.status(500).json({ error: 'Erreur lors de la création du compte' })
  }

  const emailResult = await sendVerificationEmail(user.email, user.prenom || '', verifyToken)
  if (!emailResult.ok) {
    // Le compte existe déjà en base à ce stade — on ne l'annule pas pour un
    // simple échec d'envoi (l'utilisateur peut redemander l'email ensuite),
    // mais on le signale clairement au front pour qu'il informe l'utilisateur.
    console.error('[register] Email de vérification non envoyé pour', user.email)
    return res.status(201).json({
      success: true,
      emailSent: false,
      message: 'Compte créé, mais l\'email de confirmation n\'a pas pu être envoyé. Contactez le support.',
    })
  }

  // Pas de cookie de session ici — la connexion ne sera possible qu'après
  // avoir cliqué le lien reçu par email (voir verify-email.ts).
  return res.status(201).json({
    success: true,
    emailSent: true,
    message: 'Compte créé ! Vérifiez votre boîte mail pour confirmer votre adresse et activer votre essai.',
  })
}
