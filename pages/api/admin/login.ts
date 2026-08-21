/**
 * pages/api/admin/login.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * POST { password } → vérifie contre ADMIN_PASSWORD → pose le cookie signé
 *
 * Protections :
 *   - Rate limiting simple (5 tentatives / IP / 15 min) via en-têtes
 *   - Comparaison timing-safe pour éviter les timing attacks
 *   - Cookie HttpOnly, SameSite=Lax, Secure en production
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'
import { COOKIE_NAME, createToken } from '../../../lib/adminAuth'

const TTL             = parseInt(process.env.ADMIN_SESSION_TTL || '86400', 10)
const ADMIN_PASSWORD  = process.env.ADMIN_PASSWORD || ''

// Rate limiting en mémoire (reset au redémarrage serveur — suffisant pour usage interne)
const attempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS    = 15 * 60 * 1000  // 15 minutes

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // ── Rate limiting ────────────────────────────────────────────────────────────
  const ip  = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown'
  const now = Date.now()
  const rec = attempts.get(ip)

  if (rec && now < rec.resetAt) {
    if (rec.count >= MAX_ATTEMPTS) {
      const retryIn = Math.ceil((rec.resetAt - now) / 60000)
      return res.status(429).json({
        error: `Trop de tentatives. Réessayez dans ${retryIn} minute(s).`
      })
    }
    rec.count++
  } else {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
  }

  // ── Vérification mot de passe (timing-safe) ───────────────────────────────────
  const { password } = req.body

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Mot de passe requis.' })
  }

  // timingSafeEqual requiert des buffers de même longueur
  const inputBuf    = Buffer.from(password.padEnd(64).slice(0, 64))
  const expectedBuf = Buffer.from(ADMIN_PASSWORD.padEnd(64).slice(0, 64))

  const match =
    crypto.timingSafeEqual(inputBuf, expectedBuf) &&
    password === ADMIN_PASSWORD   // double vérification longueur exacte

  if (!match) {
    return res.status(401).json({ error: 'Mot de passe incorrect.' })
  }

  // ── Succès : poser le cookie signé ───────────────────────────────────────────
  attempts.delete(ip)   // reset le compteur de tentatives

  const token = createToken()
  const isProduction = process.env.NODE_ENV === 'production'

  res.setHeader('Set-Cookie', [
    `${COOKIE_NAME}=${token}`,
    `Max-Age=${TTL}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    isProduction ? 'Secure' : '',
  ].filter(Boolean).join('; '))

  return res.status(200).json({ ok: true })
}
