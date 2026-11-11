// pages/api/codes.ts — codes de réduction du compte connecté.
//   GET  → mes deux codes (bienvenue, à offrir), le code appliqué et l'effet sur le premier abonnement
//   POST → applique un code { code } ; une pro-forma en attente sans paiement déclaré est réémise au montant réduit
import type { NextApiRequest, NextApiResponse } from 'next'
import { compteAbonne } from '../../lib/compteAbonne'
import { supabaseAdmin } from '../../lib/supabaseAdmin'
import { appliquerCode, calculerPremierAbonnement, codesDuClient, emettrePremierAbonnement } from '../../lib/offres'
import { siteUrl } from '../../lib/adminAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const c = await compteAbonne(req)
  if (!c) return res.status(401).json({ error: 'Non connecté' })
  const db = supabaseAdmin()
  if (req.method === 'GET') {
    const codes = await codesDuClient(c.id)
    const { data: util } = await db.from('codes_utilisations').select('code, utilise_le').eq('user_id', c.id).maybeSingle()
    const [pro, premium] = await Promise.all([calculerPremierAbonnement(c.id, 'pro'), calculerPremierAbonnement(c.id, 'premium')])
    return res.status(200).json({ codes, applique: util ?? null, simulation: { pro: { base: pro.base, net: pro.net }, premium: { base: premium.base, net: premium.net } } })
  }
  if (req.method === 'POST') {
    const r = await appliquerCode(c.id, String(req.body?.code || ''))
    if (!r.ok) return res.status(400).json({ error: r.error })
    // Pro-forma d'abonnement déjà en attente : réémise au montant réduit si aucun paiement n'est déclaré
    const { data: pending } = await db.from('invoices').select('id, plan_code').eq('user_id', c.id).eq('status', 'proforma_envoyee').maybeSingle()
    let reemise = false
    if (pending && ['pro', 'premium'].includes(pending.plan_code)) {
      const { count } = await db.from('paiements').select('id', { count: 'exact', head: true }).eq('invoice_id', pending.id).eq('statut', 'declare')
      if (!count) {
        const { error } = await db.rpc('admin_cancel_proforma', { p_invoice_id: pending.id, p_actor: 'client', p_note: 'Remplacée : code de réduction appliqué' })
        if (!error) { await emettrePremierAbonnement({ userId: c.id, plan: pending.plan_code, actor: 'client', origin: 'client', base: siteUrl(req) }); reemise = true }
      }
    }
    return res.status(200).json({ ok: true, pourcentage: r.pourcentage, reemise })
  }
  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Méthode non autorisée' })
}
