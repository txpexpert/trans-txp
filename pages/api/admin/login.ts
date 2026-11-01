/**
 * pages/api/admin/login.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Connexion administrateur nominative (2026-11-01).
 *
 * POST { email, password, scope }
 *   scope 'backoffice' → réservé au super-administrateur, pose das_admin
 *   scope 'gestion'    → administrateurs de type 2, pose das_gestion
 *                        (le super-administrateur utilise son accès backoffice)
 *
 * Réponses particulières :
 *   409 { code: 'SETUP_REQUIRED' } — compte maître sans mot de passe : la page
 *       propose « Créer mon mot de passe » (voir /api/admin/setup-master).
 *   403 { code: 'INVITE_PENDING' } — invitation non encore acceptée.
 *
 * Protections : limitation par IP (mémoire) + verrouillage du compte 15 min
 * après 5 échecs, comparaison bcrypt, message d'erreur identique que l'email
 * existe ou non.
 */
import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { COOKIE_NAME, GESTION_COOKIE, createToken, sessionCookie, newSessionVersion, type AdminScope } from '../../../lib/adminAuth'

const attempts = new Map<string, { count: number; resetAt: number }>()
const MAX_IP_ATTEMPTS = 10
const WINDOW_MS = 15 * 60 * 1000
const BAD = 'Email ou mot de passe incorrect.'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown'
  const now = Date.now()
  const rec = attempts.get(ip)
  if (rec && now < rec.resetAt) {
    if (rec.count >= MAX_IP_ATTEMPTS) {
      return res.status(429).json({ error: `Trop de tentatives. Réessayez dans ${Math.ceil((rec.resetAt - now) / 60000)} minute(s).` })
    }
    rec.count++
  } else {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
  }

  const email = String(req.body?.email || '').trim().toLowerCase()
  const password = String(req.body?.password || '')
  const scope: AdminScope = req.body?.scope === 'gestion' ? 'gestion' : 'backoffice'
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis.' })

  const sb = supabaseAdmin()
  const { data: acc } = await sb.from('admin_accounts')
    .select('id, email, niveau, statut, password_hash, session_id, login_attempts, locked_until')
    .eq('email', email).maybeSingle()

  if (!acc) { await new Promise(r => setTimeout(r, 250)); return res.status(401).json({ error: BAD }) }

  if (acc.niveau === 'super' && !acc.password_hash) {
    return res.status(409).json({ code: 'SETUP_REQUIRED', error: 'Compte maître : créez d’abord votre mot de passe personnel.' })
  }
  if (acc.locked_until && new Date(acc.locked_until) > new Date()) {
    return res.status(429).json({ error: `Compte verrouillé ${Math.ceil((new Date(acc.locked_until).getTime() - now) / 60000)} min après plusieurs échecs.` })
  }

  const ok = !!acc.password_hash && await bcrypt.compare(password, acc.password_hash)
  if (!ok) {
    const n = (acc.login_attempts || 0) + 1
    await sb.from('admin_accounts').update({
      login_attempts: n,
      locked_until: n >= 5 ? new Date(now + WINDOW_MS).toISOString() : null,
    }).eq('id', acc.id)
    return res.status(401).json({ error: BAD })
  }

  if (acc.statut === 'invite')   return res.status(403).json({ code: 'INVITE_PENDING', error: 'Invitation non activée : utilisez le lien reçu par email.' })
  if (acc.statut === 'suspendu') return res.status(403).json({ error: 'Accès suspendu. Contactez le super-administrateur.' })

  if (scope === 'backoffice' && acc.niveau !== 'super') {
    return res.status(403).json({ code: 'WRONG_SPACE', error: 'Votre accès concerne la page « Gestion des abonnements ».' })
  }
  if (scope === 'gestion' && acc.niveau === 'super') {
    return res.status(403).json({ code: 'USE_BACKOFFICE', error: 'Super-administrateur : connectez-vous au backoffice, la Gestion des abonnements y est accessible.' })
  }

  const sv = acc.session_id || newSessionVersion()
  await sb.from('admin_accounts').update({
    login_attempts: 0, locked_until: null, last_login_at: new Date().toISOString(), session_id: sv,
  }).eq('id', acc.id)

  attempts.delete(ip)
  const token = createToken({ aid: acc.id, email: acc.email, niveau: acc.niveau, scope, sv })
  res.setHeader('Set-Cookie', sessionCookie(scope === 'backoffice' ? COOKIE_NAME : GESTION_COOKIE, token))
  return res.status(200).json({ ok: true, niveau: acc.niveau })
}
