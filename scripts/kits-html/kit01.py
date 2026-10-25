"""Kit 01 · Origine préférentielle et accords de libre-échange."""

ACCUEIL = r"""
<div class="eb">Kit 01 · Origine préférentielle et ALE</div>
<h1>Payer le bon droit, <em>et pouvoir le prouver</em>.</h1>
<p class="lead">Un droit préférentiel n’est acquis que si trois conditions sont réunies : la marchandise est originaire au sens de l’accord invoqué, elle a été transportée sans modification, et elle est couverte par une preuve valable. Ce kit vous accompagne sur chacune, de la vérification d’éligibilité jusqu’au contrôle a posteriori.</p>
<div class="box key"><b class="t">Pourquoi c’est important</b>Si la douane du pays d’exportation ne confirme pas l’origine dans les 10 mois suivant une demande de vérification, la préférence est refusée et les droits de droit commun sont réclamés, avec un délai de reprise de quatre ans (circ. n° 6706/233, annexe I, art. 35 ; CDII, art. 99 bis).</div>
<h3>Votre parcours</h3>
<div class="steps">
  <div class="step"><div><b>Identifier l’accord et la preuve</b><br><span class="muted">L’assistant indique, selon le pays et le sens de l’opération, l’accord applicable, la preuve, sa validité et les mentions.</span> <a href="#assistant">Ouvrir l’assistant →</a></div></div>
  <div class="step"><div><b>Vérifier le caractère originaire</b><br><span class="muted">Calculez le critère de valeur (UE, Turquie), le critère de 35 % (États-Unis) ou la plus-value de droit commun.</span> <a href="#calcul">Ouvrir le calculateur →</a></div></div>
  <div class="step"><div><b>Documenter</b><br><span class="muted">Remplissez la fiche d’origine produit et générez vos déclarations et clauses fournisseurs.</span> <a href="#fiche">Ouvrir la fiche →</a></div></div>
  <div class="step"><div><b>Contrôler et suivre</b><br><span class="muted">Déroulez les check-lists avant chaque déclaration et suivez la validité et la conservation de chaque preuve.</span> <a href="#suivi">Ouvrir le suivi →</a></div></div>
</div>
<h3>Les outils du kit</h3>
<div class="cards">
  <a class="card" href="#assistant"><span class="ic">🧭</span><b>Assistant « quel accord ? »</b><span>Accord, preuve, validité, mentions et points de vigilance</span></a>
  <a class="card" href="#calcul"><span class="ic">🧮</span><b>Calculateur d’origine</b><span>Règle de valeur, tolérance de 15 %, critère de 35 %, plus-value</span></a>
  <a class="card" href="#fiche"><span class="ic">📋</span><b>Fiche d’origine produit</b><span>À remplir, imprimer et conserver au dossier</span></a>
  <a class="card" href="#decl"><span class="ic">✍️</span><b>Déclaration d’origine</b><span>Texte prêt à reporter sur la facture, FR et EN</span></a>
  <a class="card" href="#fourn"><span class="ic">🤝</span><b>Déclaration du fournisseur</b><span>Déclaration à long terme, deux ans au plus</span></a>
  <a class="card" href="#suivi"><span class="ic">⏱️</span><b>Suivi des preuves</b><span>Validité, conservation et alertes</span></a>
</div>
"""

PRINCIPES = r"""
<div class="eb">Comprendre</div>
<h1>Les règles d’origine <em>en une page</em></h1>
<h3>Origine non préférentielle et origine préférentielle</h3>
<div class="tw"><table class="t">
<tr><th></th><th>Origine non préférentielle (droit commun)</th><th>Origine préférentielle (accords)</th></tr>
<tr><td><b>À quoi elle sert</b></td><td>Appliquer le tarif et les mesures commerciales ; certificats « CO Rose » à l’export vers les pays sans accord</td><td>Obtenir un droit réduit ou nul au titre d’un accord de libre-échange</td></tr>
<tr><td><b>Critère</b></td><td>Entièrement obtenu, ou transformation complète : plus-value au moins égale à la valeur d’importation des produits mis en œuvre, ou opération figurant à l’annexe I du décret</td><td>Entièrement obtenu, ou ouvraison suffisante selon la règle de liste du produit fini dans l’accord invoqué</td></tr>
<tr><td><b>Base de calcul</b></td><td>Prix départ usine (facture du transformateur) et valeur d’importation (déclaration certifiée)</td><td>Prix départ usine et valeur des matières non originaires</td></tr>
<tr><td><b>Références</b></td><td class="ref">CDII, art. 16 à 19 ; décret, art. 1er et 2 ; circ. 5549/230</td><td class="ref">Circ. 6706/233, annexe I ; circ. 4977/222</td></tr>
</table></div>
<h3>Les règles communes aux accords</h3>
<ul class="l">
<li><b>Deux catégories de produits originaires</b> : entièrement obtenus (minéraux extraits, végétaux récoltés, animaux nés et élevés, pêche des navires de la partie, déchets de fabrication…), ou obtenus à partir de matières non originaires ayant subi une ouvraison suffisante (annexe I, art. 2 et 3).</li>
<li><b>La règle de liste</b> fixe, produit par produit, ce qui est « suffisant » : proportion maximale de matières non originaires, changement de position tarifaire, opération spécifique ou matières entièrement obtenues (annexe I, note 1).</li>
<li><b>Les opérations insuffisantes</b> ne confèrent jamais l’origine : conditionnement, étiquetage, simple mélange, simple assemblage… (art. 6).</li>
<li><b>Le cumul</b> permet de considérer comme originaires des matières d’un autre partenaire appliquant des règles identiques (art. 7 et 8).</li>
<li><b>La non-modification</b> : en passant par un pays tiers, la marchandise reste sous surveillance douanière et ne subit que des opérations de conservation ou de marquage exigées par l’importateur (art. 14).</li>
<li><b>L’unité à considérer</b> est le produit retenu pour le classement SH ; emballages, accessoires, pièces de rechange et outils livrés avec le matériel et compris dans le prix en font partie (art. 9).</li>
<li><b>Assortiments</b> : originaires si les articles non originaires n’excèdent pas 15 % du prix départ usine (art. 10).</li>
<li><b>Éléments neutres</b> : l’origine de l’énergie, des machines, des outils et des marchandises qui n’entrent pas dans la composition finale n’est pas prise en compte (art. 11).</li>
<li><b>Territorialité</b> : une ouvraison réalisée hors de la partie préserve l’origine si la valeur ajoutée à l’extérieur n’excède pas 10 % du prix départ usine (art. 13).</li>
</ul>
<div class="box tip"><b class="t">Le réflexe à adopter</b>Toujours appliquer les règles de l’accord invoqué, à la date de l’opération. Un même produit peut être originaire pour l’UE et ne pas l’être pour les États-Unis (Guide, n° 2-021).</div>
<h3>Ce qui a changé au 1er janvier 2026 (UE et Turquie)</h3>
<div class="tw"><table class="t">
<tr><th>Point</th><th>Avant</th><th>Depuis le 01/01/2026</th></tr>
<tr><td>Règles applicables</td><td>Protocole d’origine ancien</td><td>Convention pan-euro-méditerranéenne révisée, à titre provisoire jusqu’au 31/12/2027 au plus tard</td></tr>
<tr><td>Tolérance</td><td>Plus restrictive</td><td>15 % du poids net (chapitres 2 à 24) ou du prix départ usine (autres), hors textiles</td></tr>
<tr><td>Cumul</td><td>Diagonal limité</td><td>Étendu à toutes les parties appliquant les règles ; bilatéral seulement pour les chapitres 50 à 63</td></tr>
<tr><td>No-drawback</td><td>Large</td><td>Limité aux textiles des chapitres 50 à 63, et inapplicable aux échanges bilatéraux</td></tr>
<tr><td>Preuves</td><td>EUR.1, EUR-MED, déclarations sur facture</td><td>EUR.1 et déclaration d’origine ; EUR-MED supprimés</td></tr>
<tr><td>Validité des preuves</td><td>4 mois</td><td>10 mois ; déclaration à long terme du fournisseur valable 2 ans</td></tr>
<tr><td>Mention à l’export marocain</td><td>—</td><td>« REVISED RULES » en case 7</td></tr>
</table></div>
<p class="ref">Circ. n° 6706/233 du 31/12/2025 ; circ. n° 6722/233 du 10/02/2026. Les accords AELE et Agadir conservent leurs anciennes règles jusqu’à la modification de leurs protocoles.</p>
"""

