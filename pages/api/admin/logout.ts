/**
 * pages/api/admin/logout.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * POST → efface les deux cookies administrateur (backoffice et gestion).
 */
import type { NextApiRequest, NextApiResponse } from 'next'
import { COOKIE_NAME, GESTION_COOKIE, clearCookie } from '../../../lib/adminAuth'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  res.setHeader('Set-Cookie', [clearCookie(COOKIE_NAME), clearCookie(GESTION_COOKIE)])
  return res.status(200).json({ ok: true })
}
