// pages/api/forum/commentaires.ts — commentaires du forum
//   POST   multipart : post_id, contenu, fichiers[] (3 × 10 Mo)
//   DELETE ?id=…  suppression par son auteur (ou par un administrateur)
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { debutJourneeForum } from '../../../lib/forumJour'
import { controleForum } from '../../../lib/forumFiltre'
import { membreForum, lireFormulaire, deposer, supprimerFichiers, nettoyer, MAX_FICHIERS_COMMENTAIRE } from '../../../lib/forum'

export const config = { api: { bodyParser: false }, maxDuration: 60 }
const uuid = (v: any) => /^[0-9a-f-]{36}$/i.test(String(v || ''))

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const m = await membreForum(req)
  if (!m) return res.status(401).json({ error: 'Connectez-vous pour accéder au forum.' })
  const db = supabaseAdmin()

  if (req.method === 'DELETE') {
    const id = String(req.query.id || '')
    if (!uuid(id)) return res.status(400).json({ error: 'Commentaire inconnu' })
    const { data: c } = await db.from('forum_commentaires').select('id, user_id, pieces').eq('id', id).maybeSingle()
    if (!c) return res.status(404).json({ error: 'Commentaire introuvable' })
    if (c.user_id !== m.id && !m.admin) return res.status(403).json({ error: 'Seul l’auteur peut supprimer son commentaire.' })
    await supprimerFichiers(c.pieces)
    await db.from('forum_commentaires').delete().eq('id', id)
    return res.status(200).json({ ok: true })
  }
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST, DELETE'); return res.status(405).json({ error: 'Méthode non autorisée' }) }

  const depuis = new Date(Date.now() - 24 * 3600e3).toISOString()
  const { count } = await db.from('forum_commentaires').select('id', { count: 'exact', head: true }).eq('user_id', m.id).gte('created_at', depuis)
  if (!m.admin && (count ?? 0) >= 60) return res.status(429).json({ error: 'Limite de 60 commentaires par 24 heures atteinte.' })

  let f: Awaited<ReturnType<typeof lireFormulaire>>
  try { f = await lireFormulaire(req, MAX_FICHIERS_COMMENTAIRE) }
  catch { return res.status(400).json({ error: `Fichiers refusés : ${MAX_FICHIERS_COMMENTAIRE} fichiers de 10 Mo au maximum.` }) }
  const postId = f.champ('post_id')
  const contenu = nettoyer(f.champ('contenu'), 4000)
  if (!uuid(postId)) return res.status(400).json({ error: 'Publication inconnue' })
  if (!contenu) return res.status(400).json({ error: 'Votre réponse est vide.' })
  const refus = m.admin ? null : controleForum(contenu)
  if (refus) return res.status(400).json({ error: refus })
  const { data: p } = await db.from('forum_posts').select('id, statut, epingle, created_at').eq('id', postId).maybeSingle()
  if (!p || p.statut !== 'publie') return res.status(404).json({ error: 'Message introuvable ou retiré' })
  // Le fil repart à zéro chaque nuit à 2 h : on ne répond plus aux messages des jours précédents
  if (!p.epingle && Date.parse(p.created_at) < debutJourneeForum().getTime()) return res.status(410).json({ error: 'Cette conversation est close : le forum repart à zéro chaque nuit à 2 h.' })

  const dep = await deposer(m.id, f.fichiers)
  if (dep.erreur) return res.status(400).json({ error: dep.erreur })
  const { error } = await db.from('forum_commentaires').insert({ post_id: postId, user_id: m.id, contenu, pieces: dep.pieces })
  if (error) { await supprimerFichiers(dep.pieces); console.error('[forum] commentaire', error); return res.status(500).json({ error: 'Envoi impossible, réessayez.' }) }
  return res.status(201).json({ ok: true })
}
