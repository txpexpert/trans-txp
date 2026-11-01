// lib/ingestHandler.ts
// ─────────────────────────────────────────────────────────────────────────────
// Logique commune aux deux routes d'ingestion (tarif SH, décisions de
// classement) : contrôle de session et d'habilitation, appel de la fonction
// SQL transactionnelle (migration 0007), en mode aperçu ou application.
//
//   POST { mode: 'preview' | 'apply', rows: [...], file?: string }
//
// Accès : super-administrateur (session backoffice) ou administrateur de type 2
// disposant de l'habilitation correspondante (session Gestion des abonnements).
// L'email de l'administrateur est enregistré comme auteur du lot.
// ─────────────────────────────────────────────────────────────────────────────
import type { NextApiRequest, NextApiResponse } from 'next'
import { getAdminSessionFromReq } from './adminAuth'
import { hasPermission, type PermissionCode } from './adminPermissions'
import { supabaseAdmin } from './supabaseAdmin'

export const MAX_ROWS_PER_CALL = 6000

export function ingestHandler(fn: 'admin_ingest_tarif' | 'admin_ingest_decisions', permission: PermissionCode) {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }) }

    const admin = await getAdminSessionFromReq(req, 'gestion')
    if (!admin) return res.status(401).json({ error: 'Session administrateur expirée : reconnectez-vous.' })
    if (!hasPermission(admin, permission)) return res.status(403).json({ error: 'Cette fonction ne fait pas partie de vos habilitations.' })

    const { mode, rows, file } = (req.body || {}) as { mode?: string; rows?: unknown; file?: string }
    if (mode !== 'preview' && mode !== 'apply') return res.status(400).json({ error: 'mode « preview » ou « apply » requis.' })
    if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ error: 'Aucune ligne reçue.' })
    if (rows.length > MAX_ROWS_PER_CALL) return res.status(413).json({ error: `Trop de lignes dans un seul envoi (max ${MAX_ROWS_PER_CALL}).` })

    const { data, error } = await supabaseAdmin().rpc(fn, {
      p_rows: rows,
      p_apply: mode === 'apply',
      p_actor: admin.email,
      p_file: file ? String(file).slice(0, 200) : null,
    })
    if (error) {
      console.error(`[${fn}]`, error.message)
      return res.status(500).json({ error: error.message })
    }
    return res.status(200).json(data)
  }
}
