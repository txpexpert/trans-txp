// lib/billingEmails.ts
// ─────────────────────────────────────────────────────────────────────────────
// E-mails de facturation des abonnements, conçus pour être reconnus sans
// ambiguïté dans la boîte de réception (par une personne, un filtre ou l'agent
// de rapprochement des paiements), y compris quand le client y répond.
//
// Convention d'identification (une seule référence par dossier : le n° de pro-forma)
//   1. Objet       : « [IXP-PF PF-IA-2026-0012] … » puis « [IXP-PAYE IA-2026-0012] … »
//                    Une réponse du client garde l'objet (« RE: [IXP-PF …] »).
//   2. Répondre à  : adresse « + » propre au dossier, ex. paiements+pf-ia-2026-0012@domaine
//                    (Gmail et Microsoft 365 livrent ces adresses dans la boîte principale).
//   3. Message-ID  : <pf-ia-2026-0012.ixp@domaine> ; la réponse du client le reprend
//                    dans In-Reply-To / References, même s'il modifie l'objet.
//   4. En-têtes    : X-IXP-Document, X-IXP-Abonne (envoi uniquement).
//   5. Corps       : ligne « Réf. IXP » lisible, et libellé de virement imposé = n° de pro-forma.
//
// Variables d'environnement
//   BILLING_REPLY_TO   adresse qui reçoit les preuves de paiement, ex. paiements@import-expert.ma
//   BILLING_BANK       coordonnées bancaires, JSON : {"titulaire":"…","banque":"…","rib":"…","swift":"…"}
//   BILLING_MSGID_DOMAIN  domaine des Message-ID (défaut : domaine de BILLING_REPLY_TO)
// ─────────────────────────────────────────────────────────────────────────────

export type BillingUser = {
  numero_abonne: string | null
  email: string
  prenom: string | null
  nom: string | null
  societe: string | null
}
export type BillingInvoice = {
  plan_code: string
  years: number
  amount: number
  currency: string
  proforma_number: string | null
  invoice_number: string | null
  sent_at?: string | null
  paid_at?: string | null
}
export type Bank = { titulaire?: string; banque?: string; rib?: string; swift?: string }
export type BillingMail = {
  to: string
  subject: string
  html: string
  text: string
  replyTo?: string
  headers: Record<string, string>
}

const PLAN: Record<string, string> = { pro: 'Pro', premium: 'Premium', enterprise: 'Entreprise' }
const SITE = () => process.env.NEXT_PUBLIC_SITE_URL || 'https://import-expert.ma'

export const TAG_PF = 'IXP-PF'
export const TAG_PAYE = 'IXP-PAYE'

