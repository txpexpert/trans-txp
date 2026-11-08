// lib/billingServer.ts
// ─────────────────────────────────────────────────────────────────────────────
// Facturation — côté serveur uniquement (API routes, getServerSideProps, cron).
//   • getBillingUser : session client vérifiée en base (même règle que
//     /api/auth/me : cookie signé + session non remplacée).
//   • issueProforma / confirmPayment : appellent les fonctions SQL de la
//     migration 0010 puis envoient l'email correspondant au client.
//   • Modèles d'email : pro-forma, facture, rappels, fin d'essai.
// Toutes les écritures passent par les fonctions SQL (transactionnelles,
// journalisées) : jamais d'UPDATE direct ici.
// ─────────────────────────────────────────────────────────────────────────────
import type { NextApiRequest } from 'next'
import type { IncomingMessage } from 'http'
import { supabaseAdmin } from './supabaseAdmin'
import { verifyUserToken, USER_COOKIE } from './userAuth'
import { parseCookie, siteUrl } from './adminAuth'
import { sendEmail } from './email'
import { PLAN_LABEL } from './subscriptions'
import {
  fmtAbonne, fmtDocNumber, fmtMAD, fmtDateLong, docTTC,
  type BillingDoc, type BillingSettings,
} from './billing'

export const BILLING_USER_COLUMNS =
  'id, numero_abonne, email, nom, prenom, societe, telephone, plan, statut, role, trial_ends_at, plan_ends_at, ' +
  'plan_souhaite, type_client, raison_sociale, ice, if_fiscal, rc, adresse_facturation, code_postal, ville, pays, current_session_id'

export interface BillingUser {
  id: string; numero_abonne: string; email: string
  nom: string | null; prenom: string | null; societe: string | null; telephone: string | null
  plan: string; statut: string; role: string | null
  trial_ends_at: string | null; plan_ends_at: string | null; plan_souhaite: string | null
  type_client: 'entreprise' | 'particulier' | null
  raison_sociale: string | null; ice: string | null; if_fiscal: string | null; rc: string | null
  adresse_facturation: string | null; code_postal: string | null; ville: string | null; pays: string | null
  current_session_id: string | null
}

/** Client connecté (cookie dia_session), relu en base. */
export async function getBillingUser(req: NextApiRequest | IncomingMessage): Promise<BillingUser | null> {
  const cookies = (req as NextApiRequest).cookies ?? parseCookie(req.headers.cookie)
  const payload = verifyUserToken(cookies[USER_COOKIE])
  if (!payload) return null
  const { data } = await supabaseAdmin()
    .from('users').select(BILLING_USER_COLUMNS)
    .eq('email', payload.email.toLowerCase()).maybeSingle()
  const u = data as unknown as BillingUser | null
  if (!u) return null
  if (u.current_session_id && u.current_session_id !== payload.sessionId) return null
  return u
}

export async function loadSettings(): Promise<BillingSettings> {
  const { data, error } = await supabaseAdmin().from('billing_settings').select('*').eq('id', true).single()
  if (error || !data) throw new Error('Paramètres de facturation introuvables (migration 0010 appliquée ?)')
  return data as BillingSettings
}

function billingFrom(_s: BillingSettings): string | undefined {
  // Expéditeur dédié (domaine vérifié dans Resend), sinon RESEND_FROM.
  return process.env.RESEND_FROM_BILLING || undefined
}

// ── Mise en page commune des emails ──────────────────────────────────────────
function layout(s: BillingSettings, title: string, body: string, cta?: { url: string; label: string }) {
  const id = [s.raison_sociale, s.forme_juridique, s.ice ? `ICE ${s.ice}` : null].filter(Boolean).join(' · ')
  return `
  <div style="font-family:'DM Sans',Arial,sans-serif;max-width:560px;margin:0 auto;color:#0A0A0A;">
    <div style="background:#0C2D5C;padding:18px;text-align:center;">
      <span style="color:#E8C97A;font-family:Georgia,serif;font-size:19px;">${esc(s.site_nom).toUpperCase()}</span>
    </div>
    <div style="padding:28px 24px;font-size:14px;line-height:1.6;color:#3A3530;">
      <h1 style="font-size:19px;font-weight:600;margin:0 0 14px;color:#0A0A0A;">${title}</h1>
      ${body}
      ${cta ? `<div style="text-align:center;margin:26px 0;">
        <a href="${cta.url}" style="display:inline-block;background:#0C2D5C;color:#E8C97A;padding:13px 26px;text-decoration:none;font-size:13px;letter-spacing:.06em;">${cta.label}</a>
      </div>` : ''}
    </div>
    <div style="border-top:1px solid #E8DFC8;padding:14px 24px;font-size:11px;color:#8A8078;">
      ${esc(id)}${s.email_facturation ? ` · ${esc(s.email_facturation)}` : ''}
    </div>
  </div>`
}

