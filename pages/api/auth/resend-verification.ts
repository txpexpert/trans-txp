// pages/api/auth/resend-verification.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { sendVerificationEmail } from '../../../lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const VERIFY_TOKEN_TTL_MS = 48 * 60 * 60 * 1000

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email requis' })

  const { data: user } = await supabase
    .from('users')
    .select('id, email, prenom, email_verified')
    .eq('email', email.toLowerCase())
    .single()

  // Réponse identique que le compte existe ou non / soit déjà vérifié —
  // évite de confirmer à un tiers qu'un email est enregistré sur le site.
  const genericResponse = { success: true, message: 'Si un compte existe pour cet email et n\'est pas encore confirmé, un nouvel email vient d\'être envoyé.' }

  if (!user || user.email_verified) {
    return res.status(200).json(genericResponse)
  }

  const verifyToken = crypto.randomBytes(32).toString('hex')
  const verifyTokenExpires = new Date(Date.now() + VERIFY_TOKEN_TTL_MS).toISOString()

  await supabase
    .from('users')
    .update({ verify_token: verifyToken, verify_token_expires: verifyTokenExpires })
    .eq('id', user.id)

  await sendVerificationEmail(user.email, user.prenom || '', verifyToken)

  return res.status(200).json(genericResponse)
}
