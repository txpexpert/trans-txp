import { useEffect, useState } from 'react'
import type { GetServerSideProps } from 'next'
import { requireAdminSSR } from '../../lib/adminAuth'
import { useRouter } from 'next/router'
import BackofficeLayout from '../../components/BackofficeLayout'

interface Admin {
  id: number
  nom: string
  email: string
  role: 'super_admin' | 'admin' | 'moderateur'
  permissions: string[]
  statut: 'actif' | 'inactif'
  derniere_connexion: string
  cree: string
}

const ADMINS: Admin[] = [
  { id:1, nom:'Owner',          email:'admin@Transit-IA',           role:'super_admin', permissions:['all'],                               statut:'actif',   derniere_connexion:"Aujourd'hui 14:32", cree:'01/01/2025' },
  { id:2, nom:'Rachid Moufid',  email:'r.moufid@Transit-IA',        role:'admin',       permissions:['tarifs','circulaires','utilisateurs'],statut:'actif',   derniere_connexion:'08/04/2026',        cree:'15/03/2025' },
  { id:3, nom:'Nadia Ouaali',   email:'n.ouaali@Transit-IA',        role:'moderateur',  permissions:['support','alertes','contenus'],       statut:'actif',   derniere_connexion:'07/04/2026',        cree:'01/06/2025' },
  { id:4, nom:'Tarik Lamsini',  email:'t.lamsini@Transit-IA',       role:'admin',       permissions:['ingest','circulaires','logs'],        statut:'inactif', derniere_connexion:'01/03/2026',        cree:'10/09/2025' },
]

const ROLE_C: Record<string,{ bg:string; color:string; label:string }> = {
  super_admin: { bg:'#F3EEFE', color:'#5A2AA0', label:'Super Admin' },
  admin:       { bg:'#EEF4FE', color:'#1A3A9A', label:'Admin' },
  moderateur:  { bg:'#FEF5E4', color:'#8A5A10', label:'Modérateur' },
}
const ALL_PERMS = ['tarifs','circulaires','utilisateurs','abonnements','contenus','ingest','logs','alertes','support','admins','parametres']

export const getServerSideProps: GetServerSideProps = requireAdminSSR

