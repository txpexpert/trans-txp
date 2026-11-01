/**
 * pages/api/admin/forgot.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * « Mot de passe oublié » administrateur. POST { email }.
 * Envoie un lien de réinitialisation (48 h) à l'adresse du compte s'il existe
 * et n'est pas suspendu. Réponse toujours identique, que l'email existe ou
 * non (aucune information sur les comptes existants).
 */
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { newOneTimeToken, siteUrl } from '../../../lib/adminAuth'
import { sendAdminResetEmail } from '../../../lib/email'

const lastRequest = new Map<string, number>()
const OK = { ok: true, message: 'Si cette adresse correspond à un accès administrateur, un lien vient d’y être envoyé.' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const email = String(req.body?.email || '').trim().toLowerCase()
  if (!email) return res.status(400).json({ error: 'Email requis.' })

  // Une demande par adresse toutes les 2 minutes.
  const last = lastRequest.get(email) || 0
  if (Date.now() - last < 120_000) return res.status(200).json(OK)
  lastRequest.set(email, Date.now())

  const sb = supabaseAdmin()
  const { data: acc } = await sb.from('admin_accounts').select('id, email, niveau, statut, password_hash').eq('email', email).maybeSingle()
  // Le compte maître sans mot de passe passe par l'étape « Créer mon mot de passe ».
  if (!acc || acc.statut === 'suspendu' || (acc.niveau === 'super' && !acc.password_hash)) return res.status(200).json(OK)

  const { token, hash } = newOneTimeToken()
  await sb.from('admin_accounts').update({
    token_hash: hash,
    token_purpose: acc.statut === 'invite' ? 'invitation' : 'reinitialisation',
    token_expires: new Date(Date.now() + 48 * 3600_000).toISOString(),
  }).eq('id', acc.id)

  const r = await sendAdminResetEmail(acc.email, `${siteUrl(req)}/gestion-abonnements/mot-de-passe?token=${token}`)
  if (!r.ok) console.error('[admin/forgot] email non envoyé pour', acc.email)
  return res.status(200).json(OK)
}
