// pages/api/whatsapp/webhook.ts — réception des messages WhatsApp (API Cloud de Meta).
//   GET  → vérification de l'adresse par Meta (hub.verify_token)
//   POST → messages reçus, signés par Meta (X-Hub-Signature-256)
// Règles : « IXP 123456 » relie le numéro au compte (consentement daté) ; STOP / START ;
// CONSEILLER coupe l'assistant 24 h et prévient l'équipe ; questions contenant des données
// personnelles refusées ; 30 questions par heure au plus ; seul le texte de la question part à l'IA.
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { signatureValide, envoyerTexte, donneesPersonnelles, masquer } from '../../../lib/whatsapp'
import { repondreWhatsapp } from '../../../lib/assistantWhatsapp'
import { sendEmail } from '../../../lib/email'

export const config = { api: { bodyParser: false }, maxDuration: 60 }

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://import-expert.ma').replace(/\/$/, '')
const LIMITE_HEURE = 30

async function corpsBrut(req: NextApiRequest) {
  const parts: Buffer[] = []
  for await (const c of req) parts.push(typeof c === 'string' ? Buffer.from(c) : c)
  return Buffer.concat(parts)
}

const arabe = (t: string) => /[؀-ۿ]/.test(t)
const T = {
  relie: (ar: boolean) => ar ? 'تم ربط رقمكم بحسابكم في Import-eXPert. يمكنكم الآن طرح أسئلتكم هنا. أرسلوا STOP لإلغاء الاشتراك أو CONSEILLER للتحدث مع خبير.' : 'Votre numéro est relié à votre compte Import-eXPert. Posez vos questions ici. Envoyez STOP pour vous désinscrire, CONSEILLER pour parler à un expert.',
  codeKo: (ar: boolean) => ar ? 'هذا الرمز غير صالح أو انتهت صلاحيته. أنشئوا رمزًا جديدًا من «فضائي» على الموقع.' : `Ce code n’est pas valide ou a expiré (15 minutes). Générez-en un nouveau dans Mon espace : ${SITE}/mon-espace`,
  stop: (ar: boolean) => ar ? 'تم إلغاء اشتراككم: لن تتلقوا أي رسالة أخرى. أرسلوا START لإعادة التفعيل.' : 'Vous êtes désinscrit : vous ne recevrez plus de message. Envoyez START pour vous réinscrire.',
  start: (ar: boolean) => ar ? 'تمت إعادة تفعيل اشتراككم.' : 'Vous êtes réinscrit.',
  conseiller: (ar: boolean) => ar ? 'تم إخطار خبير، وسيجيبكم هنا خلال يوم عمل واحد. المساعد متوقف في هذه المحادثة لمدة 24 ساعة.' : 'Un expert est prévenu et vous répond ici sous un jour ouvré. L’assistant est suspendu sur cette conversation pendant 24 heures.',
  inconnu: (ar: boolean) => ar ? `مرحبًا! المساعد IXP مخصص للمشتركين. لربط رقمكم: «فضائي» ← ربط رقمي. وللتجربة المجانية لمدة 14 يومًا: ${SITE}/ar/inscription` : `Bonjour ! IXP-Assistant répond aux abonnés Import-eXPert. Pour relier votre numéro : Mon espace → « Relier mon numéro » (${SITE}/mon-espace). Pas encore de compte ? Essai gratuit de 14 jours : ${SITE}/auth/register?plan=pro`,
  nonAbonne: (ar: boolean) => ar ? `المساعد IXP متاح خلال التجربة وفي العروض المؤدى عنها: ${SITE}/ar/tarifs` : `IXP-Assistant est inclus pendant l’essai et dans les offres payantes. Voir les offres : ${SITE}/tarifs. Ou écrivez CONSEILLER pour parler à un expert.`,
  perso: (ar: boolean, quoi: string) => ar ? 'يحتوي سؤالكم على معطيات شخصية. أعيدوا صياغته دون بريد إلكتروني أو هاتف أو ICE أو RIB أو رقم بطاقة التعريف.' : `Votre question contient ${quoi}. Pour protéger vos données, reformulez-la sans email, téléphone, ICE, RIB ni numéro de CIN.`,
  limite: (ar: boolean) => ar ? 'لقد بلغتم حد 30 سؤالًا في الساعة. يمكنكم المتابعة لاحقًا أو على الموقع.' : `Vous avez atteint la limite de ${LIMITE_HEURE} questions par heure. Vous pouvez continuer plus tard, ou sur le site : ${SITE}/mon-espace`,
  media: (ar: boolean) => ar ? 'يجيب المساعد على الرسائل النصية فقط.' : 'IXP-Assistant répond aux messages texte uniquement.',
  erreur: (ar: boolean) => ar ? 'تعذر إعداد الجواب. أعيدوا المحاولة بعد قليل، أو أرسلوا CONSEILLER.' : 'La réponse n’a pas pu être préparée. Réessayez dans un instant, ou écrivez CONSEILLER.',
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const ok = req.query['hub.mode'] === 'subscribe' && process.env.WHATSAPP_VERIFY_TOKEN && req.query['hub.verify_token'] === process.env.WHATSAPP_VERIFY_TOKEN
    return ok ? res.status(200).send(String(req.query['hub.challenge'] ?? '')) : res.status(403).end()
  }
  if (req.method !== 'POST') return res.status(405).end()
  const brut = await corpsBrut(req)
  if (!signatureValide(brut, req.headers['x-hub-signature-256'] as string | undefined)) return res.status(401).end()
  let corps: any
  try { corps = JSON.parse(brut.toString('utf8')) } catch { return res.status(400).end() }

  const messages = (corps?.entry ?? []).flatMap((e: any) => (e?.changes ?? []).flatMap((c: any) => c?.value?.messages ?? []))
  for (const m of messages) {
    try { await traiter(m) } catch (e) { console.error('[whatsapp] traitement', (e as Error)?.message) }
  }
  return res.status(200).json({ ok: true })
}

