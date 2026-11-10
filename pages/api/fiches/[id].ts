// pages/api/fiches/[id].ts — une fiche produit : lecture, mise à jour, suppression.
import type { NextApiRequest, NextApiResponse } from 'next'
import { compteAbonne } from '../../../lib/compteAbonne'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { nettoyerFiche } from '../../../lib/fichesChamps'
import { enregistrerDepuisFiche, ficheComplete } from '../../../lib/progression'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const c = await compteAbonne(req)
  if (!c) return res.status(401).json({ error: 'Non connecté' })
  if (!c.abonne) return res.status(403).json({ error: 'Abonnement requis', code: 'ABONNEMENT' })
  const id = String(req.query.id || '')
  if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ error: 'Identifiant invalide' })
  const db = supabaseAdmin()
  const { data: f } = await db.from('fiches_produits').select('*').eq('id', id).eq('user_id', c.id).maybeSingle()
  if (!f) return res.status(404).json({ error: 'Fiche introuvable' })

  if (req.method === 'GET') return res.status(200).json({ fiche: f })

  if (req.method === 'PUT') {
    const champs = nettoyerFiche(req.body)
    const merged = { ...f, ...champs }
    const upd = { ...champs, updated_at: new Date().toISOString(), verifie_le: new Date().toISOString().slice(0, 10), statut: ficheComplete(merged) ? 'complete' : 'brouillon' }
    const { data, error } = await db.from('fiches_produits').update(upd).eq('id', id).eq('user_id', c.id).select('*').single()
    if (error) return res.status(500).json({ error: error.message })
    await enregistrerDepuisFiche(c.id, data)
    return res.status(200).json({ fiche: data })
  }

  if (req.method === 'DELETE') {
    const { error } = await db.from('fiches_produits').delete().eq('id', id).eq('user_id', c.id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  res.setHeader('Allow', 'GET, PUT, DELETE')
  return res.status(405).json({ error: 'Méthode non autorisée' })
}
