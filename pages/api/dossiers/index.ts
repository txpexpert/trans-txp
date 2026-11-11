// pages/api/dossiers/index.ts — dossiers défendables du compte : liste (GET), émission (POST).
import type { NextApiRequest, NextApiResponse } from 'next'
import { compteAbonne } from '../../../lib/compteAbonne'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { empreinte, figerFiche, nouveauNumero } from '../../../lib/dossiers'

const txt = (v: any, n = 200) => (v == null || v === '' ? null : String(v).slice(0, n))

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const c = await compteAbonne(req)
  if (!c) return res.status(401).json({ error: 'Non connecté' })
  if (!c.abonne) return res.status(403).json({ error: 'Les dossiers défendables sont inclus dans l’essai et les offres payantes.', code: 'ABONNEMENT' })
  const db = supabaseAdmin()

  if (req.method === 'GET') {
    const { data, error } = await db.from('dossiers')
      .select('id, numero, created_at, type, titre, statut, fiches').eq('user_id', c.id)
      .order('created_at', { ascending: false }).limit(100)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ dossiers: (data ?? []).map(d => ({ ...d, fiches: undefined, nb_fiches: Array.isArray(d.fiches) ? d.fiches.length : 0 })) })
  }

  if (req.method === 'POST') {
    const b = req.body || {}
    const ids: string[] = Array.isArray(b.fiche_ids) ? b.fiche_ids.filter((x: any) => /^[0-9a-f-]{36}$/i.test(String(x))).slice(0, 50) : []
    if (!ids.length) return res.status(400).json({ error: 'Choisissez au moins une fiche produit.' })
    const type = b.type === 'operation' ? 'operation' : 'produit'
    const { data: fiches, error: e1 } = await db.from('fiches_produits').select('*').eq('user_id', c.id).in('id', ids)
    if (e1) return res.status(500).json({ error: e1.message })
    if (!fiches?.length) return res.status(404).json({ error: 'Fiches introuvables' })
    const ordre = new Map(ids.map((id, i) => [id, i]))
    fiches.sort((a, z) => (ordre.get(a.id) ?? 0) - (ordre.get(z.id) ?? 0))

    const { data: u } = await db.from('users').select('societe, raison_sociale, ice, nom, prenom').eq('id', c.id).single()
    const titulaire = {
      raison_sociale: u?.raison_sociale || u?.societe || [u?.prenom, u?.nom].filter(Boolean).join(' ') || null,
      ice: u?.ice || null,
    }
    const operation = type === 'operation' ? {
      reference_dum: txt(b.operation?.reference_dum, 60),
      date: txt(b.operation?.date, 20),
      facture: txt(b.operation?.facture, 80),
      bureau: txt(b.operation?.bureau, 120),
      regime: txt(b.operation?.regime, 120),
      transitaire: txt(b.operation?.transitaire, 120),
    } : null
    const titre = txt(b.titre, 160) || (type === 'operation'
      ? `Opération ${operation?.reference_dum || operation?.facture || ''}`.trim()
      : fiches.length === 1 ? fiches[0].designation : `${fiches.length} produits`)
    const created_at = new Date().toISOString()
    const numero = nouveauNumero()
    const contenu = { numero, created_at, type, titre: titre!, operation, titulaire, fiches: fiches.map(figerFiche) }
    const row = { ...contenu, user_id: c.id, empreinte: empreinte(contenu) }
    const { data, error } = await db.from('dossiers').insert(row).select('id, numero').single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json({ dossier: data })
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Méthode non autorisée' })
}
