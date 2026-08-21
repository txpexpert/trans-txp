// pages/modules/faq.tsx
// FAQ en Douane — Page restructurée
// Vue : Grands thèmes → Questions par thème → Recherche intelligente

import { useState, useEffect, useCallback, useRef } from 'react'
import ModuleLayout from '../../components/ModuleLayout'
import { supabase } from '../../lib/supabase'

// ── Types ─────────────────────────────────────────────────────────────────────

interface FaqEntry {
  id: string
  titre: number
  titre_label: string
  categorie: string
  question: string
  answer: string
  tags: string[]
  difficulte: 'débutant' | 'intermédiaire' | 'avancé'
  profils: string[]
  answer_words: number
  sort_order: number
}

// ── Constantes ────────────────────────────────────────────────────────────────

const THEMES = [
  { titre: 0,  label: 'Tous les thèmes',            icon: '◈', count: 173 },
  { titre: 1,  label: 'Procédures de dédouanement', icon: '⊞', count: 43 },
  { titre: 2,  label: 'Droit douanier',             icon: '≡', count: 11 },
  { titre: 3,  label: 'Tarification douanière',     icon: '◇', count: 7  },
  { titre: 4,  label: 'Contrôles & Fraudes',        icon: '⊕', count: 5  },
  { titre: 5,  label: 'Régimes économiques',        icon: '⬡', count: 55 },
  { titre: 6,  label: 'Classement tarifaire',       icon: '◉', count: 6  },
  { titre: 7,  label: "Règles d'origine",           icon: '△', count: 14 },
  { titre: 8,  label: 'Valeur en douane',           icon: '◎', count: 22 },
  { titre: 9,  label: 'Contentieux douanier',       icon: '✦', count: 10 },
]

const THEME_COLORS: Record<number, { bg: string; accent: string; light: string }> = {
  0: { bg: '#0C2D5C', accent: '#2563EB', light: '#E8F0FA' },
  1: { bg: '#1E40AF', accent: '#3B82F6', light: '#DBEAFE' },
  2: { bg: '#065F46', accent: '#059669', light: '#D1FAE5' },
  3: { bg: '#78350F', accent: '#D97706', light: '#FEF3C7' },
  4: { bg: '#7F1D1D', accent: '#DC2626', light: '#FEE2E2' },
  5: { bg: '#4C1D95', accent: '#7C3AED', light: '#EDE9FE' },
  6: { bg: '#164E63', accent: '#0891B2', light: '#CFFAFE' },
  7: { bg: '#14532D', accent: '#16A34A', light: '#DCFCE7' },
  8: { bg: '#1E3A8A', accent: '#2563EB', light: '#DBEAFE' },
  9: { bg: '#831843', accent: '#BE185D', light: '#FCE7F3' },
}

const DIFF_STYLE: Record<string, React.CSSProperties> = {
  'débutant':      { background: '#DCFCE7', color: '#166534' },
  'intermédiaire': { background: '#FEF3C7', color: '#92400E' },
  'avancé':        { background: '#FEE2E2', color: '#991B1B' },
}

const PAGE_SIZE = 15

// ── Anti-scraping hook ────────────────────────────────────────────────────────

function useAntiScraping() {
  useEffect(() => {
    const noCtx = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-protected]')) e.preventDefault()
    }
    const noKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      if (['c','a','p','s','u'].includes(e.key.toLowerCase())) {
        const hover = document.querySelector('[data-protected]:hover')
        const focus = (document.activeElement as HTMLElement)?.closest?.('[data-protected]')
        if (hover || focus) e.preventDefault()
      }
    }
    document.addEventListener('contextmenu', noCtx)
    document.addEventListener('keydown', noKey)
    return () => {
      document.removeEventListener('contextmenu', noCtx)
      document.removeEventListener('keydown', noKey)
    }
  }, [])
}

// ── Composant : réponse protégée ──────────────────────────────────────────────

