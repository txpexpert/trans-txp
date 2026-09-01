import { useEffect, useState } from 'react'
import type { GetServerSideProps } from 'next'
import { requireAdminSSR } from '../../lib/adminAuth'
import { useRouter } from 'next/router'
import BackofficeLayout from '../../components/BackofficeLayout'

interface LogEntry {
  id: number
  date: string
  heure: string
  user: string
  action: string
  module: string
  statut: 'success' | 'error' | 'warning' | 'info'
  ip: string
}

const LOGS: LogEntry[] = [
  { id:1,  date:'09/04/2026', heure:'14:32', user:'fz.idrissi@cabinet-fzi.ma',  action:'Recherche code SH 8703210010',              module:'Tarifs',       statut:'success', ip:'196.12.44.21' },
  { id:2,  date:'09/04/2026', heure:'13:58', user:'k.benali@transitaire.ma',    action:'Génération DUM — lots 240409-KBT',           module:'Générateur',   statut:'success', ip:'196.22.11.8'  },
  { id:3,  date:'09/04/2026', heure:'13:15', user:'SYSTÈME',                    action:'Sync ADII — 3 nouvelles circulaires',        module:'Ingestion RAG',statut:'info',    ip:'–'            },
  { id:4,  date:'09/04/2026', heure:'12:40', user:'m.tazi@importexport.ma',     action:'Simulation fiscale — CH07020090',            module:'Simulateur',   statut:'success', ip:'41.249.87.33' },
  { id:5,  date:'09/04/2026', heure:'11:55', user:'s.chaoui@logima.ma',         action:'Tentative accès module Premium (quota)',     module:'Auth',         statut:'warning', ip:'105.67.23.4'  },
  { id:6,  date:'09/04/2026', heure:'11:20', user:'SYSTÈME',                    action:'Échec import tarifs CSV — format invalide',  module:'Ingestion',    statut:'error',   ip:'–'            },
  { id:7,  date:'09/04/2026', heure:'10:44', user:'y.alami@freelance.ma',       action:'Login refusé — compte suspendu',             module:'Auth',         statut:'error',   ip:'160.154.9.2'  },
  { id:8,  date:'09/04/2026', heure:'10:03', user:'admin@Transit-IA',            action:'Ajout circulaire ADII n° 5801/2026',         module:'Backoffice',   statut:'success', ip:'127.0.0.1'    },
  { id:9,  date:'08/04/2026', heure:'17:30', user:'k.benali@transitaire.ma',    action:'Chat IA — 8 requêtes',                      module:'Chat',         statut:'success', ip:'196.22.11.8'  },
  { id:10, date:'08/04/2026', heure:'16:50', user:'SYSTÈME',                    action:'Backup automatique base Supabase',           module:'Système',      statut:'success', ip:'–'            },
  { id:11, date:'08/04/2026', heure:'15:22', user:'fz.idrissi@cabinet-fzi.ma',  action:'Export rapport PDF — Régimes économiques',   module:'Documents',    statut:'success', ip:'196.12.44.21' },
  { id:12, date:'08/04/2026', heure:'14:08', user:'SYSTÈME',                    action:'Rate limit atteint — IP 41.249.87.33',       module:'Auth',         statut:'warning', ip:'41.249.87.33' },
]

const STATUT_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  success: { bg:'#E6F7EE', color:'#1A7A40', label:'Succès' },
  error:   { bg:'#FEE8E8', color:'#C0392B', label:'Erreur' },
  warning: { bg:'#FEF5E4', color:'#8A5A10', label:'Attention' },
  info:    { bg:'#EEF4FE', color:'#1A3A9A', label:'Info' },
}

export const getServerSideProps: GetServerSideProps = requireAdminSSR

