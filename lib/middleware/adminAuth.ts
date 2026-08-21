import type { NextApiRequest } from 'next'
import { verifyUserToken, USER_COOKIE } from '../userAuth'
export interface AdminAuthResult { valid: boolean; reason?: string }
export async function verifyAdminToken(req: NextApiRequest): Promise<AdminAuthResult> {
  const payload = verifyUserToken(req.cookies[USER_COOKIE])
  if (!payload) return { valid: false, reason: 'no_session' }
  const isAdmin = payload.email.toLowerCase() === (process.env.ADMIN_EMAIL ?? '').toLowerCase()
  return isAdmin ? { valid: true } : { valid: false, reason: 'not_admin' }
}
