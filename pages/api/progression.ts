// pages/api/progression.ts — progression du parcours du compte connecté (abonnés uniquement).
import type { NextApiRequest, NextApiResponse } from 'next'
import { compteAbonne } from '../../lib/compteAbonne'
import { etatProgression } from '../../lib/progression'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée' })
  const c = await compteAbonne(req)
  if (!c || !c.abonne) return res.status(200).json({ abonne: false })
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json({ abonne: true, etapes: await etatProgression(c.id) })
}