export function esc(v: unknown): string {
  return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

// ── Repérage des dossiers dans la boîte de facturation (2026-11-08) ─────────
// Une référence unique suit le dossier : la référence de paiement (PF-…).
//   • objet balisé « [IXP-PF PF-…] » puis « [IXP-PAYE <n° facture>] » : la
//     réponse du client garde la balise ;
//   • adresse de réponse propre au dossier : facturation+pf-…@domaine (Gmail et
//     Microsoft 365 la livrent dans la boîte principale) ;
//   • Message-ID <pf-….ixp@domaine>, repris par la réponse du client
//     (In-Reply-To / References) ; la facture s'affiche dans le même fil ;
//   • en-têtes X-IXP-* et ligne « Réf. IXP » en pied de message.
// Filtre Gmail conseillé : subject:(IXP-PF OR IXP-PAYE) → libellé IXP/Paiements.
export const TAG_PF = 'IXP-PF'
export const TAG_PAYE = 'IXP-PAYE'

export function dossierAddress(base: string | null | undefined, ref: string): string | undefined {
  if (!base || !base.includes('@') || !ref) return base || undefined
  const [local, domain] = base.split('@')
  return `${local.split('+')[0]}+${ref.toLowerCase()}@${domain}`
}
function msgId(s: BillingSettings, ref: string, suffix = '') {
  const dom = (s.email_facturation || '').split('@')[1] || 'import-expert.ma'
  return `<${ref.toLowerCase()}${suffix}.ixp@${dom}>`
}
function dossierHeaders(s: BillingSettings, doc: BillingDoc, user: { numero_abonne: string | null }, type: string, ownRef?: string) {
  const pf = fmtDocNumber(doc.payment_reference)
  const h: Record<string, string> = {
    'X-IXP-Document': ownRef || pf, 'X-IXP-Reference': pf, 'X-IXP-Abonne': fmtAbonne(user.numero_abonne), 'X-IXP-Type': type,
  }
  if (ownRef) {
    h['Message-ID'] = msgId(s, ownRef, '-' + type)
    h['In-Reply-To'] = msgId(s, pf); h['References'] = msgId(s, pf)
  } else if (type === 'proforma') {
    h['Message-ID'] = msgId(s, pf)
  } else {
    h['Message-ID'] = msgId(s, pf, '-' + type + '-' + Date.now().toString(36))
    h['In-Reply-To'] = msgId(s, pf); h['References'] = msgId(s, pf)
  }
  return h
}
function refLine(...parts: (string | null | undefined)[]) {
  return `<p style="margin:18px 0 0;font-family:monospace;font-size:11px;color:#8A8078;">Réf. IXP : ${parts.filter(Boolean).map(esc).join(' · ')}<br>Merci de conserver l’objet de ce message dans vos réponses.</p>`
}

/** Reconnaît un message entrant lié à un dossier (objet, adresse « + » ou fil). Renvoie la référence PF-… ou le n° de facture. */
export function matchDossier(m: { subject?: string; to?: string[]; inReplyTo?: string; references?: string }): string | null {
  const t = /\[IXP-(?:PF|PAYE)\s+((?:PF-)?[A-Z]{3}\d{2}[A-Z]{2}\d{2})\]/i.exec(m.subject || '')
  if (t) return t[1].toUpperCase()
  for (const a of m.to || []) {
    const p = /\+((?:pf-)?[a-z]{3}\d{2}[a-z]{2}\d{2})@/i.exec(a)
    if (p) return p[1].toUpperCase()
  }
  const th = /<((?:pf-)?[a-z]{3}\d{2}[a-z]{2}\d{2})[^.>]*\.ixp@/i.exec(`${m.inReplyTo || ''} ${m.references || ''}`)
  return th ? th[1].toUpperCase() : null
}

function bankBlock(s: BillingSettings, ref: string, amount: number) {
  const rows: [string, string][] = [
    ['Montant à virer', fmtMAD(amount) + ' TTC'],
    ['Référence à indiquer', fmtDocNumber(ref)],
    ['Bénéficiaire', s.titulaire_compte || s.raison_sociale],
    ['Banque', s.banque || '— (communiquée prochainement)'],
    ['RIB', s.rib || '— (communiqué prochainement)'],
  ]
  if (s.swift) rows.push(['SWIFT', s.swift])
  return `<table style="width:100%;border-collapse:collapse;margin:14px 0;font-size:13px;">
    ${rows.map(([k, v]) => `<tr><td style="padding:6px 8px;border:1px solid #E8DFC8;color:#6E6A62;">${k}</td>
      <td style="padding:6px 8px;border:1px solid #E8DFC8;font-weight:600;font-family:${k.startsWith('R') ? 'monospace' : 'inherit'};">${esc(v)}</td></tr>`).join('')}
  </table>`
}

const docUrl = (base: string, id: string, kind: 'doc' | 'avoir' = 'doc') =>
  `${base}/facturation/document/${id}${kind === 'avoir' ? '?type=avoir' : ''}`

// ── Emails ───────────────────────────────────────────────────────────────────
export async function emailProforma(doc: BillingDoc, user: Pick<BillingUser, 'email' | 'prenom' | 'numero_abonne'>, s: BillingSettings, base: string, relance = false) {
  const plan = PLAN_LABEL[doc.plan_code] || doc.plan_code
  const ttc = docTTC(doc)
  const body = `
    <p>Bonjour${user.prenom ? ' ' + esc(user.prenom) : ''},</p>
    <p>${relance
      ? `Nous n'avons pas encore reçu le règlement de votre facture pro-forma <b>${fmtDocNumber(doc.payment_reference)}</b>.`
      : `Veuillez trouver votre facture pro-forma <b>${fmtDocNumber(doc.payment_reference)}</b> pour l'abonnement annuel <b>${esc(s.site_nom)} ${plan}</b>.`}</p>
    <p>Montant : <b>${fmtMAD(doc.amount_ht)} HT</b> + TVA ${doc.vat_rate ?? s.tva_rate} % = <b>${fmtMAD(ttc)} TTC</b>.
       Numéro d'abonné : <b>${fmtAbonne(user.numero_abonne)}</b>.</p>
    <p>Pour régler par virement :</p>
    ${bankBlock(s, doc.payment_reference || '', ttc)}
    <p>Indiquez impérativement la référence <b>${fmtDocNumber(doc.payment_reference)}</b> dans le libellé du virement. Le montant viré doit correspondre exactement au montant TTC.</p>
    <p><b>Une fois le virement effectué :</b> déposez votre justificatif dans votre espace « Mon abonnement », ou répondez simplement à ce message en joignant l'avis de virement, sans modifier l'objet.</p>
    <p>Votre abonnement est activé pour 12 mois à la validation du paiement ; la facture définitive vous est alors envoyée.</p>
    ${refLine(fmtDocNumber(doc.payment_reference), fmtAbonne(user.numero_abonne))}`
  return sendEmail({
    to: user.email, from: billingFrom(s), replyTo: dossierAddress(s.email_facturation, fmtDocNumber(doc.payment_reference)),
    headers: dossierHeaders(s, doc, user, relance ? 'relance' : 'proforma'),
    subject: `[${TAG_PF} ${fmtDocNumber(doc.payment_reference)}] ${relance ? 'Relance — ' : ''}Facture pro-forma — ${s.site_nom} ${plan}`,
    html: layout(s, relance ? 'Rappel de paiement' : 'Votre facture pro-forma', body, { url: docUrl(base, doc.id), label: 'VOIR LA PRO-FORMA' }),
  })
}

export async function emailInvoice(doc: BillingDoc, user: Pick<BillingUser, 'email' | 'prenom' | 'numero_abonne'>, s: BillingSettings, base: string) {
  const plan = PLAN_LABEL[doc.plan_code] || doc.plan_code
  const carried = doc.days_carried > 0
    ? `<p>Votre abonnement étant encore en cours, les <b>${doc.days_carried} jours restants</b> ont été ajoutés à la nouvelle période.</p>` : ''
  const body = `
    <p>Bonjour${user.prenom ? ' ' + esc(user.prenom) : ''},</p>
    <p>Nous avons bien reçu votre paiement de <b>${fmtMAD(docTTC(doc))} TTC</b> (référence ${fmtDocNumber(doc.payment_reference)}). Merci.</p>
    <p>Votre abonnement <b>${esc(s.site_nom)} ${plan}</b> est actif jusqu'au <b>${fmtDateLong(doc.period_end)}</b>.</p>
    ${carried}
    <p>Votre facture <b>${esc(doc.invoice_number)}</b> est disponible dans votre espace « Mon abonnement » ; elle peut être imprimée ou enregistrée en PDF.</p>
    <p>Ce message vaut confirmation d'activation.</p>
    ${refLine(doc.invoice_number, fmtDocNumber(doc.payment_reference), fmtAbonne(user.numero_abonne))}`
  return sendEmail({
    to: user.email, from: billingFrom(s), replyTo: dossierAddress(s.email_facturation, fmtDocNumber(doc.payment_reference)),
    headers: dossierHeaders(s, doc, user, 'facture', doc.invoice_number || undefined),
    subject: `[${TAG_PAYE} ${doc.invoice_number}] Facture acquittée — abonnement ${s.site_nom} ${plan} activé (réf. ${fmtDocNumber(doc.payment_reference)})`,
    html: layout(s, 'Paiement reçu — abonnement activé', body, { url: docUrl(base, doc.id), label: 'VOIR LA FACTURE' }),
  })
}

export async function emailReminder(kind: 'j30' | 'j7' | 'j0', user: Pick<BillingUser, 'email' | 'prenom' | 'plan' | 'plan_ends_at'>, s: BillingSettings, base: string, doc?: BillingDoc | null) {
  const plan = PLAN_LABEL[user.plan] || user.plan
  const when = kind === 'j0'
    ? `expire le ${fmtDateLong(user.plan_ends_at)} : sans renouvellement, l'accès sera suspendu`
    : `arrive à échéance le ${fmtDateLong(user.plan_ends_at)}`
  const body = `
    <p>Bonjour${user.prenom ? ' ' + esc(user.prenom) : ''},</p>
    <p>Votre abonnement <b>${esc(s.site_nom)} ${plan}</b> ${when}.</p>
    ${doc ? `<p>Votre pro-forma de renouvellement <b>${fmtDocNumber(doc.payment_reference)}</b> (${fmtMAD(docTTC(doc))} TTC) est disponible.
      En réglant avant l'échéance, les jours restants s'ajoutent à la nouvelle période.</p>
      ${bankBlock(s, doc.payment_reference || '', docTTC(doc))}` : '<p>Contactez-nous pour le renouvellement de votre contrat.</p>'}`
  const tag = doc ? `[${TAG_PF} ${fmtDocNumber(doc.payment_reference)}] ` : ''
  return sendEmail({
    to: user.email, from: billingFrom(s),
    replyTo: doc ? dossierAddress(s.email_facturation, fmtDocNumber(doc.payment_reference)) : s.email_facturation || undefined,
    ...(doc ? { headers: dossierHeaders(s, doc, { numero_abonne: null }, 'rappel-' + kind) } : {}),
    subject: tag + (kind === 'j0' ? `Dernier jour : votre abonnement ${s.site_nom} expire` : `Renouvellement de votre abonnement ${s.site_nom}`),
    html: layout(s, 'Renouvellement de votre abonnement', body, { url: `${base}/mon-abonnement`, label: 'MON ABONNEMENT' }),
  })
}

