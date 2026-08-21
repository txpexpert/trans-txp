import { useEffect, useState } from 'react'
import type { GetServerSideProps } from 'next'
import { requireAdminSSR } from '../../lib/adminAuth'
import { useRouter } from 'next/router'
import BackofficeLayout from '../../components/BackofficeLayout'

interface TarifEntry {
  id: number
  code: string
  designation: string
  unite: string
  taux_import: number
  tva: number
  ic?: number
  statut: 'actif' | 'modifie' | 'inactif'
  source: string
}

const SAMPLE_TARIFS: TarifEntry[] = [
  { id:1, code:'8703.21.00.10', designation:'Véhicules automobiles − cylindrée ≤ 1 000 cm³',     unite:'U', taux_import:40, tva:20, ic:5,  statut:'actif',    source:'ADII 2025' },
  { id:2, code:'8703.22.00.10', designation:'Véhicules automobiles − 1 000 < cyl. ≤ 1 500 cm³', unite:'U', taux_import:40, tva:20, ic:10, statut:'actif',    source:'ADII 2025' },
  { id:3, code:'2709.00.10.00', designation:'Huiles brutes de pétrole ou de minéraux bitumineux',unite:'T', taux_import:2.5,tva:10,        statut:'modifie',  source:'BO n°7241' },
  { id:4, code:'1001.19.00.00', designation:'Blé dur − autres',                                   unite:'T', taux_import:0,  tva:0,         statut:'actif',    source:'ADII 2025' },
  { id:5, code:'0207.12.00.00', designation:'Poulets non découpés congelés',                      unite:'KG',taux_import:25, tva:20, ic:0,  statut:'actif',    source:'ADII 2025' },
  { id:6, code:'3004.90.90.90', designation:'Médicaments pour la médecine humaine, NDA',          unite:'KG',taux_import:2.5,tva:0,         statut:'actif',    source:'ADII 2025' },
  { id:7, code:'8471.30.00.00', designation:'Machines automatiques traitement info − portables',  unite:'U', taux_import:2.5,tva:20,        statut:'modifie',  source:'BO n°7198' },
  { id:8, code:'6109.10.00.00', designation:'T-shirts et maillots de corps en coton',             unite:'KG',taux_import:25, tva:20, ic:5,  statut:'actif',    source:'ADII 2025' },
]

const STATUT_C: Record<string, { bg:string; color:string; label:string }> = {
  actif:    { bg:'#E6F7EE', color:'#1A7A40', label:'Actif' },
  modifie:  { bg:'#FEF5E4', color:'#8A5A10', label:'Modifié' },
  inactif:  { bg:'#F5F5F5', color:'#888',    label:'Inactif' },
}

export const getServerSideProps: GetServerSideProps = requireAdminSSR

