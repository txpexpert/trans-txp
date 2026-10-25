"""Kit 04 · Pack conformité intégral (pilotage de la fonction import)."""

ACCUEIL = r"""
<div class="eb">Kit 04 · Pack conformité intégral</div>
<h1>Piloter la conformité import <em>comme un programme</em>.</h1>
<p class="lead">Les kits 01 à 03 outillent l’origine, les régimes économiques et le classement. Ce kit les relie en un programme de conformité : une organisation, des contrôles à des moments précis, des indicateurs, et un plan de déploiement en 90 jours.</p>
<div class="box key"><b class="t">La logique de diligence raisonnable</b>L’entreprise démontre qu’elle a mis en place des procédures, des contrôles et des ressources proportionnés à ses risques. C’est ce qui fait la différence en cas de contrôle, et c’est la base d’un audit OEA (Import Process Management, 23.1).</div>
<h3>Les trois kits spécialisés</h3>
<div class="cards">
  <a class="card" href="Kit01_Origine_preferentielle_ALE.html"><span class="ic">🌍</span><b>Kit 01 · Origine et ALE</b><span>Assistant d’accord, calculateur d’origine, déclarations, suivi des preuves</span></a>
  <a class="card" href="Kit02_Regimes_suspensifs_economiques.html"><span class="ic">⚖️</span><b>Kit 02 · Régimes économiques</b><span>Choix du régime, échéances, apurement, cautionnement</span></a>
  <a class="card" href="Kit03_Classement_SH_controle_a_posteriori.html"><span class="ic">🗂️</span><b>Kit 03 · Classement et contrôle</b><span>Arbre RGI, registre SH, décisions anticipées, délais</span></a>
</div>
<h3>Les outils de pilotage</h3>
<div class="cards">
  <a class="card" href="#maturite"><span class="ic">📈</span><b>Évaluer votre maturité</b><span>Les 10 composantes du programme, notées</span></a>
  <a class="card" href="#plan"><span class="ic">🗓️</span><b>Plan de déploiement 90 jours</b><span>Tâches datées à partir de votre date de lancement</span></a>
  <a class="card" href="#raci"><span class="ic">👥</span><b>Matrice des responsabilités</b><span>Qui fait quoi, modifiable</span></a>
  <a class="card" href="#controles"><span class="ic">⏱️</span><b>Calendrier des contrôles clés</b><span>De la création de l’article à l’audit annuel</span></a>
  <a class="card" href="#kpi"><span class="ic">📊</span><b>Tableau de bord</b><span>Indicateurs calculés à partir de vos chiffres</span></a>
  <a class="card" href="#delais"><span class="ic">⏳</span><b>Délais clés consolidés</b><span>Tous les délais des trois kits</span></a>
</div>
"""

MATURITE = r"""
<div class="eb">Outil</div>
<h1>Évaluer <em>votre maturité</em></h1>
<p class="lead">Notez chacune des dix composantes d’un programme de conformité de 0 (inexistant) à 3 (en place et vérifié). Le score situe votre fonction import sur le modèle de maturité et désigne les priorités.</p>
<div id="mat"></div>
<div class="res" id="mat-res"></div>
<h3>Le modèle de maturité</h3>
<div class="tw"><table class="t">
<tr><th>Niveau</th><th>Caractéristiques</th><th>Pour passer au niveau suivant</th></tr>
<tr><td><b>1. Réactif</b></td><td>Dédouanement subi ; savoir concentré chez le transitaire ; erreurs découvertes au contrôle</td><td>Nommer un propriétaire de processus ; constituer le dossier d’opération unique</td></tr>
<tr><td><b>2. Organisé</b></td><td>Procédures écrites ; base articles ; échéanciers des titres et des régimes</td><td>Généraliser le filtre d’admissibilité et la revue post-mainlevée ; mettre en place les indicateurs</td></tr>
<tr><td><b>3. Maîtrisé</b></td><td>Filtre systématique ; contrôles clés ; indicateurs mensuels ; décisions anticipées sur les produits sensibles</td><td>Pré-diagnostic et audit OEA ou catégorisation commune</td></tr>
<tr><td><b>4. Certifié</b></td><td>OEA ; circuit vert ; cautionnement sur engagement ; dédouanement à domicile</td><td>Pilotage par la donnée ; études de temps de mainlevée ; amélioration continue</td></tr>
<tr><td><b>5. Optimisé</b></td><td>Décisions fondées sur les données ; anticipation réglementaire ; fonction import génératrice de valeur</td><td>Maintenir, auditer, partager les bonnes pratiques</td></tr>
</table></div>
<p class="ref">Import Process Management, 23.1 et 25.3.</p>
"""

PLAN = r"""
<div class="eb">Outil</div>
<h1>Plan de déploiement <em>en 90 jours</em></h1>
<p class="lead">Indiquez votre date de lancement : chaque tâche est datée et son avancement est enregistré. Le plan suit la méthode en cinq temps : mesurer, fonder la base articles, sécuriser les flux, piloter les régimes, réviser.</p>
<div class="form three"><div><label class="f" for="p-start">Date de lancement</label><input class="i" type="date" id="p-start"></div><div><label class="f" for="p-owner">Propriétaire du processus</label><input class="i" id="p-owner" placeholder="Nom et fonction"></div></div>
<div class="res" id="p-sum"></div>
<div id="p-list"></div>
<div class="btns noprint"><button class="btn" type="button" id="p-csv">Exporter le plan (CSV)</button><button class="btn" type="button" id="p-reset">Réinitialiser l’avancement</button></div>
"""

