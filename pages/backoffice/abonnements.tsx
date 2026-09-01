import { useEffect, useState } from 'react'
import type { GetServerSideProps } from 'next'
import { requireAdminSSR } from '../../lib/adminAuth'
import { useRouter } from 'next/router'
import BackofficeLayout from '../../components/BackofficeLayout'

interface Abonnement {
  id: number
  client: string
  email: string
  plan: string
  montant: number
  devise: string
  statut: 'actif' | 'essai' | 'expire' | 'suspendu'
  debut: string
  renouvellement: string
  factures: number
}

const ABONNEMENTS: Abonnement[] = [
  { id:1, client:'Cabinet FZI Douane',      email:'fz.idrissi@cabinet-fzi.ma',  plan:'Premium',       montant:3200, devise:'DH/mois', statut:'actif',    debut:'02/02/2025', renouvellement:'02/05/2026', factures:14 },
  { id:2, client:'ATLAS TRANSIT SARL',      email:'k.benali@transitaire.ma',    plan:'Professionnel', montant:950,  devise:'DH/mois', statut:'actif',    debut:'15/01/2025', renouvellement:'15/04/2026', factures:15 },
  { id:3, client:'TAZI IMPORT EXPORT',      email:'m.tazi@importexport.ma',     plan:'Consultation',  montant:350,  devise:'DH/mois', statut:'actif',    debut:'10/02/2025', renouvellement:'10/05/2026', factures:13 },
  { id:4, client:'LOGIMA TRANSPORT',        email:'s.chaoui@logima.ma',         plan:'Professionnel', montant:950,  devise:'DH/mois', statut:'essai',    debut:'19/03/2026', renouvellement:'19/04/2026', factures:0  },
  { id:5, client:'Youssef Alami',           email:'y.alami@freelance.ma',       plan:'Consultation',  montant:350,  devise:'DH/mois', statut:'suspendu', debut:'05/12/2024', renouvellement:'–',          factures:4  },
  { id:6, client:'SOTRALY Casablanca',      email:'contact@sotraly.ma',         plan:'Premium',       montant:3200, devise:'DH/mois', statut:'actif',    debut:'01/03/2026', renouvellement:'01/06/2026', factures:2  },
  { id:7, client:'MEDLOGIX Transit',        email:'ops@medlogix.ma',            plan:'Professionnel', montant:950,  devise:'DH/mois', statut:'actif',    debut:'14/01/2026', renouvellement:'14/04/2026', factures:3  },
  { id:8, client:'Industrielle du Détroit', email:'adm@ind-detroit.ma',         plan:'Premium',       montant:3200, devise:'DH/mois', statut:'expire',   debut:'10/10/2024', renouvellement:'10/10/2025', factures:12 },
]

const PLAN_PRICES: Record<string, number> = { Premium:3200, Professionnel:950, Consultation:350 }

const STATUT_C: Record<string,{ bg:string; color:string; label:string }> = {
  actif:    { bg:'#E6F7EE', color:'#1A7A40', label:'Actif' },
  essai:    { bg:'#EEF4FE', color:'#1A3A9A', label:'Essai' },
  expire:   { bg:'#F5F5F5', color:'#888',    label:'Expiré' },
  suspendu: { bg:'#FEE8E8', color:'#C0392B', label:'Suspendu' },
}

export const getServerSideProps: GetServerSideProps = requireAdminSSR

