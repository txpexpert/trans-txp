// components/SubscriptionsBoard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Tableau de gestion des abonnements — données réelles Supabase via
// /api/admin/subscriptions. Facturation ANNUELLE (lib/pricing.ts).
//
// Utilisé par deux tableaux de bord :
//   • /backoffice/abonnements   — super-administrateur, toutes les actions ;
//   • /gestion-abonnements      — administrateurs de type 2 : seuls les
//     boutons de leurs habilitations sont affichés (prop `caps`), et les
//     montants encaissés seulement avec l'habilitation « voir_montants ».
// ─────────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useMemo, useState } from 'react'
import SubscriptionActions, { postAdminAction } from './SubscriptionActions'
import BillingSettingsPanel from './BillingSettingsPanel'
import { hasPermission, type AdminCapabilities } from '../lib/adminPermissions'
import {
  PLAN_LABEL, STATUT_STYLE, EVENT_LABEL, PAID_PLANS,
  GENERALADMIN, fmtAmount, fmtDate, displayName, endDate, daysLeft, invTTC,
  type Subscriber, type Invoice, type PlanRow, type SubscriptionEvent,
} from '../lib/subscriptions'
import { fmtAbonne, fmtDocNumber, normRef, type Paiement, type Avoir } from '../lib/billing'

type Filter = 'tous' | 'payants' | 'essai' | 'a_echeance' | 'expires' | 'suspendus'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'tous',       label: 'Tous' },
  { id: 'payants',    label: 'Abonnés actifs' },
  { id: 'essai',      label: 'En essai' },
  { id: 'a_echeance', label: 'Échéance < 30 j' },
  { id: 'expires',    label: 'Expirés' },
  { id: 'suspendus',  label: 'Suspendus' },
]