ACCORDS = r"""
<div class="eb">Comprendre</div>
<h1>Les accords <em>et leurs règles</em></h1>
<p class="lead">Synthèse par accord. Les mentions « à vérifier » signalent un point non tranché par le Guide : consultez la circulaire citée avant l’opération.</p>
<div class="form three noprint" style="padding:12px 14px"><div class="full"><label class="f" for="acc-f">Filtrer</label><input class="i" id="acc-f" placeholder="Ex. : Turquie, EUR.1, cumul, 35 %"></div></div>
<div class="tw"><table class="t" id="acc-t">
<tr><th>Accord</th><th>Pays</th><th>Règles d’origine</th><th>Preuve</th><th>Validité</th><th>Cumul</th><th>Références</th></tr>
<tr><td><b>Union européenne</b></td><td>États membres de l’UE</td><td>Règles révisées (application provisoire du 01/01/2026 au 31/12/2027 au plus tard) ; tolérance de 15 % hors textiles</td><td>EUR.1 ou déclaration d’origine (≤ 6 000 EUR, ou exportateur agréé)</td><td>10 mois</td><td>Étendu ; bilatéral pour les ch. 50 à 63</td><td class="ref">Circ. 6706/233</td></tr>
<tr><td><b>Turquie</b></td><td>Türkiye</td><td>Règles révisées depuis le 01/01/2026</td><td>EUR.1 ou déclaration d’origine</td><td>10 mois</td><td>Diagonal Maroc–UE–Turquie</td><td class="ref">Circ. 6706/233 ; 6722/233</td></tr>
<tr><td><b>AELE</b></td><td>Suisse, Norvège, Islande, Liechtenstein</td><td>Anciennes règles maintenues ; produits agricoles transformés : seul l’élément agricole est taxé</td><td>À vérifier</td><td>À vérifier</td><td>À vérifier</td><td class="ref">Circ. 4980/233 ; 6409/222</td></tr>
<tr><td><b>Agadir</b></td><td>Tunisie, Égypte, Jordanie</td><td>Anciennes règles maintenues</td><td>À vérifier</td><td>À vérifier</td><td>À vérifier</td><td class="ref">Circ. 5047/223</td></tr>
<tr><td><b>États-Unis</b></td><td>États-Unis</td><td>Règle spécifique de l’annexe IX ou, à défaut, article nouveau et critère de 35 % ; de minimis textile 7 %</td><td>Aucun certificat : l’importateur certifie l’éligibilité</td><td>—</td><td>Total Maroc–États-Unis</td><td class="ref">Loi 28-04 ; circ. 4977/222</td></tr>
<tr><td><b>Royaume-Uni</b></td><td>Royaume-Uni</td><td>Reprise de l’accord Maroc–UE ; décision n° 01/2026 élargissant le cumul ; incidence des règles révisées à vérifier</td><td>EUR.1 ou déclaration sur facture (cumul bilatéral) ; EUR-MED (cumul diagonal)</td><td>À vérifier</td><td>Bilatéral : UE, Norvège, Islande ; diagonal : Suisse, Turquie, Égypte, Tunisie, Jordanie</td><td class="ref">Circ. 6139/222 ; 6758/233</td></tr>
<tr><td><b>ZLECAf</b></td><td>Pays africains appliquant l’accord</td><td>Règles de l’accord et de sa circulaire d’application</td><td>Certificat visé par le pays d’exportation ; délivrance sur BADR à l’export</td><td>À vérifier</td><td>À vérifier</td><td class="ref">Note D87/2026 ; circ. 6530/223</td></tr>
<tr><td><b>Droit commun</b></td><td>Pays sans accord</td><td>Entièrement obtenu ou transformation complète</td><td>Certificat « CO Rose » à l’export</td><td>—</td><td>—</td><td class="ref">CDII, art. 16 à 19 ; circ. 5549/230</td></tr>
</table></div>
"""

ASSISTANT = r"""
<div class="eb">Outil</div>
<h1>Quel accord, <em>quelle preuve</em> ?</h1>
<p class="lead">Répondez à deux ou trois questions : l’assistant indique l’accord applicable, la preuve à obtenir ou à émettre, sa validité, les mentions et les points de vigilance.</p>
<div id="wiz-acc"></div>
"""

CALCUL = r"""
<div class="eb">Outil</div>
<h1>Calculateur <em>d’origine</em></h1>
<p class="lead">Trois critères, selon l’accord : la règle de valeur des accords pan-euro-méditerranéens, le critère de 35 % de l’accord avec les États-Unis, et la plus-value de l’origine de droit commun.</p>
<h3>1. Règle de valeur et tolérance (UE, Turquie, AELE, Agadir)</h3>
<div class="form three">
  <div><label class="f" for="c-pdu">Prix départ usine (DH)</label><input class="i" id="c-pdu" inputmode="decimal" placeholder="1 000 000"></div>
  <div><label class="f" for="c-vmno">Valeur des matières non originaires (DH)</label><input class="i" id="c-vmno" inputmode="decimal" placeholder="380 000"></div>
  <div><label class="f" for="c-max">Plafond de la règle de liste (%)<small>Lire la règle du produit fini</small></label><input class="i" id="c-max" inputmode="decimal" placeholder="40"></div>
  <div><label class="f" for="c-vmno-hors">Dont matières ne respectant pas la règle (DH)<small>Pour tester la tolérance</small></label><input class="i" id="c-vmno-hors" inputmode="decimal" placeholder="0"></div>
  <div><label class="f" for="c-acc">Accord</label><select class="i" id="c-acc"><option value="rev">UE ou Turquie (règles révisées)</option><option value="old">AELE ou Agadir (anciennes règles)</option></select></div>
  <div><label class="f" for="c-tex">Produit textile (ch. 50 à 63)</label><select class="i" id="c-tex"><option value="non">Non</option><option value="oui">Oui</option></select></div>
</div>
<div class="res" id="c-res1"></div>
<h3>2. Critère de 35 % (États-Unis)</h3>
<div class="form three">
  <div><label class="f" for="u-vmp">Valeur des matières produites dans les parties (DH)</label><input class="i" id="u-vmp" inputmode="decimal"></div>
  <div><label class="f" for="u-cdt">Coûts directs de transformation (DH)</label><input class="i" id="u-cdt" inputmode="decimal"></div>
  <div><label class="f" for="u-vep">Valeur estimée du produit (DH)</label><input class="i" id="u-vep" inputmode="decimal"></div>
  <div class="full"><label class="f" for="u-new">Le produit est-il un article nouveau ou différent (nouveau nom, caractéristiques ou usage) ?</label><select class="i" id="u-new"><option value="oui">Oui</option><option value="non">Non</option></select></div>
</div>
<div class="res" id="c-res2"></div>
<h3>3. Plus-value de droit commun (certificat « CO Rose »)</h3>
<div class="form three">
  <div><label class="f" for="d-imp">Valeur d’importation des produits mis en œuvre (DH)</label><input class="i" id="d-imp" inputmode="decimal" placeholder="400 000"></div>
  <div><label class="f" for="d-pdu">Prix départ usine du produit (DH)</label><input class="i" id="d-pdu" inputmode="decimal" placeholder="650 000"></div>
  <div><label class="f" for="d-ann">L’opération figure-t-elle à l’annexe I du décret ?<small>Ex. : teinture du fil, raffinage du sucre brut</small></label><select class="i" id="d-ann"><option value="non">Non ou ne sais pas</option><option value="oui">Oui</option></select></div>
</div>
<div class="res" id="c-res3"></div>
<div class="box tip"><b class="t">Limite du calcul</b>Une règle de liste peut aussi exiger un changement de position tarifaire ou une opération spécifique : le calculateur ne couvre que le critère de valeur. Reportez le résultat dans la <a href="#fiche">fiche d’origine</a>.</div>
"""