RACI = r"""
<div class="eb">Outil</div>
<h1>Matrice <em>des responsabilités</em></h1>
<p class="lead">Répartition proposée pour une importation avec paiement mise à la consommation par l’intermédiaire d’un transitaire. Adaptez-la à votre organisation : vos choix sont enregistrés. R : réalise ; A : rend compte ; C : consulté ; I : informé.</p>
<div class="tw" id="raci-t"></div>
<div class="res" id="raci-chk"></div>
<div class="btns noprint"><button class="btn" type="button" id="raci-csv">Exporter (CSV)</button><button class="btn" type="button" id="raci-reset">Revenir à la proposition</button></div>
<div class="box tip"><b class="t">Une règle simple</b>Chaque activité doit avoir un seul « A ». Nommez un propriétaire du processus import, qui rend compte de l’ensemble de la chaîne et arbitre entre les fonctions (Import Process Management, 1.4).</div>
"""

CONTROLES = r"""
<div class="eb">Contrôle</div>
<h1>Le calendrier <em>des contrôles clés</em></h1>
<p class="lead">Chaque contrôle se place à un moment précis de l’opération et prévient une erreur précise. Cochez ceux qui sont en place dans votre organisation.</p>
<ul class="cl" data-cl="ctrl">
  <li><span class="tx"><b>Création d’un article</b> — Double validation du classement (import et technique) ; recherche de circulaires de classement<span class="rf">Prévient : sous-position erronée · Kit 03</span></span></li>
  <li><span class="tx"><b>Avant commande</b> — Filtre d’admissibilité ; disponibilité du contingent ; droits antidumping par producteur<span class="rf">Prévient : marchandise bloquée, refoulée ou surtaxée</span></span></li>
  <li><span class="tx"><b>Signature du contrat</b> — Mentions obligatoires ; documents exigés du fournisseur, dont preuve d’origine et clause de coopération<span class="rf">Prévient : rejet du titre ; preuve d’origine manquante · Kit 01</span></span></li>
  <li><span class="tx"><b>Avant expédition</b> — Validité du titre d’importation ; preuve d’origine reçue et contrôlée<span class="rf">Prévient : droit commun au lieu du préférentiel</span></span></li>
  <li><span class="tx"><b>Avant signature de la DUM</b> — Rapprochement facture, DUM, titre et preuve d’origine ; documents annexes complets ; valeur reconstituée selon l’Incoterm<span class="rf">Prévient : fausse déclaration</span></span></li>
  <li><span class="tx"><b>Entre J+7 et J+30 après mainlevée</b> — Revue des écarts entre DUM, réception physique et comptabilité<span class="rf">Transforme une infraction en régularisation spontanée (CDII, art. 78-3°) · Kit 03</span></span></li>
  <li><span class="tx"><b>Chaque mois</b> — Rapprochement des comptes sous régime ; échéanciers ; consignations à récupérer<span class="rf">Prévient : comptes échus ; droits non restitués · Kit 02</span></span></li>
  <li><span class="tx"><b>Chaque année</b> — Audit d’un échantillon de dossiers ; revue des redevances, commissions et prix intragroupe<span class="rf">Prévient : redressement en contrôle a posteriori</span></span></li>
</ul>
<p class="ref">Import Process Management, 23.2.</p>
"""

KPI = r"""
<div class="eb">Outil</div>
<h1>Tableau de bord <em>de la fonction import</em></h1>
<p class="lead">Saisissez vos chiffres de la période : les indicateurs se calculent. Quatre dimensions : délai, coût, conformité, trésorerie.</p>
<div class="form three">
  <div><label class="f" for="k-per">Période</label><input class="i" id="k-per" placeholder="Ex. : septembre 2026"></div>
  <div><label class="f" for="k-dum">DUM déposées</label><input class="i" id="k-dum" inputmode="numeric"></div>
  <div><label class="f" for="k-anti">DUM enregistrées avant arrivée</label><input class="i" id="k-anti" inputmode="numeric"></div>
  <div><label class="f" for="k-delai">Délai moyen arrivée – mainlevée (jours)</label><input class="i" id="k-delai" inputmode="decimal"></div>
  <div><label class="f" for="k-vert">DUM en circuit vert</label><input class="i" id="k-vert" inputmode="numeric"></div>
  <div><label class="f" for="k-rect">Rectifications et annulations</label><input class="i" id="k-rect" inputmode="numeric"></div>
  <div><label class="f" for="k-bloc">Arrivages bloqués pour un document</label><input class="i" id="k-bloc" inputmode="numeric"></div>
  <div><label class="f" for="k-art">Articles actifs</label><input class="i" id="k-art" inputmode="numeric"></div>
  <div><label class="f" for="k-artok">Articles au classement validé et à jour</label><input class="i" id="k-artok" inputmode="numeric"></div>
  <div><label class="f" for="k-mag">Frais de magasinage et surestaries (DH)</label><input class="i" id="k-mag" inputmode="decimal"></div>
  <div><label class="f" for="k-eco">Droits économisés par les préférences (DH)</label><input class="i" id="k-eco" inputmode="decimal"></div>
  <div><label class="f" for="k-ecop">Droits économisables sur les flux éligibles (DH)</label><input class="i" id="k-ecop" inputmode="decimal"></div>
  <div><label class="f" for="k-ech">Comptes sous régime échus</label><input class="i" id="k-ech" inputmode="numeric"></div>
  <div><label class="f" for="k-gar">Garanties mobilisées (DH)</label><input class="i" id="k-gar" inputmode="decimal"></div>
  <div><label class="f" for="k-plaf">Plafond des garanties (DH)</label><input class="i" id="k-plaf" inputmode="decimal"></div>
</div>
<div class="res" id="k-out"></div>
<div class="btns noprint"><button class="btn p" type="button" id="k-save">Enregistrer la période</button><button class="btn" type="button" id="k-csv">Exporter l’historique (CSV)</button></div>
<div class="tw" id="k-hist"></div>
<p class="ref">Indicateurs : Import Process Management, 25.1.</p>
"""

