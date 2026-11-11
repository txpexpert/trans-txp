// lib/offres.ts — leviers de conversion sur le premier abonnement (Pro ou Premium) :
//   1. Codes de réduction : chaque client reçoit un code de bienvenue (pour lui) et un code à offrir
//      (à un ami ou un partenaire). Un seul code par client, porté sur sa première pro-forma.
//   2. Déduction des packs experts : un pack payé dans les 30 jours précédents est déduit du premier
//      abonnement. Si la déduction couvre tout l'abonnement, celui-ci est activé sans pro-forma.
// Taux modifiables ci-dessous.
import { randomBytes } from 'crypto'
import { supabaseAdmin } from './supabaseAdmin'
import { PRICING } from './pricing'
import { issueProforma } from './billingServer'
import { sendEmail } from './email'

export const REDUCTION: Record<'bienvenue' | 'parrainage', number> = { bienvenue: 15, parrainage: 15 } // en %
export const DELAI_DEDUCTION_PACK_JOURS = 30

const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const suffixe = () => Array.from(randomBytes(6)).map(x => ALPHA[x % ALPHA.length]).join('')

/** Crée, si besoin, les deux codes d'un client et les renvoie. */
export async function codesDuClient(userId: string) {
  const db = supabaseAdmin()
  const { data: existants } = await db.from('codes_promo').select('code, type, pourcentage, actif').eq('proprietaire', userId)
  const out: Record<string, { code: string; pourcentage: number }> = {}
  for (const c of existants ?? []) out[c.type] = { code: c.code, pourcentage: Number(c.pourcentage) }
  for (const type of ['bienvenue', 'parrainage'] as const) {
    if (out[type]) continue
    const code = `${type === 'bienvenue' ? 'BIENV' : 'AMI'}-${suffixe()}`
    const { error } = await db.from('codes_promo').insert({ code, type, proprietaire: userId, pourcentage: REDUCTION[type] })
    if (!error) out[type] = { code, pourcentage: REDUCTION[type] }
  }
  return out
}

/** Applique un code au compte (avant la première pro-forma). */
export async function appliquerCode(userId: string, saisie: string): Promise<{ ok: true; pourcentage: number } | { ok: false; error: string }> {
  const db = supabaseAdmin()
  const code = saisie.trim().toUpperCase()
  const { data: c } = await db.from('codes_promo').select('*').eq('code', code).maybeSingle()
  if (!c || !c.actif || (c.expire_le && new Date(c.expire_le) < new Date())) return { ok: false, error: 'Code inconnu ou expiré.' }
  if (c.type === 'bienvenue' && c.proprietaire !== userId) return { ok: false, error: 'Ce code de bienvenue est personnel.' }
  if (c.type === 'parrainage' && c.proprietaire === userId) return { ok: false, error: 'Ce code est à offrir : utilisez votre code de bienvenue.' }
  const { data: u } = await db.from('users').select('plan, statut').eq('id', userId).single()
  const { count: payees } = await db.from('invoices').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'payee')
  if ((payees ?? 0) > 0 || (['pro', 'premium', 'enterprise'].includes(u?.plan) && u?.statut === 'active')) return { ok: false, error: 'Les codes s’appliquent au premier abonnement.' }
  const { data: deja } = await db.from('codes_utilisations').select('id, utilise_le').eq('user_id', userId).maybeSingle()
  if (deja?.utilise_le) return { ok: false, error: 'Un code a déjà été utilisé sur votre compte.' }
  const { error } = deja
    ? await db.from('codes_utilisations').update({ code, appliquee_le: new Date().toISOString() }).eq('id', deja.id)
    : await db.from('codes_utilisations').insert({ code, user_id: userId })
  if (error) return { ok: false, error: error.message }
  return { ok: true, pourcentage: Number(c.pourcentage) }
}

