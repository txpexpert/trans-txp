// pages/backoffice/logs.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Journaux d'activité — données réelles uniquement (2026-11-01) :
//   • Connexions : table user_sessions, une ligne par session ouverte,
//     identifiée par le numéro d'abonné (ABIXP27.01AA).
//   • Abonnements : table subscription_events (activations, paiements,
//     suspensions, suppressions…).
// Remplace l'ancienne liste de journaux fictifs.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react'
import type { CSSProperties } from 'react'
import { withAdminData } from '../../lib/adminAuth'
import { supabaseAdmin } from '../../lib/supabaseAdmin'
import BackofficeLayout from '../../components/BackofficeLayout'
import { EVENT_LABEL, PLAN_LABEL, fmtAmount, type UserSession, type SubscriptionEvent } from '../../lib/subscriptions'

interface Lot { id: string; type: 'tarif' | 'decisions'; fichier: string | null; actor: string; compte: Record<string, number>; created_at: string }
interface Props {
  sessions: UserSession[]
  events: SubscriptionEvent[]
  lots: Lot[]
  loadError?: string
}

export const getServerSideProps = withAdminData<Props>(async () => {
  const sb = supabaseAdmin()
  const [sessions, events, lots] = await Promise.all([
    sb.from('user_sessions').select('*').order('created_at', { ascending: false }).limit(300),
    sb.from('subscription_events').select('*').order('created_at', { ascending: false }).limit(300),
    sb.from('ingestion_lots').select('*').order('created_at', { ascending: false }).limit(300),
  ])
  if (sessions.error) throw sessions.error
  if (events.error) throw events.error
  if (lots.error) throw lots.error
  return { sessions: sessions.data ?? [], events: events.data ?? [], lots: lots.data ?? [] }
})

const dt = (iso: string) => new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })

function device(ua: string | null): string {
  if (!ua) return '—'
  const os = /Android/i.test(ua) ? 'Android' : /iPhone|iPad/i.test(ua) ? 'iOS' : /Windows/i.test(ua) ? 'Windows' : /Mac OS/i.test(ua) ? 'macOS' : /Linux/i.test(ua) ? 'Linux' : 'Autre'
  const br = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : ''
  return br ? `${br} · ${os}` : os
}

const th: CSSProperties = { padding: '.5rem .75rem', textAlign: 'left', fontSize: 10, letterSpacing: '.06em', color: 'var(--inkm)', fontWeight: 600, whiteSpace: 'nowrap', borderBottom: '.5px solid var(--rule)' }
const td: CSSProperties = { padding: '.5rem .75rem', borderBottom: '.5px solid var(--rule)', fontSize: 12, verticalAlign: 'top' }
const num: CSSProperties = { fontFamily: 'monospace', fontWeight: 600, color: 'var(--bd)', whiteSpace: 'nowrap' }