ERREUR = r"""
<div class="eb">Contrôle</div>
<h1>Quand une erreur <em>est découverte</em></h1>
<div id="wiz-err"></div>
<div class="box warn"><b class="t">La pire option</b>Laisser l’erreur se répéter : chaque déclaration est une infraction distincte, et la récidive dans les trois ans d’une transaction double le maximum de l’amende (CDII, art. 257 ter).</div>
"""

DELAIS = r"""
<div class="eb">Référence</div>
<h1>Délais clés <em>consolidés</em></h1>
<div class="form three noprint" style="padding:12px 14px"><div class="full"><label class="f" for="dl-f">Filtrer</label><input class="i" id="dl-f" placeholder="Ex. : origine, ATPA, 4 ans, preuve"></div></div>
<div class="tw"><table class="t" id="dl-t">
<tr><th>Domaine</th><th>Délai</th><th>Durée</th><th>Référence</th></tr>
<tr><td>Contrôle</td><td>Révélation volontaire après mainlevée</td><td>30 jours</td><td class="ref">CDII, art. 78-3°</td></tr>
<tr><td>Contrôle</td><td>Reprise des droits</td><td>4 ans (fraude : à compter de la découverte)</td><td class="ref">CDII, art. 99 bis et 99 ter</td></tr>
<tr><td>Contrôle</td><td>Prescription des infractions</td><td>4 ans</td><td class="ref">CDII, art. 239 bis</td></tr>
<tr><td>Contrôle</td><td>Conservation des documents</td><td>4 ans</td><td class="ref">CDII, art. 42-2° et 72</td></tr>
<tr><td>Contrôle</td><td>Astreinte après mise en demeure de communiquer</td><td>48 heures, puis 500 DH par jour au plus</td><td class="ref">CDII, art. 301</td></tr>
<tr><td>Contrôle</td><td>Récidive</td><td>3 ans</td><td class="ref">CDII, art. 257 ter</td></tr>
<tr><td>Classement</td><td>Réponse à une décision anticipée</td><td>150 jours au plus</td><td class="ref">CDII, art. 45 ter-2°</td></tr>
<tr><td>Classement</td><td>Validité d’une décision anticipée</td><td>5 ans (classement), 3 ans (origine), 1 an (valeur)</td><td class="ref">CDII, art. 45 ter-2°</td></tr>
<tr><td>Classement</td><td>Déclaration globale : régularisation</td><td>365 jours, prorogeable d’un an au plus</td><td class="ref">Note D201/2026</td></tr>
<tr><td>Origine</td><td>Validité des preuves (UE, Turquie)</td><td>10 mois</td><td class="ref">Circ. 6706/233, annexe I, art. 23</td></tr>
<tr><td>Origine</td><td>Déclaration à long terme du fournisseur</td><td>2 ans au plus</td><td class="ref">Annexe I, art. 29</td></tr>
<tr><td>Origine</td><td>Délivrance d’un EUR.1 a posteriori</td><td>2 ans</td><td class="ref">Annexe I, art. 21</td></tr>
<tr><td>Origine</td><td>Réponse de la douane étrangère à une vérification</td><td>10 mois</td><td class="ref">Annexe I, art. 35</td></tr>
<tr><td>Origine</td><td>Conservation (UE et Turquie / États-Unis)</td><td>3 ans / 5 ans</td><td class="ref">Annexe I, art. 31 ; circ. 4977/222</td></tr>
<tr><td>Origine</td><td>Notification d’un rejet de préférence (États-Unis)</td><td>1 mois</td><td class="ref">Circ. 4977/222</td></tr>
<tr><td>Régimes</td><td>ATPA</td><td>6 mois, jusqu’à 2 ans</td><td class="ref">Décret, art. 105 ; CDII, art. 137</td></tr>
<tr><td>Régimes</td><td>Contestation des éléments d’apurement par l’administration</td><td>2 mois après la déclaration d’exportation</td><td class="ref">CDII, art. 136-2°</td></tr>
<tr><td>Régimes</td><td>Entrepôt de douane</td><td>1 an + 2 × 6 mois</td><td class="ref">CDII, art. 127 ; circ. 5171/313</td></tr>
<tr><td>Régimes</td><td>Transformation sous douane</td><td>3 mois + 9 mois</td><td class="ref">Décret, art. 172 septies</td></tr>
<tr><td>Régimes</td><td>Admission temporaire</td><td>2 ans, 1 an ou 6 mois selon la catégorie, jusqu’au double</td><td class="ref">Décret, art. 132</td></tr>
<tr><td>Régimes</td><td>Examen de la demande d’outillage</td><td>Huitaine</td><td class="ref">Circ. 6538/313</td></tr>
<tr><td>Régimes</td><td>Traitement d’une demande de facilité de cautionnement</td><td>30 jours</td><td class="ref">Circ. 6707/313</td></tr>
<tr><td>Régimes</td><td>Suspension d’une facilité non utilisée</td><td>3 mois ; résiliation après 1 an de suspension</td><td class="ref">Circ. 6707/313</td></tr>
<tr><td>Régimes</td><td>Drawback : demande et remboursement</td><td>Exportations de moins de 2 ans ; remboursement sous 30 jours ouvrables</td><td class="ref">CDII, art. 162 ; arrêté 840-21</td></tr>
<tr><td>Régimes</td><td>Échange standard</td><td>6 mois ; sortie du défectueux sous 2 mois en cas d’importation anticipée</td><td class="ref">CDII, art. 152 bis et 152 ter</td></tr>
<tr><td>OEA</td><td>Notification de l’éligibilité</td><td>1 mois au plus</td><td class="ref">Brochure ADII</td></tr>
<tr><td>OEA</td><td>Validité du certificat</td><td>3 ans, renouvelable après audit</td><td class="ref">Guide, n° 8-004</td></tr>
<tr><td>OEA</td><td>Suspension du statut</td><td>90 jours au plus</td><td class="ref">Guide, n° 8-004</td></tr>
<tr><td>Recours</td><td>Commission locale de concertation</td><td>Réunion tous les 15 jours ; décision sous 15 jours</td><td class="ref">CDII, art. 22 bis-2°</td></tr>
</table></div>
"""

