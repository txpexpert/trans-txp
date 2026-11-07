import Link from 'next/link'
import SiteShell from '../components/SiteShell'

const ETAPES = [
  { n: '01', t: 'Qualifier', d: 'Le code SH justifié et tout ce qu’il déclenche : documents, licences, marquage.', h: '/espaces/qualifier' },
  { n: '02', t: 'Optimiser', d: 'L’origine, l’accord et le régime qui réduisent légalement le coût.', h: '/espaces/optimiser' },
  { n: '03', t: 'Chiffrer', d: 'Le coût de revient réel, rendu chez vous.', h: '/espaces/chiffrer' },
  { n: '04', t: 'Exécuter', d: 'Un dossier complet et une déclaration vérifiée avant dépôt.', h: '/espaces/executer' },
  { n: '05', t: 'Sécuriser', d: 'Ce qui pourrait être contesté, et comment s’en prémunir.', h: '/espaces/securiser' },
]

export default function APropos() {
  return (
    <SiteShell title="À propos | IXP-Import-eXPert" description="IXP-Import-eXPert : plateforme marocaine de conformité et d’optimisation douanière, conçue et animée par des experts douaniers.">
      <section className="x-hero">
        <div className="x-wrap x-hero-grid">
          <div>
            <div className="x-eyebrow">À propos</div>
            <h1 className="x-h1">La douane marocaine, <em>rendue lisible</em>.</h1>
            <p className="x-lead">IXP-Import-eXPert est une plateforme de conformité et d’optimisation douanière dédiée aux importateurs, exportateurs, transitaires et cabinets de conseil au Maroc. Elle qualifie, chiffre et sécurise chaque opération avant qu’elle ne soit engagée.</p>
            <div className="x-hero-cta">
              <Link href="/plateforme" className="x-btn x-btn-dark">Découvrir la plateforme</Link>
              <Link href="/contact" className="x-btn x-btn-line">Nous contacter</Link>
            </div>
          </div>
          <div className="x-panel">
            <div className="x-eyebrow">Né du terrain</div>
            <p style={{ margin: 0 }}>Dix-huit ans de pratique douanière, une méthode d’amélioration continue issue du Lean Six Sigma et des ouvrages de référence sur l’ingénierie douanière. Le logiciel industrialise ce savoir ; l’équipe d’experts reste disponible quand un dossier sort de l’ordinaire.</p>
            <p className="x-note">Sources mobilisées : Code des douanes et impôts indirects, circulaires de l’administration des douanes, Code général des impôts, instruction générale des opérations de change, accords de libre-échange.</p>
          </div>
        </div>
      </section>

      <section className="x-sec">
        <div className="x-wrap">
          <div className="x-eyebrow">Notre méthode</div>
          <h2 className="x-h2">Une opération, <em>cinq étapes</em>, un seul dossier.</h2>
          <div className="x-tools">
            {ETAPES.map(e => (
              <Link key={e.n} href={e.h} className="x-tool"><span className="x-mono">{e.n}</span><b>{e.t}</b><p>{e.d}</p></Link>
            ))}
          </div>
        </div>
      </section>

      <section className="x-sec-tight">
        <div className="x-wrap x-split">
          <div>
            <div className="x-eyebrow">Nos engagements</div>
            <ul className="x-list">
              <li>Chaque réponse cite le texte qui la fonde.</li>
              <li>Des contenus datés et mis à jour au fil des circulaires et des lois de finances.</li>
              <li>Des experts douaniers pour les dossiers qui sortent de l’ordinaire.</li>
            </ul>
          </div>
          <div>
            <div className="x-eyebrow">Aller plus loin</div>
            <ul className="x-list">
              <li><Link href="/expertise">Expertise et services</Link></li>
              <li><Link href="/diagnostic">Diagnostic de conformité</Link></li>
              <li><Link href="/tarifs">Tarifs</Link></li>
            </ul>
          </div>
        </div>
      </section>
    </SiteShell>
  )
}
