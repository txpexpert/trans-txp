// pages/cas-types.tsx — cas types illustratifs, chacun rattaché à ses textes officiels.
import Link from 'next/link'
import SiteShell from '../components/SiteShell'
import { CAS_TYPES } from '../lib/casTypes'

export default function CasTypes() {
  return (
    <SiteShell title="Cas types : les erreurs d’importation qui se révèlent plus tard | IXP-Import-eXPert"
      description="Trois situations d’importation fréquentes, expliquées à partir des textes officiels : valeur en douane, origine préférentielle, régimes économiques.">
      <section className="x-hero" style={{ paddingBottom: 24 }}>
        <div className="x-wrap">
          <div className="x-eyebrow">Cas types</div>
          <h1 className="x-h1" style={{ maxWidth: 900 }}>L’erreur ne se voit pas au dédouanement. <em>Elle se paie au contrôle.</em></h1>
          <p className="x-lead">Trois situations fréquentes, expliquées pas à pas : ce qui s’est passé, le point qui coince, ce que cela coûte, et ce qu’Import-eXPert aurait signalé avant l’opération. Chaque mécanisme est rattaché au texte officiel qui le fonde.</p>
          <p className="x-disclaimer">Cas illustratifs construits à partir des textes : les entreprises et situations sont fictives.</p>
        </div>
      </section>

      <section className="x-sec-tight" style={{ paddingTop: 0 }}>
        <div className="x-wrap">
          {CAS_TYPES.map((c, i) => (
            <article className="x-cas-full" id={c.slug} key={c.slug}>
              <div className="x-eyebrow">Cas type {i + 1} · {c.domaine}</div>
              <h2>{c.titre}</h2>
              <p className="x-cas-acc">{c.accroche}</p>
              <div className="x-cas-steps">
                <div><h4>La situation</h4><p>{c.situation}</p></div>
                <div><h4>Le point qui coince</h4><p>{c.ceQuiCoince}</p></div>
                <div><h4>Ce que cela coûte</h4><p>{c.consequence}</p></div>
                <div><h4>Ce qu’Import-eXPert signale avant</h4><p>{c.ceQueVoitIxp}</p></div>
              </div>
              <div className="x-cas-src">
                <span className="x-mono">TEXTES DE RÉFÉRENCE</span>
                {c.textes.map(t => <div key={t.ref}><b>{t.ref}</b> · {t.objet}</div>)}
              </div>
              <div style={{ marginTop: 18, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {c.outils.map(o => <Link key={o.path} href={o.path} className="x-btn x-btn-line x-btn-sm">{o.label}</Link>)}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="x-sec x-sec-dark">
        <div className="x-wrap x-center">
          <h2 className="x-h2">Et dans votre entreprise, <em>combien d’opérations sont exposées</em> ?</h2>
          <p className="x-sub">Le diagnostic couvre huit domaines, mesure votre exposition et produit un plan d’action.</p>
          <div style={{ marginTop: 24 }}><Link href="/diagnostic" className="x-btn x-btn-gold">Mesurer mon exposition</Link></div>
        </div>
      </section>
    </SiteShell>
  )
}