export default function SubscriptionsBoard({ caps, title = 'Abonnements' }: { caps?: AdminCapabilities | null; title?: string }) {
  // Sans `caps` (backoffice du super-administrateur) : tout est visible.
  const seeAmounts = !caps || hasPermission(caps, 'voir_montants')
  const [users, setUsers]       = useState<Subscriber[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [plans, setPlans]       = useState<PlanRow[]>([])
  const [events, setEvents]     = useState<SubscriptionEvent[]>([])
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [avoirs, setAvoirs]     = useState<Avoir[]>([])
  const [refQ, setRefQ]         = useState('')
  const [avoirFor, setAvoirFor] = useState<Invoice | null>(null)
  const isSuper = !caps || caps.niveau === 'super'
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
      setPaiements(d.paiements || []); setAvoirs(d.avoirs || [])
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

  const paiementsByUser = useMemo(() => {
    const m: Record<string, Paiement[]> = {}
    paiements.forEach(p => { if (p.user_id) (m[p.user_id] ||= []).push(p) })
    return m
  }, [paiements])

  const billable   = users.filter(u => u.role !== GENERALADMIN)
  const paidActive = billable.filter(u => u.statut === 'active' && (PAID_PLANS as readonly string[]).includes(u.plan))
  const trials     = billable.filter(u => u.statut === 'trial')
  const pendingAll = invoices.filter(i => i.status === 'proforma_envoyee')
  // Rapprochement : la référence collée depuis le relevé (PF-IXP…, n° d'abonné,
  // email…) filtre les pro-formas en attente.
  const pendingInv = refQ.trim()
    ? pendingAll.filter(i => {
        const u = users.find(x => x.id === i.user_id)
        const q = normRef(refQ)
        return [i.payment_reference, i.proforma_number, u?.numero_abonne].some(x => x && (normRef(x).includes(q) || q.includes(normRef(x))))
          || (!!u && [u.email, u.raison_sociale, u.societe, u.nom].some(x => x && x.toLowerCase().includes(refQ.trim().toLowerCase())))
      })
    : pendingAll
  const issued     = invoices.filter(i => i.status === 'payee')
  const yearAgo    = Date.now() - 365 * 86_400_000
  const revenue12m = issued.filter(i => i.paid_at && new Date(i.paid_at).getTime() > yearAgo).reduce((s, i) => s + invTTC(i), 0)
                   - avoirs.filter(a => new Date(a.issued_at).getTime() > yearAgo).reduce((s, a) => s + Number(a.amount_ttc), 0)
  const declaredCount = paiements.filter(p => p.statut === 'declare').length

  const filtered = users.filter(u => {
    const dl = daysLeft(endDate(u))
    const okFilter =
      filter === 'tous'       ? true :
      filter === 'payants'    ? paidActive.includes(u) :
      filter === 'essai'      ? u.statut === 'trial' :
      filter === 'a_echeance' ? (u.statut === 'active' || u.statut === 'trial') && dl !== null && dl >= 0 && dl <= 30 :
      filter === 'expires'    ? u.statut === 'expired' :
      filter === 'suspendus'  ? u.statut === 'suspended' : true
    const hay = [u.numero_abonne, fmtAbonne(u.numero_abonne), u.email, u.nom, u.prenom, u.societe, u.raison_sociale, u.ice, PLAN_LABEL[u.plan]].join(' ').toLowerCase()
    return okFilter && hay.includes(q.toLowerCase())
  })

  const onDone  = (m: string) => { showToast(m); load() }
  const onError = (m: string) => showToast(m, true)

  return (
    <>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: toast.error ? '#C0392B' : '#059669', color: 'white', padding: '10px 20px', fontSize: 12, zIndex: 1100, maxWidth: 420 }}>
          {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: 'var(--bd)', marginBottom: 4 }}>{title}</h1>
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
          ...(seeAmounts ? [{ label: 'ENCAISSÉ (12 MOIS)', value: fmtAmount(revenue12m), color: '#7C3AED' }] : []),
          { label: 'ABONNÉS ACTIFS',       value: paidActive.length,                 color: '#059669' },
          { label: 'ESSAIS EN COURS',      value: trials.length,                     color: '#2563EB' },
          { label: 'PRO-FORMAS EN ATTENTE',value: seeAmounts ? `${pendingAll.length} · ${fmtAmount(pendingAll.reduce((s, i) => s + invTTC(i), 0))}` : pendingAll.length, color: '#D97706' },
          { label: 'JUSTIFICATIFS À VÉRIFIER', value: declaredCount, color: '#0E7490' },
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
                  {p.price_per_year != null ? `${fmtAmount(p.price_per_year)} HT / an` : 'Sur contrat'}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pro-formas en attente — rapprochement des virements */}
      {pendingAll.length > 0 && (
        <div style={{ background: '#FFFBF0', border: '.5px solid #E8C97A', borderLeft: '3px solid #D97706', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 11, letterSpacing: '.08em', color: '#8A5A10', marginBottom: '.75rem' }}>
            PAIEMENTS À VALIDER — coller la référence lue sur le relevé bancaire, vérifier le montant, valider
          </div>
          <input value={refQ} onChange={e => setRefQ(e.target.value)} placeholder="Référence du virement (PF-IXP27AA01), n° d'abonné, email ou raison sociale…"
            style={{ width: '100%', padding: '9px 12px', border: '.5px solid #E8C97A', background: '#fff', fontSize: 12, fontFamily: 'monospace', marginBottom: 8 }} />
          {pendingInv.length === 0 && <p style={{ fontSize: 12, color: '#C0392B' }}>Aucune pro-forma en attente ne correspond à cette référence.</p>}
          {pendingInv.map(inv => {
            const u = users.find(x => x.id === inv.user_id)
            if (!u) return null
            const decl = paiements.filter(p => p.invoice_id === inv.id && p.statut === 'declare')
            return (
              <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '.5rem 0', borderTop: '.5px solid #F0E0B0' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700 }}>{fmtDocNumber(inv.payment_reference || inv.proforma_number)}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: 'var(--bd)' }}>{fmtAbonne(u.numero_abonne)}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--bd)' }}>{u.raison_sociale || displayName(u)}</span>
                <span style={{ fontSize: 12, color: 'var(--inks)' }}>{PLAN_LABEL[inv.plan_code]} · {inv.years} an{inv.years > 1 ? 's' : ''} · <b>{fmtAmount(invTTC(inv))} TTC</b></span>
                <span style={{ fontSize: 11, color: 'var(--inkm)' }}>émise le {fmtDate(inv.sent_at || inv.created_at)}{inv.origin && inv.origin !== 'admin' ? ` · ${inv.origin === 'client' ? 'demandée par le client' : inv.origin === 'fin_essai' ? 'fin d’essai' : 'renouvellement'}` : ''}</span>
                {decl.map(p => (
                  <span key={p.id} style={{ fontSize: 11, background: '#E6F4F7', color: '#0E7490', padding: '2px 8px' }}>
                    📎 {fmtAmount(p.montant)} le {fmtDate(p.date_valeur)}
                    {p.justificatif_path && <> · <a href={`/api/admin/justificatif?id=${p.id}`} target="_blank" rel="noreferrer">voir</a></>}
                  </span>
                ))}
                <div style={{ marginLeft: 'auto' }}>
                  <SubscriptionActions user={u} plans={plans} pending={[inv]} paiements={paiementsByUser[u.id] || []} onDone={onDone} onError={onError} compact caps={caps} />
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
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher n° d'abonné (ABIXP…), nom, société, email ou plan…"
        style={{ width: '100%', padding: '10px 14px', border: '.5px solid var(--rule)', background: 'var(--white)', fontSize: 12, outline: 'none', fontFamily: 'inherit', marginBottom: '1rem' }}
      />

      {/* Table des abonnés */}
      <div style={{ background: 'var(--white)', border: '.5px solid var(--rule)', overflowX: 'auto', marginBottom: '1.5rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '.5px solid var(--rule)' }}>
              {['N° ABONNÉ', 'CLIENT', 'PLAN', 'STATUT', 'ÉCHÉANCE', 'FACTURES', 'ACTIONS'].map(h => (
                <th key={h} style={{ padding: '.5rem .75rem', textAlign: 'left', fontSize: 10, letterSpacing: '.06em', color: 'var(--inkm)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--inkm)' }}>Aucun compte ne correspond.</td></tr>
            )}
            {filtered.map(u => {
              const s = STATUT_STYLE[u.statut] || { bg: '#eee', color: '#555', label: u.statut }
              const end = endDate(u)
              const dl = daysLeft(end)
              const paid = invoices.filter(i => i.user_id === u.id && i.status === 'payee')
              return (
                <tr key={u.id} style={{ borderBottom: '.5px solid var(--rule)', verticalAlign: 'top' }}>
                  <td style={{ padding: '.6rem .75rem', fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: 'var(--bd)', whiteSpace: 'nowrap' }}>{fmtAbonne(u.numero_abonne)}</td>
                  <td style={{ padding: '.6rem .75rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--bd)' }}>{u.raison_sociale || u.societe || displayName(u)}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--ba)' }}>{u.email}</div>
                    <div style={{ fontSize: 10, color: 'var(--inkm)' }}>
                      {u.type_client === 'entreprise' ? `Entreprise · ICE ${u.ice || '—'}` : u.type_client === 'particulier' ? 'Particulier' : 'Profil de facturation à compléter'}
                    </div>
                  </td>
                  <td style={{ padding: '.6rem .75rem', color: 'var(--inks)' }}>
                    {u.role === GENERALADMIN ? 'Generaladmin' : PLAN_LABEL[u.plan] || u.plan}
                    {u.plan_souhaite && u.plan === 'trial' && <div style={{ fontSize: 10, color: 'var(--inkm)' }}>souhaite {PLAN_LABEL[u.plan_souhaite]}</div>}
                  </td>
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
                    <SubscriptionActions user={u} plans={plans} pending={pendingByUser[u.id] || []} paiements={paiementsByUser[u.id] || []} onDone={onDone} onError={onError} caps={caps} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Factures émises */}
      {seeAmounts && issued.length > 0 && (
        <div style={{ background: 'var(--white)', border: '.5px solid var(--rule)', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 11, letterSpacing: '.08em', color: 'var(--inkm)', marginBottom: '.75rem' }}>FACTURES ÉMISES ET AVOIRS (ARCHIVE COMPTABLE)</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr>{['FACTURE', 'DATE', 'ABONNÉ', 'CLIENT', 'PRO-FORMA', 'HT', 'TTC', ''].map(h =>
              <th key={h} style={{ textAlign: 'left', fontSize: 10, color: 'var(--inkm)', padding: '.4rem .5rem', borderBottom: '.5px solid var(--rule)' }}>{h}</th>)}</tr></thead>
            <tbody>
              {issued.map(i => {
                const u = users.find(x => x.id === i.user_id)
                const avs = avoirs.filter(a => a.invoice_id === i.id)
                return (
                  <tr key={i.id} style={{ borderBottom: '.5px solid var(--rule)', verticalAlign: 'top' }}>
                    <td style={{ padding: '.45rem .5rem' }}><a href={`/facturation/document/${i.id}`} target="_blank" rel="noreferrer" style={{ fontFamily: 'monospace', fontWeight: 700 }}>{i.invoice_number}</a>
                      {avs.map(a => <div key={a.id}><a href={`/facturation/document/${a.id}?type=avoir`} target="_blank" rel="noreferrer" style={{ fontFamily: 'monospace', fontSize: 11, color: '#C0392B' }}>{fmtDocNumber(a.avoir_number)} −{fmtAmount(a.amount_ttc)}</a></div>)}
                    </td>
                    <td style={{ padding: '.45rem .5rem' }}>{fmtDate(i.paid_at)}</td>
                    <td style={{ padding: '.45rem .5rem', fontFamily: 'monospace' }}>{fmtAbonne(i.numero_abonne)}</td>
                    <td style={{ padding: '.45rem .5rem' }}>{u ? (u.raison_sociale || displayName(u)) : i.client_email}</td>
                    <td style={{ padding: '.45rem .5rem', fontFamily: 'monospace', fontSize: 11 }}>{fmtDocNumber(i.payment_reference || i.proforma_number)}</td>
                    <td style={{ padding: '.45rem .5rem' }}>{fmtAmount(i.amount_ht)}</td>
                    <td style={{ padding: '.45rem .5rem', fontWeight: 600 }}>{fmtAmount(invTTC(i))}</td>
                    <td style={{ padding: '.45rem .5rem' }}>{isSuper && <button onClick={() => setAvoirFor(i)} style={{ fontSize: 11, padding: '3px 8px', border: '.5px solid #C0392B', color: '#C0392B', background: 'transparent', cursor: 'pointer' }}>Avoir</button>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {avoirFor && <AvoirModal invoice={avoirFor} avoirs={avoirs.filter(a => a.invoice_id === avoirFor.id)}
        onClose={() => setAvoirFor(null)} onDone={m => { setAvoirFor(null); onDone(m) }} onError={onError} />}

      <BillingSettingsPanel />

      {/* Journal */}
      <div style={{ background: 'var(--white)', border: '.5px solid var(--rule)', padding: '1.25rem' }}>
        <div style={{ fontSize: 11, letterSpacing: '.08em', color: 'var(--inkm)', marginBottom: '.75rem' }}>JOURNAL DES ABONNEMENTS</div>
        {events.length === 0
          ? <p style={{ fontSize: 12, color: 'var(--inkm)' }}>Aucune opération enregistrée pour l'instant.</p>
          : events.map(e => (
            <div key={e.id} style={{ display: 'flex', gap: 12, fontSize: 12, padding: '.4rem 0', borderTop: '.5px solid var(--rule)', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--inkm)', minWidth: 120 }}>{new Date(e.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span>
              <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 600, color: 'var(--bd)', minWidth: 96 }}>{fmtAbonne(e.numero_abonne)}</span>
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--ba)', minWidth: 200 }}>{e.user_email}</span>
              <span style={{ color: 'var(--inks)' }}>
                {EVENT_LABEL[e.type] || e.type}
                {e.to_plan && !['suspension', 'reactivation', 'suppression'].includes(e.type) ? ` · ${PLAN_LABEL[e.to_plan] || e.to_plan}` : ''}
                {e.amount != null ? ` · ${fmtAmount(e.amount)}` : ''}
                {e.note ? ` — ${e.note}` : ''}
              </span>
            </div>
          ))}
      </div>

    </>
  )
}

// ── Avoir (super-administrateur) ─────────────────────────────────────────────
function AvoirModal({ invoice, avoirs, onClose, onDone, onError }: {
  invoice: Invoice; avoirs: Avoir[]; onClose: () => void; onDone: (m: string) => void; onError: (m: string) => void
}) {
  const ht = Number(invoice.amount_ht ?? invTTC(invoice) / 1.2)
  const reste = Math.round((ht - avoirs.reduce((s, a) => s + Number(a.amount_ht), 0)) * 100) / 100
  const [montant, setMontant] = useState(String(reste))
  const [motif, setMotif] = useState('')
  const [resilier, setResilier] = useState(false)
  const [busy, setBusy] = useState(false)
  const input = { width: '100%', padding: '8px 10px', border: '.5px solid var(--rule)', fontSize: 13, fontFamily: 'inherit' }
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(12,45,92,.35)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', width: '100%', maxWidth: 480, padding: '1.5rem', borderTop: '3px solid #C0392B' }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: 'var(--bd)', marginBottom: '1rem' }}>Avoir sur la facture {invoice.invoice_number}</div>
        <p style={{ fontSize: 12, lineHeight: 1.6, marginTop: 0 }}>
          Une facture émise ne se modifie ni ne se supprime : l’avoir (série AV-) la corrige ou l’annule. Solde HT encore créditable : <b>{fmtAmount(reste)}</b>.
        </p>
        <label style={{ fontSize: 10, color: 'var(--inkm)' }}>MONTANT HT DE L’AVOIR</label>
        <input style={input} value={montant} onChange={e => setMontant(e.target.value)} inputMode="decimal" />
        <label style={{ fontSize: 10, color: 'var(--inkm)', display: 'block', marginTop: 10 }}>MOTIF (FIGURE SUR L’AVOIR)</label>
        <input style={input} value={motif} onChange={e => setMotif(e.target.value)} placeholder="ex. erreur de plan, remboursement" />
        <label style={{ display: 'flex', gap: 8, fontSize: 12, marginTop: 10 }}>
          <input type="checkbox" checked={resilier} onChange={e => setResilier(e.target.checked)} /> Mettre fin à l’abonnement couvert par cette facture
        </label>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '1.25rem' }}>
          <button onClick={onClose} style={{ fontSize: 12, padding: '7px 14px', border: '.5px solid var(--rule)', background: 'transparent', cursor: 'pointer' }}>Fermer</button>
          <button disabled={busy || !motif.trim()} style={{ fontSize: 12, padding: '7px 14px', border: 'none', background: '#C0392B', color: '#fff', cursor: 'pointer' }}
            onClick={async () => {
              setBusy(true)
              const r = await postAdminAction({ action: 'create_avoir', invoiceId: invoice.id, motif, amountHT: Number(montant.replace(',', '.')), resilier })
              setBusy(false)
              r.ok ? onDone(`Avoir émis sur ${invoice.invoice_number}`) : onError(r.error || 'Erreur')
            }}>{busy ? 'Émission…' : 'Émettre l’avoir'}</button>
        </div>
      </div>
    </div>
  )
}