function ProtectedAnswer({ text }: { text: string }) {
  const paragraphs = text.split('\n\n').filter(p => p.trim())

  return (
    <div
      data-protected="true"
      className="faq-answer-wrap"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        position: 'relative',
      }}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'transparent' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {paragraphs.map((p, i) => {
          const lines = p.split('\n').filter(l => l.trim())

          if (lines.some(l => /^[-•]/.test(l.trim()))) {
            return (
              <ul key={i} style={{ margin: '0 0 .875rem', paddingLeft: '1.5rem', listStyle: 'none' }}>
                {lines.map((line, j) => (
                  <li key={j} style={{ fontSize: 13, color: 'var(--inks)', lineHeight: 1.75, padding: '2px 0', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '-1rem', color: 'var(--ba)', fontWeight: 700 }}>·</span>
                    {line.replace(/^[-•]\s*/, '')}
                  </li>
                ))}
              </ul>
            )
          }

          if (lines.length > 1 && lines.every(l => /^\d+[.-]/.test(l.trim()))) {
            return (
              <ol key={i} style={{ margin: '0 0 .875rem', paddingLeft: '1.5rem' }}>
                {lines.map((line, j) => (
                  <li key={j} style={{ fontSize: 13, color: 'var(--inks)', lineHeight: 1.75, padding: '2px 0' }}>
                    {line.replace(/^\d+[.-]\s*/, '')}
                  </li>
                ))}
              </ol>
            )
          }

          // Detect sub-heading (short line ending with :)
          if (lines.length === 1 && p.trim().endsWith(':') && p.length < 80) {
            return (
              <p key={i} style={{ fontSize: 12, fontWeight: 600, color: 'var(--bd)', letterSpacing: '.04em', margin: '.75rem 0 .25rem', textTransform: 'uppercase' }}>
                {p}
              </p>
            )
          }

          return (
            <p key={i} style={{ fontSize: 13, color: 'var(--inks)', lineHeight: 1.8, margin: '0 0 .875rem', textAlign: 'justify' }}>
              {p}
            </p>
          )
        })}
      </div>
    </div>
  )
}

// ── Composant : carte thème ───────────────────────────────────────────────────

function ThemeCard({ theme, active, onClick, realCount }: {
  theme: typeof THEMES[0]
  active: boolean
  onClick: () => void
  realCount?: number
}) {
  const colors = THEME_COLORS[theme.titre]
  const count = realCount ?? theme.count

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', cursor: 'pointer',
        padding: '.875rem 1rem',
        background: active ? colors.bg : 'var(--white)',
        border: active ? `1.5px solid ${colors.bg}` : `.5px solid var(--rule)`,
        transition: 'all .15s',
        display: 'flex', alignItems: 'center', gap: '.75rem',
      }}>
      <span style={{
        fontSize: 18, opacity: .7,
        color: active ? 'white' : colors.accent,
      }}>
        {theme.icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12, fontWeight: 500, lineHeight: 1.3,
          color: active ? 'white' : 'var(--bd)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }}>
          {theme.label}
        </div>
      </div>
      <span style={{
        fontSize: 11, fontWeight: 700, flexShrink: 0,
        color: active ? 'rgba(255,255,255,.7)' : colors.accent,
        background: active ? 'rgba(255,255,255,.15)' : colors.light,
        padding: '1px 7px', borderRadius: 10,
      }}>
        {count}
      </span>
    </button>
  )
}

// ── Composant : item FAQ ──────────────────────────────────────────────────────

