// pages/backoffice/utilisateurs.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Comptes utilisateurs — données réelles de la table users (Supabase) via
// /api/admin/subscriptions. Remplace la maquette à données fictives.
// Les boutons de la fiche agissent réellement sur l'abonnement.
// ─────────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { GetServerSideProps } from 'next'
import { requireAdminSSR } from '../../lib/adminAuth'
import BackofficeLayout from '../../components/BackofficeLayout'
import SubscriptionActions from '../../components/SubscriptionActions'
import {
  PLAN_LABEL, STATUT_STYLE, fmtDate, fmtAmount, displayName, endDate, daysLeft,
  type Subscriber, type Invoice, type PlanRow,
} from '../../lib/subscriptions'

export const getServerSideProps: GetServerSideProps = requireAdminSSR

export default function BackofficeUtilisateurs() {
  const [users, setUsers]       = useState<Subscriber[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [plans, setPlans]       = useState<PlanRow[]>([])
  const [paiements, setPaiements] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [loadError, setLoadError] = useState('')
  const [q, setQ]               = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [toast, setToast]       = useState<{ msg: string; error?: boolean } | null>(null)

  const showToast = (msg: string, error = false) => { setToast({ msg, error }); setTimeout(() => setToast(null), 4000) }

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/subscriptions', { credentials: 'include' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || `Erreur ${r.status}`)
      setUsers(d.users || []); setInvoices(d.invoices || []); setPlans(d.plans || []); setPaiements(d.paiements || [])
      setLoadError('')
    } catch (e: any) {
      setLoadError(e.message || 'Chargement impossible')
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  const selected = users.find(u => u.id === selectedId) || null
  const pendingByUser = useMemo(() => {
    const m: Record<string, Invoice[]> = {}
    invoices.filter(i => i.status === 'proforma_envoyee').forEach(i => { (m[i.user_id] ||= []).push(i) })
    return m
  }, [invoices])

  const filtered = users.filter(u =>
    [u.numero_abonne, u.email, u.nom, u.prenom, u.societe, PLAN_LABEL[u.plan], u.telephone].join(' ').toLowerCase().includes(q.toLowerCase())
  )

  const onDone  = (m: string) => { showToast(m); load() }
  const onError = (m: string) => showToast(m, true)

  return (
    <BackofficeLayout title="Comptes utilisateurs">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: 'var(--bd)', marginBottom: 4 }}>Comptes utilisateurs</h1>
        <p style={{ fontSize: 13, color: 'var(--inkm)' }}>
          {loading ? 'Chargement…' : `${users.length} comptes · ${users.filter(u => u.statut === 'active').length} actifs · ${users.filter(u => !u.email_verified).length} email non confirmé`}
        </p>
      </div>

      {loadError && <div style={{ background: '#FEE8E8', color: '#C0392B', padding: '10px 14px', fontSize: 12, marginBottom: '1rem' }}>{loadError}</div>}

      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher n° d'abonné (ABIXP…), nom, société, email, téléphone…"
        style={{ width: '100%', padding: '10px 14px', border: '.5px solid var(--rule)', background: 'var(--white)', fontSize: 12, outline: 'none', fontFamily: 'inherit', marginBottom: '1rem' }} />

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 320, background: 'var(--white)', border: '.5px solid var(--rule)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '.5px solid var(--rule)' }}>
                {['N° ABONNÉ', 'UTILISATEUR', 'SOCIÉTÉ', 'PLAN', 'STATUT', 'ÉCHÉANCE', 'INSCRIT', 'ACTIONS'].map(h => (
                  <th key={h} style={{ padding: '.5rem .75rem', textAlign: 'left', fontSize: 10, letterSpacing: '.06em', color: 'var(--inkm)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--inkm)' }}>Aucun compte.</td></tr>
              )}
              {filtered.map(u => {
                const s = STATUT_STYLE[u.statut] || { bg: '#eee', color: '#555', label: u.statut }
                const dl = daysLeft(endDate(u))
                return (
                  <tr key={u.id} onClick={() => setSelectedId(u.id)}
                    style={{ borderBottom: '.5px solid var(--rule)', cursor: 'pointer', background: selectedId === u.id ? 'var(--bl)' : '', verticalAlign: 'top' }}>
                    <td style={{ padding: '.55rem .75rem', fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: 'var(--bd)', whiteSpace: 'nowrap' }}>{u.numero_abonne}</td>
                    <td style={{ padding: '.55rem .75rem' }}>
                      <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--bd)' }}>{displayName(u)}</div>
                      <div style={{ fontSize: 11, color: 'var(--inkm)' }}>{u.email}{!u.email_verified && ' · non confirmé'}</div>
                    </td>
                    <td style={{ padding: '.55rem .75rem' }}>{u.societe || '—'}</td>
                    <td style={{ padding: '.55rem .75rem' }}>{PLAN_LABEL[u.plan] || u.plan}</td>
                    <td style={{ padding: '.55rem .75rem' }}>
                      <span style={{ fontSize: 10, padding: '2px 8px', background: s.bg, color: s.color, fontWeight: 600 }}>{s.label}</span>
                      {pendingByUser[u.id] && <div style={{ fontSize: 10, color: '#D97706', marginTop: 3 }}>pro-forma en attente</div>}
                    </td>
                    <td style={{ padding: '.55rem .75rem', whiteSpace: 'nowrap' }}>
                      {fmtDate(endDate(u))}
                      {dl !== null && dl >= 0 && <span style={{ fontSize: 10, color: dl <= 30 ? '#D97706' : 'var(--inkm)' }}> · {dl} j</span>}
                    </td>
                    <td style={{ padding: '.55rem .75rem', color: 'var(--inkm)' }}>{fmtDate(u.created_at)}</td>
                    <td style={{ padding: '.55rem .75rem', minWidth: 260 }}>
                      <SubscriptionActions user={u} plans={plans} pending={pendingByUser[u.id] || []} paiements={paiements.filter(p => p.user_id === u.id)} onDone={onDone} onError={onError} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {selected && (
          <div style={{ width: 320, flexShrink: 0, background: 'var(--white)', border: '.5px solid var(--rule)', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, color: 'var(--bd)' }}>Fiche utilisateur</div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--inkm)' }} onClick={() => setSelectedId(null)}>✕</button>
            </div>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'var(--bd)', letterSpacing: '.04em', marginBottom: 4 }}>{selected.numero_abonne}</div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--bd)' }}>{displayName(selected)}</div>
              <div style={{ fontSize: 11, color: 'var(--inkm)', marginTop: 2 }}>{selected.societe || '—'}</div>
            </div>
            {[
              ['Email', selected.email],
              ['Téléphone', selected.telephone || '—'],
              ['Profil', selected.profil || '—'],
              ['Inscrit le', fmtDate(selected.created_at)],
              ['Dernière connexion', fmtDate(selected.last_login_at)],
              ['Plan', PLAN_LABEL[selected.plan] || selected.plan],
              ['Statut', (STATUT_STYLE[selected.statut]?.label) || selected.statut],
              ['Fin d\'essai', fmtDate(selected.trial_ends_at)],
              ['Échéance abonnement', fmtDate(selected.plan_ends_at)],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '6px 0', borderBottom: '.5px solid var(--rule)', fontSize: 12 }}>
                <span style={{ color: 'var(--inkm)' }}>{k}</span>
                <span style={{ color: 'var(--bd)', fontWeight: 500, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v}</span>
              </div>
            ))}

            <div style={{ fontSize: 10, letterSpacing: '.08em', color: 'var(--inkm)', margin: '1.25rem 0 .5rem' }}>ABONNEMENT</div>
            <SubscriptionActions user={selected} plans={plans} pending={pendingByUser[selected.id] || []} paiements={paiements.filter(p => p.user_id === selected.id)} onDone={onDone} onError={onError} />

            <div style={{ fontSize: 10, letterSpacing: '.08em', color: 'var(--inkm)', margin: '1.25rem 0 .5rem' }}>FACTURES</div>
            {invoices.filter(i => i.user_id === selected.id).length === 0
              ? <div style={{ fontSize: 12, color: 'var(--inkm)' }}>Aucune facture.</div>
              : invoices.filter(i => i.user_id === selected.id).map(i => (
                <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '4px 0' }}>
                  <span style={{ fontFamily: 'monospace' }}>{i.invoice_number || i.proforma_number}</span>
                  <span>{PLAN_LABEL[i.plan_code]} · {fmtAmount(i.amount)}</span>
                  <span style={{ color: i.status === 'payee' ? '#1A7A40' : i.status === 'annulee' ? '#999' : '#D97706' }}>
                    {i.status === 'payee' ? 'payée' : i.status === 'annulee' ? 'annulée' : 'en attente'}
                  </span>
                </div>
              ))}

            <a href={`mailto:${selected.email}`} style={{ display: 'block', marginTop: '1.25rem', textAlign: 'center', fontSize: 11, padding: '7px', border: '.5px solid var(--rule)', color: 'var(--inks)', textDecoration: 'none' }}>
              Écrire au client
            </a>
          </div>
        )}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: toast.error ? '#C0392B' : '#059669', color: 'white', padding: '10px 20px', fontSize: 12, zIndex: 1100, maxWidth: 420 }}>
          {toast.msg}
        </div>
      )}
    </BackofficeLayout>
  )
}
