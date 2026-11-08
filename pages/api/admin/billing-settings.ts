// pages/api/admin/billing-settings.ts
// ─────────────────────────────────────────────────────────────────────────────
// Paramètres de facturation (émetteur RIGORIS LEX, identifiants fiscaux, RIB,
// code site) — table billing_settings, une seule ligne.
//   GET → lecture (backoffice ou « Gestion des abonnements »)
//   PUT → modification (super-administrateur uniquement)
// Les documents déjà émis ne changent pas : ils gardent l'instantané figé au
// moment de leur émission.
// ─────────────────────────────────────────────────────────────────────────────
import type { NextApiRequest, NextApiResponse } from 'next'
import { getAdminSessionFromReq } from '../../../lib/adminAuth'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { SETTINGS_FIELDS } from '../../../lib/billing'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sb = supabaseAdmin()

  if (req.method === 'GET') {
    const admin = await getAdminSessionFromReq(req, 'gestion')
    if (!admin) return res.status(401).json({ error: 'Session administrateur expirée' })
    const { data, error } = await sb.from('billing_settings').select('*').eq('id', true).single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ settings: data, canEdit: admin.niveau === 'super' })
  }

  if (req.method === 'PUT') {
    const admin = await getAdminSessionFromReq(req, 'backoffice')
    if (!admin || admin.niveau !== 'super') return res.status(403).json({ error: 'Réservé au super-administrateur' })
    const input = (req.body?.settings || {}) as Record<string, unknown>
    const patch: Record<string, unknown> = {}
    for (const f of SETTINGS_FIELDS) {
      if (!(f.key in input)) continue
      const raw = input[f.key]
      const val = typeof raw === 'string' ? raw.trim() : raw
      if (f.key === 'delai_paiement_jours') { patch[f.key] = Number(val) || 15; continue }
      if (f.key === 'site_code') { patch[f.key] = String(val || 'IXP').toUpperCase(); continue }
      if (f.key === 'ice' || f.key === 'rib') { patch[f.key] = val ? String(val).replace(/\s/g, '') : null; continue }
      patch[f.key] = val === '' ? null : val
    }
    if (patch.raison_sociale === null) return res.status(400).json({ error: 'Raison sociale obligatoire' })
    if (patch.site_nom === null) return res.status(400).json({ error: 'Nom du site obligatoire' })
    patch.updated_at = new Date().toISOString()
    patch.updated_by = admin.email
    const { data, error } = await sb.from('billing_settings').update(patch).eq('id', true).select('*').single()
    if (error) {
      const msg = /ice/.test(error.message) ? 'ICE invalide (15 chiffres)' : /site_code/.test(error.message) ? 'Code site : 3 lettres majuscules' : error.message
      return res.status(400).json({ error: msg })
    }
    return res.status(200).json({ ok: true, settings: data })
  }

  res.setHeader('Allow', 'GET, PUT')
  return res.status(405).json({ error: 'Method not allowed' })
}
