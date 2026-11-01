/**
 * pages/api/admin/setup-master.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Création du mot de passe personnel du compte maître (super-administrateur),
 * UNE SEULE FOIS. Preuve demandée : l'ancien mot de passe partagé
 * ADMIN_PASSWORD (variable d'environnement Vercel), connu du seul concepteur.
 *
 * Dès que le compte maître a un mot de passe, cette route refuse toute
 * nouvelle demande : ADMIN_PASSWORD n'ouvre plus rien. Un oubli ultérieur se
 * règle par « Mot de passe oublié » (lien envoyé à l'email du compte maître).
 *
 * POST { email, adminPassword, newPassword }
 */
import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { COOKIE_NAME, MIN_PASSWORD_LENGTH, createToken, sessionCookie, newSessionVersion } from '../../../lib/adminAuth'

let failures = 0
let blockedUntil = 0

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (Date.now() < blockedUntil) return res.status(429).json({ error: 'Trop de tentatives. Réessayez dans 15 minutes.' })

  const email = String(req.body?.email || '').trim().toLowerCase()
  const adminPassword = String(req.body?.adminPassword || '')
  const newPassword = String(req.body?.newPassword || '')

  const expected = process.env.ADMIN_PASSWORD || ''
  if (!expected) return res.status(500).json({ error: 'ADMIN_PASSWORD n’est pas configuré sur le serveur.' })
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `Le nouveau mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères.` })
  }
  if (newPassword === expected) {
    return res.status(400).json({ error: 'Choisissez un mot de passe différent de l’ancien mot de passe partagé.' })
  }

  const sb = supabaseAdmin()
  const { data: acc } = await sb.from('admin_accounts')
    .select('id, email, niveau, password_hash').eq('niveau', 'super').maybeSingle()
  if (!acc || acc.email !== email) return res.status(403).json({ error: 'Seul le compte maître peut utiliser cette étape.' })
  if (acc.password_hash) return res.status(409).json({ error: 'Le mot de passe du compte maître est déjà créé. Utilisez « Mot de passe oublié ».' })

  const a = crypto.createHash('sha256').update(adminPassword).digest()
  const b = crypto.createHash('sha256').update(expected).digest()
  if (!crypto.timingSafeEqual(a, b)) {
    failures++
    if (failures >= 5) { blockedUntil = Date.now() + 15 * 60 * 1000; failures = 0 }
    return res.status(401).json({ error: 'Ancien mot de passe partagé incorrect.' })
  }
  failures = 0

  const sv = newSessionVersion()
  const { error } = await sb.from('admin_accounts').update({
    password_hash: await bcrypt.hash(newPassword, 12),
    statut: 'actif', session_id: sv, login_attempts: 0, locked_until: null,
    last_login_at: new Date().toISOString(),
  }).eq('id', acc.id)
  if (error) return res.status(500).json({ error: error.message })

  res.setHeader('Set-Cookie', sessionCookie(COOKIE_NAME,
    createToken({ aid: acc.id, email: acc.email, niveau: 'super', scope: 'backoffice', sv })))
  return res.status(200).json({ ok: true })
}
