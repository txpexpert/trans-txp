// components/ChainRows.tsx
// La chaîne en tuiles transversales détaillées, avec le parcours des modules :
// chaque module est une étiquette reliée au suivant par une flèche, et un signal
// lumineux parcourt la ligne continue, du premier module de Qualifier au dernier
// de Sécuriser, en passant d'une étape à l'autre par un connecteur.
// Animation coupée si l'utilisateur demande moins de mouvement ; pause au survol.
import Link from 'next/link'
import { Fragment, useEffect, useRef, useState } from 'react'
import { CHAIN } from '../lib/suite'

const STEP_MS = 900

export default function ChainRows() {
  // index global de chaque module dans la ligne continue
  const starts: number[] = []
  let total = 0
  CHAIN.forEach(e => { starts.push(total); total += e.tools.length })

  const [active, setActive] = useState(-1)
  const paused = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => {
      if (paused.current) return
      setActive(a => (a + 1) % (total + 2)) // deux temps morts en fin de boucle
    }, STEP_MS)
    return () => window.clearInterval(id)
  }, [total])

  const state = (g: number) => (g === active ? 'on' : g < active ? 'done' : '')

  return (
    <div className="x-flow" onMouseEnter={() => { paused.current = true }} onMouseLeave={() => { paused.current = false }}>
      {CHAIN.map((e, si) => {
        const first = starts[si]
        const last = first + e.tools.length - 1
        const stepOn = active >= first && active <= last
        const linkOn = active === last + 1 || (active > last && si < CHAIN.length - 1 && active === starts[si + 1])
        return (
          <Fragment key={e.slug}>
            <div className={`x-link-card x-row3 x-flow-row x-c-${e.slug} ${stepOn ? 'is-on' : ''}`}>
              <Link href={`/espaces/${e.slug}`} className="x-flow-head">
                <span className="x-num">ÉTAPE {e.num}</span>
                <div className="x-verb">{e.verb}</div>
                <div className="x-card-t" style={{ marginBottom: 0 }}>{e.title}</div>
                <span className="x-flow-open">Ouvrir l’espace →</span>
              </Link>
              <div>
                <p style={{ margin: '0 0 8px', fontWeight: 500 }}>{e.question}</p>
                <p style={{ margin: 0, color: 'var(--x-ink2)', fontSize: 15 }}>{e.promise}</p>
                <div className="x-flow-tools" aria-label={`Parcours des modules de l’étape ${e.verb}`}>
                  {e.tools.map((t, ti) => {
                    const g = first + ti
                    return (
                      <Fragment key={t.path + t.label}>
                        {ti > 0 && <span className={`x-flow-arr ${g <= active ? 'lit' : ''}`} aria-hidden="true" />}
                        <Link href={t.path} className={`x-flow-chip ${state(g)}`} title={t.desc}>
                          <i>{ti + 1}</i>{t.label}
                        </Link>
                      </Fragment>
                    )
                  })}
                </div>
              </div>
              <div className="x-card-out" style={{ borderTop: 'none', paddingTop: 0 }}>
                <b>Livrable</b>{e.livrable}
                <b style={{ marginTop: 12 }}>Transmet</b>{e.transmet}
              </div>
            </div>
            {si < CHAIN.length - 1 && (
              <div className={`x-flow-link ${linkOn ? 'on' : active > last ? 'done' : ''}`} aria-hidden="true">
                <span className="x-flow-line" />
                <span className="x-flow-tag">{e.transmet} → {CHAIN[si + 1].verb}</span>
              </div>
            )}
          </Fragment>
        )
      })}
    </div>
  )
}
