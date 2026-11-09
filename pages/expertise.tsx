// pages/expertise.tsx — le volet humain : Douane Engineering, prestations à l'acte, kits.
import Link from 'next/link'
import SiteShell from '../components/SiteShell'
import { PRESTATIONS } from '../lib/suite'
import { KITS_PRATIQUES, kitHref, kitCompletHref, nbKitsEnLettres } from '../lib/kitsPratiques'


export default function Expertise() {
  return (
    <SiteShell title="Expertise et services | IXP-Import-eXPert" description="Douane Engineering : renseignements, avis motivés et accompagnement de dossiers par des experts douaniers.">
      <section className="x-hero">
        <div className="x-wrap x-hero-grid">
          <div>
            <div className="x-eyebrow">Douane Engineering</div>
            <h1 className="x-h1">Derrière la plateforme, <em>des experts douaniers</em>.</h1>
            <p className="x-lead">Import-eXPert est né du terrain : dix-huit ans de pratique douanière, une méthode d’amélioration continue issue du Lean Six Sigma, et des ouvrages de référence sur l’ingénierie douanière et les guerres tarifaires. Le logiciel industrialise ce savoir ; l’équipe reste disponible quand un dossier sort de l’ordinaire.</p>
            <div className="x-hero-cta">
              <Link href="/contact?sujet=renseignement" className="x-btn x-btn-dark">Poser une question à un expert</Link>
              <Link href="/contact?sujet=mission" className="x-btn x-btn-line">Décrire une mission</Link>
            </div>
          </div>
          <div className="x-panel">
            <div className="x-eyebrow">Publications</div>
            <ul className="x-list">
              <li><em>Douane Engineering</em> (2026)</li>
              <li><em>Guerres douanières</em> · <em>Customs Wars</em> (2026), sur la guerre tarifaire américaine</li>
              <li>Glossaire douanier trilingue FR · EN · AR (à paraître)</li>
            </ul>
            <p className="x-note" style={{ marginTop: 0 }}>Chaque réponse experte s’appuie sur les mêmes sources que la plateforme : Code des douanes, circulaires ADII, CGI, IGOC, accords de libre-échange.</p>
          </div>
        </div>
      </section>

      <section className="x-sec-tight" id="acces-expert">
        <div className="x-wrap">
          <div className="x-eyebrow">Deux portes d’entrée</div>
          <h2 className="x-h2">Un expert pour <em>votre dossier</em>.</h2>
          <div className="x-tools" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
            <a className="x-tool" href="/tools/douane-engineering.html" style={{ borderTop: '3px solid var(--x-gold, #B8922A)' }}>
              <b>Douane Engineering</b>
              <p>Assistance et accompagnement expert : diagnostic de vos flux, structuration de vos opérations, optimisation tarifaire et sécurisation des dossiers sensibles.</p>
              <span className="x-tier">Découvrir l’offre →</span>
            </a>
            <a className="x-tool" href="/modules/conseil" style={{ borderTop: '3px solid #1A3A9A' }}>
              <b>Conseil personnalisé</b>
              <p>Un expert douanier répond à votre question ou étudie votre cas : opérations complexes, litiges, classement, origine ou valeur.</p>
              <span className="x-tier">Soumettre une demande →</span>
            </a>
          </div>
        </div>
      </section>

      <section className="x-sec x-sec-dark">
        <div className="x-wrap">
          <div className="x-eyebrow">À l’acte, en complément de l’abonnement</div>
          <h2 className="x-h2">Des interventions cadrées, <em>un prix connu d’avance</em>.</h2>
          <p className="x-sub">L’abonnement couvre l’usage de la plateforme par utilisateur. Les demandes de renseignement et de conseil sont facturées à l’opération ; le plan Premium en inclut deux par mois.</p>
          <div className="x-presta">
            {PRESTATIONS.map(p => (
              <div key={p.nom}><span className="x-mono">{p.delai}</span><h4>{p.nom}</h4><p>{p.desc}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="x-sec" id="kits">
        <div className="x-wrap">
          <div className="x-eyebrow">Kits opérationnels</div>
          <h2 className="x-h2">Vos dossiers les plus sensibles, <em>déjà structurés</em>.</h2>
          <p className="x-sub" style={{ marginBottom: 8 }}>{nbKitsEnLettres()} kits d’expertise, édition 2026, à consulter en ligne ou à télécharger sans installation. Chaque règle y est rattachée à son texte. Pour les kits 01 à 04, une version interactive complète ajoute les outils de calcul, les assistants, les modèles générés et les tableaux de suivi.</p>
          <div className="x-plans">
            {KITS_PRATIQUES.map(k => {
              const complet = kitCompletHref(k)
              return (
                <div className="x-plan" key={k.num}>
                  <span className="x-num">Kit {k.num}</span>
                  <h3 style={{ fontSize: 22, margin: '8px 0' }}>{k.titre}</h3>
                  <p style={{ margin: 0, color: 'var(--x-ink2)', fontSize: 14.5, flex: 1 }}>{k.detail}</p>
                  <div style={{ marginTop: 18, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <a href={kitHref(k)} target="_blank" rel="noopener" className="x-btn x-btn-dark x-btn-sm">Consulter</a>
                    <a href={kitHref(k)} download={k.fichier} className="x-btn x-btn-line x-btn-sm">Télécharger</a>
                    {complet && <a href={complet} target="_blank" rel="noopener" className="x-btn x-btn-line x-btn-sm">Kit interactif complet</a>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </SiteShell>
  )
}
