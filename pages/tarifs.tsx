// pages/tarifs.tsx — abonnement par utilisateur + prestations expertes à l'acte.
// Montants repris de la grille actuelle (pages/abonnements.tsx) : à valider avant mise en ligne.
import Link from 'next/link'
import SiteShell from '../components/SiteShell'
import { PLANS, PRESTATIONS } from '../lib/suite'

const FAQ = [
  ['Comment est calculé l’abonnement ?', 'Par utilisateur et par mois, hors taxes. Le plan Entreprise couvre toute une équipe sur devis.'],
  ['Que coûte l’avis d’un expert ?', 'Les renseignements et avis sont facturés à l’opération, selon un barème communiqué avant toute intervention. Le plan Expert en inclut deux par mois.'],
  ['L’essai gratuit donne-t-il accès à tout ?', 'Oui : 14 jours d’accès au plan Expert.'],
  ['Comment se règle l’abonnement ?', 'Par virement bancaire, en dirhams, mensuellement ou annuellement (deux mois offerts).'],
]

export default function Tarifs() {
  return (
    <SiteShell title="Tarifs | IXP-Import-eXPert" description="Abonnement par utilisateur, prestations expertes à l'acte, essai gratuit de 14 jours.">
      <section className="x-hero" style={{ paddingBottom: 24 }}>
        <div className="x-wrap x-center">
          <div className="x-eyebrow">Tarifs</div>
          <h1 className="x-h1">Un abonnement pour la plateforme, <em>l’expert à l’acte</em>.</h1>
          <p className="x-lead">Chaque palier couvre une portion plus longue de la chaîne. Essai gratuit de 14 jours.</p>
        </div>
      </section>

      <section className="x-sec-tight" style={{ paddingTop: 0 }}>
        <div className="x-wrap">
          <div className="x-plans">
            {PLANS.map(p => (
              <div key={p.id} className={`x-plan ${p.vedette ? 'vedette' : ''}`}>
                <h3>{p.nom}</h3>
                <p className="pour">{p.pour}</p>
                <div className="x-price">{p.prix === '0' ? 'Gratuit' : `${p.prix} DH`}<small>{p.unite}</small></div>
                <ul className="x-list">{p.inclus.map(t => <li key={t}>{t}</li>)}</ul>
                <Link href={p.href} className={`x-btn ${p.vedette ? 'x-btn-dark' : 'x-btn-line'}`} style={{ justifyContent: 'center' }}>{p.cta}</Link>
              </div>
            ))}
          </div>
          <p className="x-note x-center">Prix hors taxes. Engagement annuel : deux mois offerts.</p>
        </div>
      </section>

      <section className="x-sec x-sec-dark">
        <div className="x-wrap">
          <div className="x-eyebrow">À l’opération</div>
          <h2 className="x-h2">Renseignements et conseil, <em>facturés à l’acte</em>.</h2>
          <div className="x-presta">
            {PRESTATIONS.map(p => (
              <div key={p.nom}><span className="x-mono">{p.delai}</span><h4>{p.nom}</h4><p>{p.desc}</p></div>
            ))}
          </div>
          <div style={{ marginTop: 28 }}><Link href="/expertise" className="x-btn x-btn-gold">En savoir plus sur nos experts</Link></div>
        </div>
      </section>

      <section className="x-sec">
        <div className="x-wrap" style={{ maxWidth: 820 }}>
          <h2 className="x-h2">Questions fréquentes</h2>
          {FAQ.map(([q, a]) => (
            <details key={q} style={{ borderBottom: '1px solid var(--x-line)', padding: '18px 0' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 500, fontSize: 17 }}>{q}</summary>
              <p style={{ color: 'var(--x-ink2)', margin: '10px 0 0' }}>{a}</p>
            </details>
          ))}
        </div>
      </section>
    </SiteShell>
  )
}
