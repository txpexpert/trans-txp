// lib/billingCron.ts
// ─────────────────────────────────────────────────────────────────────────────
// Tâche quotidienne de facturation (appelée par /api/cron/expire-subscriptions,
// après l'expiration des abonnements et essais échus) :
//   1. fin d'essai      → pro-forma du plan choisi envoyée (sinon : email
//                         « choisissez votre abonnement ») ;
//   2. J-30 échéance    → pro-forma de renouvellement envoyée ;
//   3. J-7 et J-0       → rappels d'échéance (J-0 = dernières 24 h) ;
//   4. pro-forma impayée depuis 7 jours → relance (une fois).
// Idempotent : chaque envoi est réservé dans billing_notifications
// (unique user + type + date de référence) avant d'être fait ; relancer la
// tâche le même jour ne renvoie rien.
// Les comptes generaladmin ne sont jamais concernés.
// ─────────────────────────────────────────────────────────────────────────────
import { supabaseAdmin } from './supabaseAdmin'
import {
  issueProforma, loadSettings, emailReminder, emailTrialEnded, emailProforma,
  BILLING_USER_COLUMNS, type BillingUser,
} from './billingServer'
import type { BillingDoc } from './billing'

const DAY = 86_400_000

async function claim(userId: string, kind: string, refDate: string, email: string, invoiceId?: string | null): Promise<string | null> {
  const { data, error } = await supabaseAdmin().from('billing_notifications')
    .insert({ user_id: userId, kind, ref_date: refDate, email, invoice_id: invoiceId ?? null })
    .select('id').single()
  if (error) return null // déjà traité (contrainte unique) ou erreur : on n'envoie pas
  return data.id as string
}

async function done(id: string, ok: boolean, err?: string, invoiceId?: string | null) {
  await supabaseAdmin().from('billing_notifications')
    .update({ ok, error: err ?? null, ...(invoiceId ? { invoice_id: invoiceId } : {}) }).eq('id', id)
}

const day = (iso: string) => iso.slice(0, 10)

export async function runBillingCron(base: string) {
  const sb = supabaseAdmin()
  const s = await loadSettings()
  const now = Date.now()
  const out = { fin_essai: 0, renouvellement: 0, rappel_j7: 0, rappel_j0: 0, relance: 0, erreurs: [] as string[] }

  const { data: pend } = await sb.from('invoices').select('*').eq('status', 'proforma_envoyee')
  const pendingByUser = new Map<string, BillingDoc>()
  for (const d of (pend || []) as BillingDoc[]) if (d.user_id) pendingByUser.set(d.user_id, d)

  // 1. Fin d'essai (essais échus depuis moins de 30 jours) ──────────────────
  const { data: trials } = await sb.from('users').select(BILLING_USER_COLUMNS)
    .eq('plan', 'trial').eq('statut', 'expired')
    .gte('trial_ends_at', new Date(now - 30 * DAY).toISOString()).lte('trial_ends_at', new Date(now).toISOString())
  for (const u of (trials || []) as unknown as BillingUser[]) {
    if (u.role === 'generaladmin' || pendingByUser.has(u.id)) continue
    const id = await claim(u.id, 'fin_essai', day(u.trial_ends_at!), u.email)
    if (!id) continue
    try {
      if (u.plan_souhaite === 'pro' || u.plan_souhaite === 'premium') {
        const r = await issueProforma({ userId: u.id, plan: u.plan_souhaite, actor: 'systeme', origin: 'fin_essai', reuse: true, base })
        await done(id, r.emailed, r.emailError, r.doc.id)
      } else {
        const r = await emailTrialEnded(u, s, base)
        await done(id, r.ok, r.ok ? undefined : String((r as any).error))
      }
      out.fin_essai++
    } catch (e: any) { out.erreurs.push(`${u.numero_abonne} fin_essai : ${e.message}`); await done(id, false, e.message) }
  }

  // 2-3. Abonnements payés arrivant à échéance (≤ 30 jours) ─────────────────
  const { data: actives } = await sb.from('users').select(BILLING_USER_COLUMNS)
    .eq('statut', 'active').in('plan', ['pro', 'premium', 'enterprise'])
    .gte('plan_ends_at', new Date(now - DAY).toISOString()).lte('plan_ends_at', new Date(now + 30 * DAY).toISOString())
  for (const u of (actives || []) as unknown as BillingUser[]) {
    if (u.role === 'generaladmin' || !u.plan_ends_at) continue
    const ref = day(u.plan_ends_at)
    const left = Math.ceil((new Date(u.plan_ends_at).getTime() - now) / DAY)
    let doc = pendingByUser.get(u.id) || null

    // J-30 : pro-forma de renouvellement (Entreprise : montant HT du dernier contrat).
    if (!doc) {
      const id = await claim(u.id, 'renouvellement', ref, u.email)
      if (id) {
        try {
          let amountHT: number | null = null
          if (u.plan === 'enterprise') {
            const { data: last } = await sb.from('invoices').select('amount_ht, years').eq('user_id', u.id)
              .eq('plan_code', 'enterprise').eq('status', 'payee').order('paid_at', { ascending: false }).limit(1).maybeSingle()
            amountHT = last?.amount_ht ? Number(last.amount_ht) / (last.years || 1) : null
          }
          if (u.plan !== 'enterprise' || amountHT) {
            const r = await issueProforma({ userId: u.id, plan: u.plan, amountHT, actor: 'systeme', origin: 'renouvellement', reuse: true, base })
            doc = r.doc
            await done(id, r.emailed, r.emailError, r.doc.id)
          } else {
            const r = await emailReminder('j30', u, s, base, null)
            await done(id, r.ok, r.ok ? undefined : String((r as any).error))
          }
          out.renouvellement++
        } catch (e: any) { out.erreurs.push(`${u.numero_abonne} renouvellement : ${e.message}`); await done(id, false, e.message) }
      }
    }

    // J-7 et J-0 : rappels (tant que le renouvellement n'est pas payé).
    const kind = left <= 1 ? 'rappel_j0' : left <= 7 ? 'rappel_j7' : null
    if (kind) {
      const id = await claim(u.id, kind, ref, u.email, doc?.id)
      if (id) {
        try {
          const r = await emailReminder(kind === 'rappel_j0' ? 'j0' : 'j7', u, s, base, doc)
          await done(id, r.ok, r.ok ? undefined : String((r as any).error))
          out[kind]++
        } catch (e: any) { out.erreurs.push(`${u.numero_abonne} ${kind} : ${e.message}`); await done(id, false, e.message) }
      }
    }
  }

  // 4. Relance des pro-formas impayées depuis 7 jours (une seule fois) ──────
  const { data: stale } = await sb.from('invoices').select('*')
    .eq('status', 'proforma_envoyee').is('reminder_sent_at', null)
    .lte('sent_at', new Date(now - 7 * DAY).toISOString())
  for (const d of (stale || []) as BillingDoc[]) {
    if (!d.user_id) continue
    const { count } = await sb.from('paiements').select('id', { count: 'exact', head: true }).eq('invoice_id', d.id).eq('statut', 'declare')
    if (count) continue // justificatif en cours de vérification
    const { data: u } = await sb.from('users').select('email, prenom, numero_abonne, role').eq('id', d.user_id).single()
    if (!u || u.role === 'generaladmin') continue
    const r = await emailProforma(d, u, s, base, true)
    if (r.ok) { await sb.from('invoices').update({ reminder_sent_at: new Date().toISOString() }).eq('id', d.id); out.relance++ }
    else out.erreurs.push(`${u.numero_abonne} relance : ${String((r as any).error)}`)
  }

  return out
}
