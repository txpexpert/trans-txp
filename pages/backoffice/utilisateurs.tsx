import { useState } from 'react'
import type { GetServerSideProps } from 'next'
import { requireAdminSSR } from '../../lib/adminAuth'
import BackofficeLayout from '../../components/BackofficeLayout'

const USERS = [
  { id:1, nom:'Karim Benali', email:'k.benali@transitaire.ma', societe:'ATLAS TRANSIT SARL', plan:'Professionnel', statut:'Actif', inscrit:'15/01/2025', tel:'+212 6 12 34 56 78', ville:'Casablanca', requetes:23, joursRestants:24 },
  { id:2, nom:'Fatima Zahra Idrissi', email:'fz.idrissi@cabinet-fzi.ma', societe:'Cabinet FZI Douane', plan:'Premium', statut:'Actif', inscrit:'02/02/2025', tel:'+212 6 98 76 54 32', ville:'Casablanca', requetes:0, joursRestants:41 },
  { id:3, nom:'Mohammed Tazi', email:'m.tazi@importexport.ma', societe:'TAZI IMPORT EXPORT', plan:'Consultation', statut:'Actif', inscrit:'10/02/2025', tel:'+212 5 22 12 34 56', ville:'Rabat', requetes:44, joursRestants:19 },
  { id:4, nom:'Sara Chaoui', email:'s.chaoui@logima.ma', societe:'LOGIMA TRANSPORT', plan:'Professionnel', statut:'Essai', inscrit:'19/03/2025', tel:'+212 6 55 44 33 22', ville:'Tanger', requetes:5, joursRestants:14 },
  { id:5, nom:'Youssef Alami', email:'y.alami@freelance.ma', societe:'Indépendant', plan:'Consultation', statut:'Suspendu', inscrit:'05/12/2024', tel:'+212 6 11 22 33 44', ville:'Marrakech', requetes:0, joursRestants:0 },
]

const PLAN_C: Record<string,string> = { 'Premium':'br','Professionnel':'bb','Consultation':'ba' }
const STAT_C: Record<string,string> = { 'Actif':'bg','Essai':'ba','Suspendu':'br' }

export const getServerSideProps: GetServerSideProps = requireAdminSSR

