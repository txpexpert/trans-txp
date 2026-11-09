// pages/accords/index.tsx — Accords préférentiels : page d'aiguillage.
// Une carte par partenaire (lib/accords.ts) qui ouvre la page détaillée
// /accords/{slug}.
import Link from 'next/link'
import SiteShell from '../../components/SiteShell'
import { ACCORDS, type Accord } from '../../lib/accords'

function Carte({ a }: { a: Accord }) {
  return (
    <Link href={`/accords/${a.slug}`} className="x-acc-card">
      <div className="x-acc-top">
        <span className="x-acc-code">{a.code}</span>
        <div>
          <b className="x-acc-name">{a.partenaire}</b>
          <span className="x-acc-nature">{a.nature}</span>
        </div>
      </div>
      <dl className="x-acc-dl">
        <dt>Signature</dt><dd>{a.signature}</dd>
        <dt>{a.unilateral ? 'Période' : 'En vigueur'}</dt><dd>{a.vigueur}</dd>
        <dt>{a.unilateral ? 'Texte de référence' : 'Circulaires'}</dt><dd>{a.circulaires.join(' · ')}</dd>
        <dt>Preuve d’origine</dt><dd>{a.preuve}</dd>
      </dl>
      <p className="x-acc-actu"><b>À retenir</b>{a.actu}</p>
      <span className="x-acc-go">Ouvrir la fiche complète →</span>
    </Link>
  )
}

export default function AccordsPage() {
  const ale = ACCORDS.filter(a => !a.unilateral)
  const uni = ACCORDS.filter(a => a.unilateral)

  return (
    <SiteShell
      title="Accords préférentiels du Maroc : UE, Royaume-Uni, États-Unis, Türkiye, Chine | IXP-Import-eXPert"
      description="Régime tarifaire, règles et preuves d’origine, contingents et circulaires ADII de chaque accord préférentiel du Maroc, mis à jour au fil des textes."
    >
      <section className="x-esp-hd x-c-qualifier">
        <div className="x-wrap">
          <div className="x-crumb"><Link href="/espaces/qualifier">Qualifier</Link> / Accords préférentiels</div>
          <div className="x-eyebrow">Origine et préférences tarifaires</div>
          <h1 className="x-h1" style={{ fontSize: 'clamp(34px,4.4vw,54px)' }}>Accords préférentiels</h1>
          <p className="x-lead">
            Quel accord s’applique à votre marchandise, quelle preuve d’origine présenter, et ce qui a changé récemment ?
            Chaque fiche reprend le texte de l’accord, les règles d’origine et les contingents.
          </p>
        </div>
      </section>

      <section className="x-sec-tight">
        <div className="x-wrap">
          <div className="x-eyebrow">Accords de libre-échange et d’association</div>
          <div className="x-acc-grid">{ale.map(a => <Carte key={a.slug} a={a} />)}</div>

          <div className="x-eyebrow" style={{ marginTop: 44 }}>Régime préférentiel unilatéral</div>
          <p className="x-note" style={{ marginTop: 6 }}>
            Le tarif zéro chinois n’est pas un accord : la Chine l’accorde seule, pour une durée limitée, et peut le modifier sans négociation.
          </p>
          <div className="x-acc-grid">{uni.map(a => <Carte key={a.slug} a={a} />)}</div>

        </div>
      </section>

    </SiteShell>
  )
}
