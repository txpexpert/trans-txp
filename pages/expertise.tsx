// pages/expertise.tsx — le volet humain : Douane Engineering, prestations à l'acte, kits.
import Link from 'next/link'
import SiteShell from '../components/SiteShell'
import { PRESTATIONS } from '../lib/suite'

const KITS = [
  { n: 'Kit 01', t: 'Origine préférentielle et ALE', f: 'Kit01_Origine_preferentielle_ALE.html',
    d: 'Assistant « quel accord, quelle preuve ? », calculateur d’origine (règle de valeur, 35 %, plus-value), fiche d’origine, déclarations et clauses générées, suivi des preuves, check-lists.' },
  { n: 'Kit 02', t: 'Régimes suspensifs et économiques', f: 'Kit02_Regimes_suspensifs_economiques.html',
    d: 'Choix du régime, calculateur d’échéance, simulateur d’apurement, tableau de bord des comptes, test d’accès aux facilités de cautionnement, modèles d’engagement et de mandat.' },
  { n: 'Kit 03', t: 'Classement SH et contrôle a posteriori', f: 'Kit03_Classement_SH_controle_a_posteriori.html',
    d: 'Arbre de décision RGI, fiche et registre de classement, décisions anticipées, délais du contrôle, lettre de révélation volontaire, conduite à tenir face à un contrôle.' },
  { n: 'Kit 04', t: 'Pack conformité intégral', f: 'Kit04_Pack_conformite_integral.html',
    d: 'Maturité de la fonction import, plan de déploiement en 90 jours, matrice des responsabilités, contrôles clés, tableau de bord, et accès aux trois kits.' },
]

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

      <section className="x-sec x-sec-dark">
        <div className="x-wrap">
          <div className="x-eyebrow">À l’acte, en complément de l’abonnement</div>
          <h2 className="x-h2">Trois niveaux d’intervention, <em>un prix connu d’avance</em>.</h2>
          <p className="x-sub">L’abonnement couvre l’usage de la plateforme par utilisateur. Les demandes de renseignement et de conseil sont facturées à l’opération ; le plan Expert en inclut deux par mois.</p>
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
          <p className="x-sub" style={{ marginBottom: 8 }}>Des kits interactifs complets : menu de rubriques, outils de calcul, assistants, modèles générés et tableaux de suivi, établis à partir du Guide des procédures douanières (édition 2026, à jour au 04/10/2026). Chaque règle y est rattachée à son texte. Utilisables en ligne ou téléchargés, sans installation.</p>
          <div className="x-plans">
            {KITS.map(k => (
              <div className="x-plan" key={k.n}>
                <span className="x-num">{k.n}</span>
                <h3 style={{ fontSize: 22, margin: '8px 0' }}>{k.t}</h3>
                <p style={{ margin: 0, color: 'var(--x-ink2)', fontSize: 14.5, flex: 1 }}>{k.d}</p>
                <div style={{ marginTop: 18, display: 'flex', gap: 8, flexWrap: 'wrap' }}><a href={`/kits/${k.f}`} target="_blank" rel="noreferrer" className="x-btn x-btn-dark">Ouvrir le kit</a><a href={`/kits/${k.f}`} download className="x-btn x-btn-line">Télécharger</a></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  )
}
