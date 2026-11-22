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
  // Colonnes de la grille des modules : 5 sur grand écran, 3 sur tablette
  // (une seule colonne en dessous de 760 px, gérée par la feuille de style).
  const [cols, setCols] = useState(5)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(max-width: 1020px)')
    const upd = () => setCols(mq.matches ? 3 : 5)
    upd()
    mq.addEventListener?.('change', upd)
    return () => mq.removeEventListener?.('change', upd)
  }, [])
  const paused = useRef(false)
  // Accès : modules cliquables seulement pour un abonnement en cours (essai compris) ou un administrateur.
  const [abonne, setAbonne] = useState(false)
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then(r => (r.ok ? r.json() : null))
      .then(u => {
        if (!u) return
        const admin = u.role === 'admin' || u.role === 'generaladmin'
        const actif = ['pro', 'premium', 'enterprise', 'trial'].includes(u.plan) && (u.statut === 'active' || u.statut === 'trial')
        setAbonne(admin || actif)
      })
      .catch(() => {})
  }, [])

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
    <div className="x-pc x-pc-compact" onMouseEnter={() => { paused.current = true }} onMouseLeave={() => { paused.current = false }}>
      {CHAIN.map((e, si) => {
        const first = starts[si]
        const last = first + e.tools.length - 1
        const stepOn = active >= first && active <= last
        const linkOn = active === last + 1 || (active > last && si < CHAIN.length - 1 && active === starts[si + 1])
        return (
          <Fragment key={e.slug}>
            <div className={`x-link-card x-row3 x-pc-row x-c-${e.slug} ${stepOn ? 'is-on' : ''}`}>
              <Link href={`/espaces/${e.slug}`} className="x-pc-head">
                <span className="x-num">ÉTAPE {e.num}</span>
                <div className="x-verb">{e.verb}</div>
                <div className="x-card-t" style={{ marginBottom: 0 }}>{e.title}</div>
                <span className="x-pc-open">Ouvrir l’espace →</span>
              </Link>
              <div>
                <p style={{ margin: '0 0 4px', fontWeight: 500 }}>{e.question}</p>
                <p style={{ margin: 0, color: 'var(--x-ink2)', fontSize: 14 }}>{e.promise}</p>
              </div>
              <div className="x-card-out" style={{ borderTop: 'none', paddingTop: 0 }}>
                <b>Livrable</b>{e.livrable}
                <b style={{ marginTop: 8 }}>Transmet</b>{e.transmet}
              </div>
              <div className="x-pc-tools x-pc-full" aria-label={`Parcours des modules de l’étape ${e.verb}`}>
                {e.tools.map((t, ti) => {
                  const g = first + ti
                  // Grille de `cols` par ligne, en serpentin : ligne paire de gauche à droite,
                  // ligne impaire de droite à gauche, pour que chaque tuile touche la suivante.
                  const row = Math.floor(ti / cols), pos = ti % cols
                  const col = row % 2 === 0 ? pos : cols - 1 - pos
                  const lastTool = ti === e.tools.length - 1
                  const dir = lastTool ? '' : pos === cols - 1 ? 'a-down' : row % 2 === 0 ? 'a-right' : 'a-left'
                  const cls = `x-pc-chip ${state(g)} ${dir} ${g < active ? 'lit' : ''}`
                  const place = { ['--gr' as any]: row + 1, ['--gc' as any]: col + 1 }
                  return abonne ? (
                    <Link key={t.path + t.label} href={t.path} title={t.desc} className={cls} style={place}>
                      <i>{ti + 1}</i><span>{t.label}</span>
                    </Link>
                  ) : (
                    <span key={t.path + t.label} title={t.desc} className={cls} style={place}>
                      <i>{ti + 1}</i><span>{t.label}</span>
                    </span>
                  )
                })}
              </div>
            </div>
            {si < CHAIN.length - 1 && (
              <div className={`x-pc-link ${linkOn ? 'on' : active > last ? 'done' : ''}`} aria-hidden="true">
                <span className="x-pc-line" />
                <span className="x-pc-tag">{e.transmet} → {CHAIN[si + 1].verb}</span>
              </div>
            )}
          </Fragment>
        )
      })}
      {!abonne && (
        <div className="x-pc-cta">
          <p>Les modules s’ouvrent avec un abonnement. Essayez le parcours complet pendant 14 jours.</p>
          <Link href="/auth/register?plan=pro" className="x-btn x-btn-gold">Essai 14 jours</Link>
        </div>
      )}
    </div>
  )
}
