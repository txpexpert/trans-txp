import { useEffect, useState } from 'react'
import type { GetServerSideProps } from 'next'
import { requireAdminSSR } from '../../lib/adminAuth'
import { useRouter } from 'next/router'
import BackofficeLayout from '../../components/BackofficeLayout'

interface Alerte {
  id: number
  titre: string
  message: string
  type: 'critique' | 'info' | 'maintenance' | 'promo'
  cible: string
  statut: 'active' | 'planifiee' | 'terminee'
  debut: string
  fin: string
  vues: number
}

const ALERTES: Alerte[] = [
  { id:1, titre:'Maintenance programmée — Base de données', message:'Interruption de service prévue le 12/04/2026 de 02h00 à 04h00. Les fonctionnalités de recherche seront indisponibles.', type:'maintenance', cible:'Tous les utilisateurs', statut:'active',    debut:'09/04/2026', fin:'12/04/2026', vues:48 },
  { id:2, titre:'Nouvelles circulaires ADII disponibles',   message:'3 nouvelles circulaires ADII ont été indexées dans le système RAG. Les réponses IA reflètent désormais les mises à jour de mars 2026.', type:'info', cible:'Tous les utilisateurs', statut:'active', debut:'09/04/2026', fin:'16/04/2026', vues:112 },
  { id:3, titre:'Offre spéciale Premium — avril 2026',      message:'Bénéficiez de 2 mois offerts sur votre abonnement Premium en invitant 3 nouveaux membres avant le 30/04/2026.', type:'promo', cible:'Plan Professionnel', statut:'active', debut:'01/04/2026', fin:'30/04/2026', vues:23 },
  { id:4, titre:'Mise à jour tarifs douaniers Q2 2026',     message:'Le tarif ADII du deuxième trimestre 2026 sera intégré le 15/04/2026. Consultez les nouveaux codes SH avant application.', type:'info', cible:'Tous les utilisateurs', statut:'planifiee', debut:'13/04/2026', fin:'20/04/2026', vues:0 },
  { id:5, titre:'Fin de la version bêta — Tracking avancé', message:'Le module Tracking avancé passe en version stable. Accès inclus dans tous les plans à partir du 10/03/2026.', type:'info', cible:'Tous les utilisateurs', statut:'terminee', debut:'08/03/2026', fin:'10/03/2026', vues:205 },
]

const TYPE_C: Record<string,{ bg:string; color:string; icon:string }> = {
  critique:    { bg:'#FEE8E8', color:'#C0392B', icon:'⚠' },
  info:        { bg:'#EEF4FE', color:'#1A3A9A', icon:'ℹ' },
  maintenance: { bg:'#FEF5E4', color:'#8A5A10', icon:'⚙' },
  promo:       { bg:'#E6F7EE', color:'#1A7A40', icon:'★' },
}
const STATUT_C: Record<string,{ bg:string; color:string; label:string }> = {
  active:    { bg:'#E6F7EE', color:'#1A7A40', label:'Active' },
  planifiee: { bg:'#EEF4FE', color:'#1A3A9A', label:'Planifiée' },
  terminee:  { bg:'#F5F5F5', color:'#888',    label:'Terminée' },
}

export const getServerSideProps: GetServerSideProps = requireAdminSSR

