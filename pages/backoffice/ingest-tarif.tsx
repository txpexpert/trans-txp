// pages/backoffice/ingest-tarif.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Ingestion du tarif SH — backoffice du super-administrateur. Le même composant
// est proposé dans « Gestion des abonnements » aux administrateurs de type 2
// ayant l'habilitation « Mettre à jour le tarif SH ».
// ─────────────────────────────────────────────────────────────────────────────
import type { GetServerSideProps } from 'next'
import { requireAdminSSR } from '../../lib/adminAuth'
import BackofficeLayout from '../../components/BackofficeLayout'
import IngestTarif from '../../components/IngestTarif'

export const getServerSideProps: GetServerSideProps = requireAdminSSR

export default function BackofficeIngestTarif() {
  return (
    <BackofficeLayout title="Ingestion Tarif SH">
      <IngestTarif />
    </BackofficeLayout>
  )
}