export async function emailTrialEnded(user: Pick<BillingUser, 'email' | 'prenom'>, s: BillingSettings, base: string) {
  const body = `
    <p>Bonjour${user.prenom ? ' ' + esc(user.prenom) : ''},</p>
    <p>Votre essai gratuit de 14 jours sur ${esc(s.site_nom)} est terminé et l'accès complet est suspendu.</p>
    <p>Choisissez votre abonnement annuel dans votre espace : votre facture pro-forma vous est envoyée immédiatement, et l'accès est rétabli pour 12 mois à la validation de votre virement.</p>`
  return sendEmail({
    to: user.email, from: billingFrom(s), replyTo: s.email_facturation || undefined,
    subject: `Votre essai ${s.site_nom} est terminé`,
    html: layout(s, 'Fin de votre essai gratuit', body, { url: `${base}/mon-abonnement`, label: 'CHOISIR MON ABONNEMENT' }),
  })
}

export async function emailAdminJustificatif(doc: BillingDoc, user: Pick<BillingUser, 'email' | 'numero_abonne'>, montant: number, s: BillingSettings, base: string) {
  const to = process.env.BILLING_ADMIN_EMAIL || s.email_facturation
  if (!to) return { ok: false, error: 'Aucun destinataire' }
  return sendEmail({
    to, from: billingFrom(s),
    headers: dossierHeaders(s, doc, user, 'justificatif'),
    subject: `[${TAG_PF} ${fmtDocNumber(doc.payment_reference)}] Justificatif déposé — ${fmtAbonne(user.numero_abonne)}`,
    html: layout(s, 'Justificatif de virement à vérifier',
      `<p>${esc(user.email)} (${fmtAbonne(user.numero_abonne)}) a déposé un justificatif de <b>${fmtMAD(montant)}</b>
       pour la pro-forma <b>${fmtDocNumber(doc.payment_reference)}</b> (attendu : ${fmtMAD(docTTC(doc))} TTC).</p>
       <p>Vérifier la réception des fonds sur le compte, puis valider dans le backoffice.</p>`,
      { url: `${base}/backoffice/abonnements`, label: 'OUVRIR LE BACKOFFICE' }),
  })
}

