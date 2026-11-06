// lib/decisionsGuard.ts
// ════════════════════════════════════════════════════════════
// Protection anti-extraction des décisions de classement.
// - Limite de débit par compte (cookie de session) et par IP.
// - Upstash Redis si configuré (UPSTASH_REDIS_REST_URL/TOKEN),
//   sinon repli en mémoire (par instance serverless).
// ════════════════════════════════════════════════════════════
import type { NextApiRequest } from 'next'
import crypto from 'crypto'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { USER_COOKIE } from './userAuth'

export const LIMITS = {
  suggest: { max: 60, windowSec: 60 },        // frappes dans la barre de recherche
  detail:  { max: 15, windowSec: 10 * 60 },   // fiches consultées
} as const
type Kind = keyof typeof LIMITS

const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
const upstash: Partial<Record<Kind, Ratelimit>> = {}
function limiter(kind: Kind): Ratelimit | null {
  if (!hasUpstash) return null
  if (!upstash[kind]) {
    const { max, windowSec } = LIMITS[kind]
    upstash[kind] = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(max, `${windowSec} s`),
      prefix: `rl:decisions:${kind}`,
    })
  }
  return upstash[kind]!
}

const memory = new Map<string, number[]>()
function memoryLimit(key: string, max: number, windowSec: number) {
  const now = Date.now(), win = windowSec * 1000
  const hits = (memory.get(key) || []).filter(t => now - t < win)
  const ok = hits.length < max
  if (ok) hits.push(now)
  memory.set(key, hits)
  if (memory.size > 5000) memory.clear()
  return { ok, remaining: Math.max(0, max - hits.length), reset: hits.length ? hits[0] + win : now + win }
}

function clientKey(req: NextApiRequest): string {
  const fwd = req.headers['x-forwarded-for']
  const ip = (Array.isArray(fwd) ? fwd[0] : (fwd || '').split(',')[0]).trim() || 'anonymous'
  const token = req.cookies?.[USER_COOKIE] || req.cookies?.['app_session'] || ''
  const who = token ? crypto.createHash('sha256').update(token).digest('hex').slice(0, 16) : 'anon'
  return `${who}:${ip}`
}

export async function checkRate(req: NextApiRequest, kind: Kind) {
  const { max, windowSec } = LIMITS[kind]
  const key = clientKey(req)
  const rl = limiter(kind)
  if (rl) {
    try {
      const r = await rl.limit(key)
      return { ok: r.success, remaining: r.remaining, reset: r.reset, max }
    } catch (e) {
      console.error('[decisionsGuard] Upstash indisponible, repli mémoire', e)
    }
  }
  return { ...memoryLimit(`${kind}:${key}`, max, windowSec), max }
}

/** Requête valide : au moins 3 lettres, ou au moins 4 chiffres pour un code SH. */
export function normalizeQuery(raw: unknown): { q: string; sh: boolean } | null {
  const q = String(raw ?? '').trim().slice(0, 80)
  if (/^[\d.\s]+$/.test(q)) {
    const digits = q.replace(/\D/g, '')
    return digits.length >= 4 ? { q: digits, sh: true } : null
  }
  const clean = q.replace(/[%_,()]/g, ' ').replace(/\s+/g, ' ').trim()
  return clean.replace(/\s/g, '').length >= 3 ? { q: clean, sh: false } : null
}
