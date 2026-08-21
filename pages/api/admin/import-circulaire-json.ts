// pages/api/admin/import-circulaire-json.ts
// ─────────────────────────────────────────────────────────────────────────────
// Reçoit un ou plusieurs documents JSON (schéma v2, produits par le projet
// Claude de génération), les valide, les ingère dans Supabase avec toutes les
// métadonnées (statut, domaine, article, abroge_ou_modifie...).
// ─────────────────────────────────────────────────────────────────────────────

import type { NextApiRequest, NextApiResponse } from 'next'
import { COOKIE_NAME, verifyToken } from '../../../lib/adminAuth'
import { ingestCirculairesSchemaV2Batch } from '../../../lib/ingestCirculaireSchemaV2'

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } }, // lot de plusieurs circulaires = payload potentiellement gros
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })

  const isAdmin = verifyToken(req.cookies[COOKIE_NAME])
  if (!isAdmin) return res.status(403).json({ error: 'Accès refusé — droits admin requis' })

  const { entries } = req.body as { entries: unknown[] }
  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ error: 'entries (tableau de documents JSON) requis.' })
  }

  try {
    const results = await ingestCirculairesSchemaV2Batch(entries, 'projet-claude-json')
    const summary = {
      total: results.length,
      inserted: results.filter(r => r.status === 'inserted').length,
      skipped_doublon: results.filter(r => r.status === 'skipped_doublon').length,
      rejected_invalide: results.filter(r => r.status === 'rejected_invalide').length,
      error: results.filter(r => r.status === 'error').length,
    }
    return res.status(200).json({ ok: true, summary, results })
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Erreur serveur' })
  }
}
