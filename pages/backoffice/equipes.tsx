// pages/backoffice/equipes.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Équipes entreprises — données réelles (2026-11-01) : les comptes de la table
// users regroupés par société déclarée à l'inscription, chacun avec son numéro
// d'abonné. Remplace l'ancienne liste d'équipes et de membres fictifs.
// (La plateforme n'a pas encore de comptes « équipe » à plusieurs membres
// rattachés à un même abonnement : ce regroupement par société en tient lieu.)
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import { withAdminData } from '../../lib/adminAuth'
import { supabaseAdmin } from '../../lib/supabaseAdmin'
import BackofficeLayout from '../../components/BackofficeLayout'
import { PLAN_LABEL, STATUT_STYLE, fmtDate, displayName, endDate, type Subscriber } from '../../lib/subscriptions'

type Row = Pick<Subscriber, 'id' | 'numero_abonne' | 'email' | 'nom' | 'prenom' | 'societe' | 'plan' | 'statut' | 'plan_ends_at' | 'trial_ends_at' | 'last_login_at'>
interface Props { users: Row[]; loadError?: string }

export const getServerSideProps = withAdminData<Props>(async () => {
  const { data, error } = await supabaseAdmin()
    .from('users')
    .select('id, numero_abonne, email, nom, prenom, societe, plan, statut, plan_ends_at, trial_ends_at, last_login_at')
    .order('numero_abonne')
  if (error) throw error
  return { users: data ?? [] }
})

const td: CSSProperties = { padding: '.5rem .75rem', borderBottom: '.5px solid var(--rule)', fontSize: 12, verticalAlign: 'top' }

export default function BackofficeEquipes({ users = [], loadError }: Props) {
  const [q, setQ] = useState('')

  // Regroupement par société (casse et espaces ignorés) ; sans société → « Sans société déclarée ».
  const groups = new Map<string, { label: string; members: Row[] }>()
  for (const u of users) {
    const label = (u.societe || '').trim() || 'Sans société déclarée'
    const key = label.toLowerCase().replace(/\s+/g, ' ')
    if (!groups.has(key)) groups.set(key, { label, members: [] })
    groups.get(key)!.members.push(u)
  }
  const list = Array.from(groups.values())
    .filter(g => [g.label, ...g.members.flatMap(m => [m.numero_abonne, m.email, m.nom, m.prenom])].join(' ').toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.members.length - a.members.length || a.label.localeCompare(b.label))

  return (
    <BackofficeLayout title="Équipes entreprises">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: 'var(--bd)', marginBottom: 4 }}>Équipes entreprises</h1>
        <p style={{ fontSize: 13, color: 'var(--inkm)' }}>
          {groups.size} société{groups.size > 1 ? 's' : ''} · {users.length} compte{users.length > 1 ? 's' : ''} · regroupement par société déclarée à l'inscription
        </p>
      </div>

      {loadError && <div style={{ background: '#FEE8E8', color: '#C0392B', padding: '10px 14px', fontSize: 12, marginBottom: '1rem' }}>{loadError}</div>}

      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher société, n° d'abonné, nom ou email…"
        style={{ width: '100%', padding: '10px 14px', border: '.5px solid var(--rule)', background: 'var(--white)', fontSize: 12, outline: 'none', fontFamily: 'inherit', marginBottom: '1rem' }} />

      {list.length === 0 && (
        <div style={{ background: 'var(--white)', border: '.5px solid var(--rule)', padding: '2rem', textAlign: 'center', color: 'var(--inkm)', fontSize: 13 }}>
          {users.length === 0 ? 'Aucun compte pour l\'instant.' : 'Aucun résultat.'}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {list.map(g => (
          <section key={g.label} style={{ background: 'var(--white)', border: '.5px solid var(--rule)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, padding: '.9rem 1rem', borderBottom: '.5px solid var(--rule)', flexWrap: 'wrap' }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: 'var(--bd)' }}>{g.label}</div>
              <div style={{ fontSize: 11, color: 'var(--inkm)' }}>{g.members.length} compte{g.members.length > 1 ? 's' : ''}</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {g.members.map(m => {
                    const s = STATUT_STYLE[m.statut] || { bg: '#eee', color: '#555', label: m.statut }
                    return (
                      <tr key={m.id}>
                        <td style={{ ...td, fontFamily: 'monospace', fontWeight: 600, color: 'var(--bd)', whiteSpace: 'nowrap' }}>{m.numero_abonne}</td>
                        <td style={td}>
                          <div style={{ fontWeight: 500, color: 'var(--bd)' }}>{displayName(m)}</div>
                          <div style={{ fontSize: 11, color: 'var(--inkm)' }}>{m.email}</div>
                        </td>
                        <td style={td}>{PLAN_LABEL[m.plan] || m.plan}</td>
                        <td style={td}><span style={{ fontSize: 10, padding: '2px 8px', background: s.bg, color: s.color, fontWeight: 600 }}>{s.label}</span></td>
                        <td style={{ ...td, whiteSpace: 'nowrap' }}>Échéance {fmtDate(endDate(m))}</td>
                        <td style={{ ...td, whiteSpace: 'nowrap', color: 'var(--inkm)' }}>Dernière connexion {fmtDate(m.last_login_at)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>

      <p style={{ fontSize: 12, color: 'var(--inkm)', marginTop: '1rem' }}>
        Pour activer, suspendre ou supprimer un compte : <Link href="/backoffice/utilisateurs" style={{ color: 'var(--ba)' }}>Comptes utilisateurs</Link>.
      </p>
    </BackofficeLayout>
  )
}
