// pages/backoffice/abonnements.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Abonnements — backoffice du super-administrateur (toutes les actions).
// Le contenu est dans components/SubscriptionsBoard.tsx, partagé avec le
// tableau de bord « Gestion des abonnements » des administrateurs de type 2.
// ─────────────────────────────────────────────────────────────────────────────
import type { GetServerSideProps } from 'next'
import { requireAdminSSR } from '../../lib/adminAuth'
import BackofficeLayout from '../../components/BackofficeLayout'
import SubscriptionsBoard from '../../components/SubscriptionsBoard'

export const getServerSideProps: GetServerSideProps = requireAdminSSR

export default function BackofficeAbonnements() {
  return (
    <BackofficeLayout title="Abonnements">
      <SubscriptionsBoard />
    </BackofficeLayout>
  )
}
