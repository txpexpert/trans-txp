// pages/api/admin/subscriptions.ts
// ─────────────────────────────────────────────────────────────────────────────
// Pilotage des abonnements et de la facturation depuis le backoffice — évite
// toute intervention manuelle dans Supabase.
//
//   GET  → abonnés (table users, triés par numéro AB…), pro-formas / factures,
//          plans, paiements déclarés, avoirs, derniers événements
//   POST → { action, ... } — voir AdminAction dans lib/subscriptions.ts
//
// Accès :
//   • super-administrateur (session backoffice) → toutes les actions ;
//   • administrateur de type 2 (session « Gestion des abonnements ») →
//     uniquement les actions de ses habilitations (lib/adminPermissions.ts).
//     Suspendre, réactiver, supprimer, avoir et generaladmin restent réservés
//     au super-administrateur.
// L'email de l'administrateur est enregistré comme auteur de chaque action.
// Toutes les écritures passent par les fonctions SQL des migrations 0004 et
// 0010 (transactionnelles et journalisées) : jamais d'UPDATE direct ici.
// Facturation (2026-11-07) : pro-forma et facture sont envoyées au client par
// email ; la validation exige le montant reçu (= TTC attendu).
// ─────────────────────────────────────────────────────────────────────────────
import type { NextApiRequest, NextApiResponse } from 'next'
import { getAdminSessionFromReq, siteUrl } from '../../../lib/adminAuth'
import { can, ACTION_PERMISSION } from '../../../lib/adminPermissions'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { issueProforma, confirmPayment, emailProforma, emailInvoice, loadSettings } from '../../../lib/billingServer'
import type { AdminAction } from '../../../lib/subscriptions'
import type { BillingDoc } from '../../../lib/billing'

