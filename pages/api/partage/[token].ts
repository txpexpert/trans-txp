// pages/api/partage/[token].ts — accès client au dossier partagé par son transitaire (sans compte).
//   GET  → dossier : transitaire, référence, statut, pièces demandées, fiche produit
//   POST → le client signale une pièce transmise ({ index, note })
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { notifierTransitaire } from '../../../lib/portail'
import { siteUrl } from '../../../lib/adminAuth'

const vus = new Map<string, number[]>()
function tropDeDemandes(ip: string) {
  const t = Date.now(), l = (vus.get(ip) || []).filter(x => t - x < 600_000)
  l.push(t); vus.set(ip, l)
  return l.length > 60
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'inconnu'
  if (tropDeDemandes(ip)) return res.status(429).json({ error: 'Trop de demandes, réessayez plus tard.' })
  const token = String(req.query.token || '')
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(token)) return res.status(404).json({ error: 'Lien invalide' })
  const db = supabaseAdmin()
  const { data: p } = await db.from('partages').select('*').eq('token', token).maybeSingle()
  if (!p) return res.status(404).json({ error: 'Ce lien n’est plus valide.' })
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'GET') {
    const [{ data: f }, { data: u }] = await Promise.all([
      db.from('fiches_produits').select('*').eq('id', p.fiche_id).maybeSingle(),
      db.from('users').select('raison_sociale, societe').eq('id', p.user_id).single(),
    ])
    await db.from('partages').update({ vu_client_le: new Date().toISOString() }).eq('id', p.id)
    const fiche = f ? { ...f, user_id: undefined, notes: undefined } : null
    return res.status(200).json({
      transitaire: u?.raison_sociale || u?.societe || 'Votre transitaire',
      client_nom: p.client_nom, reference: p.reference, statut: p.statut, pieces: p.pieces, message: p.message,
      maj: p.updated_at, fiche,
    })
  }

  if (req.method === 'POST') {
    if (p.statut === 'clos') return res.status(400).json({ error: 'Ce dossier est clos.' })
    const i = Number(req.body?.index)
    const pieces = Array.isArray(p.pieces) ? [...p.pieces] : []
    if (!Number.isInteger(i) || !pieces[i]) return res.status(400).json({ error: 'Pièce inconnue' })
    if (pieces[i].etat === 'validee') return res.status(400).json({ error: 'Cette pièce est déjà validée.' })
    const note = req.body?.note ? String(req.body.note).slice(0, 500) : null
    pieces[i] = { ...pieces[i], etat: 'fournie', note, maj: new Date().toISOString() }
    const { error } = await db.from('partages').update({ pieces, updated_at: new Date().toISOString() }).eq('id', p.id)
    if (error) return res.status(500).json({ error: error.message })
    const { data: owner } = await db.from('users').select('email').eq('id', p.user_id).single()
    if (owner?.email) await notifierTransitaire(owner.email, p, pieces[i].nom, note, `${siteUrl(req)}/portail/${p.id}`)
    return res.status(200).json({ pieces })
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Méthode non autorisée' })
}
