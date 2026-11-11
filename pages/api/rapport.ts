// pages/api/rapport.ts — rapport mensuel du compte connecté.
//   GET  → réglages (destinataire dirigeant, activation) et aperçu HTML du rapport
//   PUT  → enregistre les réglages
//   POST → envoie le rapport maintenant, au seul titulaire du compte (essai d'envoi)
import type { NextApiRequest, NextApiResponse } from 'next'
import { compteAbonne } from '../../lib/compteAbonne'
import { supabaseAdmin } from '../../lib/supabaseAdmin'
import { construireRapport } from '../../lib/rapportMensuel'
import { sendEmail } from '../../lib/email'
import { siteUrl } from '../../lib/adminAuth'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const c = await compteAbonne(req)
  if (!c) return res.status(401).json({ error: 'Non connecté' })
  if (!c.abonne) return res.status(403).json({ error: 'Le rapport mensuel est inclus dans les offres payantes.', code: 'ABONNEMENT' })
  const db = supabaseAdmin()
  const site = siteUrl(req)

  if (req.method === 'GET') {
    const { data: u } = await db.from('users').select('email, email_dirigeant, rapport_mensuel').eq('id', c.id).single()
    const r = await construireRapport(c.id, site)
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({ reglages: u, apercu: r, inclus: ['pro', 'premium', 'enterprise'].includes(c.plan) || c.role === 'admin' || c.role === 'generaladmin' })
  }
  if (req.method === 'PUT') {
    const b = req.body || {}
    const mail = typeof b.email_dirigeant === 'string' ? b.email_dirigeant.trim().slice(0, 200) : ''
    if (mail && !EMAIL.test(mail)) return res.status(400).json({ error: 'Adresse email du dirigeant invalide.' })
    const { error } = await db.from('users').update({ email_dirigeant: mail || null, rapport_mensuel: b.rapport_mensuel !== false }).eq('id', c.id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }
  if (req.method === 'POST') {
    const r = await construireRapport(c.id, site)
    const e = await sendEmail({ to: c.email, subject: '[Essai] ' + r.subject, html: r.html })
    if (!e.ok) return res.status(502).json({ error: 'Envoi impossible : le service email n’est pas configuré sur cet environnement.' })
    return res.status(200).json({ ok: true, a: c.email })
  }
  res.setHeader('Allow', 'GET, PUT, POST')
  return res.status(405).json({ error: 'Méthode non autorisée' })
}