export default function BackofficeLogs({ sessions = [], events = [], lots = [], loadError }: Props) {
  const [tab, setTab] = useState<'sessions' | 'abonnements' | 'ingestions'>('sessions')
  const [q, setQ] = useState('')
  const match = (...parts: (string | null | undefined)[]) => parts.join(' ').toLowerCase().includes(q.toLowerCase())

  const fSessions = sessions.filter(s => match(s.numero_abonne, s.email, s.ip))
  const fEvents   = events.filter(e => match(e.numero_abonne, e.user_email, EVENT_LABEL[e.type], e.note))
  const fLots     = lots.filter(l => match(l.actor, l.fichier, l.type === 'tarif' ? 'tarif' : 'décisions'))

  return (
    <BackofficeLayout title="Journaux d'activité">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: 'var(--bd)', marginBottom: 4 }}>Journaux d'activité</h1>
        <p style={{ fontSize: 13, color: 'var(--inkm)' }}>
          {sessions.length} connexion{sessions.length > 1 ? 's' : ''} · {events.length} opération{events.length > 1 ? 's' : ''} d'abonnement · 300 dernières de chaque
        </p>
      </div>

      {loadError && <div style={{ background: '#FEE8E8', color: '#C0392B', padding: '10px 14px', fontSize: 12, marginBottom: '1rem' }}>{loadError}</div>}

      <div style={{ display: 'flex', gap: 6, marginBottom: '.75rem', flexWrap: 'wrap' }}>
        {([['sessions', 'Connexions'], ['abonnements', 'Abonnements'], ['ingestions', 'Ingestions']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            fontSize: 11, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit',
            border: '.5px solid ' + (tab === id ? 'var(--bd)' : 'var(--rule)'),
            background: tab === id ? 'var(--bd)' : 'var(--white)', color: tab === id ? '#fff' : 'var(--inks)',
          }}>{label}</button>
        ))}
      </div>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Filtrer par n° d'abonné (ABIXP…), email, adresse IP…"
        style={{ width: '100%', padding: '10px 14px', border: '.5px solid var(--rule)', background: 'var(--white)', fontSize: 12, outline: 'none', fontFamily: 'inherit', marginBottom: '1rem' }} />

      <div style={{ background: 'var(--white)', border: '.5px solid var(--rule)', overflowX: 'auto' }}>
        {tab === 'ingestions' ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['DATE', 'TYPE', 'FICHIER', 'RÉSULTAT', 'PAR'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {fLots.length === 0 && (
                <tr><td colSpan={5} style={{ ...td, textAlign: 'center', color: 'var(--inkm)', padding: '2rem' }}>
                  {lots.length === 0 ? 'Aucune ingestion de tarif ou de décisions pour l\'instant.' : 'Aucun résultat.'}
                </td></tr>
              )}
              {fLots.map(l => (
                <tr key={l.id}>
                  <td style={{ ...td, whiteSpace: 'nowrap', color: 'var(--inkm)' }}>{dt(l.created_at)}</td>
                  <td style={td}>{l.type === 'tarif' ? 'Tarif SH' : 'Décisions'}</td>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 11 }}>{l.fichier || '—'}</td>
                  <td style={td}>
                    {l.compte.new ?? 0} ajout(s) · {l.compte.upd ?? 0} {l.type === 'tarif' ? 'modification(s)' : 'complétée(s)'}
                    {l.type === 'tarif' ? ` · ${l.compte.removed ?? 0} remplacement(s)` : ''} · {l.compte.err ?? 0} erreur(s)
                  </td>
                  <td style={{ ...td, color: 'var(--inkm)' }}>{l.actor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : tab === 'sessions' ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['DATE', 'N° ABONNÉ', 'EMAIL', 'APPAREIL', 'ADRESSE IP', 'SESSION'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {fSessions.length === 0 && (
                <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: 'var(--inkm)', padding: '2rem' }}>
                  {sessions.length === 0 ? 'Aucune connexion enregistrée. Chaque nouvelle connexion d\'un abonné apparaîtra ici.' : 'Aucun résultat.'}
                </td></tr>
              )}
              {fSessions.map(s => (
                <tr key={s.id}>
                  <td style={{ ...td, whiteSpace: 'nowrap', color: 'var(--inkm)' }}>{dt(s.created_at)}</td>
                  <td style={{ ...td, ...num }}>{s.numero_abonne}</td>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 11, color: 'var(--ba)' }}>{s.email}</td>
                  <td style={td}>{device(s.user_agent)}</td>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 11 }}>{s.ip || '—'}</td>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 10, color: 'var(--inkm)' }} title={s.session_id}>{s.session_id.slice(0, 8)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['DATE', 'N° ABONNÉ', 'EMAIL', 'OPÉRATION', 'MONTANT', 'PAR'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {fEvents.length === 0 && (
                <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: 'var(--inkm)', padding: '2rem' }}>
                  {events.length === 0 ? 'Aucune opération d\'abonnement pour l\'instant.' : 'Aucun résultat.'}
                </td></tr>
              )}
              {fEvents.map(e => (
                <tr key={e.id}>
                  <td style={{ ...td, whiteSpace: 'nowrap', color: 'var(--inkm)' }}>{dt(e.created_at)}</td>
                  <td style={{ ...td, ...num }}>{e.numero_abonne || '—'}</td>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 11, color: 'var(--ba)' }}>{e.user_email}</td>
                  <td style={td}>
                    {EVENT_LABEL[e.type] || e.type}
                    {e.to_plan && !['suspension', 'reactivation', 'suppression'].includes(e.type) ? ` · ${PLAN_LABEL[e.to_plan] || e.to_plan}` : ''}
                    {e.note && <div style={{ fontSize: 11, color: 'var(--inkm)' }}>{e.note}</div>}
                  </td>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>{e.amount != null ? fmtAmount(e.amount) : '—'}</td>
                  <td style={{ ...td, color: 'var(--inkm)' }}>{e.actor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </BackofficeLayout>
  )
}
