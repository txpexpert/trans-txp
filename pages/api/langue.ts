// pages/api/langue.ts — enregistre la langue choisie (cookie) puis renvoie vers la page demandée.
import type { NextApiRequest, NextApiResponse } from 'next'
import { COOKIE_LANGUE } from '../../lib/langues'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const l = req.query.l === 'ar' ? 'ar' : 'fr'
  const r = typeof req.query.r === 'string' ? req.query.r : ''
  // Retour limité aux chemins du site (pas de redirection vers un autre domaine)
  const cible = /^\/(?![/\\])[^\s]*$/.test(r) ? r : (l === 'ar' ? '/ar' : '/')
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  res.setHeader('Set-Cookie', `${COOKIE_LANGUE}=${l}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`)
  res.setHeader('Cache-Control', 'no-store')
  res.redirect(302, cible)
}
