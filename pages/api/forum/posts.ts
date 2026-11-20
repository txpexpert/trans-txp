// pages/api/forum/posts.ts — Forum des clients
//   GET  conversation du jour (depuis le dernier 2 h, heure du Maroc) : messages et réponses
//   POST multipart : contenu, fichiers[] (images, PDF, Office ; 6 × 10 Mo) — sans titre
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { membreForum, auteur, lireFormulaire, deposer, signer, nettoyer, MAX_FICHIERS_POST } from '../../../lib/forum'
import { debutJourneeForum, titreAuto } from '../../../lib/forumJour'

export const config = { api: { bodyParser: false }, maxDuration: 60 }
const MAX_JOUR = 400
const USERS = 'users(prenom, nom, societe, raison_sociale, role)'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store')
  const m = await membreForum(req)
  if (!m) return res.status(401).json({ error: 'Connectez-vous pour accéder au forum.' })
  const db = supabaseAdmin()

  if (req.method === 'GET') {
    // Conversation du jour : messages publiés depuis le dernier 2 h (heure du Maroc), du plus ancien
    // au plus récent, réponses comprises. Les annonces épinglées par l'équipe restent affichées en tête.
    const debut = debutJourneeForum().toISOString()
    const { data, error } = await db.from('forum_posts')
      .select(`id, user_id, contenu, pieces, epingle, nb_commentaires, nb_jaime, created_at, updated_at, ${USERS}`)
      .eq('statut', 'publie').or(`created_at.gte.${debut},epingle.eq.true`)
      .order('created_at', { ascending: true }).limit(MAX_JOUR)
    if (error) { console.error('[forum] liste', error); return res.status(500).json({ error: 'Forum momentanément indisponible.' }) }
    const lignes = data ?? []
    const ids = lignes.map(p => p.id)
    const [{ data: mesJaime }, { data: cs }] = ids.length ? await Promise.all([
      db.from('forum_jaime').select('post_id').eq('user_id', m.id).in('post_id', ids),
      db.from('forum_commentaires').select(`id, post_id, user_id, contenu, pieces, created_at, ${USERS}`)
        .in('post_id', ids).eq('statut', 'publie').order('created_at').limit(2000),
    ]) : [{ data: [] as any[] }, { data: [] as any[] }]
    const aime = new Set((mesJaime ?? []).map((j: any) => j.post_id))
    const reponses = await signer((cs ?? []).map((c: any) => ({ id: c.id, post_id: c.post_id, contenu: c.contenu, pieces: c.pieces || [], cree: c.created_at, auteur: auteur(c.users), moi: c.user_id === m.id })))
    const posts = await signer(lignes.map((p: any) => ({
      id: p.id, contenu: p.contenu, pieces: p.pieces || [], epingle: p.epingle,
      nb_jaime: p.nb_jaime, cree: p.created_at, modifie: p.updated_at !== p.created_at ? p.updated_at : null,
      auteur: auteur(p.users), moi: p.user_id === m.id, aime: aime.has(p.id),
      reponses: reponses.filter(r => r.post_id === p.id),
    })))
    return res.status(200).json({ posts, debut, moi: { admin: m.admin } })
  }

  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'Méthode non autorisée' }) }

  const depuis = new Date(Date.now() - 24 * 3600e3).toISOString()
  const { count } = await db.from('forum_posts').select('id', { count: 'exact', head: true }).eq('user_id', m.id).gte('created_at', depuis)
  if (!m.admin && (count ?? 0) >= 10) return res.status(429).json({ error: 'Limite de 10 publications par 24 heures atteinte.' })

  let f: Awaited<ReturnType<typeof lireFormulaire>>
  try { f = await lireFormulaire(req, MAX_FICHIERS_POST) }
  catch { return res.status(400).json({ error: `Fichiers refusés : ${MAX_FICHIERS_POST} fichiers de 10 Mo au maximum.` }) }
  const contenu = nettoyer(f.champ('contenu'), 8000)
  if (!contenu && !f.fichiers.length) return res.status(400).json({ error: 'Votre message est vide.' })
  // Plus de champ titre : la colonne (obligatoire en base) reçoit le début du message
  const titre = titreAuto(contenu, f.fichiers.length > 0)

  const dep = await deposer(m.id, f.fichiers)
  if (dep.erreur) return res.status(400).json({ error: dep.erreur })
  const { data, error } = await db.from('forum_posts').insert({ user_id: m.id, titre, contenu, pieces: dep.pieces }).select('id').single()
  if (error) { console.error('[forum] publication', error); return res.status(500).json({ error: 'Publication impossible, réessayez.' }) }
  return res.status(201).json({ ok: true, id: data.id })
}