export default function BackofficeAbonnements() {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [toast, setToast] = useState('')


  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  const filtered = ABONNEMENTS.filter(a =>
    [a.client, a.email, a.plan].join(' ').toLowerCase().includes(q.toLowerCase())
  )

  const mrr = ABONNEMENTS.filter(a => a.statut === 'actif').reduce((s, a) => s + a.montant, 0)
  const actifs = ABONNEMENTS.filter(a => a.statut === 'actif').length
  const essais = ABONNEMENTS.filter(a => a.statut === 'essai').length
  const cabinets = ABONNEMENTS.filter(a => a.plan === 'Premium' && a.statut === 'actif').length

  return (
    <BackofficeLayout title="Abonnements & MRR">

      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, background:'#059669', color:'white', padding:'10px 20px', fontSize:12, zIndex:999 }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom:'1.5rem' }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, color:'var(--bd)', marginBottom:4 }}>Abonnements & MRR</h1>
        <p style={{ fontSize:13, color:'var(--inkm)' }}>{ABONNEMENTS.length} comptes · {actifs} actifs · {essais} en période d'essai</p>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'.75rem', marginBottom:'1.5rem' }}>
        {[
          { label:'MRR Total', value:`${mrr.toLocaleString('fr')} DH`, color:'#7C3AED' },
          { label:'Abonnements actifs', value:actifs, color:'#059669' },
          { label:'Périodes d\'essai', value:essais, color:'#2563EB' },
          { label:'Comptes Premium', value:cabinets, color:'#D97706' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--white)', border:'.5px solid var(--rule)', borderTop:`3px solid ${s.color}`, padding:'1rem 1.25rem' }}>
            <div style={{ fontSize:10, letterSpacing:'.06em', color:'var(--inkm)', marginBottom:4 }}>{s.label}</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:700, color:'var(--bd)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Répartition plans */}
      <div style={{ background:'var(--white)', border:'.5px solid var(--rule)', padding:'1.25rem', marginBottom:'1.5rem' }}>
        <div style={{ fontSize:11, letterSpacing:'.08em', color:'var(--inkm)', marginBottom:'1rem' }}>RÉPARTITION PAR PLAN</div>
        <div style={{ display:'flex', gap:'1.5rem', flexWrap:'wrap' }}>
          {Object.entries(PLAN_PRICES).map(([plan, prix]) => {
            const count = ABONNEMENTS.filter(a => a.plan === plan && a.statut === 'actif').length
            const rev = count * prix
            return (
              <div key={plan} style={{ flex:1, minWidth:140, padding:'1rem', border:'.5px solid var(--rule)' }}>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--bd)', marginBottom:4 }}>{plan}</div>
                <div style={{ fontSize:22, fontFamily:"'Playfair Display',serif", fontWeight:700, color:'var(--ba)' }}>{count}</div>
                <div style={{ fontSize:11, color:'var(--inkm)', marginTop:2 }}>{rev.toLocaleString('fr')} DH/mois</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recherche */}
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher client, email ou plan…"
        style={{ width:'100%', padding:'10px 14px', border:'.5px solid var(--rule)', background:'var(--white)', fontSize:12, outline:'none', fontFamily:'inherit', marginBottom:'1rem' }}
      />

      {/* Table */}
      <div style={{ background:'var(--white)', border:'.5px solid var(--rule)', overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ borderBottom:'.5px solid var(--rule)' }}>
              {['CLIENT','EMAIL','PLAN','MONTANT','STATUT','DÉBUT','RENOUVELLEMENT','FACTURES',''].map(h => (
                <th key={h} style={{ padding:'.5rem .75rem', textAlign:'left', fontSize:10, letterSpacing:'.06em', color:'var(--inkm)', fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => {
              const s = STATUT_C[a.statut]
              return (
                <tr key={a.id} style={{ borderBottom:'.5px solid var(--rule)' }}>
                  <td style={{ padding:'.5rem .75rem', fontWeight:600, color:'var(--bd)' }}>{a.client}</td>
                  <td style={{ padding:'.5rem .75rem', fontFamily:'monospace', fontSize:11, color:'var(--ba)' }}>{a.email}</td>
                  <td style={{ padding:'.5rem .75rem', color:'var(--inks)' }}>{a.plan}</td>
                  <td style={{ padding:'.5rem .75rem', fontWeight:600, color:'var(--bd)' }}>{a.montant.toLocaleString('fr')} DH</td>
                  <td style={{ padding:'.5rem .75rem' }}>
                    <span style={{ fontSize:10, padding:'2px 8px', background:s.bg, color:s.color, fontWeight:600 }}>{s.label}</span>
                  </td>
                  <td style={{ padding:'.5rem .75rem', color:'var(--inkm)', whiteSpace:'nowrap' }}>{a.debut}</td>
                  <td style={{ padding:'.5rem .75rem', color: a.statut === 'actif' ? 'var(--bd)' : 'var(--inkm)', whiteSpace:'nowrap' }}>{a.renouvellement}</td>
                  <td style={{ padding:'.5rem .75rem', color:'var(--inkm)', textAlign:'center' }}>{a.factures}</td>
                  <td style={{ padding:'.5rem .75rem' }}>
                    <button onClick={() => showToast(`Factures de ${a.client} — bientôt disponible`)}
                      style={{ fontSize:10, padding:'2px 8px', background:'transparent', border:'.5px solid var(--rule)', cursor:'pointer', fontFamily:'inherit', color:'var(--inkm)' }}>
                      Factures
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

    </BackofficeLayout>
  )
}
