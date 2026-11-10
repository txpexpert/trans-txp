// pages/demo/fiche-produit.tsx
// Modèle de démonstration du livrable de l'étape Qualifier : la fiche produit
// douane, sourcée et datée. Classement, taux et textes : données réelles de la
// base (décision n° 6780/232, tarif 2026). Fournisseur, valeurs et quantités :
// fictifs, signalés comme tels. Montre aussi la barre de progression proposée.
import Link from 'next/link'
import SiteShell from '../../components/SiteShell'

const dh = (n: number) => Math.round(n).toLocaleString('fr-FR') + ' DH'

// Calcul illustratif (valeurs fictives)
const QTE = 500, FOB_U = 420, FRET = 18000, ASSUR = 2100
const FOB = QTE * FOB_U
const VD = FOB + FRET + ASSUR
const DI = VD * 0.30
const TPI = VD * 0.0025
const TVA = (VD + DI + TPI) * 0.20

const MODULES = [
  { n: 1, label: 'Classement tarifaire SH', action: 'Code SH recherché et retenu', done: true },
  { n: 2, label: 'Décisions de classement', action: 'Décision consultée et rattachée', done: true },
  { n: 3, label: 'Documents requis par code SH', action: 'Liste des documents établie', done: true },
  { n: 4, label: 'Autorisations et licences', action: 'Contrôle MIC vérifié', done: false },
  { n: 5, label: 'Marchandises dangereuses', action: 'Statut de la marchandise renseigné', done: false },
  { n: 6, label: 'Marquage et signalisation', action: 'Mentions d’étiquetage vérifiées', done: false },
  { n: 7, label: 'Accords préférentiels', action: 'Origine et accord renseignés', done: false },
]

