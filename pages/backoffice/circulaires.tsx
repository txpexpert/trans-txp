import { useEffect, useState } from 'react'
import type { GetServerSideProps } from 'next'
import { requireAdminSSR } from '../../lib/adminAuth'
import { supabaseAdmin } from '../../lib/supabaseAdmin'
import { useRouter } from 'next/router'
import BackofficeLayout from '../../components/BackofficeLayout'

interface Circulaire {
  id: string
  numero: string
  titre: string
  date: string
  categorie: string
  statut: 'indexee' | 'en_attente' | 'erreur'
  chunks: number
  source: string
}

// ✅ 2026-11-01 — données réelles : documents indexés dans la base RAG
// (table knowledge_chunks), regroupés par numéro / titre. Remplace la liste
// d'exemples. L'ajout rapide (/api/quick-add) est inchangé.
async function loadCirculaires(): Promise<Circulaire[]> {
  // Lecture par pages de 1 000 lignes (plafond par requête de l'API Supabase).
  const rows: any[] = []
  for (let from = 0; from < 50000; from += 1000) {
    const { data, error } = await supabaseAdmin()
      .from('knowledge_chunks')
      .select('numero, titre, date_document, type_document, domaine, emetteur, created_at')
      .order('id')
      .range(from, from + 999)
    if (error) throw error
    rows.push(...(data ?? []))
    if (!data || data.length < 1000) break
  }
  const docs = new Map<string, Circulaire & { _at: string }>()
  for (const r of rows) {
    const key = `${r.numero || ''}|${r.titre || ''}`
    const d = docs.get(key)
    if (d) { d.chunks++; if (r.created_at > d._at) d._at = r.created_at; continue }
    docs.set(key, {
      id: key,
      numero: r.numero || '—',
      titre: r.titre || 'Sans titre',
      date: r.date_document || (r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : '—'),
      categorie: r.type_document || r.domaine || '—',
      statut: 'indexee',
      chunks: 1,
      source: r.emetteur || 'ADII',
      _at: r.created_at || '',
    })
  }
  return Array.from(docs.values())
    .sort((a, b) => (b._at || '').localeCompare(a._at || ''))
    .map(({ _at, ...c }) => c)
}

const STATUT_C = {
  indexee:    { bg:'#E6F7EE', color:'#1A7A40', label:'Indexée RAG' },
  en_attente: { bg:'#FEF5E4', color:'#8A5A10', label:'En attente' },
  erreur:     { bg:'#FEE8E8', color:'#C0392B', label:'Erreur' },
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const guard = await requireAdminSSR(context)
  if ('redirect' in guard) return guard
  try {
    return { props: { circulaires: await loadCirculaires() } }
  } catch (e: any) {
    return { props: { circulaires: [], loadError: e?.message || 'Chargement impossible' } }
  }
}