export default function BackofficeLogs() {
  const router = useRouter()
  const [logs, setLogs] = useState(LOGS)
  const [q, setQ] = useState('')
  const [filtre, setFiltre] = useState<string>('all')
  const [toast, setToast] = useState('')


  const filtered = logs.filter(l => {
    const matchQ = [l.user, l.action, l.module].join(' ').toLowerCase().includes(q.toLowerCase())
    const matchF = filtre === 'all' || l.statut === filtre
    return matchQ && matchF
  })

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  const badge = (s: LogEntry['statut']) => {
    const c = STATUT_COLORS[s]
    return (
      <span style={{ fontSize:10, padding:'2px 8px', background:c.bg, color:c.color, fontWeight:600, letterSpacing:'.05em', whiteSpace:'nowrap' }}>
        {c.label}
      </span>
    )
  }

  return (
    <BackofficeLayout title="Journaux d'activité">

      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, background:'#1A3A9A', color:'white', padding:'10px 20px', fontSize:12, zIndex:999 }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem' }}>
        <div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, color:'var(--bd)', marginBottom:4 }}>
            Journaux d'activité
          </h1>
          <p style={{ fontSize:13, color:'var(--inkm)' }}>{filtered.length} entrée(s) · mise à jour en temps réel</p>
        </div>
        <button
          onClick={() => { setLogs([...LOGS]); showToast('Journaux actualisés') }}
          style={{ padding:'8px 16px', background:'var(--ba)', color:'white', border:'none', cursor:'pointer', fontSize:12, letterSpacing:'.05em' }}>
          ↻ Actualiser
        </button>
      </div>

      {/* Filtres */}
      <div style={{ display:'flex', gap:'1rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Rechercher utilisateur, action, module…"
          style={{ flex:1, minWidth:200, padding:'8px 12px', border:'.5px solid var(--rule)', background:'var(--white)', fontSize:12, color:'var(--bd)', outline:'none', fontFamily:'inherit' }}
        />
        {(['all','success','error','warning','info'] as const).map(f => (
          <button key={f} onClick={() => setFiltre(f)} style={{
            padding:'6px 14px', fontSize:11, border:'.5px solid var(--rule)', cursor:'pointer', letterSpacing:'.05em',
            background: filtre === f ? '#0C2D5C' : 'var(--white)', color: filtre === f ? 'white' : 'var(--inkm)',
            fontFamily:'inherit',
          }}>
            {f === 'all' ? 'Tous' : STATUT_COLORS[f].label}
          </button>
        ))}
      </div>

      {/* Stats rapides */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'.75rem', marginBottom:'1.5rem' }}>
        {(['success','error','warning','info'] as const).map(s => {
          const c = STATUT_COLORS[s]
          const cnt = logs.filter(l => l.statut === s).length
          return (
            <div key={s} style={{ background:'var(--white)', border:`.5px solid var(--rule)`, borderTop:`3px solid ${c.color}`, padding:'1rem', cursor:'pointer' }} onClick={() => setFiltre(s)}>
              <div style={{ fontSize:10, letterSpacing:'.06em', color:'var(--inkm)', marginBottom:4 }}>{c.label.toUpperCase()}</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:700, color:'var(--bd)' }}>{cnt}</div>
            </div>
          )
        })}
      </div>

      {/* Table */}
      <div style={{ background:'var(--white)', border:'.5px solid var(--rule)', overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ borderBottom:'.5px solid var(--rule)' }}>
              {['DATE / HEURE','UTILISATEUR','ACTION','MODULE','STATUT','IP'].map(h => (
                <th key={h} style={{ padding:'.5rem .75rem', textAlign:'left', fontSize:10, letterSpacing:'.06em', color:'var(--inkm)', fontWeight:600, whiteSpace:'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding:'2rem', textAlign:'center', color:'var(--inkm)', fontSize:13 }}>Aucun journal correspondant</td></tr>
            ) : filtered.map(l => (
              <tr key={l.id} style={{ borderBottom:'.5px solid var(--rule)' }}>
                <td style={{ padding:'.5rem .75rem', fontFamily:'monospace', fontSize:11, color:'var(--inkm)', whiteSpace:'nowrap' }}>{l.date} {l.heure}</td>
                <td style={{ padding:'.5rem .75rem', fontFamily:'monospace', fontSize:11, color:'var(--ba)', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.user}</td>
                <td style={{ padding:'.5rem .75rem', color:'var(--inks)' }}>{l.action}</td>
                <td style={{ padding:'.5rem .75rem', color:'var(--inkm)' }}>{l.module}</td>
                <td style={{ padding:'.5rem .75rem' }}>{badge(l.statut)}</td>
                <td style={{ padding:'.5rem .75rem', fontFamily:'monospace', fontSize:11, color:'var(--inkm)' }}>{l.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </BackofficeLayout>
  )
}