OEA = r"""
<div class="eb">Référence</div>
<h1>Vers le statut <em>d’opérateur économique agréé</em></h1>
<p class="lead">Le statut OEA est l’aboutissement naturel d’un programme de conformité : il est accordé, sur demande volontaire, aux entreprises établies au Maroc qui remplissent quatre conditions cumulatives (décret, art. 53 bis).</p>
<ul class="cl" data-cl="oea">
  <li><span class="tx">Absence d’antécédents contentieux graves<span class="rf">Décret, art. 53 bis</span></span></li>
  <li><span class="tx">Gestion transparente des écritures et des stocks<span class="rf">Décret, art. 53 bis</span></span></li>
  <li><span class="tx">Solvabilité financière, appréciée sur les trois dernières années<span class="rf">Brochure ADII</span></span></li>
  <li><span class="tx">Respect des normes de sécurité et de sûreté<span class="rf">Décret, art. 53 bis</span></span></li>
</ul>
<div class="tw"><table class="t">
<tr><th>Statut</th><th>Avantages</th></tr>
<tr><td><b>Simplifications douanières (classe A ou B)</b></td><td>Allègement des contrôles, passage plus rapide, traitement prioritaire, accès au statut d’exportateur agréé ; plafond de cautionnement illimité en classe A</td></tr>
<tr><td><b>Sécurité et Sûreté</b> (réservé aux titulaires de la classe A)</td><td>En plus : circuit vert systématique, dédouanement à domicile, facilités pour les MEAD, reconnaissance mutuelle à l’étranger</td></tr>
</table></div>
<h3>La procédure</h3>
<ol class="l">
<li>Demande en ligne sur Diw@nati ; éligibilité notifiée dans un délai d’un mois.</li>
<li>Audit par un cabinet externe (Simplifications) ou questionnaire d’auto-évaluation en 13 volets suivi d’un audit douanier (Sécurité et Sûreté).</li>
<li>Avis de la commission d’agrément, puis convention signée avec l’ADII.</li>
<li>Certificat valable trois ans, renouvelable après un nouvel audit ; recours sous un mois en cas de rejet ou de retrait.</li>
</ol>
<div class="box tip"><b class="t">Catégorisation commune ADII–DGI</b>Avec au moins quatre ans d’activité, une seule procédure permet d’obtenir le statut OEA et le statut de contribuable catégorisé de la DGI (circ. n° 5542/314).</div>
"""

GLOSSAIRE = r"""
<div class="eb">Référence</div>
<h1>Glossaire</h1>
<div class="form three noprint" style="padding:12px 14px"><div class="full"><label class="f" for="gl-f">Filtrer</label><input class="i" id="gl-f" placeholder="Ex. : apurement"></div></div>
<div class="tw"><table class="t" id="gl-t">
<tr><th>Terme</th><th>Définition</th></tr>
<tr><td><b>Acquit à caution</b></td><td>Titre qui couvre une marchandise placée sous régime suspensif et contient l’engagement solidaire du soumissionnaire et de sa caution</td></tr>
<tr><td><b>Apurement</b></td><td>Opération qui solde un compte sous régime économique par une destination autorisée (exportation, entreposage, cession, mise à la consommation)</td></tr>
<tr><td><b>ATPA</b></td><td>Admission temporaire pour perfectionnement actif</td></tr>
<tr><td><b>BADR</b></td><td>Base automatisée des douanes en réseau, système de dédouanement de l’ADII</td></tr>
<tr><td><b>CDII</b></td><td>Code des douanes et impôts indirects</td></tr>
<tr><td><b>Certificat de décharge</b></td><td>Document qui libère le soumissionnaire et sa caution, totalement ou à proportion des quantités apurées</td></tr>
<tr><td><b>Contrôle a posteriori</b></td><td>Révision des déclarations après la mainlevée, dans un délai de quatre ans</td></tr>
<tr><td><b>Cumul</b></td><td>Règle qui permet de considérer comme originaires des matières d’un autre partenaire appliquant des règles identiques</td></tr>
<tr><td><b>Décision anticipée</b></td><td>Décision rendue par l’ADII avant l’opération sur le classement, l’origine ou la méthode d’évaluation</td></tr>
<tr><td><b>Drawback</b></td><td>Remboursement forfaitaire de droits perçus sur des matières incorporées dans des produits exportés</td></tr>
<tr><td><b>DUM</b></td><td>Déclaration unique de marchandises</td></tr>
<tr><td><b>EUR.1</b></td><td>Certificat de circulation des marchandises prouvant l’origine préférentielle</td></tr>
<tr><td><b>Exportateur agréé</b></td><td>Exportateur autorisé à établir des déclarations d’origine sans limite de valeur</td></tr>
<tr><td><b>MEAD</b></td><td>Magasins et aires de dédouanement</td></tr>
<tr><td><b>Mainlevée</b></td><td>Autorisation donnée par la douane d’enlever la marchandise</td></tr>
<tr><td><b>No-drawback</b></td><td>Règle interdisant l’utilisation, sous préférence, de matières non originaires importées en suspension de droits</td></tr>
<tr><td><b>OEA</b></td><td>Opérateur économique agréé</td></tr>
<tr><td><b>Prix départ usine</b></td><td>Prix payé au fabricant chez qui la dernière ouvraison a été effectuée</td></tr>
<tr><td><b>Règle de liste</b></td><td>Condition d’ouvraison fixée produit par produit dans un accord pour conférer l’origine</td></tr>
<tr><td><b>Révélation volontaire</b></td><td>Signalement spontané d’une inexactitude dans les 30 jours suivant la mainlevée, pouvant dispenser de pénalités</td></tr>
<tr><td><b>RGI</b></td><td>Règles générales interprétatives du Système harmonisé</td></tr>
<tr><td><b>SH</b></td><td>Système harmonisé de désignation et de codification des marchandises</td></tr>
<tr><td><b>Soumissionnaire</b></td><td>Personne qui s’engage envers l’administration en plaçant une marchandise sous régime</td></tr>
<tr><td><b>TIC</b></td><td>Taxe intérieure de consommation</td></tr>
<tr><td><b>TSD</b></td><td>Transformation sous douane</td></tr>
<tr><td><b>ZAI</b></td><td>Zone d’accélération industrielle</td></tr>
</table></div>
"""

