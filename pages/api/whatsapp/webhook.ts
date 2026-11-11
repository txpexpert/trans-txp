// pages/api/whatsapp/webhook.ts — point de réception des notifications WhatsApp (Meta).
// ─────────────────────────────────────────────────────────────────────────────
// À déclarer dans Meta (App → WhatsApp → Configuration) :
//   URL de rappel : https://<domaine>/api/whatsapp/webhook
//   Jeton de vérification : valeur de WHATSAPP_VERIFY_TOKEN ; champ abonné : messages
//
// GET  : défi de vérification envoyé par Meta lors de la déclaration.
// POST : messages entrants et statuts des messages envoyés. Signature
//        X-Hub-Signature-256 vérifiée sur le corps brut (bodyParser désactivé).
//
// Mots-clés reconnus (insensibles à la casse et aux accents) :
//   IXP 123456                   → relie le numéro au compte, vaut consentement daté
//   STOP / ARRET / توقف          → désinscription ; START / REPRENDRE → réinscription
//   CONSEILLER / HUMAIN / EXPERT / مستشار (message court) → conversation confiée à l'équipe 24 h
// Toute autre question d'un abonné relié est traitée par IXP-Assistant (lib/whatsappBot.ts).
// On répond 200 dès que la signature est valide, même en cas d'erreur interne,
// pour éviter les renvois en boucle ; les doublons sont écartés par wa_message_id.
// ─────────────────────────────────────────────────────────────────────────────
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { verifySignature, sendText, markRead } from '../../../lib/whatsapp'
import { repondreQuestion, contientDonneesPersonnelles } from '../../../lib/whatsappBot'
import { canAccessModule, type Plan, type Statut } from '../../../lib/moduleAccess'
import { sendEmail } from '../../../lib/email'

export const config = { api: { bodyParser: false }, maxDuration: 60 }

const SITE = () => (process.env.NEXT_PUBLIC_SITE_URL || 'https://import-expert.ma').replace(/\/$/, '')
const LIMITE_HEURE = 30 // questions par numéro et par heure

async function corpsBrut(req: NextApiRequest): Promise<Buffer> {
  const parts: Buffer[] = []
  for await (const c of req) parts.push(typeof c === 'string' ? Buffer.from(c) : c)
  return Buffer.concat(parts)
}

const plat = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toUpperCase()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const q = req.query
    if (q['hub.mode'] === 'subscribe' && process.env.WHATSAPP_VERIFY_TOKEN && q['hub.verify_token'] === process.env.WHATSAPP_VERIFY_TOKEN) {
      return res.status(200).send(String(q['hub.challenge'] ?? ''))
    }
    return res.status(403).end()
  }
  if (req.method !== 'POST') return res.status(405).end()

  const raw = await corpsBrut(req)
  if (!verifySignature(raw, req.headers['x-hub-signature-256'] as string | undefined)) return res.status(401).end()

  try {
    const body = JSON.parse(raw.toString('utf8'))
    for (const entry of body?.entry ?? []) {
      for (const change of entry?.changes ?? []) {
        const v = change?.value ?? {}
        for (const st of v.statuses ?? []) await majStatut(st)
        const noms: Record<string, string> = Object.fromEntries((v.contacts ?? []).map((c: any) => [c.wa_id, c.profile?.name]))
        for (const m of v.messages ?? []) await traiterMessage(m, noms[m.from])
      }
    }
  } catch (e) {
    console.error('[whatsapp] traitement webhook :', e)
  }
  return res.status(200).json({ ok: true })
}

async function majStatut(st: any) {
  if (!st?.id) return
  const erreur = st.errors?.[0] ? `${st.errors[0].code} ${st.errors[0].title}` : null
  await supabaseAdmin().from('whatsapp_messages').update({ statut: st.status, ...(erreur ? { erreur } : {}) }).eq('wa_message_id', st.id)
}

