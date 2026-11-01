// pages/backoffice/abonnements.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Abonnements — données réelles (table users + invoices de Supabase via
// /api/admin/subscriptions). Remplace la maquette à données fictives.
// Facturation ANNUELLE uniquement (grille : lib/pricing.ts / subscription_plans).
// ─────────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { GetServerSideProps } from 'next'
import { requireAdminSSR } from '../../lib/adminAuth'
import BackofficeLayout from '../../components/BackofficeLayout'
import SubscriptionActions from '../../components/SubscriptionActions'
import {
  PLAN_LABEL, STATUT_STYLE, EVENT_LABEL, PAID_PLANS,
  fmtAmount, fmtDate, displayName, endDate, daysLeft,
  type Subscriber, type Invoice, type PlanRow, type SubscriptionEvent,
} from '../../lib/subscriptions'

export const getServerSideProps: GetServerSideProps = requireAdminSSR

type Filter = 'tous' | 'payants' | 'essai' | 'a_echeance' | 'expires' | 'suspendus'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'tous',       label: 'Tous' },
  { id: 'payants',    label: 'Abonnés actifs' },
  { id: 'essai',      label: 'En essai' },
  { id: 'a_echeance', label: 'Échéance < 30 j' },
  { id: 'expires',    label: 'Expirés' },
  { id: 'suspendus',  label: 'Suspendus' },
]

