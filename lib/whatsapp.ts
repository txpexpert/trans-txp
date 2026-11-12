// lib/whatsapp.ts — IXP-Assistant sur WhatsApp : lien « wa.me », envoi par l'API Cloud de Meta,
// vérification de signature, filtre des données personnelles.
// Variables : NEXT_PUBLIC_WHATSAPP_NUMBER (bouton), WHATSAPP_TOKEN, WHATSAPP_PHONE_ID,
// WHATSAPP_APP_SECRET, WHATSAPP_VERIFY_TOKEN, WHATSAPP_ADMIN_EMAIL (réception et envoi).
import crypto from 'crypto'

export { WA_NUMERO, numeroLisible, lienWhatsapp, messagePourPage } from './whatsappLien'

/** Signature X-Hub-Signature-256 de Meta sur le corps brut. */
export function signatureValide(corps: Buffer, entete: string | undefined) {
  const secret = process.env.WHATSAPP_APP_SECRET
  if (!secret || !entete?.startsWith('sha256=')) return false
  const attendu = Buffer.from('sha256=' + crypto.createHmac('sha256', secret).update(corps).digest('hex'))
  const recu = Buffer.from(entete)
  return attendu.length === recu.length && crypto.timingSafeEqual(attendu, recu)
}

export function apiConfiguree() {
  return !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID)
}

/** Message texte (dans la fenêtre de 24 h ouverte par le contact). */
export async function envoyerTexte(telephone: string, texte: string) {
  if (!apiConfiguree()) return false
  const r = await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to: telephone, type: 'text', text: { preview_url: true, body: texte.slice(0, 4000) } }),
  })
  if (!r.ok) console.error('[whatsapp] envoi', r.status, (await r.text()).slice(0, 300))
  return r.ok
}

/** Données personnelles dans une question : email, téléphone, ICE, RIB, CIN.
 *  Règles prudentes pour ne pas bloquer les codes SH (10 chiffres, parfois commençant par 05, 06 ou 07). */
export function donneesPersonnelles(t: string): string | null {
  if (/[^\s@]+@[^\s@]+\.[a-z]{2,}/i.test(t)) return 'une adresse email'
  const chiffres = t.replace(/(\d)[\s.\-]+(?=\d)/g, '$1')
  if (/(?<!\d)\d{24}(?!\d)/.test(chiffres)) return 'un RIB'
  if (/(?<!\d)\d{15}(?!\d)/.test(chiffres)) return 'un numéro ICE'
  if (/(\+|(?<!\d)00)212\s?[5-7]|(?<!\d)212[5-7]\d{8}(?!\d)/.test(t.replace(/[\s.\-]/g, '')) || /(?<!\d)0[5-7](\s\d{2}){4}(?!\d)/.test(t)) return 'un numéro de téléphone'
  const cin = /\b([A-Z]{1,2})(\d{5,6})\b/.exec(t)
  if (cin && !['SH', 'HS', 'NC', 'CN', 'TN', 'NGP'].includes(cin[1])) return 'un numéro de CIN'
  return null
}

/** Masque un numéro pour l'affichage : +212 6•• ••• 839 */
export function masquer(tel: string) {
  return tel.length > 6 ? `+${tel.slice(0, 4)}•• ••• ${tel.slice(-3)}` : tel
}