/** Montant HT du premier abonnement après code et packs. */
export async function calculerPremierAbonnement(userId: string, plan: 'pro' | 'premium') {
  const db = supabaseAdmin()
  const base = PRICING[plan].annual!
  const [{ data: util }, { data: packs }] = await Promise.all([
    db.from('codes_utilisations').select('id, code, utilise_le, codes_promo(pourcentage, type)').eq('user_id', userId).is('utilise_le', null).maybeSingle(),
    db.from('commandes_packs').select('id, pack, montant_ht, payee_le').eq('user_id', userId).is('deduit_le', null)
      .not('payee_le', 'is', null).gte('payee_le', new Date(Date.now() - DELAI_DEDUCTION_PACK_JOURS * 864e5).toISOString()),
  ])
  const pct = util ? Number((util as any).codes_promo?.pourcentage || 0) : 0
  const reduction = Math.round(base * pct) / 100
  const packsMontant = (packs ?? []).reduce((s, p) => s + (Number(p.montant_ht) || 0), 0)
  const net = Math.max(0, Math.round((base - reduction - packsMontant) * 100) / 100)
  const notes: string[] = []
  if (util) notes.push(`Code ${util.code} : −${pct} % (−${reduction} DH HT)`)
  for (const p of packs ?? []) notes.push(`Pack « ${p.pack} » déduit : −${Number(p.montant_ht)} DH HT`)
  return { base, net, reduction, packsMontant, notes, utilisationId: util?.id ?? null, packIds: (packs ?? []).map(p => p.id) }
}

/** Première pro-forma d'abonnement avec réductions ; activation directe si les packs couvrent tout. */
export async function emettrePremierAbonnement(opts: { userId: string; plan: 'pro' | 'premium'; actor: string; origin: 'client' | 'fin_essai'; base: string }) {
  const db = supabaseAdmin()
  const { count: payees } = await db.from('invoices').select('id', { count: 'exact', head: true }).eq('user_id', opts.userId).eq('status', 'payee')
  if ((payees ?? 0) > 0) {
    const r = await issueProforma({ userId: opts.userId, plan: opts.plan, actor: opts.actor, origin: opts.origin, reuse: true, base: opts.base })
    return { ...r, active: false }
  }
  const calc = await calculerPremierAbonnement(opts.userId, opts.plan)
  const maintenant = new Date().toISOString()
  if (calc.net <= 0) {
    // Abonnement entièrement couvert par les packs payés : activation sans pro-forma (le pack a été facturé).
    const fin = new Date(Date.now() + 365 * 864e5).toISOString()
    const { data: u } = await db.from('users').select('email, prenom, plan, statut').eq('id', opts.userId).single()
    await db.from('users').update({ plan: opts.plan, statut: 'active', plan_ends_at: fin, plan_souhaite: null }).eq('id', opts.userId)
    await db.from('subscription_events').insert({ user_id: opts.userId, user_email: u?.email, type: 'activation_pack', from_plan: u?.plan, to_plan: opts.plan,
      from_statut: u?.statut, to_statut: 'active', plan_ends_at: fin, amount: 0, note: calc.notes.join(' ; '), actor: opts.actor })
    if (calc.packIds.length) await db.from('commandes_packs').update({ deduit_le: maintenant }).in('id', calc.packIds)
    if (calc.utilisationId) await db.from('codes_utilisations').update({ utilise_le: maintenant }).eq('id', calc.utilisationId)
    if (u?.email) await sendEmail({ to: u.email, subject: 'Votre abonnement est activé',
      html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#14120F"><p>Bonjour${u.prenom ? ' ' + u.prenom : ''},</p><p>Votre abonnement ${opts.plan === 'pro' ? 'Pro' : 'Premium'} est activé pour un an : le pack expert réglé couvre son montant.</p><p><a href="${opts.base}/mon-espace">Ouvrir mon espace</a></p></div>` })
    return { doc: null, emailed: true, active: true, notes: calc.notes }
  }
  const r = await issueProforma({
    userId: opts.userId, plan: opts.plan, actor: opts.actor, origin: opts.origin, reuse: true, base: opts.base,
    amountHT: calc.net < calc.base ? calc.net : null, note: calc.notes.join(' ; ') || null,
  })
  // Réductions consommées seulement si la pro-forma émise porte bien le montant réduit
  if (calc.net < calc.base && Math.abs(Number((r.doc as any).amount_ht) - calc.net) < 0.01) {
    if (calc.packIds.length) await db.from('commandes_packs').update({ deduit_le: maintenant, deduit_sur: r.doc.id }).in('id', calc.packIds)
    if (calc.utilisationId) await db.from('codes_utilisations').update({ utilise_le: maintenant, invoice_id: r.doc.id }).eq('id', calc.utilisationId)
  }
  return { ...r, active: false, notes: calc.notes }
}
