// pages/backoffice/admins.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Administrateurs — super-administrateur uniquement. Même panneau que sous les
// tuiles du tableau de bord : ajout par email, habilitations, activation,
// suspension, suppression, liste des comptes créés.
// ─────────────────────────────────────────────────────────────────────────────
import type { GetServerSideProps } from 'next'
import { requireAdminSSR } from '../../lib/adminAuth'
import BackofficeLayout from '../../components/BackofficeLayout'
import AdminAccountsPanel from '../../components/AdminAccountsPanel'

export const getServerSideProps: GetServerSideProps = requireAdminSSR

export default function BackofficeAdmins() {
  return (
    <BackofficeLayout title="Administrateurs">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: 'var(--bd)', marginBottom: 4 }}>Administrateurs</h1>
        <p style={{ fontSize: 13, color: 'var(--inkm)' }}>
          Le super-administrateur a toutes les capacités. Les administrateurs de type 2 n’accèdent qu’à « Gestion des abonnements »,
          avec les habilitations cochées ci-dessous.
        </p>
      </div>
      <AdminAccountsPanel />
    </BackofficeLayout>
  )
}