FICHE = r"""
<div class="eb">Outil</div>
<h1>Fiche d’origine <em>produit</em></h1>
<p class="lead">Une fiche par produit et par accord : c’est la première pièce demandée lors d’une vérification. Les champs sont enregistrés dans votre navigateur ; imprimez la fiche pour le dossier.</p>
<form data-gen="fiche" class="form" onsubmit="return false">
  <div><label class="f">Produit fini</label><input class="i" name="produit"></div>
  <div><label class="f">Code SH (10 chiffres)</label><input class="i" name="sh"></div>
  <div><label class="f">Accord invoqué</label><select class="i" name="accord"><option>Union européenne</option><option>Turquie</option><option>AELE</option><option>Accord d’Agadir</option><option>États-Unis</option><option>Royaume-Uni</option><option>ZLECAf</option></select></div>
  <div><label class="f">Pays de destination ou d’origine</label><input class="i" name="pays"></div>
  <div class="full"><label class="f">Règle de liste applicable (texte)</label><textarea class="i" name="regle"></textarea></div>
  <div><label class="f">Prix départ usine (DH)</label><input class="i" name="pdu"></div>
  <div><label class="f">Valeur des matières non originaires (DH)</label><input class="i" name="vmno"></div>
  <div class="full"><label class="f">Matières non originaires (désignation, code SH, origine, valeur)</label><textarea class="i" name="mno"></textarea></div>
  <div class="full"><label class="f">Matières originaires et preuves reçues (fournisseur, type de preuve, n°, date)</label><textarea class="i" name="mo"></textarea></div>
  <div><label class="f">Cumul appliqué avec</label><input class="i" name="cumul" placeholder="Laisser vide si aucun"></div>
  <div><label class="f">Tolérance de 15 % utilisée</label><select class="i" name="tol"><option>Non</option><option>Oui</option></select></div>
  <div class="full"><label class="f">Opérations réalisées (au-delà des opérations insuffisantes de l’art. 6)</label><textarea class="i" name="ops"></textarea></div>
  <div><label class="f">Résultat</label><select class="i" name="resultat"><option>Originaire</option><option>Non originaire</option><option>À confirmer</option></select></div>
  <div><label class="f">Preuve émise (type, n°, date)</label><input class="i" name="preuve"></div>
  <div><label class="f">Établie par</label><input class="i" name="auteur"></div>
  <div><label class="f">Date</label><input class="i" type="date" name="date"></div>
</form>
<template id="tpl-fiche">FICHE D’ORIGINE PRODUIT

Produit fini : {{produit}}    Code SH : {{sh}}
Accord invoqué : {{accord}}    Pays : {{pays}}

Règle de liste applicable :
{{regle}}

Prix départ usine : {{pdu}} DH
Valeur des matières non originaires : {{vmno}} DH

Matières non originaires :
{{mno}}

Matières originaires et preuves reçues :
{{mo}}

Cumul appliqué avec : {{cumul}}
Tolérance de 15 % utilisée : {{tol}}

Opérations réalisées :
{{ops}}

Résultat : {{resultat}}
Preuve émise : {{preuve}}

Établie par {{auteur}}, le {{date}}.
Références : circ. n° 6706/233, annexe I ; Guide des procédures douanières, n° 2-021.</template>
<pre class="out" id="out-fiche"></pre>
"""

DECL = r"""
<div class="eb">Modèle</div>
<h1>Déclaration d’origine <em>sur facture</em></h1>
<p class="lead">À porter sur la facture, le bon de livraison ou un autre document commercial décrivant les produits. Tout exportateur peut l’établir jusqu’à 6 000 EUR par envoi ; au-delà, seul un exportateur agréé le peut (annexe I, art. 18 et 19).</p>
<form data-gen="decl" class="form" onsubmit="return false">
  <div><label class="f">Valeur de l’envoi (EUR)</label><input class="i" name="valeur" inputmode="decimal"></div>
  <div><label class="f">N° d’exportateur agréé<small>Laisser vide si vous n’êtes pas agréé</small></label><input class="i" name="agree"></div>
  <div><label class="f">Origine préférentielle des produits</label><input class="i" name="origine" placeholder="marocaine"></div>
  <div><label class="f">Cumul appliqué avec<small>Parties, en anglais (ex. : TÜRKIYE)</small></label><input class="i" name="cumul"></div>
  <div><label class="f">Lieu</label><input class="i" name="lieu"></div>
  <div><label class="f">Date</label><input class="i" type="date" name="date"></div>
  <div class="full"><label class="f">Nom et fonction du signataire</label><input class="i" name="signataire"></div>
</form>
<div id="decl-alert"></div>
<template id="tpl-decl">L'exportateur des produits couverts par le présent document (autorisation douanière ou de l'autorité gouvernementale compétente n° {{agree}}) déclare que, sauf indication claire du contraire, ces produits ont l'origine préférentielle {{origine}}.
REVISED RULES
{{#cumul}}CUMULATION APPLIED WITH {{cumul}}
{{/cumul}}
{{lieu}}, le {{date}}
{{signataire}}

— English version —
The exporter of the products covered by this document (customs or competent governmental authority authorisation No {{agree}}) declares that, except where otherwise clearly indicated, these products are of {{origine}} preferential origin.
REVISED RULES
{{#cumul}}CUMULATION APPLIED WITH {{cumul}}
{{/cumul}}
{{lieu}}, {{date}}
{{signataire}}</template>
<pre class="out" id="out-decl"></pre>
<div class="box warn"><b class="t">Avant la première utilisation</b>Le texte officiel figure en appendice de l’annexe I de la circulaire n° 6706/233 : comparez ce modèle mot pour mot et utilisez la version linguistique demandée par l’accord. Pour l’AELE et l’accord d’Agadir, les anciennes règles et leurs modèles s’appliquent.</div>
"""

FOURN = r"""
<div class="eb">Modèle</div>
<h1>Déclaration à long terme <em>du fournisseur</em></h1>
<p class="lead">Elle permet d’appliquer le cumul sur des livraisons régulières. Sa validité est de deux ans au plus (annexe I, art. 29). Exigez-la dès le premier envoi.</p>
<form data-gen="fourn" class="form" onsubmit="return false">
  <div><label class="f">Nom du signataire</label><input class="i" name="nom"></div>
  <div><label class="f">Société du fournisseur</label><input class="i" name="societe"></div>
  <div class="full"><label class="f">Adresse et identifiant du fournisseur</label><input class="i" name="adresse"></div>
  <div><label class="f">Client</label><input class="i" name="client"></div>
  <div><label class="f">Pays d’origine des marchandises</label><input class="i" name="origine"></div>
  <div class="full"><label class="f">Marchandises (désignation, code SH, référence ; une par ligne)</label><textarea class="i" name="marchandises"></textarea></div>
  <div><label class="f">Échanges préférentiels avec</label><input class="i" name="avec" placeholder="Ex. : l’Union européenne"></div>
  <div></div>
  <div><label class="f">Début de la période</label><input class="i" type="date" name="debut"></div>
  <div><label class="f">Fin de la période</label><input class="i" type="date" name="fin"></div>
</form>
<div id="fourn-alert"></div>
<template id="tpl-fourn">DÉCLARATION À LONG TERME DU FOURNISSEUR

Le soussigné, {{nom}}, agissant pour la société {{societe}} ({{adresse}}), fournisseur,
déclare que les marchandises énumérées ci-après, livrées régulièrement à la société {{client}} :

{{marchandises}}

sont originaires de {{origine}} et satisfont aux règles d’origine régissant les échanges préférentiels avec {{avec}}.

La présente déclaration couvre les envois effectués du {{debut}} au {{fin}}.

Le fournisseur s’engage à informer immédiatement le client si la présente déclaration cesse d’être valable, et à mettre à la disposition des autorités douanières toutes les justifications requises.

Fait à …………………, le …………………
Nom, fonction, signature et cachet :</template>
<pre class="out" id="out-fourn"></pre>
<p class="muted">Le texte réglementaire de la déclaration du fournisseur prévaut sur ce modèle de structure.</p>
"""