export default function BackofficeTarifs() {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<TarifEntry | null>(null)
  const [toast, setToast] = useState('')


  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }
  const filtered = SAMPLE_TARIFS.filter(t => [t.code, t.designation].join(' ').toLowerCase().includes(q.toLowerCase()))

  return (
    <BackofficeLayout title="Codes SH & Tarifs">

      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, background:'#059669', color:'white', padding:'10px 20px', fontSize:12, zIndex:999 }}>
          {toast}
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem' }}>
        <div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, color:'var(--bd)', marginBottom:4 }}>Codes SH & Tarifs</h1>
          <p style={{ fontSize:13, color:'var(--inkm)' }}>17 881 codes · Tarif ADII 2025 · Dernière sync 20/03/2026</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => showToast('Import CSV en cours…')} style={{ padding:'8px 16px', background:'transparent', border:'.5px solid var(--rule)', color:'var(--inks)', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
            ↑ Importer CSV
          </button>
          <button onClick={() => showToast('Synchronisation ADII lancée…')} style={{ padding:'8px 16px', background:'#0C2D5C', color:'white', border:'none', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
            ↻ Sync ADII
          </button>
        </div>
      </div>

      {/* Compteurs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'.75rem', marginBottom:'1.5rem' }}>
        {[
          { label:'Total codes SH', value:'17 881', color:'#2563EB' },
          { label:'Modifiés récemment', value:'124', color:'#D97706' },
          { label:'Inactifs', value:'38', color:'#6B7280' },
          { label:'Dernière mise à jour', value:'20/03', color:'#059669' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--white)', border:'.5px solid var(--rule)', borderTop:`3px solid ${s.color}`, padding:'1rem' }}>
            <div style={{ fontSize:10, letterSpacing:'.06em', color:'var(--inkm)', marginBottom:4 }}>{s.label}</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:700, color:'var(--bd)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Recherche */}
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Rechercher par code SH ou désignation…"
        style={{ width:'100%', padding:'10px 14px', border:'.5px solid var(--rule)', background:'var(--white)', fontSize:12, color:'var(--bd)', outline:'none', fontFamily:'inherit', marginBottom:'1rem' }}
      />

      {/* Table */}
      <div style={{ background:'var(--white)', border:'.5px solid var(--rule)', overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ borderBottom:'.5px solid var(--rule)' }}>
              {['CODE SH','DÉSIGNATION','UNITÉ','DROIT IMPORT','TVA','IC','STATUT','SOURCE',''].map(h => (
                <th key={h} style={{ padding:'.5rem .75rem', textAlign:'left', fontSize:10, letterSpacing:'.06em', color:'var(--inkm)', fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} style={{ borderBottom:'.5px solid var(--rule)', cursor:'pointer', background: selected?.id === t.id ? '#F0F4FF' : 'transparent' }}
                  onClick={() => setSelected(selected?.id === t.id ? null : t)}>
                <td style={{ padding:'.5rem .75rem', fontFamily:'monospace', fontSize:11, color:'var(--ba)', fontWeight:600 }}>{t.code}</td>
                <td style={{ padding:'.5rem .75rem', color:'var(--inks)', maxWidth:280, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.designation}</td>
                <td style={{ padding:'.5rem .75rem', color:'var(--inkm)' }}>{t.unite}</td>
                <td style={{ padding:'.5rem .75rem', fontWeight:600, color:'var(--bd)' }}>{t.taux_import}%</td>
                <td style={{ padding:'.5rem .75rem', color:'var(--inkm)' }}>{t.tva}%</td>
                <td style={{ padding:'.5rem .75rem', color:'var(--inkm)' }}>{t.ic !== undefined ? `${t.ic}%` : '–'}</td>
                <td style={{ padding:'.5rem .75rem' }}>
                  <span style={{ fontSize:10, padding:'2px 8px', background:STATUT_C[t.statut].bg, color:STATUT_C[t.statut].color, fontWeight:600 }}>
                    {STATUT_C[t.statut].label}
                  </span>
                </td>
                <td style={{ padding:'.5rem .75rem', fontSize:11, color:'var(--inkm)' }}>{t.source}</td>
                <td style={{ padding:'.5rem .75rem' }}>
                  <button onClick={e => { e.stopPropagation(); showToast(`Code ${t.code} copié`) }}
                    style={{ fontSize:10, padding:'2px 8px', background:'transparent', border:'.5px solid var(--rule)', cursor:'pointer', color:'var(--inkm)', fontFamily:'inherit' }}>
                    Copier
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Détail */}
      {selected && (
        <div style={{ marginTop:'1rem', background:'var(--white)', border:'.5px solid var(--rule)', padding:'1.5rem' }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:500, color:'var(--bd)', marginBottom:'.75rem' }}>
            Détail — {selected.code}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', fontSize:12 }}>
            {[
              ['Code SH complet', selected.code],
              ['Désignation', selected.designation],
              ['Unité statistique', selected.unite],
              ['Droit d\'importation', `${selected.taux_import}%`],
              ['TVA', `${selected.tva}%`],
              ['IC', selected.ic !== undefined ? `${selected.ic}%` : 'Non applicable'],
              ['Statut', STATUT_C[selected.statut].label],
              ['Source', selected.source],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize:10, letterSpacing:'.06em', color:'var(--inkm)', marginBottom:2 }}>{k}</div>
                <div style={{ color:'var(--bd)', fontWeight:500 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

    </BackofficeLayout>
  )
}
