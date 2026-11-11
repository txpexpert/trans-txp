// lib/whatsapp.ts — envoi et réception WhatsApp (API Cloud de Meta). Serveur uniquement.
// ─────────────────────────────────────────────────────────────────────────────
// VARIABLES D'ENVIRONNEMENT (Vercel) :
//   WHATSAPP_TOKEN          jeton permanent d'un « utilisateur système » Meta Business
//                           (droits whatsapp_business_messaging et whatsapp_business_management)
//   WHATSAPP_PHONE_ID       identifiant du numéro (« Phone number ID », pas le numéro lui-même)
//   WHATSAPP_APP_SECRET     clé secrète de l'application Meta : vérifie la signature des webhooks
//   WHATSAPP_VERIFY_TOKEN   chaîne libre, saisie aussi dans Meta lors de la déclaration du webhook
//   WHATSAPP_GRAPH_VERSION  facultatif, défaut v23.0
//   WHATSAPP_ADMIN_EMAIL    destinataire des demandes « conseiller » (à défaut BILLING_ADMIN_EMAIL)
//   NEXT_PUBLIC_WHATSAPP_NUMBER  numéro affiché (bouton, liaison), ex. 212612345678
//
// Messages : une réponse libre n'est possible que dans les 24 h qui suivent le
// dernier message du client (fenêtre de service). Hors fenêtre, seul un modèle
// approuvé par Meta peut être envoyé (sendTemplate).
// ─────────────────────────────────────────────────────────────────────────────
import crypto from 'crypto'
import { supabaseAdmin } from './supabaseAdmin'

const GRAPH = () => `https://graph.facebook.com/${process.env.WHATSAPP_GRAPH_VERSION || 'v23.0'}`

export const whatsappConfigured = () => !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID)

/** Vérifie l'en-tête X-Hub-Signature-256 (HMAC-SHA256 du corps brut avec la clé de l'app). */
export function verifySignature(raw: Buffer, header: string | undefined): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET
  if (!secret || !header?.startsWith('sha256=')) return false
  const expected = Buffer.from('sha256=' + crypto.createHmac('sha256', secret).update(raw).digest('hex'))
  const got = Buffer.from(header)
  return got.length === expected.length && crypto.timingSafeEqual(got, expected)
}

/** Numéro marocain saisi librement → wa_id (212XXXXXXXXX). Renvoie null si inexploitable. */
export function toWaId(input: string | null | undefined): string | null {
  let d = String(input || '').replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  if (/^0[5-7]\d{8}$/.test(d)) d = '212' + d.slice(1)
  return /^\d{8,15}$/.test(d) ? d : null
}

async function post(payload: Record<string, unknown>) {
  if (!whatsappConfigured()) return { ok: false as const, error: 'WhatsApp non configuré' }
  const r = await fetch(`${GRAPH()}/${process.env.WHATSAPP_PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...payload }),
  })
  const j: any = await r.json().catch(() => ({}))
  if (!r.ok) return { ok: false as const, error: j?.error?.message || `HTTP ${r.status}` }
  return { ok: true as const, id: j?.messages?.[0]?.id as string | undefined }
}

async function journal(wa_id: string, kind: string, body: string, res: { ok: boolean; id?: string; error?: string }) {
  await supabaseAdmin().from('whatsapp_messages').insert({
    wa_message_id: res.ok ? res.id ?? null : null, wa_id, direction: 'out', kind, body,
    statut: res.ok ? 'sent' : 'failed', erreur: res.ok ? null : res.error,
  })
}

/** Message libre (dans la fenêtre de 24 h uniquement). Respecte l'opt-out. */
export async function sendText(to: string, text: string) {
  const { data: c } = await supabaseAdmin().from('whatsapp_contacts').select('opt_out_at').eq('wa_id', to).maybeSingle()
  if (c?.opt_out_at) return { ok: false as const, error: 'Contact désinscrit (STOP)' }
  const res = await post({ to, type: 'text', text: { body: text.slice(0, 4096), preview_url: true } })
  await journal(to, 'text', text, res)
  return res
}

/**
 * Modèle approuvé par Meta (fin d'essai, pro-forma, virement reçu, renouvellement…).
 * N'envoie qu'aux contacts ayant donné leur consentement et non désinscrits.
 */
export async function sendTemplate(to: string, name: string, params: string[] = [], lang = 'fr') {
  const { data: c } = await supabaseAdmin().from('whatsapp_contacts').select('opt_in_at, opt_out_at').eq('wa_id', to).maybeSingle()
  if (!c?.opt_in_at || c.opt_out_at) return { ok: false as const, error: 'Pas de consentement WhatsApp' }
  const res = await post({
    to, type: 'template',
    template: { name, language: { code: lang }, ...(params.length ? { components: [{ type: 'body', parameters: params.map(t => ({ type: 'text', text: t })) }] } : {}) },
  })
  await journal(to, 'template', `${name}(${params.join(' | ')})`, res)
  return res
}

/** Envoie un modèle à l'abonné si son numéro est relié et consentant ; silencieux sinon. */
export async function notifyUser(userId: string, template: string, params: string[] = []) {
  const { data: c } = await supabaseAdmin().from('whatsapp_contacts').select('wa_id').eq('user_id', userId).maybeSingle()
  if (!c?.wa_id) return { ok: false as const, error: 'Numéro non relié' }
  return sendTemplate(c.wa_id, template, params)
}

/** Accusé de lecture (coches bleues) sur un message entrant. */
export async function markRead(messageId: string) {
  await post({ status: 'read', message_id: messageId }).catch(() => {})
}