CLAUSE = r"""
<div class="eb">Modèle</div>
<h1>Clause de coopération <em>à la vérification</em></h1>
<p class="lead">À insérer dans vos contrats d’achat. Une preuve formellement correcte ne suffit pas : si l’origine n’est pas confirmée lors d’une vérification, c’est vous qui payez les droits.</p>
<form data-gen="clause" class="form" onsubmit="return false">
  <div><label class="f">Numéro d’article du contrat</label><input class="i" name="art"></div>
  <div><label class="f">Accord concerné</label><input class="i" name="accord" placeholder="Ex. : Accord d’association Maroc–UE"></div>
  <div><label class="f">Durée de conservation des justificatifs (années)</label><input class="i" name="annees" placeholder="3 (5 pour les États-Unis)"></div>
  <div><label class="f">Inclure la clause de remboursement</label><select class="i" name="remb"><option value="1">Oui</option><option value="">Non</option></select></div>
</form>
<template id="tpl-clause">Article {{art}} — Origine préférentielle

Le vendeur garantit que les marchandises livrées sous preuve d’origine préférentielle satisfont aux règles d’origine de l’accord {{accord}}. Il conserve pendant au moins {{annees}} ans les justificatifs du caractère originaire (nomenclature des matières, preuves des fournisseurs, calculs).

Il s’engage à répondre sans délai à toute demande de vérification émanant des autorités douanières du pays d’exportation ou d’importation, et à communiquer à l’acheteur, sur demande, les éléments nécessaires à la justification de l’origine.
{{#remb}}
En cas de refus de la préférence imputable à une preuve inexacte ou à un défaut de coopération du vendeur, celui-ci rembourse à l’acheteur les droits, intérêts et pénalités mis à sa charge.{{/remb}}</template>
<pre class="out" id="out-clause"></pre>
"""

US = r"""
<div class="eb">Modèle</div>
<h1>Dossier d’origine <em>États-Unis</em></h1>
<p class="lead">Dans l’accord Maroc–États-Unis, aucun certificat n’est exigé : l’importateur qui demande la préférence est réputé certifier l’éligibilité et en répond. Obtenez ce dossier de votre fournisseur avant la première importation et conservez-le cinq ans (circ. n° 4977/222).</p>
<ul class="cl" data-cl="us">
  <li><span class="tx">Description du produit et code SH<span class="rf">Circ. 4977/222</span></span></li>
  <li><span class="tx">Règle appliquée : règle spécifique des listes 1 et 2 de l’annexe IX, ou article nouveau ou différent et critère de valeur<span class="rf">Circ. 4977/222, section IV</span></span></li>
  <li><span class="tx">Calcul : (VMP + CDT) / VEP × 100 ≥ 35 %, avec le détail des montants<span class="rf">Utilisez le calculateur, critère n° 2</span></span></li>
  <li><span class="tx">Liste des matières, avec leur origine et leur valeur<span class="rf">Circ. 4977/222</span></span></li>
  <li><span class="tx">Textiles : vérification du de minimis de 7 % du poids du composant déterminant<span class="rf">Circ. 4977/222</span></span></li>
  <li><span class="tx">Preuve du transport direct entre les parties<span class="rf">Circ. 4977/222</span></span></li>
  <li><span class="tx">Engagement écrit du fournisseur de fournir ces éléments sur demande<span class="rf">Guide, n° 2-023</span></span></li>
  <li><span class="tx">Archivage du dossier pendant 5 ans<span class="rf">Circ. 4977/222</span></span></li>
</ul>
<div class="box key"><b class="t">En cas de rejet de la préférence</b>La douane doit le notifier par écrit dans un délai d’un mois, avec ses motifs de fait et de droit. Répondez point par point ; les commissions de concertation et de recours restent ouvertes (circ. n° 4977/222 ; CDII, art. 22 bis et 22 ter).</div>
"""

CL_IMPORT = r"""
<div class="eb">Contrôle</div>
<h1>Check-list <em>à l’importation</em></h1>
<p class="lead">À dérouler avant de demander la préférence. L’avancement est enregistré dans votre navigateur.</p>
<ul class="cl" data-cl="imp">
  <li><span class="tx">L’accord couvre le pays d’origine et le produit (code SH) à la date de l’opération<span class="rf">Guide n° 2-021</span></span></li>
  <li><span class="tx">La preuve est admise par l’accord : EUR.1 ou déclaration d’origine (UE, Turquie), aucun certificat (États-Unis), certificat visé (ZLECAf)<span class="rf">Annexe I, art. 17 ; circ. 4977/222 ; note D87/2026</span></span></li>
  <li><span class="tx">La preuve est valable à la date de la déclaration (10 mois pour l’UE et la Turquie)<span class="rf">Annexe I, art. 23</span></span></li>
  <li><span class="tx">Au-delà de 6 000 EUR, la déclaration d’origine porte un numéro d’exportateur agréé au bon format<span class="rf">Annexe I, art. 18 ; note D99/2026</span></span></li>
  <li><span class="tx">La description et les quantités de la preuve correspondent à la facture et aux marchandises<span class="rf">Annexe I, art. 28</span></span></li>
  <li><span class="tx">Le cachet et la signature correspondent aux spécimens diffusés par l’ADII<span class="rf">Note D105/2026</span></span></li>
  <li><span class="tx">En cas de passage par un pays tiers : connaissements, marquage ou certificat de non-manipulation<span class="rf">Annexe I, art. 14</span></span></li>
  <li><span class="tx">Produits agricoles transformés de l’AELE : seul l’élément agricole est taxé<span class="rf">Circ. 6409/222</span></span></li>
  <li><span class="tx">États-Unis : le dossier d’origine du fournisseur est en votre possession<span class="rf">Circ. 4977/222</span></span></li>
  <li><span class="tx">La référence de l’accord et la preuve sont jointes à la déclaration<span class="rf">Circ. 6063/313</span></span></li>
</ul>
"""

CL_EXPORT = r"""
<div class="eb">Contrôle</div>
<h1>Check-list <em>à l’exportation</em></h1>
<p class="lead">À dérouler avant d’émettre une preuve d’origine pour votre client étranger.</p>
<ul class="cl" data-cl="exp">
  <li><span class="tx">Une fiche d’origine existe pour le produit et l’accord du pays de destination<span class="rf">Guide n° 2-021</span></span></li>
  <li><span class="tx">La règle de liste de l’accord est satisfaite (tolérance de 15 % hors textiles pour l’UE et la Turquie)<span class="rf">Annexe I, art. 5</span></span></li>
  <li><span class="tx">Les opérations réalisées dépassent les opérations insuffisantes<span class="rf">Annexe I, art. 6</span></span></li>
  <li><span class="tx">Les matières cumulées sont couvertes par une preuve ou une déclaration du fournisseur valable<span class="rf">Annexe I, art. 7, 8 et 29</span></span></li>
  <li><span class="tx">Textiles des chapitres 50 à 63 : aucune matière non originaire importée en suspension (no-drawback)<span class="rf">Circ. 6706/233 ; 6139/222</span></span></li>
  <li><span class="tx">La preuve porte « REVISED RULES » (UE, Turquie) et, en cas de cumul, « CUMULATION APPLIED WITH … »<span class="rf">Circ. 6706/233</span></span></li>
  <li><span class="tx">Au-delà de 6 000 EUR : statut d’exportateur agréé, ou EUR.1 demandé sur BADR<span class="rf">Annexe I, art. 18 et 19</span></span></li>
  <li><span class="tx">Royaume-Uni : type de cumul et preuve correspondante vérifiés auprès de l’ADII<span class="rf">Circ. 6139/222 ; 6758/233</span></span></li>
  <li><span class="tx">AELE et Agadir : anciennes règles et preuves appliquées<span class="rf">Circ. 4980/233 et 5047/223</span></span></li>
  <li><span class="tx">Le dossier d’origine est archivé au moins 3 ans<span class="rf">Annexe I, art. 31</span></span></li>
</ul>
<div class="box tip"><b class="t">Le statut d’exportateur agréé</b>Réservé aux personnes morales qui exportent fréquemment pour leur compte et offrent les garanties de contrôle. Il supprime le visa de chaque EUR.1. La demande est adressée au service des règles d’origine de l’ADII et donne lieu à un entretien (brochure ADII « Exportateur agréé »).</div>
"""

