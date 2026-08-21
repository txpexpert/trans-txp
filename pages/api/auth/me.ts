// pages/api/auth/me.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { verifyUserToken, USER_COOKIE } from '../../../lib/userAuth'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // ✅ Nom de cookie lu depuis la constante — pas hardcodé
  const token   = req.cookies[USER_COOKIE]
  // ✅ verifyUserToken retourne null (pas d'exception) — pas de try-catch nécessaire
  const payload = verifyUserToken(token)

  if (!payload) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  // ✅ Rôle dérivé server-side — jamais exposé dans le bundle client
  const role = payload.email.toLowerCase() === (process.env.ADMIN_EMAIL ?? '').toLowerCase()
    ? 'admin'
    : 'user'

  return res.status(200).json({
    role,
    email:  payload.email,
    plan:   payload.plan,
    statut: payload.statut,
  })
}