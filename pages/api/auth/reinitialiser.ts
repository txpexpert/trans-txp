/**
 * pages/api/auth/reinitialiser.ts — nouveau mot de passe à partir du lien reçu par email (2026-11-14)
 *
 * GET  ?token=…              → { ok } si le lien est valide (affichage du formulaire)
 * POST { token, nouveau }    → enregistre le mot de passe, invalide le lien,
 *                              ferme toutes les sessions ouvertes, déverrouille
 *                              le compte et confirme l'email (le lien prouve
 *                              que la personne reçoit bien les emails de cette adresse).
 * L'utilisateur se reconnecte ensuite avec son nouveau mot de passe.
 */
import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { clearUserCookie } from '../../../lib/userAuth'
import { empreinteJeton, verifierMotDePasse } from '../../../lib/motDePasse'

const INVALIDE = 'Lien invalide ou expiré. Demandez un nouveau lien.'

async function compteDuJeton(jeton: string) {
  if (!jeton || jeton.length < 20) return null
  const { data } = await supabaseAdmin().from('users')
    .select('id, email, statut, reset_token_expires')
    .eq('reset_token_hash', empreinteJeton(jeton)).maybeSingle()
  if (!data || !data.reset_token_expires || new Date(data.reset_token_expires) < new Date()) return null
  if (data.statut === 'suspended') return null
  return data
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'GET') {
    const u = await compteDuJeton(String(req.query.token || ''))
    if (!u) return res.status(404).json({ error: INVALIDE })
    return res.status(200).json({ ok: true })
  }

  if (req.method !== 'POST') return res.status(405).end()

  const u = await compteDuJeton(String(req.body?.token || ''))
  if (!u) return res.status(404).json({ error: INVALIDE })

  const nouveau = String(req.body?.nouveau || '')
  const err = verifierMotDePasse(nouveau, u.email)
  if (err) return res.status(400).json({ error: err })

  const { error } = await supabaseAdmin().from('users').update({
    password_hash:       await bcrypt.hash(nouveau, 12),
    password_changed_at: new Date().toISOString(),
    reset_token_hash:    null,
    reset_token_expires: null,
    current_session_id:  crypto.randomUUID(), // ferme toutes les sessions ouvertes
    login_attempts:      0,
    locked_until:        null,
    email_verified:      true,
  }).eq('id', u.id)
  if (error) return res.status(500).json({ error: 'Enregistrement impossible, réessayez.' })

  res.setHeader('Set-Cookie', clearUserCookie())
  return res.status(200).json({ ok: true })
}