SUIVI = r"""
<div class="eb">Outil</div>
<h1>Suivi des <em>preuves d’origine</em></h1>
<p class="lead">Enregistrez chaque preuve reçue ou émise. La date limite de validité, la date de fin de conservation et le statut sont calculés automatiquement.</p>
<div id="tbl-preuves"></div>
<p class="muted">Validité : 10 mois (UE, Turquie) ; déclaration à long terme du fournisseur : 24 mois au plus. Conservation : 3 ans au moins (UE, Turquie), 5 ans (États-Unis). Pour les autres accords, la validité est à vérifier dans la circulaire de l’accord.</p>
"""

CONTROLE = r"""
<div class="eb">Contrôle</div>
<h1>Le contrôle a posteriori <em>de l’origine</em></h1>
<p class="lead">Après la mainlevée, la douane peut contrôler l’origine directement auprès de l’importateur, ou demander à la douane du pays d’exportation de vérifier la preuve.</p>
<h3>Comment se déroule une vérification</h3>
<div class="steps">
  <div class="step"><div><b>Déclenchement</b><br><span class="muted">Par sondage, ou en cas de doute fondé : cachet non conforme au spécimen, discordance de mentions, incohérence avec la facture (annexe I, art. 34 ; note D105/2026).</span></div></div>
  <div class="step"><div><b>Demande à la douane du pays d’exportation</b><br><span class="muted">Envoyée avec les documents. Elle dispose de 10 mois pour répondre dans les accords UE et Turquie (annexe I, art. 35).</span></div></div>
  <div class="step"><div><b>Résultat</b><br><span class="muted">Sans réponse suffisante, la préférence est refusée, sauf circonstances exceptionnelles. Les droits de droit commun sont recouvrés (CDII, art. 86 bis).</span></div></div>
  <div class="step"><div><b>Contestation</b><br><span class="muted">Entre importateur et douane : droit interne, commissions de concertation et de recours (CDII, art. 22 bis et 22 ter).</span></div></div>
</div>
<h3>Délais à connaître</h3>
<div class="tw"><table class="t">
<tr><th>Délai</th><th>Durée</th><th>Référence</th></tr>
<tr><td>Réponse de la douane étrangère (UE, Turquie)</td><td>10 mois</td><td class="ref">Annexe I, art. 35</td></tr>
<tr><td>Conservation par l’exportateur (UE, Turquie)</td><td>3 ans au moins</td><td class="ref">Annexe I, art. 31</td></tr>
<tr><td>Conservation par l’importateur (États-Unis)</td><td>5 ans</td><td class="ref">Circ. 4977/222</td></tr>
<tr><td>Vérification de l’origine des textiles (États-Unis)</td><td>12 mois</td><td class="ref">Circ. 4977/222</td></tr>
<tr><td>Recouvrement des droits après refus</td><td>4 ans ; en cas de fraude, à compter de la découverte</td><td class="ref">CDII, art. 99 bis et 99 ter</td></tr>
<tr><td>Délivrance d’un EUR.1 a posteriori</td><td>2 ans</td><td class="ref">Annexe I, art. 21</td></tr>
</table></div>
<div class="box warn"><b class="t">États-Unis : un risque collectif</b>Dans l’accord avec les États-Unis, l’échec d’une vérification sur les textiles peut conduire à exclure de la préférence toutes les marchandises du contrevenant (circ. n° 4977/222).</div>
<h3>Si vous recevez une demande de justification</h3>
<ol class="l">
<li>Réunissez la fiche d’origine, les preuves fournisseurs, les factures et les calculs.</li>
<li>Saisissez immédiatement votre fournisseur au titre de la clause de coopération.</li>
<li>Répondez par écrit, dans le délai, en listant les pièces remises.</li>
<li>Si une erreur est découverte de votre côté, examinez la révélation volontaire (voir le kit 03).</li>
</ol>
"""

CAS = r"""
<div class="eb">Référence</div>
<h1>Cas pratiques</h1>
<p class="lead">Situations tirées du Guide des procédures douanières. Les entreprises sont fictives ; les règles sont celles des textes cités.</p>
<details class="fq" open><summary>Une déclaration d’origine au-delà de 6 000 EUR sans statut d’exportateur agréé</summary><p>Atlas Huiles exporte vers la Belgique des envois de 15 000 EUR et établit elle-même une déclaration d’origine. Au-delà de 6 000 EUR, seul un exportateur agréé le peut : l’importateur belge se voit refuser la préférence. Il fallait un EUR.1 par envoi ou le statut d’exportateur agréé (annexe I, art. 18).</p></details>
<details class="fq"><summary>Cumul avec la Turquie vers l’Allemagne</summary><p>Tanger Auto Parts exporte des faisceaux de câbles avec 40 % de cuivre turc et 20 % de connecteurs chinois. Sous les règles révisées, le cuivre turc est cumulable et le no-drawback ne s’applique plus à ce produit hors textile. Elle doit apposer « CUMULATION APPLIED WITH TÜRKIYE » et « REVISED RULES » en case 7 de l’EUR.1. L’erreur serait de continuer à émettre un EUR-MED (circ. n° 6706/233).</p></details>
<details class="fq"><summary>Un même produit vers trois marchés</summary><p>Fès Chaussures exporte le même modèle vers l’Italie, la Turquie et la Tunisie. Pour l’Italie et la Turquie, règles révisées et « REVISED RULES ». Pour la Tunisie, règles de l’accord d’Agadir maintenues. L’erreur serait d’appliquer une seule fiche d’origine (circ. n° 5047/223).</p></details>
<details class="fq"><summary>Importation des États-Unis sans dossier du fournisseur</summary><p>Casa Machines importe des pompes assemblées à partir de moteurs mexicains et demande la préférence. Sélectionnée au contrôle, elle doit produire le calcul de 35 %. Faute d’éléments du fournisseur, la préférence est refusée par écrit dans le mois et les droits de droit commun sont dus (circ. n° 4977/222).</p></details>
<details class="fq"><summary>Vérification sans réponse de la douane étrangère</summary><p>Marrakech Déco a importé d’Italie des luminaires sous EUR.1. Un an plus tard, la douane demande une vérification ; la douane italienne répond après onze mois sans confirmer l’origine. La préférence est refusée (annexe I, art. 35) et les droits recouvrés (CDII, art. 86 bis).</p></details>
<details class="fq"><summary>Royaume-Uni et cumul diagonal</summary><p>Rabat Textiles exporte vers Londres des chemises confectionnées avec du tissu turc. Cumul diagonal : la preuve doit être un EUR-MED et la règle du no-drawback interdit d’avoir importé le tissu en suspension de droits (circ. n° 6139/222).</p></details>
<details class="fq"><summary>Origine de droit commun et teinture</summary><p>Oriental Textiles importe de Chine du fil écru (400 000 DH), le teint et l’exporte au prix départ usine de 650 000 DH. La plus-value (250 000 DH) est inférieure à la valeur des intrants, mais la teinture figure à l’annexe I du décret : le fil est d’origine marocaine et un CO Rose peut être demandé (décret, art. 1er).</p></details>
"""

