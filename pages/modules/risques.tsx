// pages/modules/risques.tsx
// Contrôle des Risques — données chargées depuis Supabase

import { useState, useEffect, useMemo } from 'react'
import ModuleLayout from '../../components/ModuleLayout'
import { supabase } from '../../lib/supabase'

interface Situation {
  id: string
  theme: string
  theme_num: number
  theme_color: string
  theme_light: string
  theme_icon: string
  titre: string
  situation_type: string
  type: string
  severity: string | null
  cat_color: string
  cat_bg: string
  situation: string
  consequence: string
  action: string
  prevention: string
  ref_faq: string
}

const THEMES = ['Tous les thèmes','Dédouanement','Droit douanier','Tarification',
  'Contrôles & Fraudes','Régimes économiques','Classement tarifaire',
  "Règles d'origine",'Valeur en douane','Contentieux','Fiscalité']

const TYPES = ['Tous','Non-conformité','Risque à éviter','Opportunité','Bonne pratique']

const TYPE_META: Record<string,{icon:string;bg:string;color:string}> = {
  'Non-conformité': {icon:'✗', bg:'#FEE2E2', color:'#991B1B'},
  'Risque à éviter':{icon:'⚠', bg:'#FEF3C7', color:'#92400E'},
  'Opportunité':    {icon:'✦', bg:'#DCFCE7', color:'#166534'},
  'Bonne pratique': {icon:'✓', bg:'#DBEAFE', color:'#1E40AF'},
}

const SEV_META: Record<string,{label:string;color:string}> = {
  'élevé':  {label:'Risque élevé',  color:'#DC2626'},
  'modéré': {label:'Risque modéré', color:'#D97706'},
}

// ── Carte situation ───────────────────────────────────────────────────────────

