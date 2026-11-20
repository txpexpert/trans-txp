// pages/api/packs.ts — commande d'un pack expert par un compte connecté (toute offre).
// La commande est enregistrée et confirmée par email ; le forfait et la pro-forma sont
// établis par l'équipe (back-office › Commandes de packs). Le paiement se fait par virement.
import type { NextApiRequest, NextApiResponse } from 'next'
import { compteAbonne } from '../../lib/compteAbonne'
import { supabaseAdmin } from '../../lib/supabaseAdmin'
import { PACKS } from '../../lib/suite'
import { sendEmail } from '../../lib/email'

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const c = await compteAbonne(req)
  if (!c) return res.status(401).json({ error: 'Connectez-vous pour commander un pack.' })
  const db = supabaseAdmin()
  if (req.method === 'GET') {
    const { data } = await db.from('commandes_packs').select('id, pack, statut, montant_ht, created_at').eq('user_id', c.id).order('created_at', { ascending: false })
    return res.status(200).json({ commandes: data ?? [] })
  }
  if (req.method === 'POST') {
    const pack = PACKS.find(p => p.nom === req.body?.pack)
    if (!pack) return res.status(400).json({ error: 'Pack inconnu' })
    const precisions = req.body?.precisions ? String(req.body.precisions).slice(0, 2000) : null
    const { data, error } = await db.from('commandes_packs').insert({ user_id: c.id, pack: pack.nom, precisions }).select('id').single()
    if (error) return res.status(500).json({ error: error.message })
    await sendEmail({
      to: c.email, subject: `Votre commande : ${pack.nom}`,
      html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#14120F">
        <div style="padding:20px 0;border-bottom:2px solid #A8822F"><b style="font-size:18px">Import-eXPert</b></div>
        <p>Nous avons bien reçu votre commande du pack <b>${esc(pack.nom)}</b>.</p>
        <p>Un expert revient vers vous sous 48 heures ouvrées avec le forfait et la pro-forma, payable par virement. Le montant du pack est déduit de votre premier abonnement annuel s’il est souscrit dans les 30 jours.</p></div>`,
    })
    if (process.env.BILLING_ADMIN_EMAIL) await sendEmail({ to: process.env.BILLING_ADMIN_EMAIL, subject: `Commande de pack : ${pack.nom} (${c.email})`, html: `<p>${esc(c.email)} a commandé le pack <b>${esc(pack.nom)}</b>.</p>${precisions ? `<p>« ${esc(precisions)} »</p>` : ''}<p>Back-office › Commandes de packs.</p>` })
    return res.status(201).json({ commande: data })
  }
  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Méthode non autorisée' })
}
