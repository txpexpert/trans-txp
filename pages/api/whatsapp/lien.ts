// pages/api/whatsapp/lien.ts — liaison du numéro WhatsApp au compte (Mon espace).
//   GET    : état (numéro relié, masqué ; désinscription éventuelle)
//   POST   : génère un code à 6 chiffres valable 15 min et le lien wa.me pré-rempli
//            « IXP 123456 » ; c'est l'envoi de ce message par l'abonné qui relie le
//            numéro et date son consentement (loi 09-08).
//   DELETE : délie le numéro et retire le consentement.
import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'
import { verifyUserToken, USER_COOKIE } from '../../../lib/userAuth'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

const NUMERO = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/\D/g, '')
const masque = (w: string) => `+${w.slice(0, 3)} ${'•'.repeat(Math.max(0, w.length - 7))}${w.slice(-4)}`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = verifyUserToken(req.cookies[USER_COOKIE])
  if (!session) return res.status(401).json({ error: 'Connexion requise' })
  const db = supabaseAdmin()

  if (req.method === 'GET') {
    const { data: c } = await db.from('whatsapp_contacts').select('wa_id, linked_at, opt_out_at').eq('user_id', session.userId).maybeSingle()
    return res.status(200).json({
      disponible: !!NUMERO,
      relie: !!c, numero: c ? masque(c.wa_id) : null, depuis: c?.linked_at ?? null, desinscrit: !!c?.opt_out_at,
    })
  }

  if (req.method === 'POST') {
    if (!NUMERO) return res.status(503).json({ error: 'WhatsApp n’est pas encore disponible.' })
    // Un seul code actif à la fois par compte
    await db.from('whatsapp_link_codes').delete().eq('user_id', session.userId).is('used_at', null)
    for (let i = 0; i < 5; i++) {
      const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
      const { error } = await db.from('whatsapp_link_codes').insert({ code, user_id: session.userId, expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() })
      if (!error) return res.status(200).json({ code, lien: `https://wa.me/${NUMERO}?text=${encodeURIComponent('IXP ' + code)}`, expire_minutes: 15 })
      if (error.code !== '23505') { console.error('[whatsapp/lien]', error); break }
    }
    return res.status(500).json({ error: 'Impossible de générer un code, réessayez.' })
  }

  if (req.method === 'DELETE') {
    await db.from('whatsapp_contacts').update({ user_id: null, opt_in_at: null, linked_at: null }).eq('user_id', session.userId)
    return res.status(200).json({ ok: true })
  }

  return res.status(405).end()
}
