import { useEffect, useState } from 'react'
import type { GetServerSideProps } from 'next'
import { requireAdminSSR } from '../../lib/adminAuth'
import { useRouter } from 'next/router'
import BackofficeLayout from '../../components/BackofficeLayout'

interface Contenu {
  id: number
  module: string
  titre: string
  type: 'page' | 'faq' | 'guide' | 'outil'
  statut: 'publie' | 'brouillon' | 'archive'
  modifie: string
  auteur: string
}

const CONTENUS: Contenu[] = [
  { id:1,  module:'Tarifs',              titre:'Guide de classement tarifaire ADII 2025',       type:'guide', statut:'publie',   modifie:'05/04/2026', auteur:'admin' },
  { id:2,  module:'Régimes économiques', titre:'Admission temporaire — conditions et procédure', type:'page',  statut:'publie',   modifie:'01/04/2026', auteur:'admin' },
  { id:3,  module:'FAQ',                 titre:'Comment calculer les droits de douane ?',        type:'faq',   statut:'publie',   modifie:'30/03/2026', auteur:'admin' },
  { id:4,  module:'FAQ',                 titre:'Qu\'est-ce qu\'un code SH ?',                    type:'faq',   statut:'publie',   modifie:'28/03/2026', auteur:'admin' },
  { id:5,  module:'ALECA / Origine',     titre:'Règles d\'origine préférentielle UE-Maroc',      type:'guide', statut:'brouillon',modifie:'25/03/2026', auteur:'admin' },
  { id:6,  module:'Simulateur',          titre:'Guide d\'utilisation du simulateur fiscal',      type:'guide', statut:'publie',   modifie:'20/03/2026', auteur:'admin' },
  { id:7,  module:'Tracking',            titre:'Comment suivre un conteneur — guide complet',    type:'guide', statut:'publie',   modifie:'15/03/2026', auteur:'admin' },
  { id:8,  module:'DUM Vérificateur',    titre:'FAQ — Erreurs courantes sur la DUM',             type:'faq',   statut:'brouillon',modifie:'10/03/2026', auteur:'admin' },
  { id:9,  module:'Incoterms',           titre:'Tableau comparatif des 11 Incoterms 2020',       type:'outil', statut:'publie',   modifie:'05/03/2026', auteur:'admin' },
  { id:10, module:'Logistique',          titre:'Tarification conteneurs — guide pratique',       type:'guide', statut:'archive',  modifie:'01/02/2026', auteur:'admin' },
]

const TYPE_C: Record<string,{ bg:string; color:string }> = {
  page:  { bg:'#EEF4FE', color:'#1A3A9A' },
  faq:   { bg:'#F3EEFE', color:'#5A2AA0' },
  guide: { bg:'#FEF5E4', color:'#8A5A10' },
  outil: { bg:'#E6F7EE', color:'#1A7A40' },
}
const STATUT_C: Record<string,{ bg:string; color:string; label:string }> = {
  publie:    { bg:'#E6F7EE', color:'#1A7A40', label:'Publié' },
  brouillon: { bg:'#FEF5E4', color:'#8A5A10', label:'Brouillon' },
  archive:   { bg:'#F5F5F5', color:'#888',    label:'Archivé' },
}

export const getServerSideProps: GetServerSideProps = requireAdminSSR