SOURCES = r"""
<div class="eb">Référence</div>
<h1>Sources et mise à jour</h1>
<p>Le pack est établi à partir du <b>Guide des procédures douanières Maroc</b> (édition 2026, à jour des textes disponibles au 04/10/2026) et du référentiel <b>Import Process Management</b> (mise à jour du 17/10/2026), chapitres 1.4, 21, 23 et 25.</p>
<h3>Ce qu’il faut surveiller</h3>
<ul class="l">
<li>Les circulaires « études tarifaires » (nomenclature) et la série 232 (classement).</li>
<li>La série 233 (règles d’origine) : alignement attendu de l’AELE et de l’accord d’Agadir sur les règles révisées.</li>
<li>La série 313 (régimes économiques et cautionnement).</li>
<li>La loi de finances annuelle, qui modifie le code et le tarif.</li>
</ul>
<div class="box warn"><b class="t">Vos données</b>Les informations saisies dans les kits restent dans le navigateur de ce poste. Utilisez les boutons « Sauvegarder » et « Exporter » pour les conserver ou les transmettre.</div>
"""

SCRIPT = r"""
var COMP=[
 ['Gouvernance','Propriétaire du processus, responsabilités, délégations, reporting à la direction'],
 ['Politique et procédures écrites','Manuel des procédures import : filtre, déclaration, régimes, archivage, gestion des écarts'],
 ['Base articles','Pour chaque article : sous-position, RGI, origine et preuve, éléments de valeur, réglementations, décisions anticipées'],
 ['Partenaires','Sélection et suivi des transitaires, transporteurs, MEAD ; clauses fournisseurs ; agréments'],
 ['Filtre d’admissibilité','Vérification avant commande : licences, normes, contrôles sanitaires, défense commerciale'],
 ['Contrôles clés','Contrôles avant signature de la DUM, rapprochements, revue post-mainlevée'],
 ['Gestion des régimes et franchises','Échéanciers, comptabilité matières, rendements, destination des biens exonérés'],
 ['Archivage','Dossier d’opération unique, durées de conservation, restitution des originaux contre décharge'],
 ['Formation et veille','Plan de formation par fonction ; veille par séries de circulaires'],
 ['Audit et amélioration','Audit interne annuel, revue de direction, traitement des écarts, divulgation volontaire']];
var LINK={2:'Kit03_Classement_SH_controle_a_posteriori.html#registre',5:'#controles',6:'Kit02_Regimes_suspensifs_economiques.html#comptes',7:'Kit03_Classement_SH_controle_a_posteriori.html#communication',0:'#raci'};
var TASKS=[
 [1,7,'Mesurer','Nommer le propriétaire du processus import et valider la matrice des responsabilités','#raci'],
 [1,10,'Mesurer','Réaliser le diagnostic de conformité avec les fonctions import, achats, production et finance','/diagnostic'],
 [8,14,'Mesurer','Évaluer la maturité sur les dix composantes et fixer les priorités','#maturite'],
 [8,30,'Fonder la base articles','Classer chaque article actif dans le registre SH, avec fiche de classement et double validation','Kit03_Classement_SH_controle_a_posteriori.html#registre'],
 [15,35,'Fonder la base articles','Établir une fiche d’origine par produit et par accord pour les flux sous préférence','Kit01_Origine_preferentielle_ALE.html#fiche'],
 [22,40,'Fonder la base articles','Identifier les produits sensibles et déposer les demandes de décision anticipée','Kit03_Classement_SH_controle_a_posteriori.html#anticipee'],
 [30,45,'Sécuriser les flux','Insérer la clause de coopération dans les contrats fournisseurs et obtenir les déclarations à long terme','Kit01_Origine_preferentielle_ALE.html#clause'],
 [30,50,'Sécuriser les flux','Mettre en place le rapprochement à quatre pièces avant signature de la DUM','#controles'],
 [35,55,'Sécuriser les flux','Instaurer la revue post-mainlevée (J+7 à J+30) et la procédure de révélation volontaire','Kit03_Classement_SH_controle_a_posteriori.html#revelation'],
 [40,60,'Piloter les régimes','Saisir tous les comptes ouverts dans le tableau de bord et régulariser les comptes échus','Kit02_Regimes_suspensifs_economiques.html#comptes'],
 [45,65,'Piloter les régimes','Documenter les taux de rendement et de déchets ; planifier le rapprochement mensuel','Kit02_Regimes_suspensifs_economiques.html#ouverture'],
 [50,70,'Piloter les régimes','Préparer le dossier de facilité de cautionnement adaptée','Kit02_Regimes_suspensifs_economiques.html#caution'],
 [55,75,'Réviser','Organiser l’archivage par dossier d’opération (4 ans) et les décharges du transitaire','Kit03_Classement_SH_controle_a_posteriori.html#communication'],
 [60,80,'Réviser','Mettre en place le tableau de bord mensuel des indicateurs','#kpi'],
 [70,85,'Réviser','Former les équipes : achats, logistique, finance, production','#maturite'],
 [80,90,'Réviser','Refaire le diagnostic et la maturité ; présenter les résultats à la direction','/diagnostic']];
var ROLES=['Achats','Supply / import','Finance','Qualité','Transitaire','Banque'];
var ACT=[['Classement, origine, valeur (fiche article)','C','A','I','C','R','–'],['Filtre d’admissibilité','C','A/R','–','R','C','–'],['Négociation et contrat','A/R','C','C','C','–','–'],
 ['Engagement d’importation (PortNet)','I','A/R','C','–','C','R'],['Paiement et couverture de change','I','C','A/R','–','–','R'],['Suivi du transport et déclaration sommaire','I','A','–','–','C','–'],
 ['Dossier de conformité technique','C','A','–','R','C','–'],['Rédaction et signature de la DUM','–','A','I','–','R','–'],['Paiement ou garantie des droits','–','C','A/R','–','C','C'],
 ['Remise du titre imputé à la banque','–','A/R','C','–','C','R'],['Archivage du dossier d’opération','–','A/R','C','C','R','–'],['Revue post-mainlevée à 30 jours','–','A/R','C','–','C','–']];
document.addEventListener('kit:ready',function(){
  /* Maturité */
  var mat=store.get('mat',{}),lab=['0 · Inexistant','1 · Partiel, non écrit','2 · En place, non vérifié','3 · En place et vérifié'];
  $('#mat').innerHTML='<div class="tw"><table class="t"><tr><th>#</th><th>Composante</th><th>Contenu attendu</th><th>Niveau</th></tr>'+COMP.map(function(c,i){
    return '<tr><td>'+(i+1)+'</td><td><b>'+c[0]+'</b></td><td>'+c[1]+'</td><td><select class="i" data-m="'+i+'"><option value="">—</option>'+lab.map(function(l,j){return '<option value="'+j+'"'+(String(mat[i])===String(j)?' selected':'')+'>'+l+'</option>';}).join('')+'</select></td></tr>';}).join('')+'</table></div>';
  function mr(){var vals=COMP.map(function(_,i){return mat[i]===''||mat[i]==null?null:+mat[i];}),done=vals.filter(function(v){return v!=null;});
    if(!done.length){$('#mat-res').innerHTML='<p class="muted">Notez au moins une composante.</p>';return;}
    var s=done.reduce(function(a,b){return a+b;},0)/(done.length*3),lvl=s<0.25?'1. Réactif':s<0.5?'2. Organisé':s<0.75?'3. Maîtrisé':s<0.92?'4. Certifié':'5. Optimisé';
    var low=COMP.map(function(c,i){return [i,vals[i]];}).filter(function(x){return x[1]!=null&&x[1]<2;}).sort(function(a,b){return a[1]-b[1];});
    var bars=COMP.map(function(c,i){var v=vals[i];return '<div style="display:grid;grid-template-columns:230px 1fr 40px;gap:10px;align-items:center;margin-bottom:6px;font-size:13.5px"><span>'+c[0]+'</span><div class="progress" style="margin:0"><i style="width:'+(v==null?0:v/3*100)+'%"></i></div><span class="ref">'+(v==null?'—':v+'/3')+'</span></div>';}).join('');
    $('#mat-res').innerHTML='<div class="kpis"><div class="kpi"><b>'+pct(s,0)+'</b><span>Score de maturité ('+done.length+'/10 composantes notées)</span></div><div class="kpi"><b style="font-size:22px">'+lvl+'</b><span>Niveau indicatif</span></div><div class="kpi"><b>'+low.length+'</b><span>Composantes prioritaires (niveau 0 ou 1)</span></div></div>'+bars+
      (low.length?'<h4>Priorités</h4><ol class="l">'+low.map(function(x){var l=LINK[x[0]];return '<li><b>'+COMP[x[0]][0]+'</b> — '+COMP[x[0]][1]+(l?' · <a href="'+l+'">Outil associé →</a>':'')+'</li>';}).join('')+'</ol>':'');}
  $('#mat').addEventListener('change',function(e){var i=e.target.dataset.m;if(i==null)return;mat[i]=e.target.value;store.set('mat',mat);mr();});mr();

  /* Plan 90 jours */
  var pst=store.get('plan',{start:'',owner:'',done:{}});$('#p-start').value=pst.start||'';$('#p-owner').value=pst.owner||'';
  function pl(){pst.start=$('#p-start').value;pst.owner=$('#p-owner').value;store.set('plan',pst);var d0=parseDate(pst.start),n=0,late=0,h='',cur='';
    TASKS.forEach(function(t,i){var ok=!!pst.done[i];if(ok)n++;var deb=d0?addDays(d0,t[0]-1):null,fin=d0?addDays(d0,t[1]-1):null,lt=fin&&!ok&&fin<today();if(lt)late++;
      if(t[2]!==cur){if(cur)h+='</ul>';h+='<h4>'+t[2]+'</h4><ul class="cl">';cur=t[2];}
      h+='<li class="'+(ok?'done':'')+'"><input type="checkbox" data-t="'+i+'"'+(ok?' checked':'')+'><span class="tx">'+t[3]+' <a href="'+t[4]+'">→</a><span class="rf">Jours '+t[0]+' à '+t[1]+(d0?' · du '+fmtDate(deb)+' au '+fmtDate(fin):'')+(lt?' · <b style="color:var(--red)">en retard</b>':'')+'</span></span></li>';});
    $('#p-list').innerHTML=h+'</ul>';
    $('#p-sum').innerHTML='<div class="kpis"><div class="kpi"><b>'+n+'/'+TASKS.length+'</b><span>Tâches réalisées</span></div><div class="kpi"><b>'+late+'</b><span>Tâches en retard</span></div><div class="kpi"><b>'+(d0?fmtDate(addDays(d0,89)):'—')+'</b><span>Fin du plan</span></div></div><div class="progress"><i style="width:'+(n/TASKS.length*100)+'%"></i></div>';}
  $('#p-list').addEventListener('change',function(e){var i=e.target.dataset.t;if(i==null)return;pst.done[i]=e.target.checked;pl();});
  ['#p-start','#p-owner'].forEach(function(s){$(s).addEventListener('input',pl);});
  $('#p-reset').addEventListener('click',function(){if(confirm('Réinitialiser l’avancement du plan ?')){pst.done={};pl();}});
  $('#p-csv').addEventListener('click',function(){var d0=parseDate(pst.start);download(toCSV([['Étape','Tâche','Début','Fin','Fait']].concat(TASKS.map(function(t,i){return [t[2],t[3],d0?fmtDate(addDays(d0,t[0]-1)):'J'+t[0],d0?fmtDate(addDays(d0,t[1]-1)):'J'+t[1],pst.done[i]?'Oui':'Non'];}))),'plan-90-jours.csv','text/csv;charset=utf-8');});
  pl();

  /* RACI */
  var rc=store.get('raci',null)||ACT.map(function(a){return a.slice(1);}),OPT=['–','R','A','C','I','A/R'];
  function rd(){$('#raci-t').innerHTML='<table class="t"><tr><th>Activité</th>'+ROLES.map(function(r){return '<th>'+r+'</th>';}).join('')+'</tr>'+ACT.map(function(a,i){return '<tr><td><b>'+a[0]+'</b></td>'+ROLES.map(function(_,j){return '<td><select class="i" style="min-width:70px" data-r="'+i+'" data-c="'+j+'">'+OPT.map(function(o){return '<option'+(rc[i][j]===o?' selected':'')+'>'+o+'</option>';}).join('')+'</select></td>';}).join('')+'</tr>';}).join('')+'</table>';
    var pb=ACT.map(function(a,i){var n=rc[i].filter(function(v){return v.indexOf('A')>=0;}).length;return n!==1?a[0]+' : '+(n?n+' responsables finaux (A)':'aucun responsable final (A)'):null;}).filter(Boolean);
    $('#raci-chk').innerHTML=pb.length?'<div class="box warn"><b class="t">À corriger</b><ul class="l">'+pb.map(function(p){return '<li>'+p+'</li>';}).join('')+'</ul></div>':'<div class="box ok">Chaque activité a un seul responsable final (A).</div>';}
  $('#raci-t').addEventListener('change',function(e){var t=e.target;if(t.dataset.r==null)return;rc[+t.dataset.r][+t.dataset.c]=t.value;store.set('raci',rc);rd();});
  $('#raci-reset').addEventListener('click',function(){rc=ACT.map(function(a){return a.slice(1);});store.set('raci',rc);rd();});
  $('#raci-csv').addEventListener('click',function(){download(toCSV([['Activité'].concat(ROLES)].concat(ACT.map(function(a,i){return [a[0]].concat(rc[i]);}))),'matrice-raci.csv','text/csv;charset=utf-8');});
  rd();

  /* Indicateurs */
  var ids=['per','dum','anti','delai','vert','rect','bloc','art','artok','mag','eco','ecop','ech','gar','plaf'],kd=store.get('kpi-cur',{});ids.forEach(function(i){if(kd[i]!=null)$('#k-'+i).value=kd[i];});
  function kc(){var v={};ids.forEach(function(i){v[i]=$('#k-'+i).value;});store.set('kpi-cur',v);var g=function(i){return num(v[i]);},dum=g('dum');
    function r(a,b){return a!=null&&b?a/b:null;}
    var K=[['Délai','Délai moyen arrivée – mainlevée',g('delai')==null?'—':g('delai').toString().replace('.',',')+' j'],['Délai','Taux de dédouanement avant arrivée',pct(r(g('anti'),dum))],
      ['Conformité','Part du circuit vert',pct(r(g('vert'),dum))],['Conformité','Taux de rectification',pct(r(g('rect'),dum))],['Conformité','Taux de blocage pour document',pct(r(g('bloc'),dum))],
      ['Conformité','Couverture de la base articles',pct(r(g('artok'),g('art')))],['Coût','Magasinage et surestaries par dossier',money(r(g('mag'),dum))],
      ['Coût','Taux d’utilisation des préférences',pct(r(g('eco'),g('ecop')))],['Trésorerie','Comptes sous régime échus',g('ech')==null?'—':String(g('ech'))],['Trésorerie','Utilisation du plafond de garanties',pct(r(g('gar'),g('plaf')))]];
    $('#k-out').innerHTML='<div class="tw"><table class="t"><tr><th>Dimension</th><th>Indicateur</th><th>Valeur</th></tr>'+K.map(function(k){return '<tr><td>'+k[0]+'</td><td>'+k[1]+'</td><td><b>'+k[2]+'</b></td></tr>';}).join('')+'</table></div>';return K;}
  $$('#kpi input').forEach(function(el){el.addEventListener('input',kc);});
  function kh(){var h=store.get('kpi-hist',[]);if(!h.length){$('#k-hist').innerHTML='';return;}
    $('#k-hist').innerHTML='<table class="t"><tr><th>Période</th><th>Délai</th><th>Avant arrivée</th><th>Circuit vert</th><th>Rectification</th><th>Base articles</th><th>Préférences</th><th>Comptes échus</th><th></th></tr>'+h.map(function(x,i){return '<tr><td>'+esc(x.per)+'</td><td>'+x.k[0]+'</td><td>'+x.k[1]+'</td><td>'+x.k[2]+'</td><td>'+x.k[3]+'</td><td>'+x.k[5]+'</td><td>'+x.k[7]+'</td><td>'+x.k[8]+'</td><td><button class="btn s" data-kd="'+i+'">✕</button></td></tr>';}).join('')+'</table>';}
  $('#k-hist').addEventListener('click',function(e){var i=e.target.dataset.kd;if(i==null)return;var h=store.get('kpi-hist',[]);h.splice(+i,1);store.set('kpi-hist',h);kh();});
  $('#k-save').addEventListener('click',function(){var K=kc(),h=store.get('kpi-hist',[]);h.push({per:$('#k-per').value||new Date().toLocaleDateString('fr-FR'),k:K.map(function(k){return k[2];})});store.set('kpi-hist',h);kh();toast('Période enregistrée');});
  $('#k-csv').addEventListener('click',function(){var h=store.get('kpi-hist',[]),K=kc();download(toCSV([['Période'].concat(K.map(function(k){return k[1];}))].concat(h.map(function(x){return [x.per].concat(x.k);}))),'indicateurs-import.csv','text/csv;charset=utf-8');});
  kc();kh();

  /* Erreur découverte */
  var K3='Kit03_Classement_SH_controle_a_posteriori.html';
  Wizard($('#wiz-err'),{
    s:{q:'Avez-vous été informé d’un contrôle ou d’une enquête portant sur l’opération ?',o:[['Non','t'],['Oui','ctl']]},
    t:{q:'Depuis combien de temps la mainlevée a-t-elle été donnée ?',o:[['30 jours au plus','rev'],['Plus de 30 jours','late']]},
    rev:{r:'<h3 style="margin-top:0">Révélez l’erreur sans attendre</h3><p>Vous pouvez être dispensé de tout ou partie des pénalités : la demande indique les énonciations rectifiées et les motifs, avec les justificatifs ; les marchandises doivent être encore sous douane ou intactes et identifiables (CDII, art. 78-3° ; décret, art. 74 et 74 bis).</p><p><a href="'+K3+'#revelation">Préparer la lettre de révélation →</a></p>'},
    late:{r:'<h3 style="margin-top:0">Régularisez quand même</h3><p>La dispense de l’article 78-3° n’est plus possible, mais la bonne foi, la régularisation spontanée et l’absence d’antécédents sont les éléments pris en compte en transaction (Import Process Management, 23.3). Corrigez la cause pour que l’erreur ne se répète pas.</p><p><a href="'+K3+'#delais">Vérifier les délais de reprise →</a></p>'},
    ctl:{r:'<h3 style="margin-top:0">Coopérez et documentez</h3><p>La révélation volontaire n’est plus ouverte. Répondez par écrit dans les délais, en listant les pièces remises ; en cas de désaccord, saisissez la commission locale de concertation. Une transaction peut réduire les amendes, jamais les droits et taxes sauf abandon des marchandises (CDII, art. 22 bis, 273 à 278).</p><p><a href="'+K3+'#controle">Voir la conduite à tenir →</a></p>'}
  },'s');

  /* Filtres */
  function filt(inp,tbl){$(inp).addEventListener('input',function(){var q=this.value.toLowerCase();$$(tbl+' tr').forEach(function(tr,i){if(i===0)return;tr.style.display=!q||tr.textContent.toLowerCase().indexOf(q)>=0?'':'none';});});}
  filt('#dl-f','#dl-t');filt('#gl-f','#gl-t');
});
"""

