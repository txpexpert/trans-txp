// pages/espaces/[slug].tsx — un espace de travail = un regroupement d'outils existants.
// Mise en page (nov. 2026) : les outils de l'étape en colonne à gauche, l'outil choisi affiché au
// centre dans un cadre (le premier par défaut ; #outil-N pour un autre). La tuile de l'outil affiché
// prend la couleur pleine de l'étape. Dans le cadre, l'en-tête et le pied du site sont masqués
// (classe ixp-cadre posée par _document, ixp-chrome.js pour les pages HTML autonomes).
// La barre « Dossier en cours » préfigure la phase 2 : le contexte (code SH,
// origine, valeur, Incoterm) est conservé d'un espace à l'autre et transmis
// aux outils en paramètres d'URL.
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import ProgressBar from '../../components/ProgressBar'
import type { GetStaticPaths, GetStaticProps } from 'next'
import SiteShell from '../../components/SiteShell'
import { CHAIN, ESPACES, TIER_LABEL, espaceBySlug } from '../../lib/suite'

type Ctx = { sh: string; origine: string; valeur: string; incoterm: string }
const EMPTY: Ctx = { sh: '', origine: '', valeur: '', incoterm: '' }
const KEY = 'ixp-dossier'

export default function EspacePage({ slug }: { slug: string }) {
  const e = espaceBySlug(slug)!
  const [ctx, setCtx] = useState<Ctx>(EMPTY)
  // Contexte transmis à l'outil affiché : appliqué quand on quitte un champ, pour ne pas recharger l'outil à chaque frappe
  const [ctxOutil, setCtxOutil] = useState<Ctx>(EMPTY)
  // Outil affiché au centre : le premier par défaut, ou celui de l'ancre #outil-N
  const [sel, setSel] = useState(0)
  const [charge, setCharge] = useState(true)
  const cadre = useRef<HTMLIFrameElement>(null)
  const obs = useRef<ResizeObserver | null>(null)

  useEffect(() => {
    try { const raw = sessionStorage.getItem(KEY); if (raw) { const c = { ...EMPTY, ...JSON.parse(raw) }; setCtx(c); setCtxOutil(c) } } catch { /* stockage indisponible */ }
  }, [])
  useEffect(() => {
    const lire = () => {
      const m = /^#outil-(\d+)$/.exec(window.location.hash)
      const n = m ? Number(m[1]) - 1 : 0
      setSel(n >= 0 && n < e.tools.length ? n : 0)
    }
    lire()
    window.addEventListener('hashchange', lire)
    return () => window.removeEventListener('hashchange', lire)
  }, [slug])
  useEffect(() => () => obs.current?.disconnect(), [])

  const update = (k: keyof Ctx, v: string) => {
    const next = { ...ctx, [k]: v }
    setCtx(next)
    try { sessionStorage.setItem(KEY, JSON.stringify(next)) } catch { /* stockage indisponible */ }
  }
  const qsDe = (c: Ctx) => new URLSearchParams(Object.entries(c).filter(([, v]) => v)).toString()
  const withCtx = (path: string, c: Ctx = ctx) => { const q = qsDe(c); return q ? `${path}?${q}` : path }

  const choisir = (n: number) => {
    setSel(n); setCharge(true); setCtxOutil(ctx)
    try { history.replaceState(null, '', n === 0 ? window.location.pathname : `#outil-${n + 1}`) } catch { /* sans historique */ }
    if (window.innerWidth <= 960) document.getElementById('outil')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Hauteur du cadre ajustée au contenu de l'outil (même origine)
  const ajuster = () => {
    setCharge(false)
    const f = cadre.current
    obs.current?.disconnect()
    try {
      const doc = f?.contentDocument
      if (!f || !doc) return
      const maj = () => { f.style.height = Math.max(640, doc.documentElement.scrollHeight, doc.body?.scrollHeight || 0) + 'px' }
      maj()
      obs.current = new ResizeObserver(maj)
      obs.current.observe(doc.documentElement)
      if (doc.body) obs.current.observe(doc.body)
    } catch { /* contenu d'une autre origine : hauteur minimale */ }
  }

  const i = CHAIN.findIndex(c => c.slug === slug)
  const prev = i > 0 ? CHAIN[i - 1] : null
  const next = i >= 0 && i < CHAIN.length - 1 ? CHAIN[i + 1] : null
  const outil = e.tools[sel] || e.tools[0]
  const src = withCtx(outil.path, ctxOutil)

  return (
    <SiteShell title={`${e.verb} · ${e.title} | IXP-Import-eXPert`} description={e.promise}>
      <section className={`x-sec-tight x-c-${e.slug}`} style={{ paddingTop: 18 }}>
        <div className="x-wrap">
          <div className="x-crumb"><Link href="/plateforme">Plateforme</Link> / {e.chain ? `Étape ${e.num}` : 'Couche transversale'}</div>

          <div className="x-esp">
            <aside className="x-esp-side" aria-label="Outils de cette étape">
              <div className="x-esp-side-hd"><span>Outils de l’étape</span><span>{e.tools.length}</span></div>
              {e.tools.map((t, n) => (
                <button key={t.path} type="button" className="x-esp-tile" aria-current={n === sel ? 'true' : undefined} onClick={() => choisir(n)}>
                  <span className="x-esp-n">{String(n + 1).padStart(2, '0')}</span>
                  <span className="x-esp-tx"><b>{t.label}</b><small>{t.desc}</small></span>
                  <span className="x-tier">{TIER_LABEL[t.tier]}</span>
                </button>
              ))}
            </aside>

            <div className="x-esp-centre">
              <div className="x-esp-intro">
                <div className="x-eyebrow">{e.chain ? `Étape ${e.num} · ${e.title}` : e.title}</div>
                <h1 className="x-h1" style={{ fontSize: 'clamp(34px,4vw,52px)' }}>{e.verb}</h1>
                <p className="x-lead" style={{ margin: 0 }}><strong style={{ fontWeight: 500, color: 'var(--x-ink)' }}>{e.question}</strong> {e.promise}</p>
                <div className="x-esp-meta">
                  <div><b>Livrable</b>{e.livrable}</div>
                  <div><b>{e.chain ? 'Transmis à l’étape suivante' : 'Utilisé par'}</b>{e.transmet}</div>
                </div>
              </div>

              {e.chain && <ProgressBar etape={e.slug} livrable={e.livrable} />}

              {e.chain && (
                <div className="x-ctx">
                  <div className="x-ctx-hd">
                    <strong>Dossier en cours</strong>
                    <span className="x-mono">CONSERVÉ D’UN ESPACE À L’AUTRE</span>
                  </div>
                  <div className="x-ctx-grid" onBlur={() => { if (qsDe(ctx) !== qsDe(ctxOutil)) { setCtxOutil(ctx); setCharge(true) } }}>
                    <input aria-label="Code SH" placeholder="Code SH" data-k="sh" value={ctx.sh} onChange={ev => update('sh', ev.target.value)} />
                    <input aria-label="Origine" placeholder="Origine (ex. UE)" data-k="origine" value={ctx.origine} onChange={ev => update('origine', ev.target.value)} />
                    <input aria-label="Valeur" placeholder="Valeur (DH)" data-k="valeur" value={ctx.valeur} onChange={ev => update('valeur', ev.target.value)} />
                    <input aria-label="Incoterm" placeholder="Incoterm (ex. FOB)" data-k="incoterm" value={ctx.incoterm} onChange={ev => update('incoterm', ev.target.value)} />
                  </div>
                  <small>Ces informations suivent votre navigation et sont transmises à l’outil affiché.</small>
                </div>
              )}

              <div className="x-esp-outil" id="outil">
                <div className="x-esp-outil-hd">
                  <div>
                    <h2>{outil.label}</h2>
                    <p>{outil.desc} · <span style={{ fontFamily: 'var(--x-mono)', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase' }}>{TIER_LABEL[outil.tier]}</span></p>
                  </div>
                  <a href={src} target="_blank" rel="noopener">Ouvrir en pleine page ↗</a>
                </div>
                {charge && <div className="x-esp-charge">Chargement de l’outil…</div>}
                <iframe key={src} ref={cadre} src={src} title={outil.label} className="x-esp-frame" onLoad={ajuster} />
              </div>

              <p className="x-note" style={{ margin: 0 }}>Une question sur cette étape ? <Link href="/#assistant" style={{ textDecoration: 'underline' }}>IXP-Assistant</Link> répond en citant le texte, et un <Link href="/expertise" style={{ textDecoration: 'underline' }}>expert</Link> peut rendre un avis motivé.</p>

              {e.chain && (
                <nav className="x-flow" aria-label="Étapes de la chaîne" style={{ marginTop: 8 }}>
                  {prev ? <Link href={`/espaces/${prev.slug}`}><span>← Étape {prev.num}</span><b>{prev.verb}</b></Link> : <span />}
                  {next && <Link href={`/espaces/${next.slug}`} className="next"><span>Étape {next.num} →</span><b>{next.verb}</b></Link>}
                </nav>
              )}
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  )
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: ESPACES.map(e => ({ params: { slug: e.slug } })),
  fallback: false,
})
export const getStaticProps: GetStaticProps = async ({ params }) => ({ props: { slug: String(params?.slug) } })
