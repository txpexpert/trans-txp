// pages/api/admin/forum.ts — modération du forum
//   GET   signalements ouverts + 50 dernières publications (masquées comprises)
//   POST  { action, id }  masquer | afficher | epingler | desepingler (publication),
//                         masquer_commentaire | afficher_commentaire, traiter (signalement)
import type { NextApiRequest, NextApiResponse } from 'next'
import { COOKIE_NAME, verifyToken } from '../../../lib/adminAuth'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

const uuid = (v: any) => /^[0-9a-f-]{36}$/i.test(String(v || ''))
const USERS = 'users(email, prenom, nom, societe)'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!verifyToken(req.cookies[COOKIE_NAME])) return res.status(401).json({ error: 'Non autorisé' })
  const db = supabaseAdmin()
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'GET') {
    const [sig, posts] = await Promise.all([
      db.from('forum_signalements').select(`id, motif, created_at, post_id, commentaire_id, ${USERS},
        forum_posts(id, titre, contenu, statut), forum_commentaires(id, contenu, statut, post_id)`)
        .is('traite_at', null).order('created_at', { ascending: false }).limit(100),
      db.from('forum_posts').select(`id, titre, statut, epingle, nb_commentaires, nb_jaime, created_at, ${USERS}`)
        .order('created_at', { ascending: false }).limit(50),
    ])
    return res.status(200).json({ signalements: sig.data ?? [], posts: posts.data ?? [] })
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })
  const { action, id } = req.body || {}
  if (!uuid(id)) return res.status(400).json({ error: 'Élément inconnu' })
  const maj: Record<string, [string, Record<string, any>]> = {
    masquer: ['forum_posts', { statut: 'masque' }],
    afficher: ['forum_posts', { statut: 'publie' }],
    epingler: ['forum_posts', { epingle: true }],
    desepingler: ['forum_posts', { epingle: false }],
    masquer_commentaire: ['forum_commentaires', { statut: 'masque' }],
    afficher_commentaire: ['forum_commentaires', { statut: 'publie' }],
    traiter: ['forum_signalements', { traite_at: new Date().toISOString() }],
  }
  const a = maj[action]
  if (!a) return res.status(400).json({ error: 'Action inconnue' })
  const { error } = await db.from(a[0]).update(a[1]).eq('id', id)
  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ ok: true })
}
