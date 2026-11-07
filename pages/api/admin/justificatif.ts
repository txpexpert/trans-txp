// pages/api/admin/justificatif.ts
// ─────────────────────────────────────────────────────────────────────────────
// Lien temporaire (5 min) vers un justificatif de virement du bucket privé
// « justificatifs ». GET ?id=<paiement_id> → redirection vers l'URL signée.
// Réservé aux administrateurs (backoffice ou « Gestion des abonnements »).
// ─────────────────────────────────────────────────────────────────────────────
import type { NextApiRequest, NextApiResponse } from 'next'
import { getAdminSessionFromReq } from '../../../lib/adminAuth'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await getAdminSessionFromReq(req, 'gestion')
  if (!admin) return res.status(401).json({ error: 'Session administrateur expirée' })
  const id = String(req.query.id || '')
  const sb = supabaseAdmin()
  const { data: p } = await sb.from('paiements').select('justificatif_path').eq('id', id).maybeSingle()
  if (!p?.justificatif_path) return res.status(404).json({ error: 'Aucun justificatif' })
  const { data, error } = await sb.storage.from('justificatifs').createSignedUrl(p.justificatif_path, 300)
  if (error || !data?.signedUrl) return res.status(500).json({ error: error?.message || 'Lien indisponible' })
  res.setHeader('Cache-Control', 'no-store')
  return res.redirect(302, data.signedUrl)
}
