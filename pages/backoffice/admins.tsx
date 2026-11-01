// pages/backoffice/admins.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Administrateurs — état réel (2026-11-01). Remplace l'ancienne liste
// d'administrateurs fictifs.
//   • Accès au backoffice : mot de passe unique ADMIN_PASSWORD (cookie das_admin,
//     voir pages/api/admin/login.ts) — il n'existe pas de comptes admin
//     nominatifs pour le backoffice.
//   • Rôle admin côté site : comptes de la table users dont role = 'admin',
//     plus l'adresse définie par la variable ADMIN_EMAIL.
// ─────────────────────────────────────────────────────────────────────────────
import { withAdminData } from '../../lib/adminAuth'
import { supabaseAdmin } from '../../lib/supabaseAdmin'
import BackofficeLayout from '../../components/BackofficeLayout'
import { fmtDate, displayName } from '../../lib/subscriptions'

interface AdminRow { numero_abonne: string; email: string; nom: string | null; prenom: string | null; role: string | null; last_login_at: string | null; source: string }
interface Props { admins: AdminRow[]; adminEmailSet: boolean; loadError?: string }

export const getServerSideProps = withAdminData<Props>(async () => {
  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim()
  const sb = supabaseAdmin()
  const { data, error } = await sb.from('users')
    .select('numero_abonne, email, nom, prenom, role, last_login_at')
    .or(adminEmail ? `role.eq.admin,email.eq."${adminEmail}"` : 'role.eq.admin')
    .order('numero_abonne')
  if (error) throw error
  const admins = (data ?? []).map((u: any) => ({
    ...u,
    source: u.role === 'admin' && u.email.toLowerCase() === adminEmail ? 'Rôle admin + ADMIN_EMAIL'
          : u.role === 'admin' ? 'Rôle admin (base)' : 'ADMIN_EMAIL',
  }))
  return { admins, adminEmailSet: !!adminEmail }
})

export default function BackofficeAdmins({ admins = [], adminEmailSet, loadError }: Props) {
  return (
    <BackofficeLayout title="Administrateurs">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: 'var(--bd)', marginBottom: 4 }}>Administrateurs</h1>
        <p style={{ fontSize: 13, color: 'var(--inkm)' }}>Qui peut administrer la plateforme, d'après la configuration réelle.</p>
      </div>

      {loadError && <div style={{ background: '#FEE8E8', color: '#C0392B', padding: '10px 14px', fontSize: 12, marginBottom: '1rem' }}>{loadError}</div>}

      <section style={{ background: 'var(--white)', border: '.5px solid var(--rule)', padding: '1.25rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: 11, letterSpacing: '.08em', color: 'var(--inkm)', marginBottom: '.5rem' }}>ACCÈS AU BACKOFFICE</div>
        <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>
          Le backoffice s'ouvre avec un mot de passe unique (variable <code>ADMIN_PASSWORD</code> sur Vercel). Toute personne qui le connaît
          a un accès complet. Pour retirer un accès, changez ce mot de passe dans les variables d'environnement Vercel puis redéployez.
        </p>
      </section>

      <section style={{ background: 'var(--white)', border: '.5px solid var(--rule)' }}>
        <div style={{ fontSize: 11, letterSpacing: '.08em', color: 'var(--inkm)', padding: '1rem 1.25rem .5rem' }}>COMPTES AYANT LE RÔLE ADMINISTRATEUR SUR LE SITE</div>
        {admins.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--inkm)', padding: '0 1.25rem 1.25rem', margin: 0 }}>
            Aucun compte n'a le rôle administrateur.{!adminEmailSet && ' La variable ADMIN_EMAIL n\'est pas définie.'}
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['N° ABONNÉ', 'NOM', 'EMAIL', 'ORIGINE DU RÔLE', 'DERNIÈRE CONNEXION'].map(h => (
                <th key={h} style={{ padding: '.5rem 1.25rem', textAlign: 'left', fontSize: 10, letterSpacing: '.06em', color: 'var(--inkm)', fontWeight: 600, borderBottom: '.5px solid var(--rule)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}</tr></thead>
              <tbody>
                {admins.map(a => (
                  <tr key={a.numero_abonne}>
                    <td style={{ padding: '.6rem 1.25rem', fontFamily: 'monospace', fontWeight: 600, color: 'var(--bd)' }}>{a.numero_abonne}</td>
                    <td style={{ padding: '.6rem 1.25rem' }}>{displayName(a)}</td>
                    <td style={{ padding: '.6rem 1.25rem', fontFamily: 'monospace', fontSize: 11, color: 'var(--ba)' }}>{a.email}</td>
                    <td style={{ padding: '.6rem 1.25rem', color: 'var(--inks)' }}>{a.source}</td>
                    <td style={{ padding: '.6rem 1.25rem', color: 'var(--inkm)' }}>{fmtDate(a.last_login_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p style={{ fontSize: 12, color: 'var(--inkm)', padding: '0 1.25rem 1.25rem', margin: '.75rem 0 0' }}>
          Un compte administrateur ne peut pas être supprimé depuis la page Comptes utilisateurs.
        </p>
      </section>
    </BackofficeLayout>
  )
}