FAQ = r"""
<div class="eb">Référence</div>
<h1>Questions fréquentes</h1>
<details class="fq"><summary>L’origine de droit commun suffit-elle pour obtenir la préférence ?</summary><p>Non : il faut satisfaire aux règles d’origine de l’accord invoqué (circ. n° 6706/233 ; circ. n° 4977/222).</p></details>
<details class="fq"><summary>Le transit par un pays tiers fait-il perdre la préférence ?</summary><p>Non, si la marchandise reste sous surveillance douanière et n’y subit pas d’autre opération que celles permises (annexe I, art. 14).</p></details>
<details class="fq"><summary>L’origine des machines utilisées compte-t-elle ?</summary><p>Non : installations, machines, outils et énergie sont des éléments neutres (annexe I, art. 11).</p></details>
<details class="fq"><summary>Faut-il encore délivrer des EUR-MED vers l’UE ?</summary><p>Non : seuls subsistent l’EUR.1 et la déclaration d’origine (circ. n° 6706/233).</p></details>
<details class="fq"><summary>Une preuve européenne sans la mention « REVISED RULES » est-elle valable ?</summary><p>Oui : l’UE ayant ratifié la convention révisée, elle n’est pas tenue de l’apposer (circ. n° 6722/233).</p></details>
<details class="fq"><summary>Puis-je fractionner un envoi dans un pays tiers ?</summary><p>Oui, si les marchandises restent sous la surveillance douanière du pays de fractionnement (annexe I, art. 14).</p></details>
<details class="fq"><summary>Combien de temps une preuve UE est-elle valable ?</summary><p>10 mois depuis le 01/01/2026 (annexe I, art. 23).</p></details>
<details class="fq"><summary>Peut-on obtenir un EUR.1 après l’exportation ?</summary><p>Oui, dans un délai de deux ans, avec la mention « ISSUED RETROSPECTIVELY » (annexe I, art. 21).</p></details>
<details class="fq"><summary>Faut-il un certificat pour les produits américains ?</summary><p>Non : l’importateur est réputé certifier l’éligibilité (circ. n° 4977/222).</p></details>
<details class="fq"><summary>Les règles révisées s’appliquent-elles à la Suisse ?</summary><p>Pas encore : pour l’AELE, les anciennes règles sont maintenues jusqu’à la modification du protocole (circ. n° 6706/233).</p></details>
<details class="fq"><summary>Un certificat ZLECAf au cachet conforme suffit-il ?</summary><p>Non : la conformité du cachet est nécessaire mais non suffisante ; les autres conditions d’origine doivent être remplies (note D87/2026).</p></details>
<details class="fq"><summary>Depuis 2026, puis-je cumuler des intrants turcs pour exporter vers le Royaume-Uni ?</summary><p>Oui, la décision n° 01/2026 ouvre le cumul avec l’UE, l’AELE, la Turquie et les pays d’Agadir, sous réserve des conditions du protocole n° 4 (circ. n° 6758/233).</p></details>
<details class="fq"><summary>Origine et provenance, est-ce la même chose ?</summary><p>Non : la provenance est le pays d’où la marchandise a été transportée directement ; l’origine dépend du lieu d’obtention ou de transformation (CDII, art. 16 et 19).</p></details>
"""

SOURCES = r"""
<div class="eb">Référence</div>
<h1>Textes et sources</h1>
<div class="tw"><table class="t">
<tr><th>Texte</th><th>Objet</th></tr>
<tr><td class="ref">CDII, art. 7, 16 à 19, 86 bis, 99 bis, 99 ter</td><td>Application des accords, origine, contrôle a posteriori, recouvrement</td></tr>
<tr><td class="ref">Décret n° 2-77-862, art. 1er et 2, annexe I</td><td>Transformation complète et plus-value</td></tr>
<tr><td class="ref">Circ. n° 6706/233 du 31/12/2025 et annexe I</td><td>Règles révisées UE et Turquie</td></tr>
<tr><td class="ref">Circ. n° 6722/233 du 10/02/2026</td><td>Mention « REVISED RULES »</td></tr>
<tr><td class="ref">Circ. n° 4977/222 du 30/12/2005</td><td>Accord Maroc–États-Unis</td></tr>
<tr><td class="ref">Circ. n° 6139/222 du 31/12/2020 ; n° 6758/233 du 07/07/2026</td><td>Accord Maroc–Royaume-Uni et cumul</td></tr>
<tr><td class="ref">Circ. n° 4980/233 et 5047/223</td><td>AELE et Agadir (anciennes règles)</td></tr>
<tr><td class="ref">Circ. n° 6409/222 du 18/01/2023</td><td>Produits agricoles transformés de l’AELE</td></tr>
<tr><td class="ref">Note D87/2026 ; circ. n° 6530/223</td><td>ZLECAf et pays les moins avancés d’Afrique</td></tr>
<tr><td class="ref">Notes D99/2026, D105/2026, D129/2026</td><td>Numéros d’exportateurs agréés, spécimens de cachets</td></tr>
<tr><td class="ref">Circ. n° 5549/230</td><td>Certificat d’origine de droit commun (CO Rose)</td></tr>
</table></div>
<p class="muted">Source de synthèse : Guide des procédures douanières Maroc, éd. 2026, n° 2-020 à 2-028.</p>
"""

