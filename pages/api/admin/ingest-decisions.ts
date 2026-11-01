// pages/api/admin/ingest-decisions.ts
// ─────────────────────────────────────────────────────────────────────────────
// Ingestion des décisions de classement (fichier JSON).
// Aperçu ou application, via la fonction SQL admin_ingest_decisions.
// Habilitation requise pour un administrateur de type 2 : « ingerer_decisions ».
// ─────────────────────────────────────────────────────────────────────────────
import { ingestHandler } from '../../../lib/ingestHandler'

export const config = {
  api: { bodyParser: { sizeLimit: '4mb' } },
  maxDuration: 60,
}

export default ingestHandler('admin_ingest_decisions', 'ingerer_decisions')