export default function BackofficeAlertes() {
  const router = useRouter()
  const [alertes, setAlertes] = useState(ALERTES)
  const [showForm, setShowForm] = useState(false)
  const [toast, setToast] = useState('')
  const [newTitre, setNewTitre] = useState('')
  const [newMsg, setNewMsg] = useState('')
  const [newType, setNewType] = useState<Alerte['type']>('info')
  const [newCible, setNewCible] = useState('Tous les utilisateurs')


  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  const handleCreate = () => {
    if (!newTitre || !newMsg) { showToast('Titre et message requis'); return }
    const today = new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' })
    setAlertes(prev => [{ id: prev.length+1, titre:newTitre, message:newMsg, type:newType, cible:newCible, statut:'active', debut:today, fin:'–', vues:0 }, ...prev])
    setShowForm(false); setNewTitre(''); setNewMsg('')
    showToast('Alerte créée et publiée')
  }

  const toggleStatut = (id: number) => {
    setAlertes(prev => prev.map(a => a.id === id ? { ...a, statut: a.statut === 'active' ? 'terminee' : 'active' } : a))
    showToast('Statut mis à jour')
  }

  const actives = alertes.filter(a => a.statut === 'active').length

  return (
    <BackofficeLayout title="Alertes & Notifications">

      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, background:'#059669', color:'white', padding:'10px 20px', fontSize:12, zIndex:999 }}>
          {toast}
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem' }}>
        <div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, color:'var(--bd)', marginBottom:4 }}>Alertes & Notifications</h1>
          <p style={{ fontSize:13, color:'var(--inkm)' }}>{alertes.length} alertes · <span style={{ color: actives > 0 ? '#DC2626' : 'var(--inkm)' }}>{actives} actives</span></p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding:'8px 18px', background:'#0C2D5C', color:'white', border:'none', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
          + Nouvelle alerte
        </button>
      </div>

      {/* Formulaire création */}
      {showForm && (
        <div style={{ background:'var(--white)', border:'.5px solid #C9A84C55', borderLeft:'3px solid #C9A84C', padding:'1.5rem', marginBottom:'1.5rem' }}>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--bd)', marginBottom:'1rem' }}>Nouvelle alerte</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
            <input value={newTitre} onChange={e => setNewTitre(e.target.value)} placeholder="Titre de l'alerte"
              style={{ padding:'8px 12px', border:'.5px solid var(--rule)', background:'#F9F8F4', fontSize:12, outline:'none', fontFamily:'inherit' }}
            />
            <select value={newType} onChange={e => setNewType(e.target.value as Alerte['type'])}
              style={{ padding:'8px 12px', border:'.5px solid var(--rule)', background:'#F9F8F4', fontSize:12, outline:'none', fontFamily:'inherit', cursor:'pointer' }}>
              <option value="info">Information</option>
              <option value="maintenance">Maintenance</option>
              <option value="critique">Critique</option>
              <option value="promo">Promotion</option>
            </select>
          </div>
          <textarea value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Message de l'alerte…" rows={3}
            style={{ width:'100%', padding:'8px 12px', border:'.5px solid var(--rule)', background:'#F9F8F4', fontSize:12, outline:'none', fontFamily:'inherit', resize:'vertical', marginBottom:'1rem' }}
          />
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={handleCreate}
              style={{ padding:'8px 18px', background:'#C9A84C', color:'#0A0A0A', border:'none', fontSize:12, cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>
              Publier l'alerte
            </button>
            <button onClick={() => setShowForm(false)}
              style={{ padding:'8px 14px', background:'transparent', border:'.5px solid var(--rule)', fontSize:12, cursor:'pointer', fontFamily:'inherit', color:'var(--inkm)' }}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Liste des alertes */}
      <div style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
        {alertes.map(a => {
          const t = TYPE_C[a.type]
          const s = STATUT_C[a.statut]
          return (
            <div key={a.id} style={{ background:'var(--white)', border:`.5px solid var(--rule)`, borderLeft:`3px solid ${t.color}`, padding:'1.25rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:16, color:t.color }}>{t.icon}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:'var(--bd)' }}>{a.titre}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:9, padding:'2px 8px', background:s.bg, color:s.color, fontWeight:600 }}>{s.label}</span>
                  <button onClick={() => toggleStatut(a.id)}
                    style={{ fontSize:10, padding:'2px 10px', background:'transparent', border:'.5px solid var(--rule)', cursor:'pointer', fontFamily:'inherit', color:'var(--inkm)' }}>
                    {a.statut === 'active' ? 'Désactiver' : 'Activer'}
                  </button>
                </div>
              </div>
              <p style={{ fontSize:12, color:'var(--inkm)', lineHeight:1.6, marginBottom:8 }}>{a.message}</p>
              <div style={{ display:'flex', gap:'1.5rem', fontSize:11, color:'var(--inkm)' }}>
                <span>🎯 {a.cible}</span>
                <span>📅 {a.debut} → {a.fin}</span>
                <span>👁 {a.vues} vues</span>
              </div>
            </div>
          )
        })}
      </div>

    </BackofficeLayout>
  )
}
