// pages/api/partages/index.ts — portail transitaire : dossiers partagés avec les clients (liste, création).
import type { NextApiRequest, NextApiResponse } from 'next'
import { compteAbonne } from '../../../lib/compteAbonne'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { nettoyerPieces, nouveauJeton, notifierClient } from '../../../lib/portail'
import { siteUrl } from '../../../lib/adminAuth'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const c = await compteAbonne(req)
  if (!c) return res.status(401).json({ error: 'Non connecté' })
  if (!c.abonne) return res.status(403).json({ error: 'Le portail clients est inclus dans l’essai et les offres payantes.', code: 'ABONNEMENT' })
  const db = supabaseAdmin()

  if (req.method === 'GET') {
    const { data, error } = await db.from('partages')
      .select('id, token, client_nom, client_email, reference, statut, pieces, created_at, updated_at, vu_client_le, fiche_id, fiches_produits(designation, code_sh)')
      .eq('user_id', c.id).order('updated_at', { ascending: false }).limit(200)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ partages: data })
  }

  if (req.method === 'POST') {
    const b = req.body || {}
    const fiche_id = String(b.fiche_id || '')
    const client_nom = String(b.client_nom || '').trim().slice(0, 160)
    const client_email = String(b.client_email || '').trim().slice(0, 200) || null
    if (!/^[0-9a-f-]{36}$/i.test(fiche_id)) return res.status(400).json({ error: 'Choisissez une fiche produit.' })
    if (!client_nom) return res.status(400).json({ error: 'Le nom du client est obligatoire.' })
    if (client_email && !EMAIL.test(client_email)) return res.status(400).json({ error: 'Adresse email du client invalide.' })
    const { data: f } = await db.from('fiches_produits').select('id').eq('id', fiche_id).eq('user_id', c.id).maybeSingle()
    if (!f) return res.status(404).json({ error: 'Fiche introuvable' })
    const row = {
      user_id: c.id, fiche_id, client_nom, client_email, token: nouveauJeton(),
      reference: b.reference ? String(b.reference).slice(0, 80) : null,
      message: b.message ? String(b.message).slice(0, 1000) : null,
      pieces: nettoyerPieces(b.pieces),
    }
    const { data, error } = await db.from('partages').insert(row).select('id, token').single()
    if (error) return res.status(500).json({ error: error.message })
    let envoye = false
    if (b.envoyer && client_email) {
      const { data: u } = await db.from('users').select('raison_sociale, societe').eq('id', c.id).single()
      const r = await notifierClient(row, u?.raison_sociale || u?.societe || 'Votre transitaire', `${siteUrl(req)}/partage/${data.token}`, 'Votre dossier de dédouanement est ouvert')
      envoye = !!r.ok
    }
    return res.status(201).json({ partage: data, envoye })
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Méthode non autorisée' })
}
