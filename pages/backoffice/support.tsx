// pages/backoffice/support.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Support — données réelles (2026-11-01) : demandes reçues via le formulaire de
// contact (table demandes_contact). Quand l'email correspond à un compte, le
// numéro d'abonné est affiché. Remplace l'ancienne liste de tickets fictifs.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react'
import { withAdminData } from '../../lib/adminAuth'
import { supabaseAdmin } from '../../lib/supabaseAdmin'
import BackofficeLayout from '../../components/BackofficeLayout'

interface Demande {
  id: string; nom: string | null; email: string | null; societe: string | null; service: string | null
  urgence: string | null; message: string | null; source: string | null; statut: string | null; created_at: string
  numero_abonne?: string | null
}
interface Props { demandes: Demande[]; loadError?: string }

export const getServerSideProps = withAdminData<Props>(async () => {
  const sb = supabaseAdmin()
  const [d, u] = await Promise.all([
    sb.from('demandes_contact').select('*').order('created_at', { ascending: false }).limit(300),
    sb.from('users').select('email, numero_abonne'),
  ])
  if (d.error) throw d.error
  if (u.error) throw u.error
  const byEmail = new Map((u.data ?? []).map((x: any) => [String(x.email).toLowerCase(), x.numero_abonne]))
  return {
    demandes: (d.data ?? []).map((x: any) => ({ ...x, numero_abonne: x.email ? byEmail.get(String(x.email).toLowerCase()) ?? null : null })),
  }
})

export default function BackofficeSupport({ demandes = [], loadError }: Props) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const list = demandes.filter(d => [d.numero_abonne, d.nom, d.email, d.societe, d.service, d.message].join(' ').toLowerCase().includes(q.toLowerCase()))

  return (
    <BackofficeLayout title="Support & Demandes">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: 'var(--bd)', marginBottom: 4 }}>Support & demandes</h1>
        <p style={{ fontSize: 13, color: 'var(--inkm)' }}>
          {demandes.length} demande{demandes.length > 1 ? 's' : ''} reçue{demandes.length > 1 ? 's' : ''} via le formulaire de contact
        </p>
      </div>

      {loadError && <div style={{ background: '#FEE8E8', color: '#C0392B', padding: '10px 14px', fontSize: 12, marginBottom: '1rem' }}>{loadError}</div>}

      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher n° d'abonné, nom, email, société, sujet…"
        style={{ width: '100%', padding: '10px 14px', border: '.5px solid var(--rule)', background: 'var(--white)', fontSize: 12, outline: 'none', fontFamily: 'inherit', marginBottom: '1rem' }} />

      <div style={{ background: 'var(--white)', border: '.5px solid var(--rule)' }}>
        {list.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--inkm)', fontSize: 13 }}>
            {demandes.length === 0 ? 'Aucune demande reçue pour l\'instant. Les messages envoyés depuis la page Contact apparaîtront ici.' : 'Aucun résultat.'}
          </div>
        )}
        {list.map(d => (
          <div key={d.id} style={{ borderBottom: '.5px solid var(--rule)' }}>
            <button onClick={() => setOpen(open === d.id ? null : d.id)} style={{
              width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', gap: 12, alignItems: 'baseline', padding: '.75rem 1rem', flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: 11, color: 'var(--inkm)', minWidth: 110 }}>{new Date(d.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span>
              <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: 'var(--bd)', minWidth: 76 }}>{d.numero_abonne || 'Non abonné'}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--bd)' }}>{d.nom || d.email}</span>
              <span style={{ fontSize: 12, color: 'var(--inks)' }}>{d.service || 'Demande'}{d.societe ? ` · ${d.societe}` : ''}</span>
              {d.urgence && <span style={{ fontSize: 10, padding: '2px 8px', background: '#FEF5E4', color: '#8A5A10', fontWeight: 600 }}>{d.urgence}</span>}
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--inkm)' }}>{d.statut || 'nouvelle'}</span>
            </button>
            {open === d.id && (
              <div style={{ padding: '0 1rem 1rem', fontSize: 13, lineHeight: 1.6 }}>
                <p style={{ whiteSpace: 'pre-wrap', margin: '0 0 .75rem', color: 'var(--ink)' }}>{d.message || '(message vide)'}</p>
                <div style={{ fontSize: 12, color: 'var(--inkm)' }}>
                  Répondre à <span style={{ fontFamily: 'monospace', color: 'var(--ba)', userSelect: 'all' }}>{d.email}</span>
                  {d.source ? ` · source : ${d.source}` : ''}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </BackofficeLayout>
  )
}