async function traiter(m: any) {
  const db = supabaseAdmin()
  const tel = String(m?.from || '').replace(/\D/g, '')
  if (!tel) return
  // Meta peut renvoyer un même message : l'identifiant unique évite une double réponse.
  const { error: doublon } = await db.from('whatsapp_journal').insert({ wa_id: m.id ?? null, telephone: tel, sens: 'entrant', traitement: m.type })
  if (doublon) return
  const repondre = async (texte: string, traitement: string) => {
    if (await envoyerTexte(tel, texte)) await db.from('whatsapp_journal').insert({ telephone: tel, sens: 'sortant', traitement })
  }
  const texte = m.type === 'text' ? String(m.text?.body || '').trim() : ''
  const ar = arabe(texte)
  const { data: contact } = await db.from('whatsapp_contacts').select('telephone, user_id, desinscrit, humain_jusqua').eq('telephone', tel).maybeSingle()
  const mot = texte.toUpperCase().replace(/\s+/g, ' ')

  if (mot === 'STOP') {
    await db.from('whatsapp_contacts').upsert({ telephone: tel, user_id: contact?.user_id ?? null, desinscrit: true, updated_at: new Date().toISOString() })
    return repondre(T.stop(ar), 'stop')
  }
  if (mot === 'START') {
    await db.from('whatsapp_contacts').upsert({ telephone: tel, user_id: contact?.user_id ?? null, desinscrit: false, updated_at: new Date().toISOString() })
    return repondre(T.start(ar), 'start')
  }
  if (contact?.desinscrit) return
  const code = /^IXP ?(\d{6})$/.exec(mot)
  if (code) {
    const { data: c } = await db.from('whatsapp_codes').select('user_id, expire_le').eq('code', code[1]).maybeSingle()
    if (!c || new Date(c.expire_le) < new Date()) return repondre(T.codeKo(ar), 'code_invalide')
    await db.from('whatsapp_contacts').delete().eq('user_id', c.user_id).neq('telephone', tel)
    await db.from('whatsapp_contacts').upsert({ telephone: tel, user_id: c.user_id, consenti_le: new Date().toISOString(), desinscrit: false, updated_at: new Date().toISOString() })
    await db.from('whatsapp_codes').delete().eq('user_id', c.user_id)
    return repondre(T.relie(ar), 'liaison')
  }
  if (mot === 'CONSEILLER') {
    await db.from('whatsapp_contacts').upsert({ telephone: tel, user_id: contact?.user_id ?? null, humain_jusqua: new Date(Date.now() + 864e5).toISOString(), updated_at: new Date().toISOString() })
    const admin = process.env.WHATSAPP_ADMIN_EMAIL
    if (admin) {
      let compte = 'numéro non relié à un compte'
      if (contact?.user_id) { const { data: u } = await db.from('users').select('email, plan').eq('id', contact.user_id).single(); if (u) compte = `compte ${u.email} (offre ${u.plan})` }
      await sendEmail({ to: admin, subject: 'WhatsApp : un contact demande un conseiller', html: `<p>Le contact <b>+${tel}</b> (${compte}) demande à parler à un expert sur WhatsApp.</p><p>L’assistant est suspendu 24 h sur cette conversation : répondez-lui depuis WhatsApp Business, sur le numéro du projet.</p>` })
    }
    return repondre(T.conseiller(ar), 'conseiller')
  }
  if (contact?.humain_jusqua && new Date(contact.humain_jusqua) > new Date()) return
  if (!texte) return repondre(T.media(ar), 'media')
  if (!contact?.user_id) return repondre(T.inconnu(ar), 'non_relie')

  const { data: u } = await db.from('users').select('plan, statut, role, trial_ends_at').eq('id', contact.user_id).single()
  if (!u) return repondre(T.inconnu(ar), 'non_relie')
  const admin = u.role === 'admin' || u.role === 'generaladmin'
  const essai = u.plan === 'trial' && u.statut === 'trial' && (!u.trial_ends_at || new Date(u.trial_ends_at) > new Date())
  const payant = ['pro', 'premium', 'enterprise'].includes(u.plan) && u.statut === 'active'
  if (!admin && !essai && !payant) return repondre(T.nonAbonne(ar), 'non_abonne')

  const quoi = donneesPersonnelles(texte)
  if (quoi) return repondre(T.perso(ar, quoi), 'donnees_personnelles')
  const { count } = await db.from('whatsapp_journal').select('id', { count: 'exact', head: true })
    .eq('telephone', tel).eq('traitement', 'reponse').gte('created_at', new Date(Date.now() - 36e5).toISOString())
  if ((count ?? 0) >= LIMITE_HEURE) return repondre(T.limite(ar), 'limite')

  try {
    const plan = (admin ? 'enterprise' : u.plan) as any
    const reponse = await repondreWhatsapp(texte.slice(0, 1500), plan, (admin ? 'active' : u.statut) as any, u.trial_ends_at ? +new Date(u.trial_ends_at) : undefined, SITE)
    return repondre(reponse, 'reponse')
  } catch (e) {
    console.error('[whatsapp] assistant', (e as Error)?.message, masquer(tel))
    return repondre(T.erreur(ar), 'erreur')
  }
}
