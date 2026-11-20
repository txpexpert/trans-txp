// pages/api/partages/[id].ts — un dossier partagé : lecture, mise à jour (statut, pièces, message), suppression.
import type { NextApiRequest, NextApiResponse } from 'next'
import { compteAbonne } from '../../../lib/compteAbonne'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { LIB_STATUT, nettoyerPieces, notifierClient } from '../../../lib/portail'
import { siteUrl } from '../../../lib/adminAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const c = await compteAbonne(req)
  if (!c) return res.status(401).json({ error: 'Non connecté' })
  if (!c.abonne) return res.status(403).json({ error: 'Abonnement requis', code: 'ABONNEMENT' })
  const id = String(req.query.id || '')
  if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ error: 'Identifiant invalide' })
  const db = supabaseAdmin()
  const { data: p } = await db.from('partages').select('*, fiches_produits(designation, code_sh)').eq('id', id).eq('user_id', c.id).maybeSingle()
  if (!p) return res.status(404).json({ error: 'Dossier introuvable' })

  if (req.method === 'GET') return res.status(200).json({ partage: p })

  if (req.method === 'PATCH') {
    const b = req.body || {}
    const upd: Record<string, any> = { updated_at: new Date().toISOString() }
    if (b.statut && LIB_STATUT[b.statut]) upd.statut = b.statut
    if ('pieces' in b) upd.pieces = nettoyerPieces(b.pieces)
    if ('message' in b) upd.message = b.message ? String(b.message).slice(0, 1000) : null
    if ('client_email' in b) upd.client_email = b.client_email ? String(b.client_email).trim().slice(0, 200) : null
    const { data, error } = await db.from('partages').update(upd).eq('id', id).eq('user_id', c.id).select('*').single()
    if (error) return res.status(500).json({ error: error.message })
    let envoye = false
    if (b.notifier && data.client_email) {
      const { data: u } = await db.from('users').select('raison_sociale, societe').eq('id', c.id).single()
      const quoi = upd.statut && upd.statut !== p.statut ? `Votre dossier passe à l’étape « ${LIB_STATUT[upd.statut]} »` : 'Votre dossier a été mis à jour'
      envoye = !!(await notifierClient(data, u?.raison_sociale || u?.societe || 'Votre transitaire', `${siteUrl(req)}/partage/${data.token}`, quoi)).ok
    }
    return res.status(200).json({ partage: { ...data, fiches_produits: p.fiches_produits }, envoye })
  }

  if (req.method === 'DELETE') {
    const { error } = await db.from('partages').delete().eq('id', id).eq('user_id', c.id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }
  res.setHeader('Allow', 'GET, PATCH, DELETE')
  return res.status(405).json({ error: 'Méthode non autorisée' })
}