KIT = dict(id='kit04', num='Kit 04', title='Pack conformité intégral', short='Pack intégral',
           color=('#153E82', '#E9EFF9', '#C9D6EE'),
           intro='Relier les trois kits en un programme : organisation, contrôles, indicateurs, plan de déploiement en 90 jours.',
           groups=[
               ('Démarrer', [('accueil', '🏠', 'Accueil du pack', '', ACCUEIL), ('maturite', '📈', 'Évaluer votre maturité', 'outil', MATURITE), ('plan', '🗓️', 'Plan de déploiement 90 jours', 'outil', PLAN)]),
               ('Organiser', [('raci', '👥', 'Matrice des responsabilités', 'outil', RACI), ('controles', '⏱️', 'Calendrier des contrôles clés', 'liste', CONTROLES)]),
               ('Piloter', [('kpi', '📊', 'Tableau de bord', 'outil', KPI), ('erreur', '🚨', 'Quand une erreur est découverte', 'outil', ERREUR), ('oea', '🏅', 'Vers le statut OEA', 'liste', OEA)]),
               ('Référence', [('delais', '⏳', 'Délais clés consolidés', '', DELAIS), ('glossaire', '🔤', 'Glossaire', '', GLOSSAIRE), ('sources', '📚', 'Sources et mise à jour', '', SOURCES)]),
           ], script=SCRIPT)