export default function BackofficeAdmins() {
  const router = useRouter()
  const [admins, setAdmins] = useState(ADMINS)
  const [showForm, setShowForm] = useState(false)
  const [newNom, setNewNom] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<Admin['role']>('moderateur')
  const [toast, setToast] = useState('')


  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  const handleAdd = () => {
    if (!newNom || !newEmail) { showToast('Nom et email requis'); return }
    const today = new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' })
    setAdmins(prev => [...prev, {
      id: prev.length + 1, nom: newNom, email: newEmail, role: newRole,
      permissions: newRole === 'super_admin' ? ['all'] : ['contenus','support'],
      statut: 'actif', derniere_connexion: 'Jamais', cree: today
    }])
    setShowForm(false); setNewNom(''); setNewEmail('')
    showToast('Administrateur ajouté')
  }

  const toggleStatut = (id: number) => {
    setAdmins(prev => prev.map(a => a.id === id ? { ...a, statut: a.statut === 'actif' ? 'inactif' : 'actif' } : a))
    showToast('Statut mis à jour')
  }

  return (
    <BackofficeLayout title="Administrateurs">

      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, background:'#7C3AED', color:'white', padding:'10px 20px', fontSize:12, zIndex:999 }}>
          {toast}
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem' }}>
        <div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, color:'var(--bd)', marginBottom:4 }}>Administrateurs</h1>
          <p style={{ fontSize:13, color:'var(--inkm)' }}>{admins.length} administrateurs · {admins.filter(a=>a.statut==='actif').length} actifs</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding:'8px 18px', background:'#0C2D5C', color:'white', border:'none', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
          + Ajouter un admin
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div style={{ background:'var(--white)', border:'.5px solid #7C3AED55', borderLeft:'3px solid #7C3AED', padding:'1.5rem', marginBottom:'1.5rem' }}>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--bd)', marginBottom:'1rem' }}>Nouvel administrateur</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
            <input value={newNom} onChange={e => setNewNom(e.target.value)} placeholder="Nom complet"
              style={{ padding:'8px 12px', border:'.5px solid var(--rule)', background:'#F9F8F4', fontSize:12, outline:'none', fontFamily:'inherit' }}
            />
            <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email @Transit-IA"
              style={{ padding:'8px 12px', border:'.5px solid var(--rule)', background:'#F9F8F4', fontSize:12, outline:'none', fontFamily:'inherit' }}
            />
            <select value={newRole} onChange={e => setNewRole(e.target.value as Admin['role'])}
              style={{ padding:'8px 12px', border:'.5px solid var(--rule)', background:'#F9F8F4', fontSize:12, outline:'none', fontFamily:'inherit', cursor:'pointer' }}>
              <option value="moderateur">Modérateur</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={handleAdd}
              style={{ padding:'8px 18px', background:'#7C3AED', color:'white', border:'none', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
              Ajouter
            </button>
            <button onClick={() => setShowForm(false)}
              style={{ padding:'8px 14px', background:'transparent', border:'.5px solid var(--rule)', fontSize:12, cursor:'pointer', fontFamily:'inherit', color:'var(--inkm)' }}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Cards admins */}
      <div style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
        {admins.map(a => {
          const r = ROLE_C[a.role]
          const isSelf = a.id === 1
          return (
            <div key={a.id} style={{ background:'var(--white)', border:'.5px solid var(--rule)', padding:'1.25rem', display:'flex', alignItems:'center', gap:'1.5rem' }}>
              {/* Avatar */}
              <div style={{ width:44, height:44, borderRadius:'50%', background: a.statut === 'actif' ? '#0C2D5C' : '#DDD', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:14, fontWeight:700, flexShrink:0 }}>
                {a.nom.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
              </div>
              {/* Info */}
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:14, fontWeight:600, color:'var(--bd)' }}>{a.nom}</span>
                  <span style={{ fontSize:10, padding:'2px 8px', background:r.bg, color:r.color, fontWeight:600 }}>{r.label}</span>
                  {a.statut === 'inactif' && <span style={{ fontSize:10, padding:'2px 6px', background:'#F5F5F5', color:'#888' }}>Inactif</span>}
                  {isSelf && <span style={{ fontSize:10, padding:'2px 6px', background:'#E6F7EE', color:'#1A7A40' }}>Vous</span>}
                </div>
                <div style={{ fontSize:12, color:'var(--inkm)', marginBottom:4 }}>{a.email}</div>
                <div style={{ display:'flex', gap:'1rem', fontSize:11, color:'var(--inkm)' }}>
                  <span>Créé le {a.cree}</span>
                  <span>Dernière connexion : {a.derniere_connexion}</span>
                </div>
                {/* Permissions */}
                <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:8 }}>
                  {(a.permissions[0] === 'all' ? ALL_PERMS : a.permissions).map(p => (
                    <span key={p} style={{ fontSize:10, padding:'1px 6px', background:'#F0F4FF', color:'#1A3A9A', border:'.5px solid #B0C8F8' }}>{p}</span>
                  ))}
                </div>
              </div>
              {/* Actions */}
              {!isSelf && (
                <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                  <button onClick={() => showToast('Édition des permissions — bientôt disponible')}
                    style={{ fontSize:10, padding:'4px 10px', background:'transparent', border:'.5px solid var(--rule)', cursor:'pointer', fontFamily:'inherit', color:'var(--ba)' }}>
                    Éditer
                  </button>
                  <button onClick={() => toggleStatut(a.id)}
                    style={{ fontSize:10, padding:'4px 10px', background:'transparent', border:'.5px solid var(--rule)', cursor:'pointer', fontFamily:'inherit', color: a.statut==='actif' ? '#C0392B' : '#1A7A40' }}>
                    {a.statut === 'actif' ? 'Désactiver' : 'Activer'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

    </BackofficeLayout>
  )
}