function SituationCard({ s, isOpen, onToggle }: {
  s: Situation; isOpen: boolean; onToggle: () => void
}) {
  const tm = TYPE_META[s.type] || TYPE_META['Bonne pratique']

  return (
    <div style={{
      border: `.5px solid ${isOpen ? s.theme_color : 'var(--color-border-tertiary)'}`,
      borderLeft: `4px solid ${s.theme_color}`,
      marginBottom: 6,
      background: '#FFFFFF',
      transition: 'border-color .15s',
    }}>
      {/* Header cliquable */}
      <button onClick={onToggle} style={{
        width:'100%', textAlign:'left',
        background: isOpen ? s.theme_light : 'transparent',
        border:'none', padding:'.875rem 1.25rem', cursor:'pointer',
        display:'flex', gap:'1rem', alignItems:'flex-start', transition:'background .12s',
      }}>
        <span style={{ fontSize:18, flexShrink:0, marginTop:2, opacity:.8, color:s.theme_color }}>
          {s.theme_icon}
        </span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4, flexWrap:'wrap' }}>
            <span style={{ fontSize:11, padding:'1px 7px', background:tm.bg, color:tm.color, letterSpacing:'.05em', flexShrink:0 }}>
              {tm.icon} {s.type}
            </span>
            {s.severity && (
              <span style={{ fontSize:10, color:SEV_META[s.severity]?.color, fontWeight:600 }}>
                · {SEV_META[s.severity]?.label}
              </span>
            )}
            <span style={{ fontSize:10, color:'var(--color-text-tertiary)' }}>
              {s.theme} · {s.situation_type}
            </span>
          </div>
          <div style={{ fontSize:13, fontWeight:600, color:'#1A1A2E', lineHeight:1.4,
            fontFamily:"'Source Serif 4',Georgia,serif" }}>
            {s.titre}
          </div>
        </div>
        <span style={{ fontSize:16, color:s.theme_color, flexShrink:0, marginTop:2,
          transform: isOpen ? 'rotate(180deg)' : 'none',
          transition:'transform .2s', display:'inline-block' }}>
          ⌄
        </span>
      </button>

      {/* Corps */}
      {isOpen && (
        <div style={{ padding:'0 1.25rem 1.25rem', background:'#FAFBFD',
          borderTop:`.5px solid ${s.theme_light}` }}>
          {[
            { label:'SITUATION',         icon:'◈', text:s.situation,   bg:'#FFFFFF',  border:'#CBD5E1', labelColor:'#475569' },
            { label:'CONSÉQUENCE',        icon:'⚠', text:s.consequence, bg:'#FFF7ED',  border:'#FED7AA', labelColor:'#C2410C' },
            { label:'ACTION CORRECTIVE',  icon:'✎', text:s.action,      bg:'#F0FDF4',  border:'#BBF7D0', labelColor:'#15803D' },
            { label:'PRÉVENTION',         icon:'◉', text:s.prevention,  bg:'#EFF6FF',  border:'#BFDBFE', labelColor:'#1D4ED8' },
          ].map(sec => (
            <div key={sec.label} style={{
              marginTop:'.75rem', padding:'.875rem',
              background:sec.bg, borderLeft:`3px solid ${sec.border}`,
            }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.08em',
                color:sec.labelColor, marginBottom:5 }}>
                {sec.icon} {sec.label}
              </div>
              <div style={{ fontSize:12, color:'#334155', lineHeight:1.75 }}>
                {sec.text}
              </div>
            </div>
          ))}
          <div style={{ marginTop:'.875rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:10, color:'var(--color-text-tertiary)' }}>
              Réf. FAQ douanière : {s.ref_faq}
            </span>
            <span style={{ fontSize:9, color:'var(--color-border-secondary)', letterSpacing:'.05em' }}>
              DOCUMENT SOUS DROIT D'AUTEUR · DAS
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function RisquesPage() {
  const [situations, setSituations] = useState<Situation[]>([])
  const [loading, setLoading]       = useState(true)
  const [themeFilter, setThemeFilter] = useState('Tous les thèmes')
  const [typeFilter, setTypeFilter]   = useState('Tous')
  const [searchQ, setSearchQ]         = useState('')
  const [openId, setOpenId]           = useState<string|null>(null)

  // Charger depuis Supabase
  useEffect(() => {
    supabase
      .from('risques')
      .select('*')
      .order('theme_num', { ascending: true })
      .order('id', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setSituations(data as Situation[])
        setLoading(false)
      })
  }, [])

  const filtered = useMemo(() => {
    return situations.filter(s => {
      if (themeFilter !== 'Tous les thèmes' && s.theme !== themeFilter) return false
      if (typeFilter  !== 'Tous'            && s.type  !== typeFilter)  return false
      if (searchQ.length >= 2) {
        const q = searchQ.toLowerCase()
        return s.titre.toLowerCase().includes(q)      ||
               s.situation.toLowerCase().includes(q)  ||
               s.action.toLowerCase().includes(q)     ||
               s.prevention.toLowerCase().includes(q)
      }
      return true
    })
  }, [situations, themeFilter, typeFilter, searchQ])

  const counts = useMemo(() => ({
    total:    situations.length,
    eleve:    situations.filter(s => s.severity === 'élevé').length,
    opport:   situations.filter(s => s.type === 'Opportunité').length,
    nonConf:  situations.filter(s => s.type === 'Non-conformité').length,
  }), [situations])

  return (
    <ModuleLayout
      kicker="MODULE 12"
      title="Contrôle des Risques"
      sub="Situations pratiques douanières — identification des risques, actions correctives et stratégies de prévention">

      {/* Stats */}
      <div className="info-grid" style={{ marginBottom:'1.5rem' }}>
        <div className="istat">
          <div className="istat-n">{loading ? '…' : counts.total}</div>
          <div className="istat-l">Situations analysées</div>
        </div>
        <div className="istat">
          <div className="istat-n" style={{ color:'#DC2626' }}>{loading ? '…' : counts.eleve}</div>
          <div className="istat-l">Risques élevés</div>
        </div>
        <div className="istat">
          <div className="istat-n" style={{ color:'#166534' }}>{loading ? '…' : counts.opport}</div>
          <div className="istat-l">Opportunités</div>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display:'flex', gap:'.75rem', marginBottom:'1rem', flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:2, minWidth:200 }}>
          <span style={{ position:'absolute', left:'.875rem', top:'50%',
            transform:'translateY(-50%)', fontSize:13,
            color:'var(--color-text-tertiary)', pointerEvents:'none' }}>◎</span>
          <input className="search-input" style={{ paddingLeft:'2.25rem', width:'100%' }}
            placeholder="Rechercher une situation, une action, une prévention…"
            value={searchQ} onChange={e => setSearchQ(e.target.value)} />
          {searchQ && (
            <button onClick={() => setSearchQ('')} style={{ position:'absolute', right:'.875rem',
              top:'50%', transform:'translateY(-50%)', background:'none',
              border:'none', cursor:'pointer', fontSize:14, color:'var(--color-text-secondary)' }}>
              ×
            </button>
          )}
        </div>
        <select className="form-select" style={{ flex:1, minWidth:180 }}
          value={themeFilter}
          onChange={e => { setThemeFilter(e.target.value); setOpenId(null) }}>
          {THEMES.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="form-select" style={{ flex:1, minWidth:160 }}
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setOpenId(null) }}>
          {TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Badges types */}
      <div style={{ display:'flex', gap:6, marginBottom:'1rem', flexWrap:'wrap', alignItems:'center' }}>
        {TYPES.slice(1).map(t => {
          const tm = TYPE_META[t]
          const cnt = filtered.filter(s => s.type === t).length
          return (
            <button key={t}
              onClick={() => setTypeFilter(typeFilter === t ? 'Tous' : t)}
              style={{
                fontSize:11, padding:'3px 10px', cursor:'pointer',
                background: typeFilter === t ? tm.bg : 'transparent',
                color: typeFilter === t ? tm.color : 'var(--color-text-secondary)',
                border:`.5px solid ${typeFilter === t ? tm.color : 'var(--color-border-tertiary)'}`,
                fontWeight: typeFilter === t ? 700 : 400,
                transition:'all .12s',
              }}>
              {tm.icon} {t} ({cnt})
            </button>
          )
        })}
        <span style={{ marginLeft:'auto', fontSize:11, color:'var(--color-text-secondary)' }}>
          {loading ? 'Chargement…' : `${filtered.length} situation${filtered.length > 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ padding:'3rem', textAlign:'center', color:'var(--color-text-secondary)', fontSize:13 }}>
          Chargement des situations…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding:'3rem', textAlign:'center',
          border:'.5px solid var(--color-border-tertiary)', color:'var(--color-text-secondary)' }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, color:'#0C2D5C', marginBottom:8 }}>
            Aucune situation trouvée
          </div>
          Essayez un autre filtre ou terme de recherche.
        </div>
      ) : (
        filtered.map(s => (
          <SituationCard
            key={s.id}
            s={s}
            isOpen={openId === s.id}
            onToggle={() => setOpenId(openId === s.id ? null : s.id)}
          />
        ))
      )}

      {/* Footer */}
      <div style={{ marginTop:'2rem', paddingTop:'1rem',
        borderTop:'.5px solid var(--color-border-tertiary)',
        display:'flex', justifyContent:'space-between',
        fontSize:11, color:'var(--color-text-secondary)' }}>
        <span>Contrôle des Risques · FAQ en Douane · Document sous droit d'auteur · DAS</span>
        <span>Code des douanes 2022 · Loi de Finances 2025</span>
      </div>

    </ModuleLayout>
  )
}
