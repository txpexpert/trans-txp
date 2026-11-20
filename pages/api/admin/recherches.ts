// pages/api/admin/recherches.ts — relecture et publication des demandes « Recherche et dissertation »
//   GET  ?statut=…            liste (100 dernières)
//   GET  ?id=…                fiche complète
//   POST { action: 'enregistrer' | 'publier' | 'rejeter' | 'regenerer', id, texte?, note? }
import type { NextApiRequest, NextApiResponse } from 'next'
import { COOKIE_NAME, readToken, verifyToken, siteUrl } from '../../../lib/adminAuth'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { avisSiVisible, genererBrouillon, enArrierePlan } from '../../../lib/rechercheExperte'

export const config = { maxDuration: 300 }
const uuid = (v: any) => /^[0-9a-f-]{36}$/i.test(String(v || ''))

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!verifyToken(req.cookies[COOKIE_NAME])) return res.status(401).json({ error: 'Non autorisé' })
  const admin = readToken(req.cookies[COOKIE_NAME])
  const db = supabaseAdmin()
  const base = siteUrl(req)
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'GET') {
    if (req.query.id) {
      if (!uuid(req.query.id)) return res.status(400).json({ error: 'Demande inconnue' })
      const { data } = await db.from('recherches_expertes').select('*, users(email, nom, prenom, societe)').eq('id', String(req.query.id)).maybeSingle()
      return data ? res.status(200).json(data) : res.status(404).json({ error: 'Demande introuvable' })
    }
    const limite = new Date(Date.now() - 20 * 60e3).toISOString()
    await db.from('recherches_expertes').update({ statut: 'erreur', erreur: 'Génération interrompue' }).eq('statut', 'generation').lt('created_at', limite)
    let q = db.from('recherches_expertes').select('id, question, statut, created_at, genere_at, publie_at, publie_par, visible_apres, users(email, nom, prenom, societe)')
      .order('created_at', { ascending: false }).limit(100)
    if (req.query.statut) q = q.eq('statut', String(req.query.statut))
    const { data } = await q
    return res.status(200).json({ demandes: data ?? [] })
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })
  const { action, id } = req.body || {}
  if (!uuid(id)) return res.status(400).json({ error: 'Demande inconnue' })
  const texte = String(req.body?.texte ?? '').trim()
  const note = String(req.body?.note ?? '').trim() || null

  if (action === 'enregistrer') {
    await db.from('recherches_expertes').update({ brouillon: texte }).eq('id', id).in('statut', ['a_valider', 'publiee'])
    return res.status(200).json({ ok: true })
  }
  if (action === 'publier') {
    if (texte.length < 50) return res.status(400).json({ error: 'Texte trop court pour être publié' })
    const { data } = await db.from('recherches_expertes').update({
      statut: 'publiee', brouillon: texte, reponse: texte, note_client: note, publie_at: new Date().toISOString(), publie_par: admin?.email || 'admin', lue_at: null,
    }).eq('id', id).in('statut', ['a_valider', 'publiee']).select('*')
    const d = data?.[0]
    if (!d) return res.status(409).json({ error: 'Cette demande ne peut pas être publiée dans son état actuel' })
    await avisSiVisible(d, base)
    return res.status(200).json({ ok: true, visible_apres: d.visible_apres })
  }
  if (action === 'rejeter') {
    if (!note) return res.status(400).json({ error: 'Indiquez au client pourquoi la demande n’est pas traitée' })
    const { data } = await db.from('recherches_expertes').update({
      statut: 'rejetee', note_client: note, publie_at: new Date().toISOString(), publie_par: admin?.email || 'admin', lue_at: null,
    }).eq('id', id).in('statut', ['a_valider', 'erreur']).select('*')
    const d = data?.[0]
    if (!d) return res.status(409).json({ error: 'Cette demande ne peut pas être refusée dans son état actuel' })
    await avisSiVisible(d, base)
    return res.status(200).json({ ok: true, visible_apres: d.visible_apres })
  }
  if (action === 'regenerer') {
    const { data } = await db.from('recherches_expertes').update({ statut: 'generation', erreur: null }).eq('id', id).in('statut', ['a_valider', 'erreur']).select('id')
    if (!data?.length) return res.status(409).json({ error: 'Demande déjà publiée ou en cours de génération' })
    const p = genererBrouillon(id, base)
    if (!enArrierePlan(p)) await p
    return res.status(202).json({ ok: true })
  }
  return res.status(400).json({ error: 'Action inconnue' })
}
