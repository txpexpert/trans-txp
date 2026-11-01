// pages/backoffice/decisions.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Ancienne page « Décisions de classement » (2026-11-01) : son formulaire
// écrivait dans une table « decisions » inexistante et n'a jamais pu ajouter
// de décision. Elle redirige désormais vers l'ingestion des décisions
// (/backoffice/ingest-decisions), qui écrit dans decisions_classement.
// ─────────────────────────────────────────────────────────────────────────────
import type { GetServerSideProps } from 'next'
import { requireAdminSSR } from '../../lib/adminAuth'

export const getServerSideProps: GetServerSideProps = async (context) => {
  const guard = await requireAdminSSR(context)
  if ('redirect' in guard) return guard
  return { redirect: { destination: '/backoffice/ingest-decisions', permanent: false } }
}

export default function BackofficeDecisions() {
  return null
}
