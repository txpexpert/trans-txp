// pages/accords/index.tsx — Accords préférentiels : page d'aiguillage.
// Une carte par partenaire (lib/accords.ts) qui ouvre la page détaillée
// /accords/{slug}, et l'actualité des accords lue dans la base
// (/api/piloter/intel?a=recent&kind=accords), mise à jour à chaque ingestion.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import SiteShell from '../../components/SiteShell'
import { ACCORDS, MAJ_ACCORDS, type Accord } from '../../lib/accords'

type News = { numero: string; titre: string; type_document: string | null; date_doc: string | null; extrait: string | null }

const dfr = (d: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR') : '')

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
  const [news, setNews] = useState<News[] | null>(null)
  const [newsErr, setNewsErr] = useState(false)

  useEffect(() => {
    fetch('/api/piloter/intel?a=recent&kind=accords&n=6', { credentials: 'same-origin' })
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(r => setNews(r.data ?? []))
      .catch(() => setNewsErr(true))
  }, [])

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
            Quel accord s’applique à votre marchandise, quelle preuve d’origine présenter, et ce qui a changé récemment.
            Chaque fiche reprend le texte de l’accord, les règles d’origine, les contingents et les circulaires de l’ADII.
          </p>
          <p className="x-mono" style={{ marginTop: 14 }}>Fiches mises à jour le {MAJ_ACCORDS}</p>
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

      <section className="x-sec-tight" style={{ paddingTop: 0 }}>
        <div className="x-wrap">
          <div className="x-eyebrow">Actualité des accords</div>
          <p className="x-note" style={{ marginTop: 6 }}>Derniers textes sur les accords, l’origine et les contingents intégrés à la base.</p>
          <div className="x-acc-news">
            {newsErr && <div className="x-acc-n">Actualité indisponible pour le moment.</div>}
            {!newsErr && news === null && <div className="x-acc-n">Chargement…</div>}
            {news?.map(n => (
              <div key={n.numero + (n.date_doc ?? '')} className="x-acc-n">
                <span className="x-mono">{dfr(n.date_doc)}{n.numero ? ` · ${n.type_document === 'circulaire' ? 'Circulaire n° ' : ''}${n.numero}` : ''}</span>
                <b>{n.titre}</b>
                {n.extrait && <p>{n.extrait.slice(0, 170)}…</p>}
              </div>
            ))}
          </div>

          <p className="x-note">
            Pour qualifier l’origine d’un produit précis, utilisez aussi <Link href="/modules/origine-aleca" style={{ textDecoration: 'underline' }}>Origine ALECA / UE</Link>.
            Une question ? <Link href="/#assistant" style={{ textDecoration: 'underline' }}>IXP-Assistant</Link> répond en citant la circulaire.
          </p>
        </div>
      </section>
    </SiteShell>
  )
}
