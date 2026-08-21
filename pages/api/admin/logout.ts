/**
 * pages/api/admin/logout.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * POST → invalide le cookie admin → redirect /admin/login
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { COOKIE_NAME } from '../../../lib/adminAuth'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Écraser le cookie avec expiration immédiate
  res.setHeader('Set-Cookie',
    `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`
  )

  return res.status(200).json({ ok: true })
}
