/**
 * pages/api/admin/password.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Création / réinitialisation d'un mot de passe administrateur à partir d'un
 * lien à usage unique (invitation ou « mot de passe oublié »).
 *
 * GET  ?token=…              → { ok, email, purpose } si le lien est valide
 * POST { token, newPassword } → enregistre le mot de passe, active le compte,
 *                               invalide le lien et toutes les sessions ouvertes
 */
import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { MIN_PASSWORD_LENGTH, hashOneTimeToken, newSessionVersion } from '../../../lib/adminAuth'

async function findByToken(token: string) {
  if (!token || token.length < 20) return null
  const { data } = await supabaseAdmin().from('admin_accounts')
    .select('id, email, niveau, statut, token_purpose, token_expires')
    .eq('token_hash', hashOneTimeToken(token)).maybeSingle()
  if (!data || !data.token_expires || new Date(data.token_expires) < new Date()) return null
  if (data.statut === 'suspendu') return null
  return data
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const acc = await findByToken(String(req.query.token || ''))
    if (!acc) return res.status(404).json({ error: 'Lien invalide ou expiré. Demandez un nouveau lien.' })
    return res.status(200).json({ ok: true, email: acc.email, purpose: acc.token_purpose, niveau: acc.niveau })
  }

  if (req.method === 'POST') {
    const newPassword = String(req.body?.newPassword || '')
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ error: `Le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères.` })
    }
    const acc = await findByToken(String(req.body?.token || ''))
    if (!acc) return res.status(404).json({ error: 'Lien invalide ou expiré. Demandez un nouveau lien.' })

    const { error } = await supabaseAdmin().from('admin_accounts').update({
      password_hash: await bcrypt.hash(newPassword, 12),
      statut: 'actif',
      token_hash: null, token_purpose: null, token_expires: null,
      session_id: newSessionVersion(),
      login_attempts: 0, locked_until: null,
    }).eq('id', acc.id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true, niveau: acc.niveau })
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Method not allowed' })
}
