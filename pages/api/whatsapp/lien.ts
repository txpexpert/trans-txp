// pages/api/whatsapp/lien.ts — liaison du numéro WhatsApp au compte connecté.
//   GET    → état : numéro relié (masqué), désinscription
//   POST   → nouveau code à usage unique (15 minutes) et lien wa.me pré-rempli « IXP <code> »
//   DELETE → délie le numéro
import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'
import { compteAbonne } from '../../../lib/compteAbonne'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { WA_NUMERO, lienWhatsapp, masquer, numeroLisible, apiConfiguree } from '../../../lib/whatsapp'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const c = await compteAbonne(req)
  if (!c) return res.status(401).json({ error: 'Non connecté' })
  const db = supabaseAdmin()
  res.setHeader('Cache-Control', 'no-store')
  if (req.method === 'GET') {
    const { data } = await db.from('whatsapp_contacts').select('telephone, consenti_le, desinscrit').eq('user_id', c.id).maybeSingle()
    return res.status(200).json({ numero: numeroLisible(), actif: !!WA_NUMERO, assistant: apiConfiguree(), inclus: c.abonne, relie: data ? { telephone: masquer(data.telephone), depuis: data.consenti_le, desinscrit: data.desinscrit } : null })
  }
  if (req.method === 'POST') {
    if (!WA_NUMERO) return res.status(503).json({ error: 'WhatsApp n’est pas encore configuré.' })
    await db.from('whatsapp_codes').delete().eq('user_id', c.id)
    let code = ''
    for (let i = 0; i < 5; i++) {
      code = String(crypto.randomInt(100000, 1000000))
      const { error } = await db.from('whatsapp_codes').insert({ code, user_id: c.id, expire_le: new Date(Date.now() + 15 * 60e3).toISOString() })
      if (!error) return res.status(200).json({ code, lien: lienWhatsapp(`IXP ${code}`), expire_dans: 15 })
    }
    return res.status(500).json({ error: 'Code indisponible, réessayez.' })
  }
  if (req.method === 'DELETE') {
    await db.from('whatsapp_contacts').delete().eq('user_id', c.id)
    return res.status(200).json({ ok: true })
  }
  res.setHeader('Allow', 'GET, POST, DELETE')
  return res.status(405).end()
}
