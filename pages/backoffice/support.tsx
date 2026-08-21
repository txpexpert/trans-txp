import { useEffect, useState } from 'react'
import type { GetServerSideProps } from 'next'
import { requireAdminSSR } from '../../lib/adminAuth'
import { useRouter } from 'next/router'
import BackofficeLayout from '../../components/BackofficeLayout'

interface Ticket {
  id: number
  ref: string
  client: string
  email: string
  sujet: string
  categorie: string
  priorite: 'haute' | 'normale' | 'basse'
  statut: 'ouvert' | 'en_cours' | 'resolu' | 'ferme'
  date: string
  messages: number
}

const TICKETS: Ticket[] = [
  { id:1, ref:'TKT-0042', client:'Fatima Zahra Idrissi', email:'fz.idrissi@cabinet-fzi.ma', sujet:'Impossible d\'exporter en PDF — module Documents',        categorie:'Bug',        priorite:'haute',   statut:'en_cours', date:'09/04/2026', messages:3 },
  { id:2, ref:'TKT-0041', client:'Karim Benali',          email:'k.benali@transitaire.ma',   sujet:'Code SH 8471.30 — résultat incohérent avec tarif ADII',   categorie:'Données',    priorite:'haute',   statut:'ouvert',   date:'08/04/2026', messages:1 },
  { id:3, ref:'TKT-0040', client:'Mohammed Tazi',         email:'m.tazi@importexport.ma',    sujet:'Demande d\'ajout de 2 membres à l\'équipe',                categorie:'Facturation',priorite:'normale', statut:'resolu',   date:'07/04/2026', messages:5 },
  { id:4, ref:'TKT-0039', client:'LOGIMA TRANSPORT',      email:'s.chaoui@logima.ma',        sujet:'Module Tracking — numéro de conteneur non reconnu',        categorie:'Fonctionnalité',priorite:'normale',statut:'en_cours', date:'06/04/2026', messages:4 },
  { id:5, ref:'TKT-0038', client:'Youssef Alami',         email:'y.alami@freelance.ma',      sujet:'Contestation de suspension de compte',                    categorie:'Compte',     priorite:'haute',   statut:'ouvert',   date:'05/04/2026', messages:2 },
  { id:6, ref:'TKT-0037', client:'SOTRALY Casablanca',    email:'contact@sotraly.ma',        sujet:'Question sur le renouvellement automatique',               categorie:'Facturation',priorite:'basse',   statut:'ferme',    date:'01/04/2026', messages:6 },
  { id:7, ref:'TKT-0036', client:'MEDLOGIX Transit',      email:'ops@medlogix.ma',           sujet:'Accès module ALECA non disponible — plan Professionnel',   categorie:'Accès',      priorite:'normale', statut:'resolu',   date:'28/03/2026', messages:3 },
]

const PRIORITE_C: Record<string,{ bg:string; color:string; label:string }> = {
  haute:   { bg:'#FEE8E8', color:'#C0392B', label:'Haute' },
  normale: { bg:'#FEF5E4', color:'#8A5A10', label:'Normale' },
  basse:   { bg:'#F5F5F5', color:'#888',    label:'Basse' },
}
const STATUT_C: Record<string,{ bg:string; color:string; label:string }> = {
  ouvert:   { bg:'#FEE8E8', color:'#C0392B', label:'Ouvert' },
  en_cours: { bg:'#EEF4FE', color:'#1A3A9A', label:'En cours' },
  resolu:   { bg:'#E6F7EE', color:'#1A7A40', label:'Résolu' },
  ferme:    { bg:'#F5F5F5', color:'#888',    label:'Fermé' },
}

export const getServerSideProps: GetServerSideProps = requireAdminSSR