export default function FicheProduitDemo() {
  const faits = MODULES.filter(m => m.done).length
  const prochain = MODULES.find(m => !m.done)!
  return (
    <SiteShell title="Modèle de fiche produit douane | IXP-Import-eXPert" description="Exemple du livrable de l’étape Qualifier : fiche produit douane, sourcée et datée.">
      <section className="x-hero" style={{ paddingBottom: 18 }}>
        <div className="x-wrap">
          <div className="x-eyebrow">Modèle de démonstration · Étape 01 Qualifier</div>
          <h1 className="x-h1 x-h1-sm">La fiche produit douane, <em>sourcée et datée</em>.</h1>
          <p className="x-lead">Le livrable de l’étape Qualifier : tout ce qu’il faut savoir sur un produit avant de le commander, chaque information rattachée à son texte.</p>
          <p className="x-disclaimer">Classement, taux et textes réels (décision n° 6780/232 du 21/10/2026, tarif 2026). Fournisseur, prix et quantités fictifs.</p>
        </div>
      </section>

      {/* Aperçu de la barre de progression */}
      <section className="x-sec-tight" style={{ paddingTop: 0 }}>
        <div className="x-wrap">
          <div className="x-prog x-c-qualifier">
            <div className="x-prog-top">
              <div className="x-prog-steps">
                <b>Qualifier {faits}/7</b><span>Optimiser</span><span>Chiffrer</span><span>Exécuter</span><span>Sécuriser</span>
              </div>
              <span className="x-mono">Aperçu de la barre de progression</span>
            </div>
            <div className="x-prog-bar">
              {MODULES.map(m => <span key={m.n} className={m.done ? 'ok' : ''} title={`${m.label} : ${m.action}`} />)}
            </div>
            <div className="x-prog-foot">
              <span><b>{faits} modules sur 7</b> réalisés · Livrable : fiche produit <b>à compléter</b></span>
              <span className="x-prog-next">Prochaine action : {prochain.label} →</span>
            </div>
          </div>
        </div>
      </section>

      {/* La fiche */}
      <section className="x-sec-tight">
        <div className="x-wrap">
          <article className="x-fp">
            <header className="x-fp-hd">
              <div>
                <span className="x-mono">FICHE PRODUIT DOUANE · RÉF. INTERNE ART-10452 (FICTIVE)</span>
                <h2>Compteur d’énergie intelligent monophasé</h2>
                <p>Référence DDSU666-H · boîtier compact sur rail · mesure la consommation, la production solaire et les échanges avec le réseau, et pilote la batterie via l’onduleur.</p>
              </div>
              <div className="x-fp-stamp">
                <span>Vérifiée le</span><b>10/11/2026</b>
                <span>Prochaine revue</span><b>Loi de finances 2027</b>
              </div>
            </header>

            <div className="x-fp-grid">
              <section>
                <h3>1. Classement tarifaire</h3>
                <div className="x-fp-code">9028.30.10.90</div>
                <p>Compteurs d’électricité › basse et moyenne tension › <b>autres</b> (appareil monté, avec boîtier).</p>
                <dl>
                  <dt>Droit d’importation</dt><dd><b>30 %</b> (tarif 2026)</dd>
                  <dt>Justification</dt><dd>Règles générales interprétatives 1 et 6</dd>
                  <dt>Décision</dt><dd>Circulaire n° 6780/232 du 21/10/2026, prise en application de l’article 45 ter du Code des douanes</dd>
                </dl>
                <p className="x-fp-alert"><b>Point de vigilance.</b> Les composantes de compteur monophasé <b>sans boîtier</b> relèvent d’une autre sous-position (9028.30.10.11), à 2,5 %. Un compteur complet déclaré comme composante, c’est 27,5 points de droit en moins à l’importation, puis à rappeler lors d’un contrôle.</p>
              </section>

              <section>
                <h3>2. Origine et accord</h3>
                <dl>
                  <dt>Fournisseur</dt><dd>Fournisseur A (fictif)</dd>
                  <dt>Pays d’origine</dt><dd>Chine</dd>
                  <dt>Accord préférentiel</dt><dd>Aucun applicable : droit commun</dd>
                  <dt>Preuve d’origine</dt><dd>Certificat d’origine non préférentiel, à conserver au dossier</dd>
                </dl>
                <h3 style={{ marginTop: 24 }}>3. Valeur en douane</h3>
                <dl>
                  <dt>Prix unitaire</dt><dd>{dh(FOB_U)} départ usine chargé (fictif)</dd>
                  <dt>À ajouter</dt><dd>Fret et assurance jusqu’à la frontière (Code des douanes, art. 20 ter-1° e et g)</dd>
                  <dt>Redevances, commissions</dt><dd>Aucune déclarée par le fournisseur</dd>
                  <dt>Poids net / brut</dt><dd>0,25 kg / 0,35 kg par unité (fictif)</dd>
                  <dt>Unité</dt><dd>Unité (u)</dd>
                </dl>
              </section>

              <section>
                <h3>4. Documents et autorisations</h3>
                <ul className="x-fp-docs">
                  <li><span className="ob">Obligatoire</span>Facture commerciale</li>
                  <li><span className="ob">Obligatoire</span>Titre de transport</li>
                  <li><span className="ob">Obligatoire</span>Déclaration unique de marchandises (DUM)</li>
                  <li><span className="co">À vérifier</span>Listes MIC des produits industriels soumis à contrôle (mise à jour du 17/05/2025)</li>
                  <li><span className="re">Recommandé</span>Fiche technique du produit, à l’appui du classement</li>
                </ul>
              </section>

              <section>
                <h3>5. Coût à l’importation (exemple : {QTE} unités)</h3>
                <table className="x-fp-calc">
                  <tbody>
                    <tr><td>Valeur départ usine</td><td>{dh(FOB)}</td></tr>
                    <tr><td>Fret et assurance</td><td>{dh(FRET + ASSUR)}</td></tr>
                    <tr className="sub"><td>Valeur en douane</td><td>{dh(VD)}</td></tr>
                    <tr><td>Droit d’importation 30 %</td><td>{dh(DI)}</td></tr>
                    <tr><td>Taxe parafiscale à l’importation 0,25 %</td><td>{dh(TPI)}</td></tr>
                    <tr><td>TVA à l’importation 20 %</td><td>{dh(TVA)}</td></tr>
                    <tr className="tot"><td>Droits et taxes</td><td>{dh(DI + TPI + TVA)}</td></tr>
                  </tbody>
                </table>
                <p className="x-fp-note">Le calcul complet (frais de port, transit, change) se fait à l’étape Chiffrer.</p>
              </section>
            </div>

            <footer className="x-fp-ft">
              <div>
                <span className="x-mono">TEXTES DE RÉFÉRENCE</span>
                <p>Circulaire n° 6780/232 du 21/10/2026 · Code des douanes, art. 20 ter et 45 ter · Règles générales interprétatives 1 et 6 · TPI 0,25 % : note n° D7106/16/ADII/100 · Tarif des droits d’importation 2026</p>
              </div>
              <div>
                <span className="x-mono">TRANSMIS À L’ÉTAPE SUIVANTE</span>
                <p>Code SH 9028.30.10.90, droit de 30 %, origine Chine, documents exigés → <b>Optimiser</b></p>
              </div>
            </footer>
            <p className="x-fp-disc">Document d’aide à la décision, établi à partir des informations saisies et des textes disponibles à la date de vérification. Il ne constitue ni une décision ni un avis opposable : les données finales sont celles édictées par les autorités compétentes.</p>
          </article>
          <div style={{ marginTop: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/fiches/nouvelle" className="x-btn x-btn-dark">Créer ma fiche produit</Link>
            <Link href="/auth/register?plan=pro" className="x-btn x-btn-line">Essai 14 jours</Link>
            <Link href="/espaces/qualifier" className="x-btn x-btn-line">Découvrir l’espace Qualifier</Link>
          </div>
        </div>
      </section>
    </SiteShell>
  )
}