SCRIPT = r"""
/* Alertes des générateurs */
  document.addEventListener('gen:decl',function(e){var v=e.detail,x=num(v.valeur);
    $('#decl-alert').innerHTML=x>6000&&!v.agree?'<div class="box warn">Envoi de plus de 6 000 EUR sans numéro d’exportateur agréé : la déclaration d’origine n’est pas admise. Demandez un EUR.1 sur BADR (annexe I, art. 18).</div>':'';});
  document.addEventListener('gen:fourn',function(e){var a=parseDate(e.detail.debut),b=parseDate(e.detail.fin);
    $('#fourn-alert').innerHTML=a&&b&&b>addMonths(a,24)?'<div class="box warn">La période dépasse deux ans : une déclaration à long terme du fournisseur est valable deux ans au plus (annexe I, art. 29).</div>':'';});

document.addEventListener('kit:ready',function(){
  /* Filtre des accords */
  $('#acc-f').addEventListener('input',function(){var q=this.value.toLowerCase();$$('#acc-t tr').forEach(function(tr,i){if(i===0)return;tr.style.display=!q||tr.textContent.toLowerCase().indexOf(q)>=0?'':'none';});});

  /* Assistant « quel accord ? » */
  function R(acc,preuve,val,mentions,vig,cons,link){return '<h3 style="margin-top:0">'+acc+'</h3><div class="tw"><table class="t">'+
    '<tr><td><b>Preuve</b></td><td>'+preuve+'</td></tr><tr><td><b>Validité</b></td><td>'+val+'</td></tr><tr><td><b>Mentions</b></td><td>'+mentions+'</td></tr><tr><td><b>Conservation</b></td><td>'+cons+'</td></tr></table></div>'+
    '<div class="box tip"><b class="t">Points de vigilance</b>'+vig+'</div>'+(link||'');}
  var L='<p><a href="#calcul">Vérifier l’origine avec le calculateur →</a> · <a href="#fiche">Remplir la fiche d’origine →</a></p>';
  var tree={
    start:{q:'Votre opération est :',o:[['Une importation au Maroc','imp'],['Une exportation depuis le Maroc','exp']]},
    imp:{q:'Le pays d’origine des marchandises :',o:[['Un État membre de l’Union européenne','iUE'],['La Turquie','iTR'],['Les États-Unis','iUS'],['La Suisse, la Norvège, l’Islande ou le Liechtenstein','iAELE'],['La Tunisie, l’Égypte ou la Jordanie','iAG'],['Le Royaume-Uni','iUK'],['Un pays africain de la ZLECAf','iZL'],['Un autre pays','iDC']]},
    exp:{q:'Le pays de destination :',o:[['Un État membre de l’Union européenne','eUE'],['La Turquie','eTR'],['Les États-Unis','eUS'],['La Suisse, la Norvège, l’Islande ou le Liechtenstein','eAELE'],['La Tunisie, l’Égypte ou la Jordanie','eAG'],['Le Royaume-Uni','eUK'],['Un pays africain de la ZLECAf','eZL'],['Un autre pays','eDC']]},
    iUE:{r:R('Accord d’association Maroc–UE (règles révisées)','EUR.1, ou déclaration d’origine établie par l’exportateur européen (jusqu’à 6 000 EUR, ou sans limite s’il est exportateur agréé)','10 mois à compter de l’établissement','La mention « REVISED RULES » n’est pas exigée sur les preuves européennes (circ. n° 6722/233)','Contrôlez le numéro d’exportateur agréé au-delà de 6 000 EUR, le cachet au regard des spécimens (note D105/2026) et la non-modification en cas de transit. Prévoyez la clause de coopération dans le contrat.','3 ans au moins',L)},
    iTR:{r:R('Accord de libre-échange Maroc–Turquie (règles révisées)','EUR.1 ou déclaration d’origine ; EUR-MED supprimés','10 mois','Les preuves turques sans « REVISED RULES » sont recevables (circ. n° 6722/233)','Format du numéro d’exportateur agréé turc : « EUR » suivi de l’année, du code de la direction régionale et du numéro (note D99/2026).','3 ans au moins',L)},
    iUS:{r:R('Accord de libre-échange Maroc–États-Unis','Aucun certificat : vous certifiez l’éligibilité en demandant la préférence. Obtenez le dossier d’origine du fournisseur (critère de 35 %).','—','Indication de l’accord dans la déclaration','Le service ne demande la déclaration d’origine de l’importateur qu’en cas de doute ou de sélectivité ; sans dossier du fournisseur, la préférence est refusée. Transport direct exigé.','5 ans','<p><a href="#us">Voir la liste du dossier d’origine →</a></p>')},
    iAELE:{r:R('Accord Maroc–AELE (anciennes règles)','Selon la circulaire n° 4980/233 : à vérifier','À vérifier','À vérifier','Produits agricoles transformés : seul l’élément agricole est taxé, au taux de la liste actualisée (circ. n° 6409/222). Format du numéro d’exportateur agréé suisse et liechtensteinois : 1 à 5 chiffres (note D99/2026).','À vérifier',L)},
    iAG:{r:R('Accord d’Agadir (anciennes règles)','Selon la circulaire n° 5047/223 : à vérifier','À vérifier','À vérifier','Les règles révisées appliquées à l’UE ne s’appliquent pas encore à ces pays.','À vérifier',L)},
    iUK:{r:R('Accord d’association Maroc–Royaume-Uni','EUR.1 ou déclaration sur facture (cumul bilatéral) ; EUR-MED (cumul diagonal)','À vérifier','Code BADR « UK »','L’incidence des règles révisées UE doit être vérifiée auprès de l’ADII ; la décision n° 01/2026 élargit le cumul (circ. n° 6758/233). Format du numéro d’exportateur agréé : « GB » + 5 chiffres + deux derniers chiffres de l’année (note D99/2026).','À vérifier',L)},
    iZL:{r:R('Zone de libre-échange continentale africaine','Certificat d’origine visé par les autorités compétentes du pays d’exportation','À vérifier','—','Le cachet doit correspondre aux spécimens diffusés par l’ADII, mais cela ne suffit pas : les autres conditions d’origine doivent être remplies (note D87/2026).','À vérifier',L)},
    iDC:{r:R('Pas d’accord préférentiel','Le droit commun s’applique','—','—','Vérifiez qu’aucun accord ne couvre en réalité l’origine de la marchandise : passer à côté d’une préférence est une perte sèche.','4 ans (documents de l’opération, CDII, art. 42)')},
    eUE:{q:'La valeur de l’envoi :',o:[['6 000 EUR au plus','eUEs'],['Plus de 6 000 EUR','eUEl']]},
    eUEs:{r:R('Accord d’association Maroc–UE (règles révisées)','Déclaration d’origine sur facture (tout exportateur) ou EUR.1','10 mois','« REVISED RULES » en case 7 ; « CUMULATION APPLIED WITH … » en cas de cumul','Vérifiez la règle de liste (tolérance de 15 % hors textiles) et, pour les textiles des ch. 50 à 63, la règle du no-drawback.','3 ans au moins','<p><a href="#decl">Générer la déclaration d’origine →</a></p>')},
    eUEl:{q:'Êtes-vous exportateur agréé ?',o:[['Oui','eUEa'],['Non','eUEn']]},
    eUEa:{r:R('Accord d’association Maroc–UE (règles révisées)','Déclaration d’origine portant votre numéro d’autorisation','10 mois','« REVISED RULES » ; « CUMULATION APPLIED WITH … » en cas de cumul','L’exportateur agréé n’établit de déclaration que s’il détient toutes les preuves du caractère originaire au moment de l’émettre (brochure ADII).','3 ans au moins','<p><a href="#decl">Générer la déclaration d’origine →</a></p>')},
    eUEn:{r:R('Accord d’association Maroc–UE (règles révisées)','Certificat EUR.1, à demander sur BADR pour chaque envoi','10 mois','« REVISED RULES » en case 7 ; « CUMULATION APPLIED WITH … » en cas de cumul','Une déclaration sur facture au-delà de 6 000 EUR sans agrément fait refuser la préférence à votre client. Si vos envois sont fréquents, demandez le statut d’exportateur agréé.','3 ans au moins')},
    eTR:{r:R('Accord Maroc–Turquie (règles révisées)','EUR.1, ou déclaration d’origine (≤ 6 000 EUR, ou exportateur agréé)','10 mois','« REVISED RULES » ; cumul diagonal Maroc–UE–Turquie possible','Mêmes règles que pour l’UE depuis le 01/01/2026.','3 ans au moins','<p><a href="#decl">Générer la déclaration d’origine →</a></p>')},
    eUS:{r:R('Accord Maroc–États-Unis','Aucun certificat : l’importateur américain certifie l’éligibilité ; fournissez-lui un dossier d’origine (règle de l’annexe IX ou critère de 35 %)','—','—','Textiles : de minimis de 7 % ; une vérification échouée peut exclure toutes les marchandises du contrevenant.','5 ans recommandés','<p><a href="#calcul">Calculer le critère de 35 % →</a></p>')},
    eAELE:{r:R('Accord Maroc–AELE (anciennes règles)','Selon la circulaire n° 4980/233 : à vérifier','À vérifier','À vérifier','Le statut d’exportateur agréé couvre aussi les exportations vers l’AELE (brochure ADII).','À vérifier')},
    eAG:{r:R('Accord d’Agadir (anciennes règles)','Selon la circulaire n° 5047/223 : à vérifier','À vérifier','À vérifier','N’appliquez pas la fiche d’origine UE : la règle de liste et la preuve peuvent différer.','À vérifier')},
    eUK:{q:'Votre produit intègre-t-il des matières d’un autre partenaire ?',o:[['Non, ou matières de l’UE, de Norvège ou d’Islande (cumul bilatéral)','eUKb'],['Oui, de Suisse, de Turquie, d’Égypte, de Tunisie ou de Jordanie (cumul diagonal)','eUKd']]},
    eUKb:{r:R('Accord Maroc–Royaume-Uni · cumul bilatéral','EUR.1 ou déclaration sur facture','À vérifier','Code BADR « UK »','Pas de no-drawback en cumul bilatéral. Vérifiez auprès de l’ADII l’incidence des règles révisées UE (circ. n° 6139/222 ; 6758/233).','À vérifier')},
    eUKd:{r:R('Accord Maroc–Royaume-Uni · cumul diagonal','EUR-MED ou déclaration sur facture EUR-MED','À vérifier','—','La règle du no-drawback s’applique : les matières cumulées ne doivent pas avoir été importées en suspension de droits (circ. n° 6139/222).','À vérifier')},
    eZL:{r:R('ZLECAf','Certificat d’origine ZLECAf, demandé et délivré sur BADR','À vérifier','—','Faites confirmer par votre client que son pays applique la préférence à ce produit, et demandez la règle d’origine à l’ADII avant de fixer votre prix.','À vérifier')},
    eDC:{r:R('Pas d’accord préférentiel','Certificat d’origine de droit commun « CO Rose », sur demande','—','—','Origine marocaine si la marchandise est entièrement obtenue ou a subi une transformation complète (plus-value ≥ valeur des intrants, ou opération de l’annexe I du décret).','Conservez la déclaration d’importation des intrants et la facture de vente','<p><a href="#calcul">Calculer la plus-value →</a></p>')}
  };
  Wizard($('#wiz-acc'),tree,'start');

  /* Calculateur */
  function v(id){return num($('#'+id).value);}
  function calc(){
    var pdu=v('c-pdu'),vm=v('c-vmno'),mx=v('c-max'),hors=v('c-vmno-hors')||0,rev=$('#c-acc').value==='rev',tex=$('#c-tex').value==='oui',h='';
    if(pdu&&vm!=null){var p=vm/pdu;h='<div class="kpis"><div class="kpi"><b>'+pct(p)+'</b><span>de matières non originaires</span></div>';
      if(mx!=null){var ok=p<=mx/100;h+='<div class="kpi"><b>'+(ok?'Conforme':'Non conforme')+'</b><span>au plafond de '+mx+' %</span></div>';}
      else h+='<div class="kpi"><b>—</b><span>Renseignez le plafond de la règle de liste</span></div>';
      if(rev&&!tex){var t=hors/pdu;h+='<div class="kpi"><b>'+pct(t)+'</b><span>matières hors règle (tolérance : 15 % au plus)</span></div>';}
      else h+='<div class="kpi"><b>—</b><span>'+(tex?'Tolérance de 15 % non applicable aux textiles':'Tolérance : selon les anciennes règles (à vérifier)')+'</span></div>';
      h+='</div>';
      if(mx!=null&&p>mx/100)h+='<div class="box warn">Le plafond est dépassé : le produit n’est pas originaire au regard du critère de valeur'+(rev&&!tex?' ; vérifiez si la tolérance de 15 % permet de régulariser une matière qui ne respecte pas une autre condition de la règle':'')+'.</div>';
      if(rev&&!tex&&hors/pdu>0.15)h+='<div class="box warn">Les matières hors règle dépassent 15 % du prix départ usine : la tolérance ne peut pas être utilisée.</div>';
    } else h='<p class="muted">Saisissez le prix départ usine et la valeur des matières non originaires.</p>';
    $('#c-res1').innerHTML=h;
    var a=v('u-vmp'),b=v('u-cdt'),c=v('u-vep'),nw=$('#u-new').value==='oui';
    if(c&&(a!=null||b!=null)){var r=((a||0)+(b||0))/c,ok2=r>=0.35&&nw;
      $('#c-res2').innerHTML='<div class="kpis"><div class="kpi"><b>'+pct(r)+'</b><span>(VMP + CDT) / VEP</span></div><div class="kpi"><b>'+(r>=0.35?'≥ 35 %':'< 35 %')+'</b><span>Seuil de l’accord</span></div><div class="kpi"><b>'+(ok2?'Éligible':'Non éligible')+'</b><span>'+(nw?'Article nouveau ou différent':'Le produit doit être un article nouveau ou différent')+'</span></div></div><p class="muted">À défaut de règle spécifique des listes 1 et 2 de l’annexe IX (circ. n° 4977/222).</p>';}
    else $('#c-res2').innerHTML='<p class="muted">Saisissez la valeur estimée du produit et au moins un des deux montants.</p>';
    var di=v('d-imp'),dp=v('d-pdu'),an=$('#d-ann').value==='oui';
    if(di&&dp){var pv=dp-di,ok3=pv>=di||an;
      $('#c-res3').innerHTML='<div class="kpis"><div class="kpi"><b>'+money(pv)+'</b><span>Plus-value</span></div><div class="kpi"><b>'+(pv>=di?'Suffisante':'Insuffisante')+'</b><span>Seuil : '+money(di)+'</span></div><div class="kpi"><b>'+(ok3?'Origine marocaine':'Non établie')+'</b><span>'+(an?'Opération de l’annexe I : critère rempli':'Critère de plus-value')+'</span></div></div><p class="muted">Pièces de preuve : déclaration d’importation des intrants et facture de vente (décret, art. 2).</p>';}
    else $('#c-res3').innerHTML='<p class="muted">Saisissez les deux valeurs.</p>';
  }
  $$('#calcul input,#calcul select').forEach(function(el){el.addEventListener('input',calc);el.addEventListener('change',calc);});calc();

  /* Suivi des preuves */
  var VAL={'Union européenne':10,'Turquie':10},CONS={'Union européenne':3,'Turquie':3,'États-Unis':5};
  LocalTable($('#tbl-preuves'),{key:'preuves',
    example:{ref:'OP-2026-001 (exemple)',sens:'Import',partenaire:'Fournisseur (Espagne)',accord:'Union européenne',type:'EUR.1',numero:'A 0000000',date:'2026-06-15'},
    cols:[{k:'ref',label:'Opération',w:120},{k:'sens',label:'Sens',type:'select',opts:['Import','Export']},{k:'partenaire',label:'Partenaire',w:140},
      {k:'accord',label:'Accord',type:'select',opts:['Union européenne','Turquie','États-Unis','AELE','Agadir','Royaume-Uni','ZLECAf','Droit commun']},
      {k:'type',label:'Preuve',type:'select',opts:['EUR.1','Déclaration d’origine','Déclaration fournisseur long terme','Certificat ZLECAf','Certification importateur (États-Unis)','CO Rose']},
      {k:'numero',label:'N°',w:100},{k:'date',label:'Établie le',type:'date'},
      {label:'Valable jusqu’au',calc:function(r){var d=parseDate(r.date),m=r.type==='Déclaration fournisseur long terme'?24:VAL[r.accord];return d&&m?fmtDate(addMonths(d,m)):'<span class="muted">À vérifier</span>';}},
      {label:'Statut',calc:function(r){var d=parseDate(r.date),m=r.type==='Déclaration fournisseur long terme'?24:VAL[r.accord];if(!d)return '';if(!m)return '<span class="pill n">Validité à vérifier</span>';
        var j=daysBetween(today(),addMonths(d,m));return j<0?'<span class="pill r">Expirée</span>':j<=30?'<span class="pill a">Expire dans '+j+' j</span>':'<span class="pill g">Valide ('+j+' j)</span>';}},
      {label:'Conserver jusqu’au',calc:function(r){var d=parseDate(r.date),y=CONS[r.accord];return d&&y?fmtDate(addMonths(d,12*y)):'<span class="muted">À vérifier</span>';}}],
    summary:function(rows){var e=0,s=0;rows.forEach(function(r){var d=parseDate(r.date),m=r.type==='Déclaration fournisseur long terme'?24:VAL[r.accord];if(d&&m){var j=daysBetween(today(),addMonths(d,m));if(j<0)e++;else if(j<=30)s++;}});
      return '<div class="kpi"><b>'+rows.length+'</b><span>preuves suivies</span></div><div class="kpi"><b>'+s+'</b><span>expirent sous 30 jours</span></div><div class="kpi"><b>'+e+'</b><span>expirées</span></div>';}});

});
"""

