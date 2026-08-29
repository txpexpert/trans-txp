/**
 * lib/userAuth.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Gestion auth utilisateurs : hash bcrypt, sessions signées HMAC (Node crypto).
 * Séparé de adminAuth.ts — cookies et secrets distincts.
 *
 * ⚠️ Ce fichier importe le module Node 'crypto' — NE PAS l'importer depuis
 * middleware.ts (Edge Runtime, 'crypto' indisponible). Pour l'Edge, utiliser
 * lib/edgeAuth.ts à la place. La logique de plans/modules (sans dépendance
 * Node) vit dans lib/moduleAccess.ts et est réexportée ci-dessous pour
 * compatibilité avec le code existant qui importe depuis userAuth.ts.
 *
 * ✅ Verrouillage de session (2026-08-29) : chaque connexion génère un
 * sessionId unique (crypto.randomUUID), stocké à la fois dans le jeton
 * (champ ci-dessous) et en base (colonne users.current_session_id, voir
 * pages/api/auth/login.ts). pages/api/auth/me.ts compare les deux à chaque
 * appel : s'ils diffèrent, une connexion plus récente a eu lieu ailleurs et
 * la session en cours est rejetée. Limite connue : le middleware Edge
 * (middleware.ts) ne fait pas cette vérification — voir note dans ce
 * fichier-là — donc une page /modules ou /tools déjà ouverte peut rester
 * techniquement accessible jusqu'à expiration naturelle du jeton.
 */
import crypto from 'crypto'
import { USER_COOKIE } from './moduleAccess'
import type { Plan, Statut } from './moduleAccess'
export * from './moduleAccess'

// ── Constants ─────────────────────────────────────────────────────────────────
const SECRET      = process.env.USER_SECRET || process.env.ADMIN_SECRET || 'dev-secret'
const SESSION_TTL = parseInt(process.env.USER_SESSION_TTL || '604800', 10) // 7 jours session

export interface SessionPayload {
  userId:    string
  email:     string
  plan:      Plan
  statut:    Statut
  trialEnds?: number
  sessionId: string   // ✅ identifiant unique de cette connexion précise
  exp:       number
}

// ── Token de session signé HMAC-SHA256 ────────────────────────────────────────
export function createUserToken(payload: Omit<SessionPayload, 'exp'>): string {
  const data    = { ...payload, exp: Date.now() + SESSION_TTL * 1000 }
  const encoded = Buffer.from(JSON.stringify(data)).toString('base64url')
  const sig     = crypto.createHmac('sha256', SECRET).update(encoded).digest('base64url')
  return `${encoded}.${sig}`
}

export function verifyUserToken(token: string | undefined): SessionPayload | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [encoded, sig] = parts
  const expected = crypto.createHmac('sha256', SECRET).update(encoded).digest('base64url')
  try {
    const valid = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    if (!valid) return null
    const payload: SessionPayload = JSON.parse(Buffer.from(encoded, 'base64url').toString())
    if (Date.now() > payload.exp) return null
    return payload
  } catch {
    return null
  }
}

// ── Cookie options ─────────────────────────────────────────────────────────────
export function userCookieOptions(token: string): string {
  const parts = [
    `${USER_COOKIE}=${token}`,
    `Max-Age=${SESSION_TTL}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ]
  if (process.env.NODE_ENV === 'production') parts.push('Secure')
  return parts.join('; ')
}

export function clearUserCookie(): string {
  return `${USER_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`
}
