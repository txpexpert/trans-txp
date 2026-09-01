import { useEffect, useState } from 'react'
import type { GetServerSideProps } from 'next'
import { requireAdminSSR } from '../../lib/adminAuth'
import { useRouter } from 'next/router'
import BackofficeLayout from '../../components/BackofficeLayout'

interface Membre {
  id: number
  nom: string
  email: string
  role: string
  entreprise: string
  plan: string
  statut: 'actif' | 'invite' | 'suspendu'
  inscrit: string
  derniere_connexion: string
}

interface Equipe {
  id: number
  nom: string
  plan: string
  membres: number
  limite: number
  admin: string
  creee: string
}

const EQUIPES: Equipe[] = [
  { id:1, nom:'Cabinet FZI Douane',      plan:'Premium',       membres:6, limite:10, admin:'fz.idrissi@cabinet-fzi.ma',  creee:'02/02/2025' },
  { id:2, nom:'SOTRALY Casablanca',      plan:'Premium',       membres:4, limite:10, admin:'contact@sotraly.ma',          creee:'01/03/2026' },
  { id:3, nom:'Industrielle du Détroit', plan:'Premium',       membres:8, limite:10, admin:'adm@ind-detroit.ma',          creee:'10/10/2024' },
  { id:4, nom:'MEDLOGIX Transit',        plan:'Professionnel', membres:2, limite:3,  admin:'ops@medlogix.ma',             creee:'14/01/2026' },
]

const MEMBRES: Membre[] = [
  { id:1, nom:'Fatima Zahra Idrissi',  email:'fz.idrissi@cabinet-fzi.ma',  role:'Administrateur', entreprise:'Cabinet FZI Douane', plan:'Premium', statut:'actif',    inscrit:'02/02/2025', derniere_connexion:'Aujourd\'hui' },
  { id:2, nom:'Ahmed Idrissi',         email:'a.idrissi@cabinet-fzi.ma',   role:'Membre',         entreprise:'Cabinet FZI Douane', plan:'Premium', statut:'actif',    inscrit:'05/02/2025', derniere_connexion:'Hier' },
  { id:3, nom:'Layla Ouali',           email:'l.ouali@cabinet-fzi.ma',     role:'Membre',         entreprise:'Cabinet FZI Douane', plan:'Premium', statut:'actif',    inscrit:'10/03/2025', derniere_connexion:'Il y a 3 jours' },
  { id:4, nom:'Hassan Belmkaddem',     email:'h.belmkaddem@sotraly.ma',    role:'Membre',         entreprise:'SOTRALY Casablanca', plan:'Premium', statut:'invite',   inscrit:'02/03/2026', derniere_connexion:'Jamais' },
  { id:5, nom:'Karim Nassiri',         email:'k.nassiri@ind-detroit.ma',   role:'Membre',         entreprise:'Ind. du Détroit',    plan:'Premium', statut:'suspendu', inscrit:'15/11/2024', derniere_connexion:'Il y a 60j' },
]

const STATUT_C: Record<string,{ bg:string; color:string; label:string }> = {
  actif:    { bg:'#E6F7EE', color:'#1A7A40', label:'Actif' },
  invite:   { bg:'#EEF4FE', color:'#1A3A9A', label:'Invité' },
  suspendu: { bg:'#FEE8E8', color:'#C0392B', label:'Suspendu' },
}

export const getServerSideProps: GetServerSideProps = requireAdminSSR

