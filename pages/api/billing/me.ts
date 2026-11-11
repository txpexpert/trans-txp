// pages/api/billing/me.ts
// ─────────────────────────────────────────────────────────────────────────────
// Espace client « Mon abonnement » (pages/mon-abonnement.tsx).
//   GET  → abonnement, profil de facturation, pro-formas / factures, avoirs,
//          paiements déclarés, coordonnées bancaires de l'émetteur.
//   POST { action: 'profile', profile }        → profil de facturation
//        { action: 'choose_plan', plan }       → plan souhaité (sans pro-forma)
//        { action: 'request_proforma', plan }  → pro-forma émise + envoyée
// Accessible même abonnement expiré (pas de contrôle de plan ici).
// ─────────────────────────────────────────────────────────────────────────────
import { emettrePremierAbonnement } from '../../../lib/offres'
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { getBillingUser, issueProforma, loadSettings } from '../../../lib/billingServer'
import { siteUrl } from '../../../lib/adminAuth'
import { profileComplete } from '../../../lib/billing'

const SELF_SERVICE_PLANS = ['pro', 'premium']

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getBillingUser(req)
  if (!user) return res.status(401).json({ error: 'Session expirée : reconnectez-vous.' })
  const sb = supabaseAdmin()

  if (req.method === 'GET') {
    const [inv, av, pay, plans, settings] = await Promise.all([
      sb.from('invoices').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      sb.from('avoirs').select('*').eq('user_id', user.id).order('issued_at', { ascending: false }),
      sb.from('paiements').select('id, invoice_id, montant, date_valeur, reference_libelle, source, justificatif_nom, statut, motif_rejet, created_at, valide_le')
        .eq('user_id', user.id).order('created_at', { ascending: false }),
      sb.from('subscription_plans').select('code, label, price_per_year, monthly_ref, vat_rate, note').eq('active', true).order('sort_order'),
      loadSettings().catch(() => null),
    ])
    const err = inv.error || av.error || pay.error || plans.error
    if (err) return res.status(500).json({ error: err.message })
    const { current_session_id, ...safeUser } = user
    return res.status(200).json({
      user: safeUser,
      documents: inv.data,
      avoirs: av.data,
      paiements: pay.data,
      plans: plans.data,
      bank: settings && {
        raison_sociale: settings.raison_sociale, titulaire_compte: settings.titulaire_compte,
        banque: settings.banque, rib: settings.rib, swift: settings.swift,
        email_facturation: settings.email_facturation, tva_rate: settings.tva_rate,
        delai_paiement_jours: settings.delai_paiement_jours,
      },
    })
  }

  if (req.method === 'POST') {
    if (user.role === 'generaladmin') return res.status(400).json({ error: 'Compte generaladmin : aucune facturation.' })
    const body = req.body || {}

    if (body.action === 'profile') {
      const p = body.profile || {}
      const { error } = await sb.rpc('billing_update_profile', {
        p_user_id: user.id,
        p_profile: {
          type_client: p.type_client, raison_sociale: p.raison_sociale, ice: p.ice, if_fiscal: p.if_fiscal,
          rc: p.rc, adresse: p.adresse, code_postal: p.code_postal, ville: p.ville, pays: p.pays,
        },
        p_actor: 'client',
      })
      if (error) return res.status(400).json({ error: error.message })
      // Particulier : nom / prénom de la facture.
      if (p.type_client === 'particulier' && (p.nom || p.prenom)) {
        await sb.from('users').update({
          nom: String(p.nom || '').slice(0, 120) || null, prenom: String(p.prenom || '').slice(0, 120) || null,
        }).eq('id', user.id)
      }
      return res.status(200).json({ ok: true })
    }

    if (body.action === 'choose_plan') {
      if (!SELF_SERVICE_PLANS.includes(body.plan)) return res.status(400).json({ error: 'Plan invalide' })
      const { error } = await sb.from('users').update({ plan_souhaite: body.plan }).eq('id', user.id)
      if (error) return res.status(400).json({ error: error.message })
      return res.status(200).json({ ok: true })
    }

    if (body.action === 'request_proforma') {
      if (!SELF_SERVICE_PLANS.includes(body.plan)) {
        return res.status(400).json({ error: 'Pour le plan Entreprise, contactez-nous : le montant est fixé au contrat.' })
      }
      if (!profileComplete({ ...user, adresse: user.adresse_facturation })) {
        return res.status(400).json({ error: 'Complétez d’abord votre profil de facturation (entreprise : raison sociale et ICE ; particulier : nom).' })
      }
      try {
        await sb.from('users').update({ plan_souhaite: body.plan }).eq('id', user.id)
        // Pro-forma déjà en attente : même plan → renvoyée ; autre plan → remplacée,
        // sauf si un justificatif a déjà été déposé dessus.
        const { data: pending } = await sb.from('invoices').select('id, plan_code')
          .eq('user_id', user.id).eq('status', 'proforma_envoyee').maybeSingle()
        if (pending && pending.plan_code !== body.plan) {
          const { count } = await sb.from('paiements').select('id', { count: 'exact', head: true })
            .eq('invoice_id', pending.id).eq('statut', 'declare')
          if (count) return res.status(400).json({ error: 'Un justificatif est en cours de vérification sur votre pro-forma actuelle : contactez-nous pour changer de plan.' })
          const { error: cErr } = await sb.rpc('admin_cancel_proforma', { p_invoice_id: pending.id, p_actor: 'client', p_note: 'Remplacée par le client (changement de plan)' })
          if (cErr) return res.status(400).json({ error: cErr.message })
        }
        // Premier abonnement : code de réduction et packs experts déduits (lib/offres.ts)
        const r = await emettrePremierAbonnement({ userId: user.id, plan: body.plan, actor: 'client', origin: 'client', base: siteUrl(req) })
        return res.status(200).json({ ok: true, document: r.doc, emailed: r.emailed, active: r.active, reductions: (r as any).notes || [] })
      } catch (e: any) {
        return res.status(400).json({ error: e.message })
      }
    }

    return res.status(400).json({ error: 'Action inconnue' })
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Method not allowed' })
}