export default function BackofficeContenus() {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [filtreStatut, setFiltreStatut] = useState<string>('all')
  const [filtreType, setFiltreType] = useState<string>('all')
  const [toast, setToast] = useState('')


  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  const filtered = CONTENUS.filter(c => {
    const matchQ = [c.module, c.titre].join(' ').toLowerCase().includes(q.toLowerCase())
    const matchS = filtreStatut === 'all' || c.statut === filtreStatut
    const matchT = filtreType === 'all' || c.type === filtreType
    return matchQ && matchS && matchT
  })

  return (
    <BackofficeLayout title="Contenus modules">

      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, background:'#059669', color:'white', padding:'10px 20px', fontSize:12, zIndex:999 }}>
          {toast}
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem' }}>
        <div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, color:'var(--bd)', marginBottom:4 }}>Contenus modules</h1>
          <p style={{ fontSize:13, color:'var(--inkm)' }}>{CONTENUS.length} contenus · {CONTENUS.filter(c=>c.statut==='publie').length} publiés</p>
        </div>
        <button onClick={() => showToast('Éditeur de contenu — bientôt disponible')}
          style={{ padding:'8px 18px', background:'#0C2D5C', color:'white', border:'none', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
          + Nouveau contenu
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'.75rem', marginBottom:'1.5rem' }}>
        {[
          { label:'Pages',  value: CONTENUS.filter(c=>c.type==='page').length,  color:'#1A3A9A' },
          { label:'FAQs',   value: CONTENUS.filter(c=>c.type==='faq').length,   color:'#5A2AA0' },
          { label:'Guides', value: CONTENUS.filter(c=>c.type==='guide').length, color:'#D97706' },
          { label:'Outils', value: CONTENUS.filter(c=>c.type==='outil').length, color:'#059669' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--white)', border:'.5px solid var(--rule)', borderTop:`3px solid ${s.color}`, padding:'1rem' }}>
            <div style={{ fontSize:10, letterSpacing:'.06em', color:'var(--inkm)', marginBottom:4 }}>{s.label.toUpperCase()}</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, color:'var(--bd)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display:'flex', gap:'1rem', marginBottom:'1rem', flexWrap:'wrap' }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher par module ou titre…"
          style={{ flex:1, minWidth:200, padding:'8px 12px', border:'.5px solid var(--rule)', background:'var(--white)', fontSize:12, outline:'none', fontFamily:'inherit' }}
        />
        <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}
          style={{ padding:'8px 12px', border:'.5px solid var(--rule)', background:'var(--white)', fontSize:12, outline:'none', fontFamily:'inherit', cursor:'pointer' }}>
          <option value="all">Tous statuts</option>
          <option value="publie">Publié</option>
          <option value="brouillon">Brouillon</option>
          <option value="archive">Archivé</option>
        </select>
        <select value={filtreType} onChange={e => setFiltreType(e.target.value)}
          style={{ padding:'8px 12px', border:'.5px solid var(--rule)', background:'var(--white)', fontSize:12, outline:'none', fontFamily:'inherit', cursor:'pointer' }}>
          <option value="all">Tous types</option>
          <option value="page">Page</option>
          <option value="faq">FAQ</option>
          <option value="guide">Guide</option>
          <option value="outil">Outil</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background:'var(--white)', border:'.5px solid var(--rule)', overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ borderBottom:'.5px solid var(--rule)' }}>
              {['MODULE','TITRE','TYPE','STATUT','DERNIÈRE MODIF.','AUTEUR','ACTIONS'].map(h => (
                <th key={h} style={{ padding:'.5rem .75rem', textAlign:'left', fontSize:10, letterSpacing:'.06em', color:'var(--inkm)', fontWeight:600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} style={{ borderBottom:'.5px solid var(--rule)' }}>
                <td style={{ padding:'.5rem .75rem', fontSize:11, color:'var(--ba)', fontWeight:600 }}>{c.module}</td>
                <td style={{ padding:'.5rem .75rem', color:'var(--inks)', maxWidth:260, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.titre}</td>
                <td style={{ padding:'.5rem .75rem' }}>
                  <span style={{ fontSize:10, padding:'2px 8px', background:TYPE_C[c.type].bg, color:TYPE_C[c.type].color, fontWeight:600 }}>{c.type.toUpperCase()}</span>
                </td>
                <td style={{ padding:'.5rem .75rem' }}>
                  <span style={{ fontSize:10, padding:'2px 8px', background:STATUT_C[c.statut].bg, color:STATUT_C[c.statut].color, fontWeight:600 }}>{STATUT_C[c.statut].label}</span>
                </td>
                <td style={{ padding:'.5rem .75rem', color:'var(--inkm)', whiteSpace:'nowrap' }}>{c.modifie}</td>
                <td style={{ padding:'.5rem .75rem', color:'var(--inkm)' }}>{c.auteur}</td>
                <td style={{ padding:'.5rem .75rem', display:'flex', gap:4 }}>
                  <button onClick={() => showToast(`Édition de "${c.titre}" — bientôt disponible`)}
                    style={{ fontSize:10, padding:'2px 8px', background:'transparent', border:'.5px solid var(--rule)', cursor:'pointer', fontFamily:'inherit', color:'var(--ba)' }}>
                    Éditer
                  </button>
                  <button onClick={() => showToast(c.statut === 'publie' ? 'Contenu dépublié' : 'Contenu publié')}
                    style={{ fontSize:10, padding:'2px 8px', background:'transparent', border:'.5px solid var(--rule)', cursor:'pointer', fontFamily:'inherit', color:'var(--inkm)' }}>
                    {c.statut === 'publie' ? 'Dépublier' : 'Publier'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </BackofficeLayout>
  )
}