async function traiterMessage(m: any, profileName?: string) {
  const db = supabaseAdmin()
  const wa_id: string = m.from
  const texte: string = m.type === 'text' ? String(m.text?.body ?? '') : m.type === 'button' ? String(m.button?.text ?? '') : m.type === 'interactive' ? String(m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title ?? '') : ''

  // Dédoublonnage : Meta peut renvoyer la même notification.
  const { error: dup } = await db.from('whatsapp_messages').insert({ wa_message_id: m.id, wa_id, direction: 'in', kind: m.type, body: texte || null })
  if (dup) { if (dup.code === '23505') return; console.error('[whatsapp] journal entrant :', dup) }

  await db.from('whatsapp_contacts').upsert({ wa_id, profile_name: profileName ?? null, last_inbound_at: new Date().toISOString() }, { onConflict: 'wa_id' })
  const { data: contact } = await db.from('whatsapp_contacts').select('*').eq('wa_id', wa_id).single()
  markRead(m.id)

  const cle = plat(texte)

  // ── Désinscription / réinscription ────────────────────────────────────────
  if (/^(STOP|ARRET|DESABONNER|UNSUBSCRIBE)$/.test(cle) || texte.trim() === 'توقف') {
    await sendText(wa_id, 'C’est noté : vous ne recevrez plus de messages d’Import-eXPert sur WhatsApp. Écrivez START pour les réactiver.')
    await db.from('whatsapp_contacts').update({ opt_out_at: new Date().toISOString() }).eq('wa_id', wa_id)
    return
  }
  if (/^(START|REPRENDRE)$/.test(cle)) {
    await db.from('whatsapp_contacts').update({ opt_out_at: null, ...(contact?.user_id ? { opt_in_at: new Date().toISOString() } : {}) }).eq('wa_id', wa_id)
    await sendText(wa_id, 'Messages WhatsApp réactivés. Posez votre question quand vous voulez.')
    return
  }
  if (contact?.opt_out_at) return // désinscrit : on n'écrit plus, même pour répondre

  // ── Liaison au compte : « IXP 123456 » (préfixe obligatoire : un code SH seul reste une question)
  const code = /^IXP\s*(\d{6})$/.exec(cle)?.[1]
  if (code) return lier(wa_id, code)

  // ── Demande d'un conseiller ───────────────────────────────────────────────
  if (cle.split(/\s+/).length <= 8 && (/\b(CONSEILLER|HUMAIN|EXPERT|AGENT)\b/.test(cle) || texte.includes('مستشار'))) {
    const jusqua = new Date(Date.now() + 24 * 3600 * 1000).toISOString()
    await db.from('whatsapp_contacts').update({ human_until: jusqua }).eq('wa_id', wa_id)
    await alerterEquipe(wa_id, contact, texte)
    await sendText(wa_id, 'Un conseiller d’Import-eXPert vous répond ici dans les meilleurs délais (jours ouvrables, 9 h – 18 h). Vous pouvez déjà décrire votre besoin.')
    return
  }
  if (contact?.human_until && new Date(contact.human_until) > new Date()) return // l'équipe a la main

  if (!texte.trim()) {
    await sendText(wa_id, 'Je ne traite que les messages écrits. Posez votre question par écrit, ou écrivez CONSEILLER pour parler à un expert.')
    return
  }

  // ── Numéro non relié : orientation ────────────────────────────────────────
  if (!contact?.user_id) {
    await sendText(wa_id, `Bonjour, ici Import-eXPert.\n\nIXP-Assistant répond sur WhatsApp aux abonnés (essai gratuit compris). Pour l’activer, ouvrez Mon espace et reliez votre numéro : ${SITE()}/mon-espace#whatsapp\n\nPas encore de compte ? Essai gratuit de 14 jours : ${SITE()}/tarifs\n\nÉcrivez CONSEILLER pour parler à un membre de l’équipe.`)
    return
  }

  // ── Abonné relié : IXP-Assistant ──────────────────────────────────────────
  const { data: u } = await db.from('users').select('plan, statut, trial_ends_at').eq('id', contact.user_id).single()
  const plan = (u?.plan || 'free') as Plan, statut = (u?.statut || 'expired') as Statut
  const trialEnds = u?.trial_ends_at ? new Date(u.trial_ends_at).getTime() : undefined
  if (!u || !canAccessModule(plan, statut, 'chat-homepage', trialEnds)) {
    await sendText(wa_id, `IXP-Assistant est inclus dans l’abonnement Pro et Premium. Votre accès n’est plus actif : ${SITE()}/mon-abonnement\n\nÉcrivez CONSEILLER pour être recontacté.`)
    return
  }
  const depuis = new Date(Date.now() - 3600 * 1000).toISOString()
  const { count } = await db.from('whatsapp_messages').select('id', { count: 'exact', head: true }).eq('wa_id', wa_id).eq('direction', 'in').gte('created_at', depuis)
  if ((count ?? 0) > LIMITE_HEURE) {
    await sendText(wa_id, 'Vous avez atteint la limite de questions pour cette heure. Réessayez un peu plus tard, ou poursuivez sur le site.')
    return
  }
  if (contientDonneesPersonnelles(texte)) {
    await sendText(wa_id, 'Pour protéger vos données, l’assistant ne traite pas les messages contenant un email, un téléphone, un ICE, un RIB ou un numéro de CIN. Reformulez votre question sans ces éléments.')
    return
  }
  try {
    await sendText(wa_id, await repondreQuestion(texte, { plan, statut, trialEnds }))
  } catch (e) {
    console.error('[whatsapp] IXP-Assistant :', e)
    await sendText(wa_id, 'L’assistant est momentanément indisponible. Réessayez dans quelques minutes, ou écrivez CONSEILLER.')
  }
}

