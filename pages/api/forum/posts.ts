// pages/api/forum/posts.ts — Forum des clients
//   GET  ?q=…&avant=<dernier_at ISO>   publications (20 par page), épinglées d'abord
//   POST multipart : titre, contenu, fichiers[] (images, PDF, Office ; 6 × 10 Mo)
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { membreForum, auteur, lireFormulaire, deposer, signer, nettoyer, MAX_FICHIERS_POST } from '../../../lib/forum'

export const config = { api: { bodyParser: false }, maxDuration: 60 }
const PAGE = 20
const USERS = 'users(prenom, nom, societe, raison_sociale, role)'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store')
  const m = await membreForum(req)
  if (!m) return res.status(401).json({ error: 'Connectez-vous pour accéder au forum.' })
  const db = supabaseAdmin()

  if (req.method === 'GET') {
    let q = db.from('forum_posts').select(`id, user_id, titre, contenu, pieces, epingle, nb_commentaires, nb_jaime, created_at, updated_at, dernier_at, ${USERS}`)
      .eq('statut', 'publie')
    const recherche = String(req.query.q || '').trim().replace(/[%,()]/g, ' ').slice(0, 80)
    if (recherche) q = q.or(`titre.ilike.%${recherche}%,contenu.ilike.%${recherche}%`)
    const avant = String(req.query.avant || '')
    if (avant && !isNaN(Date.parse(avant))) q = q.eq('epingle', false).lt('dernier_at', avant)
    else q = q.order('epingle', { ascending: false })
    const { data, error } = await q.order('dernier_at', { ascending: false }).limit(PAGE + 1)
    if (error) { console.error('[forum] liste', error); return res.status(500).json({ error: 'Forum momentanément indisponible.' }) }
    const lignes = (data ?? []).slice(0, PAGE)
    const ids = lignes.map(p => p.id)
    const { data: mesJaime } = ids.length ? await db.from('forum_jaime').select('post_id').eq('user_id', m.id).in('post_id', ids) : { data: [] as any[] }
    const aime = new Set((mesJaime ?? []).map((j: any) => j.post_id))
    const posts = await signer(lignes.map((p: any) => ({
      id: p.id, titre: p.titre, contenu: p.contenu, pieces: p.pieces || [], epingle: p.epingle,
      nb_commentaires: p.nb_commentaires, nb_jaime: p.nb_jaime, cree: p.created_at, modifie: p.updated_at !== p.created_at ? p.updated_at : null, dernier: p.dernier_at,
      auteur: auteur(p.users), moi: p.user_id === m.id, aime: aime.has(p.id),
    })))
    return res.status(200).json({ posts, suite: (data ?? []).length > PAGE, moi: { admin: m.admin } })
  }

  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'Méthode non autorisée' }) }

  const depuis = new Date(Date.now() - 24 * 3600e3).toISOString()
  const { count } = await db.from('forum_posts').select('id', { count: 'exact', head: true }).eq('user_id', m.id).gte('created_at', depuis)
  if (!m.admin && (count ?? 0) >= 10) return res.status(429).json({ error: 'Limite de 10 publications par 24 heures atteinte.' })

  let f: Awaited<ReturnType<typeof lireFormulaire>>
  try { f = await lireFormulaire(req, MAX_FICHIERS_POST) }
  catch { return res.status(400).json({ error: `Fichiers refusés : ${MAX_FICHIERS_POST} fichiers de 10 Mo au maximum.` }) }
  const titre = nettoyer(f.champ('titre'), 160)
  const contenu = nettoyer(f.champ('contenu'), 8000)
  if (titre.length < 3) return res.status(400).json({ error: 'Donnez un titre à votre publication.' })
  if (!contenu && !f.fichiers.length) return res.status(400).json({ error: 'Votre publication est vide.' })

  const dep = await deposer(m.id, f.fichiers)
  if (dep.erreur) return res.status(400).json({ error: dep.erreur })
  const { data, error } = await db.from('forum_posts').insert({ user_id: m.id, titre, contenu, pieces: dep.pieces }).select('id').single()
  if (error) { console.error('[forum] publication', error); return res.status(500).json({ error: 'Publication impossible, réessayez.' }) }
  return res.status(201).json({ ok: true, id: data.id })
}
