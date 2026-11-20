// pages/api/forum/interactions.ts — « J'aime » et signalements
//   POST { action: 'jaime', post_id }                               bascule le « J'aime »
//   POST { action: 'signaler', post_id? | commentaire_id?, motif }  signalement à la modération
//   Masquage automatique : un élément signalé par 3 membres différents (signalements non traités)
//   passe au statut « masque » ; l'équipe peut le réafficher depuis /backoffice/forum.
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { sendEmail } from '../../../lib/email'
import { siteUrl } from '../../../lib/adminAuth'
import { membreForum, nettoyer } from '../../../lib/forum'

const SEUIL_MASQUAGE = 3
const uuid = (v: any) => /^[0-9a-f-]{36}$/i.test(String(v || ''))

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Méthode non autorisée' }) }
  const m = await membreForum(req)
  if (!m) return res.status(401).json({ error: 'Connectez-vous pour accéder au forum.' })
  const db = supabaseAdmin()
  const b = req.body || {}

  if (b.action === 'jaime') {
    if (!uuid(b.post_id)) return res.status(400).json({ error: 'Publication inconnue' })
    const { data: deja } = await db.from('forum_jaime').select('post_id').eq('post_id', b.post_id).eq('user_id', m.id).maybeSingle()
    if (deja) await db.from('forum_jaime').delete().eq('post_id', b.post_id).eq('user_id', m.id)
    else {
      const { error } = await db.from('forum_jaime').insert({ post_id: b.post_id, user_id: m.id })
      if (error) return res.status(404).json({ error: 'Publication introuvable' })
    }
    const { data: p } = await db.from('forum_posts').select('nb_jaime').eq('id', b.post_id).maybeSingle()
    return res.status(200).json({ aime: !deja, nb_jaime: p?.nb_jaime ?? 0 })
  }

  if (b.action === 'signaler') {
    const post_id = uuid(b.post_id) ? b.post_id : null
    const commentaire_id = uuid(b.commentaire_id) ? b.commentaire_id : null
    if (!post_id && !commentaire_id) return res.status(400).json({ error: 'Élément inconnu' })
    const motif = nettoyer(b.motif, 500) || 'Contenu inapproprié'
    const cible = (q: any) => (post_id ? q.eq('post_id', post_id) : q.eq('commentaire_id', commentaire_id))
    const { data: deja } = await cible(db.from('forum_signalements').select('id').eq('user_id', m.id).is('traite_at', null)).limit(1)
    if (deja?.length) return res.status(200).json({ ok: true, deja: true })
    const { error } = await db.from('forum_signalements').insert({ post_id, commentaire_id, user_id: m.id, motif })
    if (error) return res.status(400).json({ error: 'Signalement impossible' })
    const { data: tous } = await cible(db.from('forum_signalements').select('user_id').is('traite_at', null)).limit(50)
    const membres = new Set((tous ?? []).map((s: any) => s.user_id)).size
    let masque = false
    if (membres >= SEUIL_MASQUAGE) {
      await db.from(post_id ? 'forum_posts' : 'forum_commentaires').update({ statut: 'masque' }).eq('id', post_id || commentaire_id)
      masque = true
    }
    if (process.env.BILLING_ADMIN_EMAIL) await sendEmail({
      to: process.env.BILLING_ADMIN_EMAIL, subject: 'Forum Import-eXPert : contenu signalé',
      html: `<p>Un membre a signalé un ${post_id ? 'message' : 'commentaire'} du forum.</p><p>Motif : ${motif.replace(/</g, '&lt;')}</p>${masque ? `<p><b>Retiré automatiquement</b> après ${membres} signalements.</p>` : ''}<p><a href="${siteUrl(req)}/backoffice/forum">Ouvrir la modération</a></p>`,
    }).catch(() => {})
    return res.status(200).json({ ok: true, masque })
  }
  return res.status(400).json({ error: 'Action inconnue' })
}
