// pages/espaces/[slug].tsx — un espace de travail = un regroupement d'outils existants.
// La barre « Dossier en cours » préfigure la phase 2 : le contexte (code SH,
// origine, valeur, Incoterm) est conservé d'un espace à l'autre et transmis
// aux outils en paramètres d'URL.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { GetStaticPaths, GetStaticProps } from 'next'
import SiteShell from '../../components/SiteShell'
import { CHAIN, ESPACES, TIER_LABEL, espaceBySlug } from '../../lib/suite'

type Ctx = { sh: string; origine: string; valeur: string; incoterm: string }
const EMPTY: Ctx = { sh: '', origine: '', valeur: '', incoterm: '' }
const KEY = 'ixp-dossier'

export default function EspacePage({ slug }: { slug: string }) {
  const e = espaceBySlug(slug)!
  const [ctx, setCtx] = useState<Ctx>(EMPTY)

  useEffect(() => {
    try { const raw = sessionStorage.getItem(KEY); if (raw) setCtx({ ...EMPTY, ...JSON.parse(raw) }) } catch { /* stockage indisponible */ }
  }, [])
  const update = (k: keyof Ctx, v: string) => {
    const next = { ...ctx, [k]: v }
    setCtx(next)
    try { sessionStorage.setItem(KEY, JSON.stringify(next)) } catch { /* stockage indisponible */ }
  }
  const qs = new URLSearchParams(Object.entries(ctx).filter(([, v]) => v)).toString()
  const withCtx = (path: string) => (qs ? `${path}?${qs}` : path)

  const i = CHAIN.findIndex(c => c.slug === slug)
  const prev = i > 0 ? CHAIN[i - 1] : null
  const next = i >= 0 && i < CHAIN.length - 1 ? CHAIN[i + 1] : null

  return (
    <SiteShell title={`${e.verb} · ${e.title} | IXP-Import-eXPert`} description={e.promise}>
      <section className={`x-esp-hd x-c-${e.slug}`}>
        <div className="x-wrap x-esp-grid">
          <div>
            <div className="x-crumb"><Link href="/plateforme">Plateforme</Link> / {e.chain ? `Étape ${e.num}` : 'Couche transversale'}</div>
            <div className="x-eyebrow">{e.chain ? `Étape ${e.num} · ${e.title}` : e.title}</div>
            <h1 className="x-h1" style={{ fontSize: 'clamp(38px,4.6vw,58px)' }}>{e.verb}</h1>
            <p className="x-lead"><strong style={{ fontWeight: 500, color: 'var(--x-ink)' }}>{e.question}</strong> {e.promise}</p>
          </div>
          <div className="x-meta">
            <div><b>Livrable</b>{e.livrable}</div>
            <div><b>{e.chain ? 'Transmis à l’étape suivante' : 'Utilisé par'}</b>{e.transmet}</div>
          </div>
        </div>
      </section>

      <section className="x-sec-tight">
        <div className="x-wrap">
          {e.chain && (
            <div className="x-ctx">
              <div className="x-ctx-hd">
                <strong>Dossier en cours</strong>
                <span className="x-mono">CONSERVÉ D’UN ESPACE À L’AUTRE</span>
              </div>
              <div className="x-ctx-grid">
                <input aria-label="Code SH" placeholder="Code SH" data-k="sh" value={ctx.sh} onChange={ev => update('sh', ev.target.value)} />
                <input aria-label="Origine" placeholder="Origine (ex. UE)" data-k="origine" value={ctx.origine} onChange={ev => update('origine', ev.target.value)} />
                <input aria-label="Valeur" placeholder="Valeur (DH)" data-k="valeur" value={ctx.valeur} onChange={ev => update('valeur', ev.target.value)} />
                <input aria-label="Incoterm" placeholder="Incoterm (ex. FOB)" data-k="incoterm" value={ctx.incoterm} onChange={ev => update('incoterm', ev.target.value)} />
              </div>
              <small>Démo : ces informations suivent votre navigation et sont transmises aux outils. La lecture automatique par chaque outil relève de la phase 2 de la refonte.</small>
            </div>
          )}

          <div className={`x-tools x-c-${e.slug}`}>
            {e.tools.map(t => (
              <Link key={t.path} href={withCtx(t.path)} data-base={t.path} className="x-tool">
                <b>{t.label}</b>
                <p>{t.desc}</p>
                <span className="x-tier">{TIER_LABEL[t.tier]}</span>
              </Link>
            ))}
          </div>

          <p className="x-note">Une question sur cette étape ? <Link href="/#assistant" style={{ textDecoration: 'underline' }}>IXP-Assistant</Link> répond en citant le texte, et un <Link href="/expertise" style={{ textDecoration: 'underline' }}>expert</Link> peut rendre un avis motivé.</p>

          {e.chain && (
            <nav className="x-flow" aria-label="Étapes de la chaîne">
              {prev ? <Link href={`/espaces/${prev.slug}`}><span>← Étape {prev.num}</span><b>{prev.verb}</b></Link> : <span />}
              {next && <Link href={`/espaces/${next.slug}`} className="next"><span>Étape {next.num} →</span><b>{next.verb}</b></Link>}
            </nav>
          )}
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
