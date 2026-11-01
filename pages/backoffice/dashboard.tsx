import { useEffect, useState } from 'react'
import type { GetServerSideProps } from 'next'
import { requireAdminSSR } from '../../lib/adminAuth'
import BackofficeLayout from '../../components/BackofficeLayout'
import Link from 'next/link'
import AdminAccountsPanel from '../../components/AdminAccountsPanel'
import { PLAN_LABEL, EVENT_LABEL, fmtAmount } from '../../lib/subscriptions'

interface Overview {
  users_total: number; users_new_30d: number; users_unverified: number
  active_paid_by_plan: Record<string, number>; trials_running: number; expiring_30d: number
  revenue_12m: number; revenue_ytd: number; proformas_pending: number; proformas_pending_amount: number
  tarifs: number; circulaires: number; knowledge_chunks: number; decisions: number
  leads: number; leads_30d: number
}
interface ActivityRow { user: string; action: string; at: string }

function relative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return 'À l\u2019instant'
  if (h < 24) return `Il y a ${h} h`
  if (h < 48) return 'Hier'
  return new Date(iso).toLocaleDateString('fr-FR')
}

// Remplace l'ancien pages/backoffice/index.tsx
// — protégé côté serveur par requireAdminSSR (voir getServerSideProps)
// — contenu repris du dashboard existant + lien Ingestion ajouté

export const getServerSideProps: GetServerSideProps = requireAdminSSR

