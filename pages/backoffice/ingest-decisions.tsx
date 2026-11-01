// pages/backoffice/ingest-decisions.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Ingestion des décisions de classement — backoffice du super-administrateur.
// Le même composant est proposé dans « Gestion des abonnements » aux
// administrateurs de type 2 ayant l'habilitation « Ingérer des décisions ».
// ─────────────────────────────────────────────────────────────────────────────
import type { GetServerSideProps } from 'next'
import { requireAdminSSR } from '../../lib/adminAuth'
import BackofficeLayout from '../../components/BackofficeLayout'
import IngestDecisions from '../../components/IngestDecisions'

export const getServerSideProps: GetServerSideProps = requireAdminSSR

export default function BackofficeIngestDecisions() {
  return (
    <BackofficeLayout title="Ingestion Décisions">
      <IngestDecisions />
    </BackofficeLayout>
  )
}
