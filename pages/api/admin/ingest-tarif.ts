// pages/api/admin/ingest-tarif.ts
// ─────────────────────────────────────────────────────────────────────────────
// Ingestion des lignes du tarif SH (format unifié 4 colonnes).
// Aperçu des écarts ou application, via la fonction SQL admin_ingest_tarif.
// Habilitation requise pour un administrateur de type 2 : « maj_tarif ».
// ─────────────────────────────────────────────────────────────────────────────
import { ingestHandler } from '../../../lib/ingestHandler'

export const config = {
  api: { bodyParser: { sizeLimit: '4mb' } },
  maxDuration: 60,
}

export default ingestHandler('admin_ingest_tarif', 'maj_tarif')