function FaqItem({ entry, isOpen, onToggle, searchQuery }: {
  entry: FaqEntry
  isOpen: boolean
  onToggle: () => void
  searchQuery: string
}) {
  const colors = THEME_COLORS[entry.titre]
  const diffStyle = DIFF_STYLE[entry.difficulte] || {}

  // Highlight search terms in question
  function highlightText(text: string, query: string) {
    if (!query || query.length < 2) return <span>{text}</span>
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return (
      <span>
        {parts.map((part, i) =>
          regex.test(part)
            ? <mark key={i} style={{ background: '#FEF08A', color: '#713F12', padding: '0 1px' }}>{part}</mark>
            : <span key={i}>{part}</span>
        )}
      </span>
    )
  }

  return (
    <div style={{
      border: `.5px solid ${isOpen ? colors.accent : 'var(--rule)'}`,
      marginBottom: 4,
      background: 'var(--white)',
      transition: 'border-color .15s',
      borderLeft: `3px solid ${isOpen ? colors.accent : 'transparent'}`,
    }}>
      {/* Question */}
      <button
        onClick={onToggle}
        style={{
          width: '100%', textAlign: 'left', background: isOpen ? colors.light : 'transparent',
          border: 'none', padding: '.875rem 1.25rem .875rem 1rem',
          cursor: 'pointer', display: 'flex', gap: '.875rem', alignItems: 'flex-start',
          transition: 'background .12s',
        }}>
        {/* ID */}
        <span style={{
          fontFamily: 'monospace', fontSize: 10, color: colors.accent,
          fontWeight: 700, flexShrink: 0, marginTop: 3, minWidth: 32,
          opacity: .8
        }}>
          {entry.id}
        </span>

        {/* Question */}
        <span style={{
          flex: 1, fontSize: 13, fontWeight: isOpen ? 600 : 500,
          color: 'var(--bd)', lineHeight: 1.55,
          fontFamily: "'Source Serif 4', Georgia, serif",
        }}>
          {highlightText(entry.question, searchQuery)}
        </span>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginTop: 1 }}>
          <span style={{ fontSize: 10, padding: '1px 6px', ...diffStyle }}>
            {entry.difficulte}
          </span>
          <span style={{
            fontSize: 14, color: colors.accent, lineHeight: 1,
            transition: 'transform .2s', display: 'inline-block',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}>
            ⌄
          </span>
        </div>
      </button>

      {/* Réponse */}
      {isOpen && (
        <div style={{
          padding: '1rem 1.25rem 1.25rem',
          borderTop: `.5px solid ${colors.light}`,
          background: 'var(--paper)',
        }}>
          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: '1rem' }}>
            {entry.tags.slice(0, 5).map(tag => (
              <span key={tag} style={{
                fontSize: 10, padding: '1px 7px',
                background: colors.light, color: colors.accent,
                border: `.5px solid ${colors.accent}30`,
                letterSpacing: '.05em'
              }}>
                {tag}
              </span>
            ))}
            {entry.profils.filter(p => p !== 'général').map(p => (
              <span key={p} style={{
                fontSize: 10, padding: '1px 7px',
                background: '#F5F3FF', color: '#4C1D95',
                border: '.5px solid #DDD6FE', letterSpacing: '.05em'
              }}>
                {p}
              </span>
            ))}
          </div>

          {/* Réponse protégée */}
          <ProtectedAnswer text={entry.answer} />

          {/* Footer */}
          <div style={{
            marginTop: '.875rem', paddingTop: '.5rem',
            borderTop: `.5px solid var(--rule)`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ fontSize: 10, color: 'var(--inkm)' }}>
              {entry.titre_label} · {entry.answer_words} mots
            </span>
            <span style={{ fontSize: 9, color: 'var(--rule)', letterSpacing: '.05em', userSelect: 'none' }}>
              FAQ EN DOUANE · DOCUMENT SOUS DROIT D'AUTEUR
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── PAGE PRINCIPALE ───────────────────────────────────────────────────────────

export default function FaqPage() {
  useAntiScraping()

  const [allEntries, setAllEntries]   = useState<FaqEntry[]>([])
  const [displayed, setDisplayed]     = useState<FaqEntry[]>([])
  const [loading, setLoading]         = useState(true)
  const [openId, setOpenId]           = useState<string | null>(null)

  // View state
  const [activeTheme, setActiveTheme] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [diffFilter, setDiffFilter]   = useState('')
  const [page, setPage]               = useState(0)

  const searchRef = useRef<HTMLInputElement>(null)
  const listRef   = useRef<HTMLDivElement>(null)

  // ── Load all FAQ entries once ─────────────────────────────────────────────
  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      // Load in batches to get all 173
      let all: FaqEntry[] = []
      let from = 0
      const batchSize = 100

      while (true) {
        const { data, error } = await supabase
          .from('faq')
          .select('*')
          .order('sort_order', { ascending: true })
          .range(from, from + batchSize - 1)

        if (error || !data || data.length === 0) break
        all = [...all, ...(data as FaqEntry[])]
        if (data.length < batchSize) break
        from += batchSize
      }

      // Fallback: sort by titre + id numerically if sort_order missing
      all.sort((a, b) => {
        if (a.sort_order && b.sort_order) return a.sort_order - b.sort_order
        if (a.titre !== b.titre) return a.titre - b.titre
        const [at, as_] = a.id.split('.').map(Number)
        const [bt, bs]  = b.id.split('.').map(Number)
        return at !== bt ? at - bt : as_ - bs
      })

      setAllEntries(all)
      setLoading(false)
    }
    loadAll()
  }, [])

  // ── Filter & paginate ─────────────────────────────────────────────────────
  useEffect(() => {
    let filtered = allEntries

    // Theme filter
    if (activeTheme > 0) {
      filtered = filtered.filter(e => e.titre === activeTheme)
    }

    // Difficulty filter
    if (diffFilter) {
      filtered = filtered.filter(e => e.difficulte === diffFilter)
    }

    // Search
    const q = searchQuery.trim().toLowerCase()
    if (q.length >= 2) {
      filtered = filtered.filter(e =>
        e.question.toLowerCase().includes(q) ||
        e.answer.toLowerCase().includes(q) ||
        e.tags.some(t => t.toLowerCase().includes(q)) ||
        e.titre_label.toLowerCase().includes(q)
      )
    }

    setDisplayed(filtered)
    setPage(0)
    setOpenId(null)
  }, [allEntries, activeTheme, searchQuery, diffFilter])

  // Scroll to list when theme changes
  const selectTheme = (t: number) => {
    setActiveTheme(t)
    setSearchQuery('')
    setDiffFilter('')
    setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  // Page slice
  const pageStart  = page * PAGE_SIZE
  const pageEnd    = pageStart + PAGE_SIZE
  const pageItems  = displayed.slice(pageStart, pageEnd)
  const totalPages = Math.ceil(displayed.length / PAGE_SIZE)

  const colors = THEME_COLORS[activeTheme]
  const activeThemeObj = THEMES.find(t => t.titre === activeTheme)

  // Theme counts from real data
  const themeCounts = allEntries.reduce<Record<number,number>>((acc, e) => {
    acc[e.titre] = (acc[e.titre] || 0) + 1
    return acc
  }, {})

  return (
    <ModuleLayout
      kicker="MODULE FAQ"
      title="FAQ en Douane"
      sub="Base de connaissances douanières marocaines · 173 questions & réponses · Droit douanier 2025">

      {/* ── STATS ── */}
      <div className="info-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="istat"><div className="istat-n">173</div><div className="istat-l">Questions indexées</div></div>
        <div className="istat"><div className="istat-n">9</div><div className="istat-l">Thèmes couverts</div></div>
        <div className="istat"><div className="istat-n">2025</div><div className="istat-l">Droit douanier marocain</div></div>
      </div>

      {/* ── NOTICE ── */}
      <div style={{
        padding: '.5rem 1rem', marginBottom: '1.5rem',
        background: '#FFFBEB', border: '.5px solid #FDE68A',
        display: 'flex', alignItems: 'center', gap: '.75rem'
      }}>
        <span style={{ fontSize: 11, color: '#92400E', letterSpacing: '.04em' }}>
          Contenu protégé · Document sous droit d'auteur · Accès réservé aux abonnés DAS
        </span>
      </div>

      {/* ── LAYOUT PRINCIPAL ── */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>

        {/* ── SIDEBAR THÈMES ── */}
        <div style={{ width: 220, flexShrink: 0 }}>
          <div style={{ fontSize: 10, letterSpacing: '.1em', color: 'var(--inkm)', marginBottom: '.5rem' }}>
            THÈMES
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {THEMES.map(theme => (
              <ThemeCard
                key={theme.titre}
                theme={theme}
                active={activeTheme === theme.titre}
                onClick={() => selectTheme(theme.titre)}
                realCount={theme.titre === 0 ? allEntries.length : themeCounts[theme.titre] || 0}
              />
            ))}
          </div>

          {/* Filtres secondaires */}
          <div style={{ marginTop: '1.25rem' }}>
            <div style={{ fontSize: 10, letterSpacing: '.1em', color: 'var(--inkm)', marginBottom: '.5rem' }}>
              NIVEAU
            </div>
            {[
              { val: '', label: 'Tous niveaux' },
              { val: 'débutant', label: 'Débutant' },
              { val: 'intermédiaire', label: 'Intermédiaire' },
              { val: 'avancé', label: 'Avancé' },
            ].map(d => (
              <button
                key={d.val}
                onClick={() => setDiffFilter(d.val)}
                style={{
                  width: '100%', textAlign: 'left', padding: '.4rem .75rem',
                  fontSize: 12, cursor: 'pointer', display: 'block',
                  background: diffFilter === d.val ? 'var(--bd)' : 'transparent',
                  color: diffFilter === d.val ? 'white' : 'var(--inks)',
                  border: diffFilter === d.val ? 'none' : '.5px solid transparent',
                  marginBottom: 2, transition: 'all .12s',
                }}>
                {d.val && (
                  <span style={{ ...DIFF_STYLE[d.val], fontSize: 9, padding: '1px 5px', marginRight: 6 }}>
                    {d.val}
                  </span>
                )}
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── CONTENU PRINCIPAL ── */}
        <div style={{ flex: 1, minWidth: 0 }} ref={listRef}>

          {/* Barre de recherche intelligente */}
          <div style={{ marginBottom: '1rem', position: 'relative' }}>
            <div style={{
              position: 'absolute', left: '.875rem', top: '50%',
              transform: 'translateY(-50%)', fontSize: 14, color: 'var(--inkm)',
              pointerEvents: 'none', zIndex: 1
            }}>
              ◎
            </div>
            <input
              ref={searchRef}
              className="search-input"
              style={{ paddingLeft: '2.25rem', width: '100%' }}
              placeholder={`Rechercher${activeTheme > 0 ? ` dans « ${activeThemeObj?.label} »` : ' dans toute la FAQ'}…`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute', right: '.875rem', top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', fontSize: 14,
                  color: 'var(--inkm)', zIndex: 1
                }}>
                ×
              </button>
            )}
          </div>

          {/* En-tête résultats */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '.75rem', padding: '.5rem .75rem',
            background: activeTheme > 0 ? colors.light : 'var(--bl)',
            borderLeft: `3px solid ${colors.accent}`,
          }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--bd)' }}>
                {activeThemeObj?.label}
              </span>
              {searchQuery && (
                <span style={{ fontSize: 12, color: 'var(--inkm)', marginLeft: 8 }}>
                  · recherche « {searchQuery} »
                </span>
              )}
            </div>
            <span style={{ fontSize: 12, color: 'var(--inkm)' }}>
              {loading ? 'Chargement…' : `${displayed.length} question${displayed.length > 1 ? 's' : ''}`}
              {totalPages > 1 && ` · page ${page + 1}/${totalPages}`}
            </span>
          </div>

          {/* Liste des Q&A */}
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--inkm)', fontSize: 13 }}>
              Chargement de la FAQ…
            </div>
          ) : displayed.length === 0 ? (
            <div style={{
              padding: '2.5rem', textAlign: 'center',
              border: '.5px solid var(--rule)', color: 'var(--inkm)'
            }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, color: 'var(--bd)', marginBottom: 8 }}>
                Aucun résultat
              </div>
              {searchQuery
                ? `Aucune question contenant « ${searchQuery} »`
                : 'Essayez un autre filtre'}
            </div>
          ) : (
            <>
              {pageItems.map(entry => (
                <FaqItem
                  key={entry.id}
                  entry={entry}
                  isOpen={openId === entry.id}
                  onToggle={() => setOpenId(openId === entry.id ? null : entry.id)}
                  searchQuery={searchQuery}
                />
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex', gap: 4, marginTop: '1.25rem',
                  justifyContent: 'center', alignItems: 'center'
                }}>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={page === 0}
                    onClick={() => { setPage(page - 1); listRef.current?.scrollIntoView({ behavior: 'smooth' }) }}>
                    ←
                  </button>

                  {/* Numéros de pages — fenêtre glissante */}
                  {(() => {
                    const pages: number[] = []
                    const delta = 2
                    for (let i = 0; i < totalPages; i++) {
                      if (i === 0 || i === totalPages - 1 ||
                          (i >= page - delta && i <= page + delta)) {
                        pages.push(i)
                      }
                    }
                    // Add ellipsis markers
                    const result: (number | '...')[] = []
                    let prev = -1
                    for (const p of pages) {
                      if (prev !== -1 && p - prev > 1) result.push('...')
                      result.push(p)
                      prev = p
                    }
                    return result.map((p, i) =>
                      p === '...'
                        ? <span key={`e${i}`} style={{ fontSize: 12, color: 'var(--inkm)', padding: '0 4px' }}>…</span>
                        : <button
                            key={p}
                            onClick={() => { setPage(p as number); listRef.current?.scrollIntoView({ behavior: 'smooth' }) }}
                            style={{
                              width: 32, height: 32, fontSize: 12, cursor: 'pointer',
                              background: p === page ? colors.bg : 'transparent',
                              color: p === page ? 'white' : 'var(--inks)',
                              border: p === page ? 'none' : '.5px solid var(--rule)',
                              transition: 'all .12s',
                            }}>
                            {(p as number) + 1}
                          </button>
                    )
                  })()}

                  <button
                    className="btn btn-outline btn-sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => { setPage(page + 1); listRef.current?.scrollIntoView({ behavior: 'smooth' }) }}>
                    →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '2rem', paddingTop: '1rem',
        borderTop: '.5px solid var(--rule)',
        display: 'flex', justifyContent: 'space-between',
        fontSize: 11, color: 'var(--inkm)'
      }}>
        <span>FAQ en Douane · Document sous droit d'auteur · Usage réservé aux abonnés DAS</span>
        <span>Code des douanes 2022 · Loi de Finances 2025</span>
      </div>

    </ModuleLayout>
  )
}