// ── Opérations + email ───────────────────────────────────────────────────────
type Origin = 'admin' | 'client' | 'fin_essai' | 'renouvellement'

export async function issueProforma(opts: {
  userId: string; plan: string; years?: number; amountHT?: number | null
  actor: string; note?: string | null; origin: Origin; reuse?: boolean; notify?: boolean; base?: string
}): Promise<{ doc: BillingDoc; emailed: boolean; emailError?: string }> {
  const sb = supabaseAdmin()
  const { data, error } = await sb.rpc('billing_create_proforma', {
    p_user_id: opts.userId, p_plan: opts.plan, p_years: opts.years ?? 1, p_amount_ht: opts.amountHT ?? null,
    p_actor: opts.actor, p_note: opts.note ?? null, p_origin: opts.origin, p_reuse: !!opts.reuse,
  })
  if (error) throw new Error(error.message)
  const doc = data as BillingDoc
  if (opts.notify === false) return { doc, emailed: false }
  const [{ data: u }, s] = await Promise.all([
    sb.from('users').select('email, prenom, numero_abonne').eq('id', opts.userId).single(),
    loadSettings(),
  ])
  const r = await emailProforma(doc, u as any, s, opts.base || siteUrl())
  return { doc, emailed: r.ok, emailError: r.ok ? undefined : String((r as any).error) }
}

export async function confirmPayment(opts: {
  invoiceId: string; amount: number; dateValeur?: string | null; reference?: string | null
  paiementId?: string | null; actor: string; note?: string | null; base?: string
}): Promise<{ doc: BillingDoc; emailed: boolean; emailError?: string }> {
  const sb = supabaseAdmin()
  const { data, error } = await sb.rpc('billing_confirm_payment', {
    p_invoice_id: opts.invoiceId, p_amount_recu: opts.amount, p_date_valeur: opts.dateValeur || null,
    p_reference: opts.reference || null, p_paiement_id: opts.paiementId || null, p_actor: opts.actor, p_note: opts.note ?? null,
  })
  if (error) throw new Error(error.message)
  const doc = data as BillingDoc
  const [{ data: u }, s] = await Promise.all([
    sb.from('users').select('email, prenom, numero_abonne').eq('id', doc.user_id!).single(),
    loadSettings(),
  ])
  const r = await emailInvoice(doc, u as any, s, opts.base || siteUrl())
  return { doc, emailed: r.ok, emailError: r.ok ? undefined : String((r as any).error) }
}
