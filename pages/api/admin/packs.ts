// pages/api/admin/packs.ts — suivi des commandes de packs experts (statut, forfait HT).
import type { NextApiRequest, NextApiResponse } from 'next'
import { COOKIE_NAME, verifyToken } from '../../../lib/adminAuth'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

const STATUTS = ['recue', 'devis_envoye', 'en_cours', 'livree', 'annulee']
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!verifyToken(req.cookies[COOKIE_NAME])) return res.status(401).json({ error: 'Non autorisé' })
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Méthode non autorisée' })
  const upd: Record<string, any> = { updated_at: new Date().toISOString() }
  if (STATUTS.includes(req.body?.statut)) upd.statut = req.body.statut
  if ('montant_ht' in (req.body || {})) { const n = parseFloat(String(req.body.montant_ht).replace(',', '.')); upd.montant_ht = Number.isFinite(n) ? n : null }
  const { error } = await supabaseAdmin().from('commandes_packs').update(upd).eq('id', String(req.body?.id || ''))
  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ ok: true })
}