export default function BackofficeUtilisateurs() {
  const [users, setUsers] = useState(USERS)
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<typeof USERS[0]|null>(null)
  const [toast, setToast] = useState('')

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }
  const filtered = users.filter(u => [u.nom, u.email, u.societe, u.plan].join(' ').toLowerCase().includes(q.toLowerCase()))

  return (
    <BackofficeLayout title="Comptes utilisateurs">
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1.5rem' }}>
        <div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, color:'var(--bd)', marginBottom:4 }}>Comptes utilisateurs</h1>
          <p style={{ fontSize:13, color:'var(--inkm)' }}>{users.length} comptes · {users.filter(u=>u.statut==='Actif').length} actifs</p>
        </div>
        <button className="btn btn-primary">+ Créer un compte</button>
      </div>

      <input className="search-input" style={{ marginBottom:'1rem' }} placeholder="Rechercher…" value={q} onChange={e => setQ(e.target.value)} />

      <div style={{ display:'flex', gap:'1rem' }}>
        {/* Table */}
        <div style={{ flex:1 }}>
          <table className="data-table">
            <thead><tr><th>Utilisateur</th><th>Société</th><th>Plan</th><th>Statut</th><th>Requêtes</th><th>Jours restants</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} style={{ cursor:'pointer', background: selected?.id===u.id ? 'var(--bl)' : '' }} onClick={() => setSelected(u)}>
                  <td>
                    <div style={{ fontWeight:500, fontSize:13 }}>{u.nom}</div>
                    <div style={{ fontSize:11, color:'var(--inkm)' }}>{u.email}</div>
                  </td>
                  <td style={{ fontSize:12 }}>{u.societe}</td>
                  <td><span className={`badge ${PLAN_C[u.plan]||'bb'}`}>{u.plan}</span></td>
                  <td><span className={`badge ${STAT_C[u.statut]||'ba'}`}>{u.statut}</span></td>
                  <td style={{ fontSize:12, textAlign:'center' }}>{u.requetes}</td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ flex:1, height:4, background:'var(--bl)', borderRadius:2, overflow:'hidden' }}>
                        <div style={{ width:`${Math.min(100, u.joursRestants/30*100)}%`, height:'100%', background: u.joursRestants<7 ? 'var(--red)' : 'var(--ba)' }}/>
                      </div>
                      <span style={{ fontSize:10, color:'var(--inkm)', minWidth:20 }}>{u.joursRestants}j</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:3 }}>
                      {u.statut !== 'Suspendu'
                        ? <button className="btn btn-outline btn-sm" onClick={e => { e.stopPropagation(); setUsers(us => us.map(r => r.id===u.id ? {...r, statut:'Suspendu'} : r)); showToast(`${u.nom} suspendu`) }}>Suspendre</button>
                        : <button style={{ padding:'3px 8px', fontSize:11, background:'transparent', border:'.5px solid var(--green)', color:'var(--green)', cursor:'pointer' }}
                            onClick={e => { e.stopPropagation(); setUsers(us => us.map(r => r.id===u.id ? {...r, statut:'Actif'} : r)); showToast(`${u.nom} réactivé`) }}>Réactiver</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Fiche détail */}
        {selected && (
          <div style={{ width:280, flexShrink:0, background:'var(--white)', border:'.5px solid var(--rule)', padding:'1.5rem', height:'fit-content' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1rem' }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, color:'var(--bd)' }}>Fiche utilisateur</div>
              <button style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:'var(--inkm)' }} onClick={() => setSelected(null)}>✕</button>
            </div>
            <div style={{ width:52, height:52, borderRadius:'50%', background:'var(--bd)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Playfair Display',serif", fontSize:18, color:'white', fontWeight:700, margin:'0 auto 1rem' }}>
              {selected.nom.split(' ').map(n=>n[0]).join('').slice(0,2)}
            </div>
            <div style={{ textAlign:'center', marginBottom:'1.25rem' }}>
              <div style={{ fontWeight:500, fontSize:14, color:'var(--bd)' }}>{selected.nom}</div>
              <div style={{ fontSize:11, color:'var(--inkm)', marginTop:2 }}>{selected.societe}</div>
              <div style={{ fontSize:11, color:'var(--inkm)' }}>{selected.ville}</div>
            </div>
            {[
              ['Email', selected.email],
              ['Téléphone', selected.tel],
              ['Inscrit le', selected.inscrit],
              ['Plan', selected.plan],
              ['Statut', selected.statut],
              ['Requêtes ce mois', `${selected.requetes}`],
              ['Jours restants', `${selected.joursRestants} jours`],
            ].map(([k,v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'.5px solid var(--rule)', fontSize:12 }}>
                <span style={{ color:'var(--inkm)' }}>{k}</span>
                <span style={{ color:'var(--bd)', fontWeight:500, textAlign:'right', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis' }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop:'1.25rem', display:'flex', flexDirection:'column', gap:'.5rem' }}>
              <button className="btn btn-outline" style={{ width:'100%', fontSize:11 }}>Envoyer un email</button>
              <button className="btn btn-outline" style={{ width:'100%', fontSize:11 }}>Modifier le plan</button>
              <button className="btn btn-outline" style={{ width:'100%', fontSize:11 }}>Réinitialiser mot de passe</button>
            </div>
          </div>
        )}
      </div>

      {toast && <div style={{ position:'fixed', bottom:'1.5rem', right:'1.5rem', background:'var(--bd)', color:'white', padding:'.7rem 1.2rem', fontSize:13, zIndex:999 }}>{toast}</div>}
    </BackofficeLayout>
  )
}
