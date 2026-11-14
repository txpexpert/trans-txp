/**
 * pages/api/auth/mot-de-passe-oublie.ts — demande de lien de réinitialisation (2026-11-14)
 *
 * POST { email } → réponse identique que le compte existe ou non (ne révèle
 * pas quels emails sont inscrits). Si le compte existe et n'est pas suspendu,
 * un lien à usage unique valable 1 heure est envoyé ; seule son empreinte
 * SHA-256 est stockée. Une seule demande toutes les 2 minutes par compte.
 */
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { siteUrl } from '../../../lib/adminAuth'
import { sendPasswordResetEmail } from '../../../lib/email'
import { DUREE_LIEN_MS, nouveauJeton } from '../../../lib/motDePasse'

const OK = { ok: true, message: 'Si un compte existe pour cette adresse, un email contenant un lien de réinitialisation vient d’être envoyé. Pensez à vérifier vos courriers indésirables.' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const email = String(req.body?.email || '').trim().toLowerCase()
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Adresse email requise.' })

  const sb = supabaseAdmin()
  const { data: u } = await sb.from('users')
    .select('id, email, statut, reset_token_expires')
    .eq('email', email).maybeSingle()

  if (!u || u.statut === 'suspended') { await new Promise(r => setTimeout(r, 250)); return res.status(200).json(OK) }

  // Anti-rafale : lien précédent émis il y a moins de 2 minutes → pas de nouvel envoi.
  if (u.reset_token_expires) {
    const emisLe = new Date(u.reset_token_expires).getTime() - DUREE_LIEN_MS
    if (Date.now() - emisLe < 2 * 60 * 1000) return res.status(200).json(OK)
  }

  const { jeton, empreinte } = nouveauJeton()
  await sb.from('users').update({
    reset_token_hash:    empreinte,
    reset_token_expires: new Date(Date.now() + DUREE_LIEN_MS).toISOString(),
  }).eq('id', u.id)

  const r = await sendPasswordResetEmail(u.email, `${siteUrl(req)}/auth/reinitialiser?token=${jeton}`)
  if (!r.ok) console.error('[mot-de-passe-oublie] envoi email :', r.error)

  return res.status(200).json(OK)
}
