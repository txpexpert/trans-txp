// pages/api/fiches/index.ts — fiches produits du compte : liste (GET) et création (POST).
import type { NextApiRequest, NextApiResponse } from 'next'
import { compteAbonne } from '../../../lib/compteAbonne'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { nettoyerFiche } from '../../../lib/fichesChamps'
import { enregistrerDepuisFiche, ficheComplete } from '../../../lib/progression'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const c = await compteAbonne(req)
  if (!c) return res.status(401).json({ error: 'Non connecté' })
  if (!c.abonne) return res.status(403).json({ error: 'Les fiches produits sont incluses dans l’essai et les offres payantes.', code: 'ABONNEMENT' })
  const db = supabaseAdmin()

  if (req.method === 'GET') {
    const { data, error } = await db.from('fiches_produits')
      .select('id, designation, ref_interne, code_sh, taux_droit, pays_origine, statut, updated_at')
      .eq('user_id', c.id).order('updated_at', { ascending: false }).limit(200)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ fiches: data })
  }

  if (req.method === 'POST') {
    const champs = nettoyerFiche(req.body)
    if (!champs.designation) return res.status(400).json({ error: 'La désignation est obligatoire.' })
    const row = { ...champs, user_id: c.id, verifie_le: new Date().toISOString().slice(0, 10), statut: ficheComplete(champs) ? 'complete' : 'brouillon' }
    const { data, error } = await db.from('fiches_produits').insert(row).select('*').single()
    if (error) return res.status(500).json({ error: error.message })
    await enregistrerDepuisFiche(c.id, data)
    return res.status(201).json({ fiche: data })
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Méthode non autorisée' })
}
