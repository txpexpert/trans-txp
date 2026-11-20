// pages/api/forum/posts/[id].ts — une publication du forum
//   GET     publication + commentaires
//   PATCH   { contenu }  modification par son auteur
//   DELETE  suppression par son auteur (ou par un administrateur), pièces jointes comprises
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'
import { titreAuto } from '../../../../lib/forumJour'
import { membreForum, auteur, signer, supprimerFichiers, nettoyer } from '../../../../lib/forum'

const uuid = (v: any) => /^[0-9a-f-]{36}$/i.test(String(v || ''))
const USERS = 'users(prenom, nom, societe, raison_sociale, role)'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store')
  const m = await membreForum(req)
  if (!m) return res.status(401).json({ error: 'Connectez-vous pour accéder au forum.' })
  const id = String(req.query.id || '')
  if (!uuid(id)) return res.status(400).json({ error: 'Publication inconnue' })
  const db = supabaseAdmin()
  const { data: p } = await db.from('forum_posts').select(`*, ${USERS}`).eq('id', id).maybeSingle()
  if (!p || (p.statut !== 'publie' && !m.admin)) return res.status(404).json({ error: 'Publication introuvable ou retirée' })

  if (req.method === 'GET') {
    const { data: cs } = await db.from('forum_commentaires').select(`id, user_id, contenu, pieces, created_at, ${USERS}`)
      .eq('post_id', id).eq('statut', 'publie').order('created_at').limit(300)
    const commentaires = await signer((cs ?? []).map((c: any) => ({ id: c.id, contenu: c.contenu, pieces: c.pieces || [], cree: c.created_at, auteur: auteur(c.users), moi: c.user_id === m.id })))
    return res.status(200).json({ commentaires })
  }

  const auteurOk = p.user_id === m.id
  if (req.method === 'PATCH') {
    if (!auteurOk) return res.status(403).json({ error: 'Seul l’auteur peut modifier sa publication.' })
    const contenu = nettoyer(req.body?.contenu, 8000)
    if (!contenu && !(p.pieces || []).length) return res.status(400).json({ error: 'Message vide.' })
    const titre = titreAuto(contenu, (p.pieces || []).length > 0)
    await db.from('forum_posts').update({ titre, contenu, updated_at: new Date().toISOString() }).eq('id', id)
    return res.status(200).json({ ok: true })
  }
  if (req.method === 'DELETE') {
    if (!auteurOk && !m.admin) return res.status(403).json({ error: 'Seul l’auteur peut supprimer sa publication.' })
    const { data: cs } = await db.from('forum_commentaires').select('pieces').eq('post_id', id)
    await supprimerFichiers([...(p.pieces || []), ...(cs ?? []).flatMap((c: any) => c.pieces || [])])
    await db.from('forum_posts').delete().eq('id', id)
    return res.status(200).json({ ok: true })
  }
  res.setHeader('Allow', 'GET, PATCH, DELETE')
  return res.status(405).json({ error: 'Méthode non autorisée' })
}
