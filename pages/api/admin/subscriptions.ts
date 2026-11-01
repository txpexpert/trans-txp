// pages/api/admin/subscriptions.ts
// ─────────────────────────────────────────────────────────────────────────────
// Pilotage des abonnements depuis le backoffice — évite toute intervention
// manuelle dans Supabase.
//
//   GET  → abonnés (table users, triés par numéro 26IXP…), factures, plans, derniers événements
//   POST → { action, ... } — voir AdminAction dans lib/subscriptions.ts
//
// Protégé par le cookie admin das_admin (même mécanisme que requireAdminSSR).
// Toutes les écritures passent par les fonctions SQL de la migration
// 0004_subscriptions.sql (transactionnelles et journalisées dans
// subscription_events) : jamais d'UPDATE direct ici.
// ─────────────────────────────────────────────────────────────────────────────
import type { NextApiRequest, NextApiResponse } from 'next'
import { COOKIE_NAME, verifyToken } from '../../../lib/adminAuth'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import type { AdminAction } from '../../../lib/subscriptions'

const USER_COLUMNS =
  'id, numero_abonne, email, nom, prenom, societe, telephone, profil, plan, statut, trial_ends_at, plan_ends_at, created_at, last_login_at, email_verified, role'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!verifyToken(req.cookies[COOKIE_NAME])) {
    return res.status(401).json({ error: 'Non autorisé' })
  }

  let sb: ReturnType<typeof supabaseAdmin>
  try { sb = supabaseAdmin() } catch (e: any) {
    return res.status(500).json({ error: e.message })
  }

  if (req.method === 'GET') {
    const [users, invoices, plans, events] = await Promise.all([
      sb.from('users').select(USER_COLUMNS).order('numero_abonne', { ascending: true }),
      sb.from('invoices').select('*').order('created_at', { ascending: false }).limit(500),
      sb.from('subscription_plans').select('code, label, price_per_year, monthly_ref, note').eq('active', true).order('sort_order'),
      sb.from('subscription_events').select('*').order('created_at', { ascending: false }).limit(50),
    ])
    const err = users.error || invoices.error || plans.error || events.error
    if (err) {
      console.error('[admin/subscriptions] GET', err)
      return res.status(500).json({ error: err.message })
    }
    return res.status(200).json({
      users:    users.data,
      invoices: invoices.data,
      plans:    plans.data,
      events:   events.data,
    })
  }

  if (req.method === 'POST') {
    const body = (req.body || {}) as AdminAction
    const note = (body as any).note ? String((body as any).note).slice(0, 500) : null
    const years = Math.min(5, Math.max(1, Number((body as any).years) || 1))
    const amount = (body as any).amount === undefined || (body as any).amount === null || (body as any).amount === ''
      ? null : Number((body as any).amount)
    if (amount !== null && (!Number.isFinite(amount) || amount < 0)) {
      return res.status(400).json({ error: 'Montant invalide' })
    }

    let rpc: { fn: string; args: Record<string, unknown> }
    switch (body.action) {
      case 'activate_plan':
      case 'create_proforma':
        if (!body.userId || !body.plan) return res.status(400).json({ error: 'userId et plan requis' })
        rpc = {
          fn: body.action === 'activate_plan' ? 'admin_activate_plan' : 'admin_create_proforma',
          args: { p_user_id: body.userId, p_plan: body.plan, p_years: years, p_amount: amount, p_note: note },
        }
        break
      case 'confirm_payment':
      case 'cancel_proforma':
        if (!body.invoiceId) return res.status(400).json({ error: 'invoiceId requis' })
        rpc = {
          fn: body.action === 'confirm_payment' ? 'admin_confirm_payment' : 'admin_cancel_proforma',
          args: { p_invoice_id: body.invoiceId, p_note: note },
        }
        break
      case 'suspend':
      case 'reactivate':
        if (!body.userId) return res.status(400).json({ error: 'userId requis' })
        rpc = { fn: 'admin_set_status', args: { p_user_id: body.userId, p_action: body.action, p_note: note } }
        break
      case 'extend': {
        const days = Number(body.days)
        if (!body.userId || !Number.isInteger(days)) return res.status(400).json({ error: 'userId et days requis' })
        rpc = { fn: 'admin_extend_subscription', args: { p_user_id: body.userId, p_days: days, p_note: note } }
        break
      }
      case 'delete':
        // Confirmation obligatoire : le numéro d'abonné ressaisi par l'admin
        // est revérifié côté base (admin_delete_user).
        if (!body.userId || !body.confirm) return res.status(400).json({ error: 'userId et confirmation requis' })
        rpc = { fn: 'admin_delete_user', args: { p_user_id: body.userId, p_confirm: String(body.confirm), p_note: note } }
        break
      default:
        return res.status(400).json({ error: 'Action inconnue' })
    }

    const { data, error } = await sb.rpc(rpc.fn, rpc.args)
    if (error) {
      // Les messages levés par les fonctions SQL sont rédigés pour l'admin.
      return res.status(400).json({ error: error.message })
    }
    return res.status(200).json({ ok: true, result: data })
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Method not allowed' })
}