const USER_COLUMNS =
  'id, numero_abonne, email, nom, prenom, societe, telephone, profil, plan, statut, trial_ends_at, plan_ends_at, created_at, last_login_at, email_verified, role, ' +
  'plan_souhaite, type_client, raison_sociale, ice, if_fiscal, rc, adresse_facturation, code_postal, ville, pays'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await getAdminSessionFromReq(req, 'gestion')
  if (!admin) return res.status(401).json({ error: 'Session administrateur expirée : reconnectez-vous.' })

  let sb: ReturnType<typeof supabaseAdmin>
  try { sb = supabaseAdmin() } catch (e: any) {
    return res.status(500).json({ error: e.message })
  }

  if (req.method === 'GET') {
    const [users, invoices, plans, events, paiements, avoirs] = await Promise.all([
      sb.from('users').select(USER_COLUMNS).order('numero_abonne', { ascending: true }),
      sb.from('invoices').select('*').order('created_at', { ascending: false }).limit(500),
      sb.from('subscription_plans').select('code, label, price_per_year, monthly_ref, note').eq('active', true).order('sort_order'),
      sb.from('subscription_events').select('*').order('created_at', { ascending: false }).limit(50),
      sb.from('paiements').select('*').order('created_at', { ascending: false }).limit(300),
      sb.from('avoirs').select('*').order('issued_at', { ascending: false }).limit(200),
    ])
    const err = users.error || invoices.error || plans.error || events.error || paiements.error || avoirs.error
    if (err) {
      console.error('[admin/subscriptions] GET', err)
      return res.status(500).json({ error: err.message })
    }
    return res.status(200).json({
      users:     users.data,
      invoices:  invoices.data,
      plans:     plans.data,
      events:    events.data,
      paiements: paiements.data,
      avoirs:    avoirs.data,
    })
  }

  if (req.method === 'POST') {
    const body = (req.body || {}) as AdminAction
    if (!(body.action in ACTION_PERMISSION)) return res.status(400).json({ error: 'Action inconnue' })
    if (!can(admin, body.action)) {
      return res.status(403).json({ error: 'Cette action ne fait pas partie de vos habilitations.' })
    }
    const actor = admin.email
    const base  = siteUrl(req)
    const note = (body as any).note ? String((body as any).note).slice(0, 500) : null
    const years = Math.min(5, Math.max(1, Number((body as any).years) || 1))
    const rawAmount = (body as any).amount
    const amount = rawAmount === undefined || rawAmount === null || rawAmount === '' ? null : Number(rawAmount)
    if (amount !== null && (!Number.isFinite(amount) || amount < 0)) {
      return res.status(400).json({ error: 'Montant invalide' })
    }

    try {
      switch (body.action) {
        // ── Pro-forma (montant HT) → envoyée au client ──
        case 'create_proforma': {
          if (!body.userId || !body.plan) return res.status(400).json({ error: 'userId et plan requis' })
          const r = await issueProforma({ userId: body.userId, plan: body.plan, years, amountHT: amount, actor, note, origin: 'admin', base })
          return res.status(200).json({ ok: true, result: r.doc, emailed: r.emailed, emailError: r.emailError })
        }

        // ── Paiement reçu sans pro-forma préalable : pro-forma + facture ──
        case 'activate_plan': {
          if (!body.userId || !body.plan) return res.status(400).json({ error: 'userId et plan requis' })
          // Une seule transaction SQL (pro-forma + facture) : rien ne reste à moitié fait.
          const { error } = await sb.rpc('admin_activate_plan', {
            p_user_id: body.userId, p_plan: body.plan, p_years: years, p_amount: amount, p_actor: actor, p_note: note,
          })
          if (error) throw new Error(error.message)
          const { data: doc } = await sb.from('invoices').select('*').eq('user_id', body.userId).eq('status', 'payee')
            .order('paid_at', { ascending: false }).limit(1).single()
          const { data: u } = await sb.from('users').select('email, prenom, numero_abonne').eq('id', body.userId).single()
          const r = await emailInvoice(doc as BillingDoc, u as any, await loadSettings(), base)
          return res.status(200).json({ ok: true, result: doc, emailed: r.ok })
        }

        // ── Validation du paiement (rapprochement) → facture envoyée ──
        case 'confirm_payment': {
          if (!body.invoiceId) return res.status(400).json({ error: 'invoiceId requis' })
          const recu = Number(body.amount)
          if (!Number.isFinite(recu) || recu <= 0) return res.status(400).json({ error: 'Saisir le montant reçu sur le compte' })
          const r = await confirmPayment({
            invoiceId: body.invoiceId, amount: recu, dateValeur: body.dateValeur || null,
            reference: body.reference || null, paiementId: body.paiementId || null, actor, note, base,
          })
          return res.status(200).json({ ok: true, result: r.doc, emailed: r.emailed, emailError: r.emailError })
        }

        case 'reject_payment': {
          if (!body.paiementId || !body.motif) return res.status(400).json({ error: 'Paiement et motif requis' })
          const { data, error } = await sb.rpc('billing_reject_payment', { p_paiement_id: body.paiementId, p_motif: String(body.motif).slice(0, 300), p_actor: actor })
          if (error) throw new Error(error.message)
          return res.status(200).json({ ok: true, result: data })
        }

        case 'resend_proforma': {
          const { data: doc } = await sb.from('invoices').select('*').eq('id', body.invoiceId).maybeSingle()
          if (!doc || !doc.user_id) return res.status(404).json({ error: 'Document introuvable' })
          const { data: u } = await sb.from('users').select('email, prenom, numero_abonne').eq('id', doc.user_id).single()
          const s = await loadSettings()
          const r = doc.status === 'payee'
            ? await emailInvoice(doc as BillingDoc, u as any, s, base)
            : await emailProforma(doc as BillingDoc, u as any, s, base)
          if (!r.ok) return res.status(502).json({ error: 'Email non envoyé : ' + String((r as any).error) })
          return res.status(200).json({ ok: true })
        }

        case 'create_avoir': {
          if (!body.invoiceId || !body.motif) return res.status(400).json({ error: 'Facture et motif requis' })
          const amountHT = body.amountHT === undefined || body.amountHT === null || (body.amountHT as any) === '' ? null : Number(body.amountHT)
          const { data, error } = await sb.rpc('admin_create_avoir', {
            p_invoice_id: body.invoiceId, p_motif: String(body.motif).slice(0, 300), p_amount_ht: amountHT,
            p_resilier: !!body.resilier, p_actor: actor,
          })
          if (error) throw new Error(error.message)
          return res.status(200).json({ ok: true, result: data })
        }

        case 'set_generaladmin': {
          if (!body.userId) return res.status(400).json({ error: 'userId requis' })
          const { data, error } = await sb.rpc('admin_set_generaladmin', { p_user_id: body.userId, p_on: !!body.on, p_actor: actor, p_note: note })
          if (error) throw new Error(error.message)
          return res.status(200).json({ ok: true, result: data })
        }

        case 'update_profile': {
          if (!body.userId) return res.status(400).json({ error: 'userId requis' })
          const { data, error } = await sb.rpc('billing_update_profile', { p_user_id: body.userId, p_profile: body.profile || {}, p_actor: actor })
          if (error) throw new Error(error.message)
          return res.status(200).json({ ok: true, result: data })
        }

        // ── Actions historiques (0004 / 0005) ──
        case 'cancel_proforma': {
          if (!body.invoiceId) return res.status(400).json({ error: 'invoiceId requis' })
          const { data, error } = await sb.rpc('admin_cancel_proforma', { p_invoice_id: body.invoiceId, p_note: note, p_actor: actor })
          if (error) throw new Error(error.message)
          return res.status(200).json({ ok: true, result: data })
        }
        case 'suspend':
        case 'reactivate': {
          if (!body.userId) return res.status(400).json({ error: 'userId requis' })
          const { data, error } = await sb.rpc('admin_set_status', { p_user_id: body.userId, p_action: body.action, p_note: note, p_actor: actor })
          if (error) throw new Error(error.message)
          return res.status(200).json({ ok: true, result: data })
        }
        case 'extend': {
          const days = Number(body.days)
          if (!body.userId || !Number.isInteger(days)) return res.status(400).json({ error: 'userId et days requis' })
          const { data, error } = await sb.rpc('admin_extend_subscription', { p_user_id: body.userId, p_days: days, p_note: note, p_actor: actor })
          if (error) throw new Error(error.message)
          return res.status(200).json({ ok: true, result: data })
        }
        case 'delete': {
          // Confirmation obligatoire : le numéro d'abonné ressaisi par l'admin
          // est revérifié côté base (admin_delete_user).
          if (!body.userId || !body.confirm) return res.status(400).json({ error: 'userId et confirmation requis' })
          const { data, error } = await sb.rpc('admin_delete_user', { p_user_id: body.userId, p_confirm: String(body.confirm), p_note: note, p_actor: actor })
          if (error) throw new Error(error.message)
          return res.status(200).json({ ok: true, result: data })
        }
        default:
          return res.status(400).json({ error: 'Action inconnue' })
      }
    } catch (e: any) {
      // Les messages levés par les fonctions SQL sont rédigés pour l'admin.
      return res.status(400).json({ error: e?.message || 'Erreur' })
    }
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Method not allowed' })
}