function esc(s: unknown) {
  return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))
}
function money(n: number, cur = 'MAD') {
  return Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + (cur === 'MAD' ? 'DH' : cur)
}
function dateFr(iso?: string | null) {
  const d = iso ? new Date(iso) : new Date()
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
function who(u: BillingUser) {
  return [u.prenom, u.nom].filter(Boolean).join(' ') || u.societe || u.email
}

/** Adresse « + » propre au dossier : paiements@x.ma → paiements+pf-ia-2026-0012@x.ma */
export function dossierAddress(base: string | undefined, ref: string): string | undefined {
  if (!base || !base.includes('@')) return undefined
  const [local, domain] = base.split('@')
  return `${local.split('+')[0]}+${ref.toLowerCase()}@${domain}`
}
function msgId(ref: string, suffix = '') {
  const dom = process.env.BILLING_MSGID_DOMAIN || (process.env.BILLING_REPLY_TO || '').split('@')[1] || 'import-expert.ma'
  return `<${ref.toLowerCase()}${suffix}.ixp@${dom}>`
}
function bank(): Bank {
  try { return JSON.parse(process.env.BILLING_BANK || '{}') } catch { return {} }
}

// ── Gabarit commun (code visuel du site, compatible clients mail) ────────────
function layout(opts: { bandeau: string; bandeauBg: string; refLine: string; body: string }) {
  return `<!DOCTYPE html><html lang="fr"><body style="margin:0;background:#FAF7F0">
<div style="max-width:600px;margin:0 auto;font-family:'DM Sans',Arial,sans-serif;color:#14120F">
  <div style="background:#14120F;padding:18px 24px">
    <span style="font-family:Georgia,serif;font-size:21px;color:#fff">Import<span style="color:#C9A84C">-</span>eXPert</span>
    <span style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:.14em;color:#BDB3A3;margin-left:6px">MAROC</span>
  </div>
  <div style="background:${opts.bandeauBg};color:#fff;padding:10px 24px;font-family:'Courier New',monospace;font-size:12px;letter-spacing:.08em">${opts.bandeau}</div>
  <div style="background:#fff;border:1px solid #E6DCC7;border-top:none;padding:28px 24px">${opts.body}</div>
  <div style="padding:14px 24px;font-family:'Courier New',monospace;font-size:11px;color:#7A7168">${opts.refLine}</div>
  <div style="padding:0 24px 24px;font-size:11.5px;color:#7A7168;line-height:1.5">Import-eXPert · ${esc(SITE().replace(/^https?:\/\//, ''))}<br>Merci de conserver l’objet de ce message dans vos réponses : il permet de traiter votre dossier sans délai.</div>
</div></body></html>`
}
function row(k: string, v: string, strong = false) {
  return `<tr><td style="padding:8px 0;border-bottom:1px dashed #E6DCC7;font-size:13.5px;color:#7A7168">${k}</td><td style="padding:8px 0;border-bottom:1px dashed #E6DCC7;font-size:14px;text-align:right;${strong ? 'font-weight:600' : ''}">${v}</td></tr>`
}

// ── 1. Envoi de la pro-forma ─────────────────────────────────────────────────
export function proformaMail(u: BillingUser, inv: BillingInvoice): BillingMail {
  const pf = inv.proforma_number || 'PF'
  const plan = PLAN[inv.plan_code] || inv.plan_code
  const b = bank()
  const replyTo = dossierAddress(process.env.BILLING_REPLY_TO, pf)
  const abn = u.numero_abonne || '—'
  const bankRows = b.rib
    ? row('Titulaire', esc(b.titulaire || 'Import-eXPert')) + row('Banque', esc(b.banque || '')) + row('RIB', `<span style="font-family:'Courier New',monospace">${esc(b.rib)}</span>`) + (b.swift ? row('SWIFT', esc(b.swift)) : '')
    : row('Coordonnées bancaires', 'communiquées sur demande')
  const body = `
    <p style="font-size:15px;margin:0 0 14px">Bonjour ${esc(who(u))},</p>
    <p style="font-size:14.5px;line-height:1.6;margin:0 0 18px">Voici la facture pro-forma de votre abonnement <strong>${esc(plan)}</strong> à Import-eXPert. Votre accès est activé dès réception du paiement.</p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 20px">
      ${row('Pro-forma', `<span style="font-family:'Courier New',monospace">${esc(pf)}</span>`, true)}
      ${row('Date', dateFr(inv.sent_at))}
      ${row('Abonné', `<span style="font-family:'Courier New',monospace">${esc(abn)}</span>${u.societe ? ' · ' + esc(u.societe) : ''}`)}
      ${row('Formule', `${esc(plan)} · ${inv.years} an${inv.years > 1 ? 's' : ''}`)}
      ${row('Montant à régler', money(inv.amount, inv.currency), true)}
    </table>
    <div style="background:#FCF4E3;border:1px solid #EFD9A8;border-radius:10px;padding:16px 18px;margin:0 0 20px">
      <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:.12em;color:#9A620C;margin-bottom:8px">RÈGLEMENT PAR VIREMENT</div>
      <table style="width:100%;border-collapse:collapse">${bankRows}
        ${row('Libellé du virement', `<span style="font-family:'Courier New',monospace;background:#fff;padding:2px 6px;border-radius:4px">${esc(pf)}</span>`, true)}
      </table>
    </div>
    <p style="font-size:14.5px;line-height:1.6;margin:0 0 6px"><strong>Une fois le virement effectué :</strong> répondez simplement à ce message en joignant l’avis de virement ou l’ordre de virement exécuté. Ne modifiez pas l’objet.</p>
    <p style="font-size:13.5px;line-height:1.6;color:#3B3631;margin:0">Vous recevrez la facture acquittée et la confirmation d’activation dès le paiement constaté.</p>`
  const text = [
    `Bonjour ${who(u)},`, '',
    `Pro-forma ${pf} — abonnement ${plan}, ${inv.years} an(s).`,
    `Abonné : ${abn}`, `Montant à régler : ${money(inv.amount, inv.currency)}`, '',
    b.rib ? `Virement : ${b.titulaire || 'Import-eXPert'} · ${b.banque || ''} · RIB ${b.rib}${b.swift ? ' · SWIFT ' + b.swift : ''}` : 'Coordonnées bancaires communiquées sur demande.',
    `Libellé du virement : ${pf}`, '',
    'Une fois le virement effectué, répondez à ce message en joignant l’avis de virement, sans modifier l’objet.', '',
    `Réf. IXP : ${pf} · ${abn}`,
  ].join('\n')
  return {
    to: u.email,
    subject: `[${TAG_PF} ${pf}] Pro-forma abonnement ${plan} — Import-eXPert`,
    html: layout({ bandeau: `PRO-FORMA · ${esc(pf)} · EN ATTENTE DE PAIEMENT`, bandeauBg: '#153E82', refLine: `Réf. IXP : ${esc(pf)} · ${esc(abn)}`, body }),
    text,
    replyTo,
    headers: { 'Message-ID': msgId(pf), 'X-IXP-Document': pf, 'X-IXP-Abonne': abn, 'X-IXP-Type': 'proforma' },
  }
}

// ── 2. Facture acquittée et abonnement activé ────────────────────────────────
export function paidMail(u: BillingUser, inv: BillingInvoice, planEndsAt: string | null): BillingMail {
  const pf = inv.proforma_number || ''
  const fa = inv.invoice_number || 'FACTURE'
  const plan = PLAN[inv.plan_code] || inv.plan_code
  const abn = u.numero_abonne || '—'
  const body = `
    <p style="font-size:15px;margin:0 0 14px">Bonjour ${esc(who(u))},</p>
    <p style="font-size:14.5px;line-height:1.6;margin:0 0 18px">Nous avons bien reçu votre paiement. Votre abonnement <strong>${esc(plan)}</strong> est <strong style="color:#1E7346">activé</strong>.</p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 20px">
      ${row('Facture acquittée', `<span style="font-family:'Courier New',monospace">${esc(fa)}</span>`, true)}
      ${pf ? row('Pro-forma réglée', `<span style="font-family:'Courier New',monospace">${esc(pf)}</span>`) : ''}
      ${row('Date de paiement', dateFr(inv.paid_at))}
      ${row('Abonné', `<span style="font-family:'Courier New',monospace">${esc(abn)}</span>${u.societe ? ' · ' + esc(u.societe) : ''}`)}
      ${row('Montant réglé', money(inv.amount, inv.currency), true)}
      ${row('Formule', esc(plan))}
      ${row('Accès valable jusqu’au', `<strong>${planEndsAt ? dateFr(planEndsAt) : '—'}</strong>`)}
    </table>
    <div style="text-align:center;margin:26px 0 10px">
      <a href="${SITE()}/auth/login" style="display:inline-block;background:#1E7346;color:#fff;padding:13px 26px;border-radius:999px;text-decoration:none;font-size:14px;font-weight:500">Accéder à mon espace</a>
    </div>
    <p style="font-size:13px;line-height:1.6;color:#7A7168;margin:16px 0 0">Ce message vaut confirmation d’activation. Conservez-le avec votre facture pour votre comptabilité.</p>`
  const text = [
    `Bonjour ${who(u)},`, '',
    `Paiement reçu : votre abonnement ${plan} est activé.`,
    `Facture acquittée : ${fa}${pf ? ' (pro-forma ' + pf + ')' : ''}`,
    `Montant réglé : ${money(inv.amount, inv.currency)}`,
    `Accès valable jusqu’au : ${planEndsAt ? dateFr(planEndsAt) : '—'}`, '',
    `Accéder à mon espace : ${SITE()}/auth/login`, '',
    `Réf. IXP : ${fa}${pf ? ' · ' + pf : ''} · ${abn}`,
  ].join('\n')
  const headers: Record<string, string> = {
    'Message-ID': msgId(fa, '-paye'), 'X-IXP-Document': fa, 'X-IXP-Abonne': abn, 'X-IXP-Type': 'facture-payee',
  }
  // Rattache la confirmation au fil de la pro-forma dans la boîte du client et dans la nôtre.
  if (pf) { headers['In-Reply-To'] = msgId(pf); headers['References'] = msgId(pf) }
  return {
    to: u.email,
    subject: `[${TAG_PAYE} ${fa}] Facture acquittée — abonnement ${plan} activé${pf ? ' (réf. ' + pf + ')' : ''}`,
    html: layout({ bandeau: `FACTURE ACQUITTÉE · ${esc(fa)} · ABONNEMENT ACTIVÉ`, bandeauBg: '#1E7346', refLine: `Réf. IXP : ${esc(fa)}${pf ? ' · ' + esc(pf) : ''} · ${esc(abn)}`, body }),
    text,
    replyTo: pf ? dossierAddress(process.env.BILLING_REPLY_TO, pf) : process.env.BILLING_REPLY_TO,
    headers,
  }
}

/** Reconnaît un message entrant lié à un dossier (objet, adresse + ou fil). Utilisé par l'agent de rapprochement. */
export function matchDossier(m: { subject?: string; to?: string[]; inReplyTo?: string; references?: string }): string | null {
  const s = m.subject || ''
  const t = /\[(?:IXP-PF|IXP-PAYE)\s+([A-Z]{1,3}-IA-\d{4}-\d{3,5}|IA-\d{4}-\d{3,5})\]/i.exec(s)
  if (t) return t[1].toUpperCase()
  for (const a of m.to || []) {
    const p = /\+((?:pf-)?ia-\d{4}-\d{3,5})@/i.exec(a)
    if (p) return p[1].toUpperCase()
  }
  const th = /<((?:pf-)?ia-\d{4}-\d{3,5})(?:-paye)?\.ixp@/i.exec(`${m.inReplyTo || ''} ${m.references || ''}`)
  if (th) return th[1].toUpperCase()
  return null
}