export default function BackofficeAbonnements() {
  const [users, setUsers]       = useState<Subscriber[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [plans, setPlans]       = useState<PlanRow[]>([])
  const [events, setEvents]     = useState<SubscriptionEvent[]>([])
  const [loading, setLoading]   = useState(true)
  const [loadError, setLoadError] = useState('')
  const [q, setQ]               = useState('')
  const [filter, setFilter]     = useState<Filter>('tous')
  const [toast, setToast]       = useState<{ msg: string; error?: boolean } | null>(null)

  const showToast = (msg: string, error = false) => { setToast({ msg, error }); setTimeout(() => setToast(null), 4000) }

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/subscriptions', { credentials: 'include' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || `Erreur ${r.status}`)
      setUsers(d.users || []); setInvoices(d.invoices || []); setPlans(d.plans || []); setEvents(d.events || [])
      setLoadError('')
    } catch (e: any) {
      setLoadError(e.message || 'Chargement impossible')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const pendingByUser = useMemo(() => {
    const m: Record<string, Invoice[]> = {}
    invoices.filter(i => i.status === 'proforma_envoyee').forEach(i => { (m[i.user_id] ||= []).push(i) })
    return m
  }, [invoices])

  const paidActive = users.filter(u => u.statut === 'active' && (PAID_PLANS as readonly string[]).includes(u.plan))
  const trials     = users.filter(u => u.statut === 'trial')
  const pendingInv = invoices.filter(i => i.status === 'proforma_envoyee')
  const yearAgo    = Date.now() - 365 * 86_400_000
  const revenue12m = invoices.filter(i => i.status === 'payee' && i.paid_at && new Date(i.paid_at).getTime() > yearAgo)
                             .reduce((s, i) => s + Number(i.amount), 0)

  const filtered = users.filter(u => {
    const dl = daysLeft(endDate(u))
    const okFilter =
      filter === 'tous'       ? true :
      filter === 'payants'    ? paidActive.includes(u) :
      filter === 'essai'      ? u.statut === 'trial' :
      filter === 'a_echeance' ? (u.statut === 'active' || u.statut === 'trial') && dl !== null && dl >= 0 && dl <= 30 :
      filter === 'expires'    ? u.statut === 'expired' :
      filter === 'suspendus'  ? u.statut === 'suspended' : true
    const hay = [u.email, u.nom, u.prenom, u.societe, PLAN_LABEL[u.plan]].join(' ').toLowerCase()
    return okFilter && hay.includes(q.toLowerCase())
  })

  const onDone  = (m: string) => { showToast(m); load() }
  const onError = (m: string) => showToast(m, true)

  return (
    <BackofficeLayout title="Abonnements">

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: toast.error ? '#C0392B' : '#059669', color: 'white', padding: '10px 20px', fontSize: 12, zIndex: 1100, maxWidth: 420 }}>
          {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: 'var(--bd)', marginBottom: 4 }}>Abonnements</h1>
        <p style={{ fontSize: 13, color: 'var(--inkm)' }}>
          {loading ? 'Chargement…' : `${users.length} comptes · ${paidActive.length} abonnés actifs · ${trials.length} en essai · facturation annuelle`}
        </p>
      </div>

      {loadError && (
        <div style={{ background: '#FEE8E8', color: '#C0392B', padding: '10px 14px', fontSize: 12, marginBottom: '1rem' }}>
          {loadError}
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'ENCAISSÉ (12 MOIS)',   value: fmtAmount(revenue12m),             color: '#7C3AED' },
          { label: 'ABONNÉS ACTIFS',       value: paidActive.length,                 color: '#059669' },
          { label: 'ESSAIS EN COURS',      value: trials.length,                     color: '#2563EB' },
          { label: 'PRO-FORMAS EN ATTENTE',value: `${pendingInv.length} · ${fmtAmount(pendingInv.reduce((s, i) => s + Number(i.amount), 0))}`, color: '#D97706' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--white)', border: '.5px solid var(--rule)', borderTop: `3px solid ${s.color}`, padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: 10, letterSpacing: '.06em', color: 'var(--inkm)', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: 'var(--bd)' }}>{loading ? '…' : s.value}</div>
          </div>
        ))}
      </div>

      {/* Répartition par plan */}
      <div style={{ background: 'var(--white)', border: '.5px solid var(--rule)', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: 11, letterSpacing: '.08em', color: 'var(--inkm)', marginBottom: '1rem' }}>RÉPARTITION PAR PLAN — ABONNEMENTS ACTIFS</div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {plans.map(p => {
            const count = paidActive.filter(u => u.plan === p.code).length
            return (
              <div key={p.code} style={{ flex: 1, minWidth: 160, padding: '1rem', border: '.5px solid var(--rule)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--bd)', marginBottom: 4 }}>{p.label}</div>
                <div style={{ fontSize: 22, fontFamily: "'Playfair Display',serif", fontWeight: 700, color: 'var(--ba)' }}>{count}</div>
                <div style={{ fontSize: 11, color: 'var(--inkm)', marginTop: 2 }}>
                  {p.price_per_year != null ? `${fmtAmount(p.price_per_year)} / an` : 'Sur contrat'}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pro-formas en attente */}
      {pendingInv.length > 0 && (
        <div style={{ background: '#FFFBF0', border: '.5px solid #E8C97A', borderLeft: '3px solid #D97706', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 11, letterSpacing: '.08em', color: '#8A5A10', marginBottom: '.75rem' }}>
            PRO-FORMAS EN ATTENTE DE PAIEMENT — valider dès réception du virement
          </div>
          {pendingInv.map(inv => {
            const u = users.find(x => x.id === inv.user_id)
            if (!u) return null
            return (
              <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '.5rem 0', borderTop: '.5px solid #F0E0B0' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{inv.proforma_number}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--bd)' }}>{displayName(u)}</span>
                <span style={{ fontSize: 12, color: 'var(--inks)' }}>{PLAN_LABEL[inv.plan_code]} · {inv.years} an{inv.years > 1 ? 's' : ''} · {fmtAmount(inv.amount)}</span>
                <span style={{ fontSize: 11, color: 'var(--inkm)' }}>émise le {fmtDate(inv.sent_at || inv.created_at)}</span>
                <div style={{ marginLeft: 'auto' }}>
                  <SubscriptionActions user={u} plans={plans} pending={[inv]} onDone={onDone} onError={onError} compact />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Filtres + recherche */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '.75rem' }}>
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            fontSize: 11, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit',
            border: '.5px solid ' + (filter === f.id ? 'var(--bd)' : 'var(--rule)'),
            background: filter === f.id ? 'var(--bd)' : 'var(--white)', color: filter === f.id ? '#fff' : 'var(--inks)',
          }}>{f.label}</button>
        ))}
      </div>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher nom, société, email ou plan…"
        style={{ width: '100%', padding: '10px 14px', border: '.5px solid var(--rule)', background: 'var(--white)', fontSize: 12, outline: 'none', fontFamily: 'inherit', marginBottom: '1rem' }}
      />

      {/* Table des abonnés */}
      <div style={{ background: 'var(--white)', border: '.5px solid var(--rule)', overflowX: 'auto', marginBottom: '1.5rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '.5px solid var(--rule)' }}>
              {['CLIENT', 'PLAN', 'STATUT', 'ÉCHÉANCE', 'FACTURES', 'ACTIONS'].map(h => (
                <th key={h} style={{ padding: '.5rem .75rem', textAlign: 'left', fontSize: 10, letterSpacing: '.06em', color: 'var(--inkm)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--inkm)' }}>Aucun compte ne correspond.</td></tr>
            )}
            {filtered.map(u => {
              const s = STATUT_STYLE[u.statut] || { bg: '#eee', color: '#555', label: u.statut }
              const end = endDate(u)
              const dl = daysLeft(end)
              const paid = invoices.filter(i => i.user_id === u.id && i.status === 'payee')
              return (
                <tr key={u.id} style={{ borderBottom: '.5px solid var(--rule)', verticalAlign: 'top' }}>
                  <td style={{ padding: '.6rem .75rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--bd)' }}>{u.societe || displayName(u)}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--ba)' }}>{u.email}</div>
                  </td>
                  <td style={{ padding: '.6rem .75rem', color: 'var(--inks)' }}>{PLAN_LABEL[u.plan] || u.plan}</td>
                  <td style={{ padding: '.6rem .75rem' }}>
                    <span style={{ fontSize: 10, padding: '2px 8px', background: s.bg, color: s.color, fontWeight: 600 }}>{s.label}</span>
                  </td>
                  <td style={{ padding: '.6rem .75rem', whiteSpace: 'nowrap', color: dl !== null && dl <= 30 && dl >= 0 ? '#D97706' : 'var(--bd)' }}>
                    {fmtDate(end)}
                    {dl !== null && dl >= 0 && <div style={{ fontSize: 10, color: 'var(--inkm)' }}>dans {dl} j</div>}
                    {end === null && (PAID_PLANS as readonly string[]).includes(u.plan) && <div style={{ fontSize: 10, color: 'var(--inkm)' }}>sans échéance</div>}
                  </td>
                  <td style={{ padding: '.6rem .75rem', color: 'var(--inkm)' }}>
                    {paid.length}{paid[0] && <div style={{ fontSize: 10 }}>{paid[0].invoice_number}</div>}
                  </td>
                  <td style={{ padding: '.6rem .75rem' }}>
                    <SubscriptionActions user={u} plans={plans} pending={pendingByUser[u.id] || []} onDone={onDone} onError={onError} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Journal */}
      <div style={{ background: 'var(--white)', border: '.5px solid var(--rule)', padding: '1.25rem' }}>
        <div style={{ fontSize: 11, letterSpacing: '.08em', color: 'var(--inkm)', marginBottom: '.75rem' }}>JOURNAL DES ABONNEMENTS</div>
        {events.length === 0
          ? <p style={{ fontSize: 12, color: 'var(--inkm)' }}>Aucune opération enregistrée pour l'instant.</p>
          : events.map(e => (
            <div key={e.id} style={{ display: 'flex', gap: 12, fontSize: 12, padding: '.4rem 0', borderTop: '.5px solid var(--rule)', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--inkm)', minWidth: 120 }}>{new Date(e.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span>
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--ba)', minWidth: 200 }}>{e.user_email}</span>
              <span style={{ color: 'var(--inks)' }}>
                {EVENT_LABEL[e.type] || e.type}
                {e.to_plan && e.type !== 'suspension' && e.type !== 'reactivation' ? ` · ${PLAN_LABEL[e.to_plan] || e.to_plan}` : ''}
                {e.amount != null ? ` · ${fmtAmount(e.amount)}` : ''}
                {e.note ? ` — ${e.note}` : ''}
              </span>
            </div>
          ))}
      </div>

    </BackofficeLayout>
  )
}
