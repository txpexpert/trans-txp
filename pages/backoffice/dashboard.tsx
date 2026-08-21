import { useEffect, useState } from 'react'
import type { GetServerSideProps } from 'next'
import { requireAdminSSR } from '../../lib/adminAuth'
import BackofficeLayout from '../../components/BackofficeLayout'
import Link from 'next/link'

// Remplace l'ancien pages/backoffice/index.tsx
// — protégé côté serveur par requireAdminSSR (voir getServerSideProps)
// — contenu repris du dashboard existant + lien Ingestion ajouté

export const getServerSideProps: GetServerSideProps = requireAdminSSR

export default function BackofficeDashboard() {
  const [tarifsCount, setTarifsCount] = useState(0)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => { if (d?.tarifs) setTarifsCount(parseInt(d.tarifs.replace(/\s/g, '')) || 0) })
      .catch(() => setTarifsCount(17881))
  }, [])

  const stats = [
    { label:'Codes SH en base',      value: tarifsCount ? tarifsCount.toLocaleString('fr') : '17 881', sub:'Tarif ADII 2025',       color:'#2563EB', href:'/backoffice/tarifs' },
    { label:'Utilisateurs actifs',   value:'248',   sub:'+12 ce mois',        color:'#059669', href:'/backoffice/utilisateurs' },
    { label:'MRR',                   value:'302 K', sub:'DH / mois',           color:'#D97706', href:'/backoffice/abonnements' },
    { label:'Abonnements actifs',    value:'159',   sub:'dont 22 Cabinet',     color:'#7C3AED', href:'/backoffice/abonnements' },
    { label:'Circulaires indexées',  value:'1 847', sub:'Sync ADII 20/03',     color:'#0891B2', href:'/backoffice/circulaires' },
    { label:'Alertes actives',       value:'3',     sub:'1 critique',           color:'#DC2626', href:'/backoffice/alertes' },
  ]

  const recentActions = [
    { user:'fz.idrissi@cabinet-fzi.ma', action:'Upgrade Cabinet → Cabinet (renouvellement)',     date:'Il y a 2h' },
    { user:'k.benali@transitaire.ma',   action:'Recherche code SH 8703210010',                  date:'Il y a 3h' },
    { user:'m.tazi@importexport.ma',    action:'Nouvel abonnement Consultation',                 date:'Hier 14:22' },
    { user:'SYSTÈME',                   action:'Synchronisation ADII — 12 nouvelles circulaires',date:'Hier 06:00' },
    { user:'s.chaoui@logima.ma',        action:'Début période d\'essai Professionnel',            date:'19/03/2025' },
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
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'2rem' }}>
        {stats.map(s => (
          <Link key={s.href} href={s.href} style={{ textDecoration:'none' }}>
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

      {/* ── ACTIVITÉ RÉCENTE ── */}
      <div style={{ background:'var(--white)', border:'.5px solid var(--rule)', padding:'1.5rem' }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:500, color:'var(--bd)', marginBottom:'1rem', paddingBottom:'.5rem', borderBottom:'.5px solid var(--rule)' }}>
          Activité récente
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr>
              <th style={{ padding:'.4rem .75rem', textAlign:'left', fontSize:10, letterSpacing:'.06em', color:'var(--inkm)', borderBottom:'.5px solid var(--rule)' }}>UTILISATEUR</th>
              <th style={{ padding:'.4rem .75rem', textAlign:'left', fontSize:10, letterSpacing:'.06em', color:'var(--inkm)', borderBottom:'.5px solid var(--rule)' }}>ACTION</th>
              <th style={{ padding:'.4rem .75rem', textAlign:'right', fontSize:10, letterSpacing:'.06em', color:'var(--inkm)', borderBottom:'.5px solid var(--rule)' }}>DATE</th>
            </tr>
          </thead>
          <tbody>
            {recentActions.map((a, i) => (
              <tr key={i} style={{ borderBottom:'.5px solid var(--rule)' }}>
                <td style={{ padding:'.5rem .75rem', fontFamily:'monospace', fontSize:11, color:'var(--ba)' }}>{a.user}</td>
                <td style={{ padding:'.5rem .75rem', color:'var(--inks)' }}>{a.action}</td>
                <td style={{ padding:'.5rem .75rem', textAlign:'right', color:'var(--inkm)', fontSize:11 }}>{a.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </BackofficeLayout>
  )
}