export default function BackofficeSupport() {
  const router = useRouter()
  const [tickets, setTickets] = useState(TICKETS)
  const [q, setQ] = useState('')
  const [filtre, setFiltre] = useState<string>('all')
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [reponse, setReponse] = useState('')
  const [toast, setToast] = useState('')


  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  const filtered = tickets.filter(t => {
    const matchQ = [t.ref, t.client, t.sujet, t.categorie].join(' ').toLowerCase().includes(q.toLowerCase())
    const matchF = filtre === 'all' || t.statut === filtre
    return matchQ && matchF
  })

  const handleRepondre = () => {
    if (!reponse.trim()) return
    setTickets(prev => prev.map(t => t.id === selected?.id
      ? { ...t, statut: 'en_cours' as const, messages: t.messages + 1 }
      : t
    ))
    setReponse(''); showToast('Réponse envoyée')
  }

  const handleResoudre = (id: number) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, statut: 'resolu' as const } : t))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, statut: 'resolu' } : null)
    showToast('Ticket marqué comme résolu')
  }

  const ouverts = tickets.filter(t => t.statut === 'ouvert').length
  const enCours = tickets.filter(t => t.statut === 'en_cours').length

  return (
    <BackofficeLayout title="Support & Tickets">

      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, background:'#059669', color:'white', padding:'10px 20px', fontSize:12, zIndex:999 }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom:'1.5rem' }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, color:'var(--bd)', marginBottom:4 }}>Support & Tickets</h1>
        <p style={{ fontSize:13, color:'var(--inkm)' }}>
          {tickets.length} tickets ·
          <span style={{ color:'#DC2626' }}> {ouverts} ouverts</span> ·
          <span style={{ color:'#1A3A9A' }}> {enCours} en cours</span>
        </p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'.75rem', marginBottom:'1.5rem' }}>
        {[
          { label:'Ouverts',  value:ouverts, color:'#DC2626' },
          { label:'En cours', value:enCours, color:'#2563EB' },
          { label:'Résolus',  value:tickets.filter(t=>t.statut==='resolu').length, color:'#059669' },
          { label:'Fermés',   value:tickets.filter(t=>t.statut==='ferme').length, color:'#888' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--white)', border:'.5px solid var(--rule)', borderTop:`3px solid ${s.color}`, padding:'1rem', cursor:'pointer' }} onClick={() => setFiltre(s.label.toLowerCase().replace(' ','_') === 'ouverts' ? 'ouvert' : s.label.toLowerCase().replace(' ','_'))}>
            <div style={{ fontSize:10, letterSpacing:'.06em', color:'var(--inkm)', marginBottom:4 }}>{s.label.toUpperCase()}</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, color:'var(--bd)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap:'1.5rem' }}>

        {/* Liste tickets */}
        <div>
          <div style={{ display:'flex', gap:'1rem', marginBottom:'1rem', flexWrap:'wrap' }}>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher…"
              style={{ flex:1, minWidth:150, padding:'8px 12px', border:'.5px solid var(--rule)', background:'var(--white)', fontSize:12, outline:'none', fontFamily:'inherit' }}
            />
            <select value={filtre} onChange={e => setFiltre(e.target.value)}
              style={{ padding:'8px 12px', border:'.5px solid var(--rule)', background:'var(--white)', fontSize:12, outline:'none', fontFamily:'inherit', cursor:'pointer' }}>
              <option value="all">Tous</option>
              <option value="ouvert">Ouverts</option>
              <option value="en_cours">En cours</option>
              <option value="resolu">Résolus</option>
              <option value="ferme">Fermés</option>
            </select>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'.5rem' }}>
            {filtered.map(t => {
              const p = PRIORITE_C[t.priorite]
              const s = STATUT_C[t.statut]
              return (
                <div key={t.id} onClick={() => setSelected(selected?.id === t.id ? null : t)}
                  style={{ background:'var(--white)', border:`.5px solid ${selected?.id === t.id ? '#0C2D5C' : 'var(--rule)'}`, padding:'1rem', cursor:'pointer', borderLeft:`3px solid ${p.color}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontFamily:'monospace', fontSize:11, color:'var(--ba)', fontWeight:600 }}>{t.ref}</span>
                    <div style={{ display:'flex', gap:4 }}>
                      <span style={{ fontSize:9, padding:'2px 6px', background:p.bg, color:p.color, fontWeight:600 }}>{p.label}</span>
                      <span style={{ fontSize:9, padding:'2px 6px', background:s.bg, color:s.color, fontWeight:600 }}>{s.label}</span>
                    </div>
                  </div>
                  <div style={{ fontSize:12, fontWeight:500, color:'var(--bd)', marginBottom:2 }}>{t.sujet}</div>
                  <div style={{ fontSize:11, color:'var(--inkm)' }}>{t.client} · {t.date} · {t.messages} msg</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Détail ticket */}
        {selected && (
          <div style={{ background:'var(--white)', border:'.5px solid var(--rule)', padding:'1.5rem', position:'sticky', top:20 }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:600, color:'var(--bd)', marginBottom:'.75rem' }}>
              {selected.ref} — {selected.sujet}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.5rem', fontSize:12, marginBottom:'1rem' }}>
              {[['Client', selected.client], ['Email', selected.email], ['Catégorie', selected.categorie], ['Date', selected.date]].map(([k,v]) => (
                <div key={k}>
                  <div style={{ fontSize:10, color:'var(--inkm)', letterSpacing:'.05em', marginBottom:1 }}>{k}</div>
                  <div style={{ color:'var(--bd)', fontWeight:500 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ padding:'.75rem', background:'#F9F8F4', border:'.5px solid var(--rule)', fontSize:12, color:'var(--inkm)', marginBottom:'1rem', lineHeight:1.6 }}>
              <em>Historique de {selected.messages} message(s) — interface complète bientôt disponible</em>
            </div>
            <textarea value={reponse} onChange={e => setReponse(e.target.value)} placeholder="Rédiger une réponse…" rows={4}
              style={{ width:'100%', padding:'8px 12px', border:'.5px solid var(--rule)', fontSize:12, outline:'none', fontFamily:'inherit', resize:'vertical', marginBottom:'1rem' }}
            />
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={handleRepondre}
                style={{ flex:1, padding:'8px 0', background:'#0C2D5C', color:'white', border:'none', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                Envoyer la réponse
              </button>
              {selected.statut !== 'resolu' && (
                <button onClick={() => handleResoudre(selected.id)}
                  style={{ padding:'8px 14px', background:'#E6F7EE', color:'#1A7A40', border:'.5px solid #B0DDB8', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                  ✓ Résoudre
                </button>
              )}
            </div>
          </div>
        )}
      </div>

    </BackofficeLayout>
  )
}
