// pages/modules/decisions-classement.tsx
// ════════════════════════════════════════════════════════════
// Décisions de Classement — Supabase (table decisions_classement)
// Recherche serveur — les décisions ajoutées via le backoffice
// apparaissent immédiatement, sans redéploiement.
// ════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import ModuleLayout from '../../components/ModuleLayout'

interface Decision {
  designation: string
  circulaire: string
  code_sh: string
  resume?: string
}

export default function DecisionsClassement() {

  const [decQ, setDecQ] = useState('')
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [total, setTotal] = useState(0)
  const [decLoaded, setDecLoaded] = useState(false)

  const search = useCallback(async (query: string) => {
    setDecLoaded(false)
    try {
      const res = await fetch('/api/decisions/search?q=' + encodeURIComponent(query))
      const json = await res.json()
      setDecisions(Array.isArray(json.data) ? json.data : [])
      setTotal(json.count ?? 0)
    } catch {
      setDecisions([])
      setTotal(0)
    } finally {
      setDecLoaded(true)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => search(decQ), 300)
    return () => clearTimeout(t)
  }, [decQ, search])

  const decisionsFiltered = decisions

  return (
    <ModuleLayout
      kicker="MODULE 05B"
      title="Décisions de Classement"
      sub="Référentiel ADII des décisions de classement tarifaire — recherchez par nom de produit, circulaire ou code SH.">

      <div className="info-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="istat">
          <div className="istat-n">{total}</div>
          <div className="istat-l">{decQ ? 'Résultats trouvés' : 'Décisions référencées'}</div>
        </div>
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <input
          className="search-input"
          style={{ width: '100%', maxWidth: '480px', fontSize: '13px' }}
          placeholder="Rechercher par nom de produit, circulaire ou code SH (ex : acier, vehicule, textile...)"
          value={decQ}
          onChange={e => setDecQ(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <div style={{
        border: '.5px solid var(--rule)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '8px 16px',
          borderBottom: '.5px solid var(--rule)',
          background: 'var(--bl)',
          fontSize: '11px', fontFamily: 'monospace', color: 'var(--inkm)',
        }}>
          {!decLoaded ? 'Chargement...' : decisionsFiltered.length + ' designation' + (decisionsFiltered.length !== 1 ? 's' : '')}
        </div>

        <div>
          {!decLoaded && (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--inkm)', fontSize: '13px' }}>
              Chargement...
            </div>
          )}

          {decLoaded && decisionsFiltered.length === 0 && (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--inkm)', fontSize: '13px' }}>
              Aucune decision trouvee{decQ ? ' pour "' + decQ + '"' : ''}.
            </div>
          )}

          {decLoaded && decisionsFiltered.map((d, i) => (
            <details key={i} style={{
              borderBottom: '.5px solid var(--rule)',
              background: i % 2 === 0 ? 'var(--surface, #fff)' : 'var(--bg2, #fafafa)',
            }}>
              <summary style={{
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: '14px',
                cursor: d.resume ? 'pointer' : 'default',
                listStyle: 'none',
              }}>
                <span style={{ fontSize: '13px', color: 'var(--ink)', lineHeight: 1.5, flex: 1, minWidth: 0 }}>
                  {d.designation}
                </span>
                <span style={{
                  fontFamily: 'monospace', fontSize: '11px',
                  color: 'var(--inkm)', whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {d.circulaire.replace('Circulaire ', '')} · {d.code_sh}
                </span>
              </summary>
              {d.resume && (
                <div style={{
                  padding: '0 16px 12px 16px',
                  fontSize: '12.5px', color: 'var(--inkm)', lineHeight: 1.6,
                }}>
                  {d.resume}
                </div>
              )}
            </details>
          ))}
        </div>
      </div>

    </ModuleLayout>
  )
}
