// pages/profils/[segment].tsx — page par profil : douleur, gain, première action et offre adaptée.
import type { GetStaticPaths, GetStaticProps } from 'next'
import Link from 'next/link'
import SiteShell from '../../components/SiteShell'
import { PROFILS_PAGES, type Profil } from '../../lib/profils'

export const getStaticPaths: GetStaticPaths = async () => ({ paths: PROFILS_PAGES.map(p => ({ params: { segment: p.id } })), fallback: false })
export const getStaticProps: GetStaticProps<{ p: Profil }> = async ({ params }) => ({ props: { p: PROFILS_PAGES.find(x => x.id === params?.segment)! } })

export default function PageProfil({ p }: { p: Profil }) {
  return (
    <SiteShell title={`${p.titre} | IXP-Import-eXPert`} description={p.lead}>
      <section className="x-hero">
        <div className="x-wrap">
          <div className="x-eyebrow">{p.eyebrow}</div>
          <h1 className="x-h1 x-h1-sm">{p.h1[0]} <em>{p.h1[1]}</em></h1>
          <p className="x-lead">{p.lead}</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
            <Link href={p.activation.href} className="x-btn x-btn-dark">{p.activation.cta}</Link>
            {p.preuves.map(x => <Link key={x.href} href={x.href} className="x-btn x-btn-line">{x.t}</Link>)}
          </div>
        </div>
      </section>
      <section className="x-sec x-sec-white">
        <div className="x-wrap">
          <div className="x-eyebrow">Ce qui coûte déjà, sans se voir</div>
          <div className="x-pf-grid">{p.douleurs.map(d => <div key={d.t} className="x-pf-card"><h3>{d.t}</h3><p>{d.d}</p></div>)}</div>
        </div>
      </section>
      <section className="x-sec">
        <div className="x-wrap x-two">
          <div>
            <div className="x-eyebrow">Ce que vous obtenez</div>
            <ul className="x-list">{p.gains.map(g => <li key={g}>{g}</li>)}</ul>
          </div>
          <div className="x-ff">
            <div className="x-eyebrow">{p.activation.t}</div>
            <p>{p.activation.d}</p>
            <Link href={p.activation.href} className="x-btn x-btn-dark">{p.activation.cta}</Link>
          </div>
        </div>
      </section>
      <section className="x-sec x-sec-dark">
        <div className="x-wrap">
          <div className="x-eyebrow">Offre adaptée</div>
          <h2 className="x-h2">{p.offre.nom}</h2>
          <p className="x-sub">{p.offre.pourquoi}</p>
          <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href={p.offre.href} className="x-btn x-btn-gold">Voir l’offre</Link>
            <Link href="/diagnostic" className="x-btn x-btn-line">Mesurer mon exposition</Link>
          </div>
          <p className="x-note" style={{ marginTop: 18 }}>L’outil répond, l’expert tranche : chaque réponse s’appuie sur le texte officiel, et aucun avis opposable n’est signé par une machine.</p>
        </div>
      </section>
    </SiteShell>
  )
}