export default function BackofficeCirulaires({ circulaires = [], loadError }: { circulaires: Circulaire[]; loadError?: string }) {
  const router = useRouter()
  const CIRCULAIRES = circulaires
  const [q, setQ] = useState('')
  const [filtre, setFiltre] = useState<Circulaire['statut'] | 'all'>('all')
  const [toast, setToast] = useState('')

  // ── Ajout rapide — une circulaire à la fois ──────────────────────────────
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [qaNumero, setQaNumero] = useState('')
  const [qaTitre, setQaTitre] = useState('')
  const [qaObjet, setQaObjet] = useState('')
  const [qaTexte, setQaTexte] = useState('')
  const [qaLoading, setQaLoading] = useState(false)

  const quickAddSubmit = async () => {
    if (!qaNumero.trim() || !qaTitre.trim() || !qaTexte.trim()) {
      showToast('Numéro, titre et texte sont obligatoires')
      return
    }
    setQaLoading(true)
    try {
      const res = await fetch('/api/quick-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'circulaires',
          entry: { numero: qaNumero.trim(), titre: qaTitre.trim(), objet: qaObjet.trim(), texte: qaTexte.trim() },
        }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error || 'Erreur lors de l\'ajout'); return }
      if (data.doublon) { showToast('Circulaire déjà indexée — ignorée'); return }
      showToast('Circulaire ajoutée et indexée dans le RAG')
      setQaNumero(''); setQaTitre(''); setQaObjet(''); setQaTexte(''); setShowQuickAdd(false)
      router.replace(router.asPath)   // recharge la liste réelle depuis Supabase
    } catch {
      showToast('Erreur réseau — réessayez')
    } finally {
      setQaLoading(false)
    }
  }


  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  const filtered = CIRCULAIRES.filter(c => {
    const matchQ = [c.numero, c.titre, c.categorie].join(' ').toLowerCase().includes(q.toLowerCase())
    const matchF = filtre === 'all' || c.statut === filtre
    return matchQ && matchF
  })

  return (
    <BackofficeLayout title="Circulaires ADII">
      {loadError && <div style={{ background:'#FEE8E8', color:'#C0392B', padding:'10px 14px', fontSize:12, marginBottom:'1rem' }}>{loadError}</div>}

      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, background:'#059669', color:'white', padding:'10px 20px', fontSize:12, zIndex:999 }}>
          {toast}
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem' }}>
        <div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, color:'var(--bd)', marginBottom:4 }}>Circulaires ADII</h1>
          <p style={{ fontSize:13, color:'var(--inkm)' }}>{CIRCULAIRES.length} circulaires · {CIRCULAIRES.filter(c => c.statut === 'indexee').length} indexées dans le RAG</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowQuickAdd(v => !v)}
            style={{ padding:'8px 18px', background:'#0891b2', color:'#fff', border:'none', fontSize:12, cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>
            + Ajout rapide
          </button>
          <button onClick={() => router.push('/backoffice/ingest')}
            style={{ padding:'8px 18px', background:'#C9A84C', color:'#0A0A0A', border:'none', fontSize:12, cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>
            ⬆ Ingérer de nouvelles circulaires
          </button>
        </div>
      </div>

      {showQuickAdd && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '1.25rem', marginBottom: '1.5rem', background: '#f9fafb', display: 'grid', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
            <input value={qaNumero} onChange={e => setQaNumero(e.target.value)} placeholder="Numéro (ex: 6234/2026)"
              style={{ padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }} />
            <input value={qaTitre} onChange={e => setQaTitre(e.target.value)} placeholder="Titre de la circulaire"
              style={{ padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }} />
          </div>
          <input value={qaObjet} onChange={e => setQaObjet(e.target.value)} placeholder="Objet / résumé court (optionnel)"
            style={{ padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }} />
          <textarea value={qaTexte} onChange={e => setQaTexte(e.target.value)} placeholder="Texte complet de la circulaire — sera découpé et indexé automatiquement dans le RAG"
            rows={6} style={{ padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }} />
          <div>
            <button onClick={quickAddSubmit} disabled={qaLoading}
              style={{ padding: '9px 18px', background: qaLoading ? '#9ca3af' : '#059669', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: qaLoading ? 'not-allowed' : 'pointer' }}>
              {qaLoading ? 'Indexation en cours…' : 'Ajouter et indexer'}
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'.75rem', marginBottom:'1.5rem' }}>
        {[
          { label:'Indexées RAG', value: CIRCULAIRES.filter(c=>c.statut==='indexee').length, color:'#059669' },
          { label:'En attente',   value: CIRCULAIRES.filter(c=>c.statut==='en_attente').length, color:'#D97706' },
          { label:'En erreur',    value: CIRCULAIRES.filter(c=>c.statut==='erreur').length, color:'#DC2626' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--white)', border:'.5px solid var(--rule)', borderTop:`3px solid ${s.color}`, padding:'1rem' }}>
            <div style={{ fontSize:10, letterSpacing:'.06em', color:'var(--inkm)', marginBottom:4 }}>{s.label.toUpperCase()}</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, color:'var(--bd)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display:'flex', gap:'1rem', marginBottom:'1rem', flexWrap:'wrap' }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher numéro ou titre…"
          style={{ flex:1, minWidth:200, padding:'8px 12px', border:'.5px solid var(--rule)', background:'var(--white)', fontSize:12, color:'var(--bd)', outline:'none', fontFamily:'inherit' }}
        />
        {(['all','indexee','en_attente','erreur'] as const).map(f => (
          <button key={f} onClick={() => setFiltre(f)} style={{
            padding:'6px 14px', fontSize:11, border:'.5px solid var(--rule)', cursor:'pointer', fontFamily:'inherit',
            background: filtre === f ? '#0C2D5C' : 'var(--white)', color: filtre === f ? 'white' : 'var(--inkm)',
          }}>
            {f === 'all' ? 'Toutes' : STATUT_C[f].label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background:'var(--white)', border:'.5px solid var(--rule)', overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ borderBottom:'.5px solid var(--rule)' }}>
              {['N° CIRCULAIRE','TITRE','DATE','CATÉGORIE','STATUT','CHUNKS',''].map(h => (
                <th key={h} style={{ padding:'.5rem .75rem', textAlign:'left', fontSize:10, letterSpacing:'.06em', color:'var(--inkm)', fontWeight:600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const s = STATUT_C[c.statut]
              return (
                <tr key={c.id} style={{ borderBottom:'.5px solid var(--rule)' }}>
                  <td style={{ padding:'.5rem .75rem', fontFamily:'monospace', fontSize:11, color:'var(--ba)', fontWeight:600 }}>{c.numero}</td>
                  <td style={{ padding:'.5rem .75rem', color:'var(--inks)', maxWidth:320, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.titre}</td>
                  <td style={{ padding:'.5rem .75rem', color:'var(--inkm)', whiteSpace:'nowrap' }}>{c.date}</td>
                  <td style={{ padding:'.5rem .75rem', color:'var(--inkm)' }}>{c.categorie}</td>
                  <td style={{ padding:'.5rem .75rem' }}>
                    <span style={{ fontSize:10, padding:'2px 8px', background:s.bg, color:s.color, fontWeight:600 }}>{s.label}</span>
                  </td>
                  <td style={{ padding:'.5rem .75rem', color:'var(--inkm)', fontFamily:'monospace' }}>{c.chunks > 0 ? c.chunks : '–'}</td>
                  <td style={{ padding:'.5rem .75rem' }}>
                    {c.statut === 'erreur' || c.statut === 'en_attente' ? (
                      <button onClick={() => showToast(`Re-ingestion de la circulaire ${c.numero} lancée`)}
                        style={{ fontSize:10, padding:'2px 10px', background:'#C9A84C', color:'#0A0A0A', border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>
                        ↺ Ré-ingérer
                      </button>
                    ) : (
                      <span style={{ fontSize:10, color:'var(--inkm)' }}>{c.chunks} chunks</span>
                    )}
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