export default function BackofficeEquipes() {
  const router = useRouter()
  const [onglet, setOnglet] = useState<'equipes' | 'membres'>('equipes')
  const [q, setQ] = useState('')
  const [toast, setToast] = useState('')


  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }
  const filteredEquipes = EQUIPES.filter(e => [e.nom, e.plan, e.admin].join(' ').toLowerCase().includes(q.toLowerCase()))
  const filteredMembres = MEMBRES.filter(m => [m.nom, m.email, m.entreprise].join(' ').toLowerCase().includes(q.toLowerCase()))

  return (
    <BackofficeLayout title="Équipes entreprises">

      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, background:'#059669', color:'white', padding:'10px 20px', fontSize:12, zIndex:999 }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom:'1.5rem' }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, color:'var(--bd)', marginBottom:4 }}>Équipes entreprises</h1>
        <p style={{ fontSize:13, color:'var(--inkm)' }}>{EQUIPES.length} équipes · {MEMBRES.length} membres au total</p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'.75rem', marginBottom:'1.5rem' }}>
        {[
          { label:'Équipes actives', value:EQUIPES.length, color:'#7C3AED' },
          { label:'Membres totaux', value:MEMBRES.length, color:'#059669' },
          { label:'Invitations en attente', value:MEMBRES.filter(m=>m.statut==='invite').length, color:'#2563EB' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--white)', border:'.5px solid var(--rule)', borderTop:`3px solid ${s.color}`, padding:'1rem' }}>
            <div style={{ fontSize:10, letterSpacing:'.06em', color:'var(--inkm)', marginBottom:4 }}>{s.label}</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, color:'var(--bd)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Onglets */}
      <div style={{ display:'flex', borderBottom:'.5px solid var(--rule)', marginBottom:'1rem' }}>
        {(['equipes','membres'] as const).map(o => (
          <button key={o} onClick={() => setOnglet(o)} style={{
            padding:'8px 20px', fontSize:12, border:'none', borderBottom: onglet === o ? '2px solid #0C2D5C' : '2px solid transparent',
            background:'transparent', cursor:'pointer', color: onglet === o ? 'var(--bd)' : 'var(--inkm)', fontFamily:'inherit',
          }}>
            {o === 'equipes' ? `Équipes (${EQUIPES.length})` : `Membres (${MEMBRES.length})`}
          </button>
        ))}
      </div>

      <input value={q} onChange={e => setQ(e.target.value)} placeholder={onglet === 'equipes' ? 'Rechercher une équipe…' : 'Rechercher un membre…'}
        style={{ width:'100%', padding:'8px 12px', border:'.5px solid var(--rule)', background:'var(--white)', fontSize:12, outline:'none', fontFamily:'inherit', marginBottom:'1rem' }}
      />

      {onglet === 'equipes' && (
        <div style={{ background:'var(--white)', border:'.5px solid var(--rule)', overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ borderBottom:'.5px solid var(--rule)' }}>
                {['ÉQUIPE','PLAN','MEMBRES / LIMITE','ADMINISTRATEUR','CRÉÉE LE',''].map(h => (
                  <th key={h} style={{ padding:'.5rem .75rem', textAlign:'left', fontSize:10, letterSpacing:'.06em', color:'var(--inkm)', fontWeight:600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredEquipes.map(e => (
                <tr key={e.id} style={{ borderBottom:'.5px solid var(--rule)' }}>
                  <td style={{ padding:'.5rem .75rem', fontWeight:600, color:'var(--bd)' }}>{e.nom}</td>
                  <td style={{ padding:'.5rem .75rem', color:'var(--inks)' }}>{e.plan}</td>
                  <td style={{ padding:'.5rem .75rem' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ color:'var(--bd)', fontWeight:600 }}>{e.membres}</span>
                      <span style={{ color:'var(--inkm)' }}>/ {e.limite}</span>
                      <div style={{ flex:1, height:4, background:'#E5E7EB', maxWidth:80 }}>
                        <div style={{ width:`${(e.membres/e.limite)*100}%`, height:'100%', background:'#7C3AED' }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:'.5rem .75rem', fontFamily:'monospace', fontSize:11, color:'var(--ba)' }}>{e.admin}</td>
                  <td style={{ padding:'.5rem .75rem', color:'var(--inkm)' }}>{e.creee}</td>
                  <td style={{ padding:'.5rem .75rem' }}>
                    <button onClick={() => showToast(`Gestion de ${e.nom} — bientôt disponible`)}
                      style={{ fontSize:10, padding:'2px 8px', background:'transparent', border:'.5px solid var(--rule)', cursor:'pointer', fontFamily:'inherit', color:'var(--inkm)' }}>
                      Gérer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {onglet === 'membres' && (
        <div style={{ background:'var(--white)', border:'.5px solid var(--rule)', overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ borderBottom:'.5px solid var(--rule)' }}>
                {['NOM','EMAIL','RÔLE','ENTREPRISE','STATUT','DERNIÈRE CONNEXION',''].map(h => (
                  <th key={h} style={{ padding:'.5rem .75rem', textAlign:'left', fontSize:10, letterSpacing:'.06em', color:'var(--inkm)', fontWeight:600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredMembres.map(m => {
                const s = STATUT_C[m.statut]
                return (
                  <tr key={m.id} style={{ borderBottom:'.5px solid var(--rule)' }}>
                    <td style={{ padding:'.5rem .75rem', fontWeight:600, color:'var(--bd)' }}>{m.nom}</td>
                    <td style={{ padding:'.5rem .75rem', fontFamily:'monospace', fontSize:11, color:'var(--ba)' }}>{m.email}</td>
                    <td style={{ padding:'.5rem .75rem', color:'var(--inkm)' }}>{m.role}</td>
                    <td style={{ padding:'.5rem .75rem', color:'var(--inks)' }}>{m.entreprise}</td>
                    <td style={{ padding:'.5rem .75rem' }}>
                      <span style={{ fontSize:10, padding:'2px 8px', background:s.bg, color:s.color, fontWeight:600 }}>{s.label}</span>
                    </td>
                    <td style={{ padding:'.5rem .75rem', color:'var(--inkm)' }}>{m.derniere_connexion}</td>
                    <td style={{ padding:'.5rem .75rem' }}>
                      <button onClick={() => showToast(`Action sur ${m.nom}`)}
                        style={{ fontSize:10, padding:'2px 8px', background:'transparent', border:'.5px solid var(--rule)', cursor:'pointer', fontFamily:'inherit', color:'var(--inkm)' }}>
                        ···
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

    </BackofficeLayout>
  )
}