KIT = dict(id='kit01', num='Kit 01', title='Origine préférentielle et accords de libre-échange', short='Origine et ALE',
           color=('#1E7346', '#EBF6EF', '#C3E3CF'),
           intro='Vérifier l’éligibilité, documenter l’origine, émettre et suivre les preuves, se préparer à une vérification.',
           groups=[
               ('Comprendre', [('accueil', '🏠', 'Accueil du kit', '', ACCUEIL), ('principes', '📘', 'Les règles d’origine', '', PRINCIPES), ('accords', '🌍', 'Les accords et leurs règles', '', ACCORDS)]),
               ('Outils', [('assistant', '🧭', 'Quel accord, quelle preuve ?', 'outil', ASSISTANT), ('calcul', '🧮', 'Calculateur d’origine', 'outil', CALCUL),
                           ('fiche', '📋', 'Fiche d’origine produit', 'outil', FICHE), ('suivi', '⏱️', 'Suivi des preuves', 'outil', SUIVI)]),
               ('Modèles', [('decl', '✍️', 'Déclaration d’origine', 'modèle', DECL), ('fourn', '🤝', 'Déclaration du fournisseur', 'modèle', FOURN),
                            ('clause', '📄', 'Clause de coopération', 'modèle', CLAUSE), ('us', '🇺🇸', 'Dossier d’origine États-Unis', 'liste', US)]),
               ('Contrôles', [('cl-import', '✅', 'Check-list à l’importation', 'liste', CL_IMPORT), ('cl-export', '✅', 'Check-list à l’exportation', 'liste', CL_EXPORT),
                              ('controle', '🔎', 'Le contrôle a posteriori', '', CONTROLE)]),
               ('Référence', [('cas', '💡', 'Cas pratiques', '', CAS), ('faq', '❓', 'Questions fréquentes', '', FAQ), ('sources', '📚', 'Textes et sources', '', SOURCES)]),
           ], script=SCRIPT)
