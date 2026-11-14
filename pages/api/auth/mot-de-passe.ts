/**
 * pages/api/auth/mot-de-passe.ts — changement du mot de passe par l'abonné connecté (2026-11-14)
 *
 * POST { actuel, nouveau }
 *   - session client valide et non remplacée ;
 *   - mot de passe actuel vérifié (bcrypt) ; 5 erreurs → verrouillage 15 min, comme à la connexion ;
 *   - nouveau mot de passe conforme à lib/motDePasse.ts et différent de l'actuel.
 * Effet : nouvel identifiant de session. Cet appareil reste connecté (cookie réémis),
 * toutes les autres sessions ouvertes sur ce compte sont fermées.
 */
import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { verifyUserToken, createUserToken, userCookieOptions, USER_COOKIE } from '../../../lib/userAuth'
import { verifierMotDePasse } from '../../../lib/motDePasse'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const payload = verifyUserToken(req.cookies[USER_COOKIE])
  if (!payload) return res.status(401).json({ error: 'Session expirée : reconnectez-vous.' })

  const actuel  = String(req.body?.actuel || '')
  const nouveau = String(req.body?.nouveau || '')
  if (!actuel || !nouveau) return res.status(400).json({ error: 'Mot de passe actuel et nouveau mot de passe requis.' })

  const sb = supabaseAdmin()
  const { data: u } = await sb.from('users')
    .select('id, email, password_hash, current_session_id, login_attempts, locked_until, statut')
    .eq('id', payload.userId).maybeSingle()
  if (!u || u.email.toLowerCase() !== payload.email.toLowerCase()) return res.status(401).json({ error: 'Compte introuvable.' })
  if (u.current_session_id && u.current_session_id !== payload.sessionId) return res.status(401).json({ error: 'Session fermée : une connexion plus récente a eu lieu.' })
  if (u.statut === 'suspended') return res.status(403).json({ error: 'Compte suspendu.' })
  if (u.locked_until && new Date(u.locked_until) > new Date()) {
    return res.status(429).json({ error: `Trop d'essais : réessayez dans ${Math.ceil((new Date(u.locked_until).getTime() - Date.now()) / 60000)} min.` })
  }

  const ok = await bcrypt.compare(actuel, u.password_hash)
  if (!ok) {
    const n = (u.login_attempts || 0) + 1
    await sb.from('users').update({
      login_attempts: n,
      locked_until: n >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null,
    }).eq('id', u.id)
    return res.status(401).json({ error: 'Mot de passe actuel incorrect.' })
  }

  const err = verifierMotDePasse(nouveau, u.email)
  if (err) return res.status(400).json({ error: err })
  if (await bcrypt.compare(nouveau, u.password_hash)) return res.status(400).json({ error: 'Le nouveau mot de passe doit être différent de l’actuel.' })

  const sessionId = crypto.randomUUID()
  const { error } = await sb.from('users').update({
    password_hash:       await bcrypt.hash(nouveau, 12),
    password_changed_at: new Date().toISOString(),
    current_session_id:  sessionId,
    login_attempts:      0,
    locked_until:        null,
    reset_token_hash:    null,
    reset_token_expires: null,
  }).eq('id', u.id)
  if (error) return res.status(500).json({ error: 'Enregistrement impossible, réessayez.' })

  const { exp: _exp, ...reste } = payload
  res.setHeader('Set-Cookie', userCookieOptions(createUserToken({ ...reste, sessionId })))
  return res.status(200).json({ ok: true })
}