export default function BackofficeDashboard() {
  // ✅ 2026-11-01 — données réelles uniquement (fonction SQL admin_dashboard_stats
  // + journal subscription_events + dernières inscriptions, via /api/admin/stats).
  // Les chiffres de démonstration (248 utilisateurs, MRR 302 K, etc.) ont été retirés.
  const [overview, setOverview] = useState<Overview | null>(null)
  const [activity, setActivity] = useState<ActivityRow[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/stats', { credentials: 'include' })
      .then(async r => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || `Erreur ${r.status}`)
        setOverview(d.overview ?? null)
        const rows: ActivityRow[] = [
          ...(d.events || []).map((e: any) => ({
            user: e.numero_abonne ? `${e.numero_abonne} · ${e.user_email}` : (e.user_email || 'SYSTÈME'),
            action: (EVENT_LABEL[e.type] || e.type)
              + (e.to_plan && !['suspension', 'reactivation'].includes(e.type) ? ` · ${PLAN_LABEL[e.to_plan] || e.to_plan}` : '')
              + (e.amount != null ? ` · ${fmtAmount(e.amount)}` : ''),
            at: e.created_at,
          })),
          ...(d.signups || []).map((u: any) => ({ user: `${u.numero_abonne} · ${u.email}`, action: 'Nouvelle inscription', at: u.created_at })),
        ]
        rows.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
        setActivity(rows.slice(0, 10))
      })
      .catch(e => setError(e.message || 'Chargement impossible'))
  }, [])

  const o = overview
  const n = (v: number | undefined) => (v == null ? '…' : Number(v).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' '))
  const paid = o?.active_paid_by_plan || {}
  const paidTotal = Object.values(paid).reduce((a, b) => a + Number(b), 0)

  const stats = [
    { label:'Comptes utilisateurs',  value: n(o?.users_total),       sub: o ? `+${o.users_new_30d} ces 30 derniers jours` : '',                                   color:'#059669', href:'/backoffice/utilisateurs' },
    { label:'Abonnés actifs',        value: o ? n(paidTotal) : '…',   sub: o ? ['pro','premium','enterprise'].map(p => `${PLAN_LABEL[p]} ${paid[p] || 0}`).join(' · ') : '', color:'#7C3AED', href:'/backoffice/abonnements' },
    { label:'Encaissé (12 mois)',    value: o ? fmtAmount(o.revenue_12m) : '…', sub: o ? `dont ${fmtAmount(o.revenue_ytd)} depuis janvier` : '',              color:'#D97706', href:'/backoffice/abonnements' },
    { label:'Pro-formas en attente', value: n(o?.proformas_pending), sub: o ? `${fmtAmount(o.proformas_pending_amount)} à encaisser` : '',                        color:'#B45309', href:'/backoffice/abonnements' },
    { label:'Échéances < 30 jours',  value: n(o?.expiring_30d),      sub: o ? `${o.trials_running} essai(s) en cours` : '',                                       color:'#DC2626', href:'/backoffice/abonnements' },
    { label:'Codes SH en base',      value: n(o?.tarifs),            sub:'Table tarifs',                                                                           color:'#2563EB', href:'/backoffice/tarifs' },
    { label:'Base documentaire',     value: n(o?.circulaires),       sub: o ? `documents · ${n(o.knowledge_chunks)} extraits · ${n(o.decisions)} décisions` : '',  color:'#0891B2', href:'/backoffice/circulaires' },
    { label:'Leads diagnostics',     value: n(o?.leads),             sub: o ? `+${o.leads_30d} ces 30 derniers jours` : '',                                        color:'#64748B', href:'/backoffice/scanner-leads' },
  ]

  return (
    <BackofficeLayout title="Vue d'ensemble">

      <div style={{ marginBottom:'2rem' }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, color:'var(--bd)', marginBottom:4 }}>
          Tableau de bord
        </h1>
        <p style={{ fontSize:13, color:'var(--inkm)' }}>
          {new Date().toLocaleDateString('fr-MA', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
        </p>
      </div>

      {/* ── BOUTON INGESTION — accès rapide ── */}
      <Link href="/backoffice/ingest" style={{
        display:'flex', alignItems:'center', gap:14, padding:'1rem 1.25rem',
        background:'#1A1600', border:'1px solid #C9A84C55', borderLeft:'3px solid #C9A84C',
        textDecoration:'none', marginBottom:'1.5rem', transition:'opacity .15s',
      }}>
        <div style={{ width:36, height:36, background:'#C9A84C', borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'#0A0A0A', flexShrink:0 }}>⬆</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:500, color:'#E8C97A' }}>Ingestion Circulaires ADII</div>
          <div style={{ fontSize:11, color:'#5F5E5A', marginTop:2 }}>Charger des PDFs pour alimenter le RAG — max 15 par lot</div>
        </div>
        <div style={{ fontSize:9, padding:'3px 10px', background:'#C9A84C', color:'#0A0A0A', letterSpacing:'.08em', flexShrink:0 }}>OUVRIR →</div>
      </Link>

      {/* ── STATS ── */}
      {error && (
        <div style={{ background:'#FEE8E8', color:'#C0392B', padding:'10px 14px', fontSize:12, marginBottom:'1rem' }}>{error}</div>
      )}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))', gap:'1rem', marginBottom:'2rem' }}>
        {stats.map(s => (
          <Link key={s.label} href={s.href} style={{ textDecoration:'none' }}>
            <div style={{
              background:'var(--white)', border:'.5px solid var(--rule)', padding:'1.25rem',
              borderTop:`3px solid ${s.color}`, cursor:'pointer',
            }}>
              <div style={{ fontSize:11, color:'var(--inkm)', letterSpacing:'.06em', marginBottom:6 }}>{s.label}</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, color:'var(--bd)', lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:11, color:'var(--inkm)', marginTop:4 }}>{s.sub}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── ADMINISTRATEURS (super-administrateur) ── */}
      <AdminAccountsPanel />

      {/* ── ACTIVITÉ RÉCENTE ── */}
      <div style={{ background:'var(--white)', border:'.5px solid var(--rule)', padding:'1.5rem' }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:500, color:'var(--bd)', marginBottom:'1rem', paddingBottom:'.5rem', borderBottom:'.5px solid var(--rule)' }}>
          Activité récente
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr>
              <th style={{ padding:'.4rem .75rem', textAlign:'left', fontSize:10, letterSpacing:'.06em', color:'var(--inkm)', borderBottom:'.5px solid var(--rule)' }}>ABONNÉ</th>
              <th style={{ padding:'.4rem .75rem', textAlign:'left', fontSize:10, letterSpacing:'.06em', color:'var(--inkm)', borderBottom:'.5px solid var(--rule)' }}>ACTION</th>
              <th style={{ padding:'.4rem .75rem', textAlign:'right', fontSize:10, letterSpacing:'.06em', color:'var(--inkm)', borderBottom:'.5px solid var(--rule)' }}>DATE</th>
            </tr>
          </thead>
          <tbody>
            {activity.length === 0 && (
              <tr><td colSpan={3} style={{ padding:'1rem .75rem', color:'var(--inkm)', fontSize:12 }}>{overview ? 'Aucune activité récente.' : 'Chargement…'}</td></tr>
            )}
            {activity.map((a, i) => (
              <tr key={i} style={{ borderBottom:'.5px solid var(--rule)' }}>
                <td style={{ padding:'.5rem .75rem', fontFamily:'monospace', fontSize:11, color:'var(--ba)' }}>{a.user}</td>
                <td style={{ padding:'.5rem .75rem', color:'var(--inks)' }}>{a.action}</td>
                <td style={{ padding:'.5rem .75rem', textAlign:'right', color:'var(--inkm)', fontSize:11 }}>{relative(a.at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </BackofficeLayout>
  )
}

