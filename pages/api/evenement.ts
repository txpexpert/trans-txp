// pages/api/evenement.ts — compteur anonyme d'une étape du parcours (aucune donnée enregistrée
// sur le visiteur : seul le compteur du jour est incrémenté, par variante d'accroche).
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../lib/supabaseAdmin'
import { EVENEMENTS, lireVariante } from '../../lib/ab'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  let corps: any = req.body
  if (typeof corps === 'string') { try { corps = JSON.parse(corps) } catch { corps = {} } }
  const e = String(corps?.e || '')
  if (!(EVENEMENTS as readonly string[]).includes(e)) return res.status(400).end()
  await supabaseAdmin().rpc('incrementer_compteur', { p_evenement: e, p_variante: lireVariante(req.headers.cookie) || '' })
  return res.status(204).end()
}