async function lier(wa_id: string, code: string) {
  const db = supabaseAdmin()
  const { data: c } = await db.from('whatsapp_link_codes').select('*').eq('code', code).is('used_at', null).gt('expires_at', new Date().toISOString()).maybeSingle()
  if (!c) {
    await sendText(wa_id, 'Ce code est invalide ou a expiré. Générez-en un nouveau depuis Mon espace.')
    return
  }
  const now = new Date().toISOString()
  await db.from('whatsapp_link_codes').update({ used_at: now }).eq('code', code)
  await db.from('whatsapp_contacts').update({ user_id: null }).eq('user_id', c.user_id).neq('wa_id', wa_id) // un seul numéro par compte
  await db.from('whatsapp_contacts').update({ user_id: c.user_id, linked_at: now, opt_in_at: now, opt_out_at: null }).eq('wa_id', wa_id)
  await sendText(wa_id, 'Votre numéro est relié à votre compte Import-eXPert. ✅\n\nPosez ici vos questions de douane, d’origine, de fiscalité à l’import ou de change : IXP-Assistant répond à partir des textes officiels. Vous recevrez aussi les messages liés à votre abonnement (pro-forma, virement reçu, renouvellement).\n\nÉcrivez CONSEILLER pour parler à un expert, STOP pour ne plus recevoir de messages.')
}

async function alerterEquipe(wa_id: string, contact: any, texte: string) {
  const to = process.env.WHATSAPP_ADMIN_EMAIL || process.env.BILLING_ADMIN_EMAIL
  if (!to) return
  let compte = 'numéro non relié à un compte'
  if (contact?.user_id) {
    const { data: u } = await supabaseAdmin().from('users').select('email, societe, plan, numero_abonne').eq('id', contact.user_id).single()
    if (u) compte = [u.societe, u.email, u.plan, u.numero_abonne].filter(Boolean).join(' · ')
  }
  const esc = (s: string) => s.replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]!))
  await sendEmail({
    to, subject: `WhatsApp : demande de conseiller (+${wa_id})`,
    html: `<p>Un contact demande à parler à un conseiller sur WhatsApp.</p><p><b>Numéro :</b> +${wa_id}${contact?.profile_name ? ` (${esc(contact.profile_name)})` : ''}<br><b>Compte :</b> ${esc(compte)}</p><p><b>Message :</b> ${esc(texte)}</p><p>L’assistant automatique reste silencieux 24 h sur cette conversation. Répondez depuis WhatsApp Business : <a href="https://wa.me/${wa_id}">ouvrir la conversation</a>.</p>`,
  })
}
