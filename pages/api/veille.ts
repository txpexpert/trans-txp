// pages/api/veille.ts — veille « mes produits » du compte connecté (12 derniers mois).
import type { NextApiRequest, NextApiResponse } from 'next'
import { compteAbonne } from '../../lib/compteAbonne'
import { supabaseAdmin } from '../../lib/supabaseAdmin'
import { veilleCompte } from '../../lib/veille'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée' })
  const c = await compteAbonne(req)
  if (!c) return res.status(401).json({ error: 'Non connecté' })
  if (!c.abonne && !c.decouverte) return res.status(403).json({ error: 'La veille sur vos produits est incluse dans l’essai et les offres payantes.', code: 'ABONNEMENT' })
  try {
    const alertes = await veilleCompte(c.id)
    const { data: fiches } = await supabaseAdmin().from('fiches_produits').select('id, designation, code_sh, verifie_le').eq('user_id', c.id)
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({ alertes, fiches: fiches ?? [] })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Veille indisponible' })
  }
}
