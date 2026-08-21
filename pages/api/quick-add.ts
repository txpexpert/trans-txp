// pages/api/quick-add.ts
// ============================================================
// Ajout rapide — une entrée à la fois, depuis un formulaire simple.
// Réutilise exactement la même logique que l'upload JSON groupé
// (lib/ingestion.ts) : même déduplication, même chunking/embedding
// pour les circulaires, pas de code dupliqué.
//
// AJOUT : support du type 'tarifs' (positions tarifaires), qui
// manquait par rapport aux fonctions déjà disponibles dans ingestion.ts.
// ============================================================

import type { NextApiRequest, NextApiResponse } from 'next'
import { COOKIE_NAME, verifyToken } from '../../lib/adminAuth'
import { ingestCirculairesJSON, ingestDecisionsJSON, ingestTarifsJSON } from '../../lib/ingestion'

type EntryType = 'decisions' | 'circulaires' | 'tarifs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })

  const isAdmin = verifyToken(req.cookies[COOKIE_NAME])
  if (!isAdmin) return res.status(403).json({ error: 'Accès refusé — droits admin requis' })

  const { type, entry } = req.body as { type: EntryType; entry: Record<string, unknown> }

  if (!type || !entry) {
    return res.status(400).json({ error: 'type et entry requis' })
  }

  try {
    let result: { inserted: number; skipped: number }

    if (type === 'decisions') {
      result = await ingestDecisionsJSON([entry])
    } else if (type === 'circulaires') {
      result = await ingestCirculairesJSON([entry], 'manuel')
    } else if (type === 'tarifs') {
      result = await ingestTarifsJSON([entry])
    } else {
      return res.status(400).json({ error: `Type non supporté pour l'ajout rapide : ${type}` })
    }

    if (result.inserted === 0 && result.skipped > 0) {
      return res.status(200).json({ ok: true, doublon: true, message: 'Entrée déjà existante — mise à jour si applicable, sinon ignorée' })
    }
    if (result.inserted === 0) {
      return res.status(400).json({ error: 'Aucune entrée insérée — vérifiez les champs obligatoires' })
    }

    return res.status(200).json({ ok: true, doublon: false })
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Erreur serveur' })
  }
}
