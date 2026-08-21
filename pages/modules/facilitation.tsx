import { useState } from 'react'
import ModuleLayout from '../../components/ModuleLayout'

type Tab = 'maroc' | 'base' | 'comparateur' | 'watchlist' | 'benchmark'

const MAROC_DATA = [
  { d: "Exportation des marchandises dans l'état où elles ont été importées", c: "Indiquer case 38 \"exportation en l'état\" + motif ou justificatif. Mainlevée après contrôle d'apurement (hors contentieux).", codes: ["070","072","762","751","768"], refs: [] },
  { d: "Exportation en suite de transformation sous douane", c: "Indiquer case 38 si exportation en l'état des intrants ou des produits transformés + motif/justificatif. Mainlevée après contrôle d'apurement.", codes: ["700","767"], refs: [] },
  { d: "MAC en suite du régime EPP (max 15% des quantités initiales)", c: "Accordée aux plates-formes d'approvisionnement des entreprises exportatrices. Indiquer case 38 \"MAC max 15% EPP\".", codes: ["047"], refs: [] },
  { d: "Mise à la consommation en suite des RED (ATPA, AT, EIF)", c: "Mainlevée après contrôle d'apurement et vérification des marchandises. Dispense d'amende pour : 15% des quantités exportées (ATPA), 15% CA export annuel précédent (EIF), articles 2ème choix textile/cuir (avec décision jointe).", codes: ["040","044","048"], refs: [] },
  { d: "Dispense de caution AT pour séminaires, expositions, manifestations culturelles", c: "Engagement écrit du département/établissement/ambassade garantissant la réexportation avant expiration des délais. Produits consommables soumis aux droits/taxes à l'importation.", codes: ["321","322","332"], refs: [] },
  { d: "AT sans paiement/exonération redevances pour démos, essais, festivités, congrès, rallyes", c: "Délai max 6 mois (expo/foire/congrès) ou 2 ans (essais/tests/expériences). Fixé par l'administration. Indiquer usage prévu en case 38.", codes: ["321","322","332"], refs: [] },
  { d: "AT des échantillons importés par les unités de production exportatrices", c: "Délai max 6 mois, fixé par l'administration selon documents produits.", codes: ["321"], refs: [] },
  { d: "AT de matériels et accessoires cinématographiques", c: "Autorisation du CCM requise (annexée à la déclaration). Délai fixé selon emploi envisagé.", codes: ["332"], refs: [] },
  { d: "AT matériel photo & effets vestimentaires pour reportages catalogues de mode", c: "Autorisation du CCM requise. Délai fixé selon emploi envisagé.", codes: ["332"], refs: [] },
  { d: "AT matériel de travail pour journalistes de chaînes TV étrangères au Maroc", c: "Autorisation du département de la communication requise. Délai fixé selon emploi envisagé.", codes: ["332"], refs: [] },
  { d: "AT de bigs bags, sacs en jute et sacs tissés par sociétés commerciales", c: "Droit pour sociétés industrielles. Refusé aux sociétés commerciales pour revente en l'état (doivent utiliser EPP).", codes: ["311"], refs: [] },
  { d: "AT petit matériel, outillage, objets en bagages accompagnés par non-résidents", c: "Attestations administratives requises (ANRT, Santé, etc.). Délai max 6 mois, fixé par l'administration.", codes: ["321"], refs: [] },
  { d: "ATPA de produits agricoles", c: "Vérification de l'existence et de l'applicabilité de l'autorisation du département de l'agriculture ou de l'ONICL pour les céréales et légumineuses précisant destinataire, nature, quantité et modalités d'apurement.", codes: [], refs: ["Article 138 du Code des Douanes"] },
  { d: "ATPA réalisées par les opérateurs non outillés — livraison pour sous-traitance à des industriels", c: "En dehors des plateformes et commerçants spécialisés connus du service, les opérations de l'espèce doivent faire l'objet d'un suivi rigoureux par les services en charge du contrôle a posteriori.", codes: [], refs: [] },
  { d: "ATPA et cession simultanées entre commerçants spécialisés et Industriels", c: "S'assurer de la souscription simultanée de deux déclarations : première d'ATPA en dispense de caution et seconde de cession en suite d'ATPA en apurement. L'enlèvement n'est autorisé qu'après mainlevée de la déclaration de cession.", codes: [], refs: [] },
  { d: "ATPA par des artisans ne remplissant pas les conditions de l'article 138 du CDII", c: "Vérification de la qualité d'artisan du soumissionnaire au vu des justificatifs produits. Délai de séjour max 3 mois. Date d'échéance du compte ATPA à modifier en conséquence.", codes: [], refs: ["Article 138 du CDII"] },
  { d: "Réimportation pour retouches de marchandises fabriquées au Maroc", c: "Les articles réimportés doivent être ceux exportés initialement en suite d'ATPA. Risque de substitution par produits de valeur supérieure : traitement rigoureux requis.", codes: [], refs: ["Circulaire n° 5252/313 du 23/02/2011"] },
  { d: "Cession pour l'exportation en suite d'ATPA au profit d'opérateurs hors Art.138 CDII", c: "S'assurer de la souscription par le cessionnaire de deux déclarations : cession en suite d'ATPA en dispense de caution et exportation avec apurement (dépôt simultané). Validation DUM après vérification du vu embarquer.", codes: [], refs: [] },
  { d: "Cession en l'état de marchandises importées initialement sous le régime de l'ATPA", c: "S'assurer de : validité du compte et absence de litige, existence de l'accord du donneur d'ordres pour ATPA sans paiement, échéance du compte de cession = échéance du compte ATPA initial.", codes: [], refs: [] },
  { d: "Exportation préalable prévue aux articles 142 et 150 du CDII", c: "Pour vente à personnes bénéficiant de franchise : bon de franchise annexé à la déclaration. Facture établie en hors droits et taxes.", codes: [], refs: ["Articles 142 et 150 du CDII"] },
  { d: "Admission des marchandises importées en compensation d'un export préalable", c: "Marchandises exportées et importées doivent être de caractéristiques techniques identiques en principe. Compensation à concurrence des droits acquittés.", codes: [], refs: [] },
  { d: "Régularisation de l'export préalable par un bureau autre que celui de la sortie", c: "Marchandises exportées et importées doivent être de caractéristiques techniques identiques. Compensation à concurrence des droits acquittés.", codes: [], refs: [] },
  { d: "ETPP de produits et marchandises (hors machines, matériels, outillages et équipements)", c: "Vérifier existence et applicabilité de l'autorisation du département de ressource selon nature du produit, sauf pour opérations ETPP vers zones d'accélération industrielle avec autorisation permanente.", codes: [], refs: ["Circulaire n° 5360/313 du 16/01/2013"] },
  { d: "ETPP de machines, matériels, outillages et équipements", c: "La déclaration doit porter sur machines, matériels, outillages et équipements. Annotation BADR avec précision des éléments d'identification de la marchandise.", codes: [], refs: ["Circulaire n° 5360/313 du 16/01/2013"] },
  { d: "ETPP — Réimportation par un bureau autre que celui d'exportation", c: "Les marchandises réimportées doivent être identiques à celles exportées. Contrôle sur base des éléments renseignés sur déclaration d'exportation au niveau BADR.", codes: [], refs: [] },
  { d: "Transformation sous douane", c: "Vérification de l'existence et applicabilité de l'avis favorable du département ministériel chargé de la ressource. S'assurer que le produit transformé bénéficie d'exonération totale ou partielle.", codes: [], refs: ["Article 163 ter du Code des Douanes"] },
  { d: "AT de matériels demeurant propriété étrangère soumis au paiement des redevances trimestrielles", c: "Facture libellée sans paiement ou facture uniquement pour la douane. Annotation BADR précise des éléments d'identification. Délai AT limité au temps nécessaire fixé selon documents produits.", codes: [], refs: ["Circulaire n° 5938/300 du 21/05/2019"] },
  { d: "AT des biens et équipements nécessaires à la réalisation de programmes hydrocarbures", c: "Vérification existence et applicabilité de la liste des matériels visée par département de l'énergie. Annotation BADR précise. Délai AT limité au temps nécessaire fixé selon documents.", codes: [], refs: ["Circulaires n° 4333/211 du 01/07/1994 et n° 5938/300 du 21/05/2019"] },
  { d: "AT avec exonération des redevances trimestrielles de matériel destiné à être homologué par l'ANRT", c: "Vérification existence et applicabilité de l'autorisation ANRT précisant nombre, nature des matériels et durée des tests. Délai de séjour = délai accordé par ANRT.", codes: [], refs: [] },
  { d: "AT pour la réalisation d'opérations de commerce triangulaire", c: "Deux situations : 1) Marchandises ne quittant pas enceinte : AT en dispense de garantie + export simultanée. 2) Marchandises quittant enceinte : AT avec garantie obligatoire, délai max 3 mois. Certificat d'origine non délivré à l'export.", codes: [], refs: [] },
  { d: "Exportation temporaire", c: "Annotation de la déclaration sur le système BADR avec précision des éléments permettant l'identification de la marchandise déclarée.", codes: [], refs: [] },
  { d: "Entrepôt industriel franc (EIF)", c: "Suspension des droits et taxes à l'importation pour transformation et réexportation des produits finis.", codes: [], refs: [] },
  { d: "Entrepôt privé banal (EPB)", c: "Stockage de marchandises sous contrôle douanier avec suspension des droits et taxes.", codes: [], refs: [] },
  { d: "Régularisation comptes par destruction ou abandon", c: "Régularisation des comptes ATPA/AT/EIF par destruction ou abandon en exonération des droits et taxes.", codes: [], refs: [] },
  { d: "Régularisation comptes ATPA/EIF par MAC", c: "MAC en exonération pour fins de lots/rebuts offerts à l'État, collectivités ou associations agréées.", codes: [], refs: [] },
  { d: "Prorogation du délai des comptes RED", c: "Prorogation au-delà du délai réglementaire des comptes régimes économiques à durée limitée.", codes: [], refs: [] },
  { d: "Drawback-énergie textile-habillement", c: "Domiciliation des dossiers de remboursement Drawback-énergie pour le secteur textile-habillement.", codes: [], refs: [] },
  { d: "Entrepôt privé particulier (EPP et EPPS)", c: "Entrepôt privé particulier et entrepôt privé particulier spécialisé — stockage marchandises propres du déclarant.", codes: [], refs: [] },
  { d: "ETPP avec échange standard", c: "Exportation temporaire en vue de perfectionnement passif avec recours à l'échange standard (remplacement avant retour).", codes: [], refs: [] },
  { d: "AT matériels propriété étrangère pour production à dominante export", c: "AT matériels propriété étrangère pour entreprises dont plus de 75% de la production est destinée à l'exportation. Exonération redevances — autorisation ponctuelle ou annuelle.", codes: [], refs: [] },
  { d: "Exportation hors délai suite ATPA, AT, EIF et EPP", c: "Procédure de régularisation pour exportation réalisée après expiration du délai accordé dans le cadre des régimes économiques.", codes: [], refs: [] },
  { d: "Importation de matériel d'investissement par envois fractionnés", c: "Permet l'importation progressive de matériels démontés constitutifs d'un ensemble industriel sous un seul régime.", codes: [], refs: [] },
  { d: "Délai 3 à 12 mois pour importations fractionnées", c: "Décision accordant un délai de 3 à 12 mois pour importations fractionnées de matériels démontés. Délai fixé selon complexité et volume.", codes: [], refs: [] },
  { d: "Cession articles/accessoires emballage fruits, légumes et produits de la mer", c: "Cession des articles et accessoires d'emballage/conditionnement de fruits, légumes et produits de la mer destinés à l'export.", codes: [], refs: [] },
  { d: "Imputation a posteriori des comptes RED", c: "Imputation a posteriori des comptes régimes économiques (en cours de validité ou échus). À titre de facilité, étendue à tous les régimes économiques.", codes: [], refs: [] },
  { d: "Sous-traitance entre industriels — complément main d'œuvre", c: "Dispense de formalités de cession pour les opérations de sous-traitance entre industriels nécessitant uniquement un complément de main d'œuvre.", codes: [], refs: [] },
  { d: "Importation échantillons/spécimens sociétés exportatrices simplifiée", c: "Échantillons/spécimens de valeur inférieure à 5 000 DH importés sous couvert de déclaration simplifiée ATPA en dispense de caution.", codes: [], refs: [] },
]

const WORLD_DATA = [
  { pays:"USA", flag:"🇺🇸", region:"Amérique du Nord", domaine:"Dédouanement numérique", tache:"Déclarations ACE multi-agences", change:"Customs Facilitation Act 2025", nouvelle:"Guichet unique fédéral ACE ; IA/datamining CBP ; green lane opérateurs agréés" },
  { pays:"USA", flag:"🇺🇸", region:"Amérique du Nord", domaine:"Opérateur agréé (AEO)", tache:"C-TPAT Trusted Trader", change:"Extension sous-traitants ; critères sécurité supply chain mis à jour", nouvelle:"11 MRAs actifs ; réduction contrôles physiques ; accès prioritaire frontières" },
  { pays:"Grande-Bretagne", flag:"🇬🇧", region:"Europe", domaine:"Dédouanement numérique", tache:"Déclarations CDS (ex-CHIEF)", change:"CHIEF décommissionné juin 2024 — CDS seule plateforme", nouvelle:"CDS : 91 éléments structurés ; intégration GVMS + NCTS5" },
  { pays:"France", flag:"🇫🇷", region:"Europe", domaine:"Guichet unique", tache:"GUN + DELTA-G", change:"Fin DAU papier novembre 2024 — passage formulaire H1/B1", nouvelle:"GUN interconnecte 11 administrations ; France Sésame optimise ports" },
  { pays:"UE", flag:"🇪🇺", region:"Europe", domaine:"Dédouanement numérique", tache:"Réforme Code Douanes Union", change:"Parlement européen mars 2024 : 486 voix — réforme CDU adoptée", nouvelle:"Espace européen données douanières ; EU-CSW guichet unique" },
  { pays:"Chine", flag:"🇨🇳", region:"Asie", domaine:"Dédouanement numérique", tache:"Smart Customs GACC", change:"Smart Customs 2023-2025 ; portail WCO-GACC lancé déc. 2024", nouvelle:"Inspection vidéo -90% temps ; IA bois <10 min ; release before inspection minerais" },
  { pays:"Inde", flag:"🇮🇳", region:"Asie", domaine:"Opérateur agréé (AEO)", tache:"AEO-T1/T2/T3 CBIC", change:"Reconnaissance WTO 2024 ; MRA Corée du Sud + Hong Kong", nouvelle:"DPD livraison directe port ; paiement différé droits T2/T3" },
  { pays:"EAU (Dubai)", flag:"🇦🇪", region:"Golfe", domaine:"Opérateur agréé (AEO)", tache:"AEO 2.0 → 3.0 Dubai Customs", change:"130 membres ; programme GCC régional 2023", nouvelle:"Fast-track lanes ; digital corridors ; smart borders" },
  { pays:"GCC (Golfe)", flag:"🌍", region:"Golfe", domaine:"Dédouanement numérique", tache:"Tarif douanier harmonisé GCC", change:"GCC Integrated Customs Tariff — janvier 2025", nouvelle:"12 chiffres harmonisés ; +13 400 lignes tarifaires ; base SH 2022" },
  { pays:"Maroc", flag:"🇲🇦", region:"Afrique", domaine:"Guichet unique", tache:"PORTNET + ADII", change:"Dématérialisation complète ; intégration ONSSA/EACCE", nouvelle:"Délai mainlevée <2h pour OEA ; 47 mesures simplification ADII" },
  { pays:"Égypte", flag:"🇪🇬", region:"Afrique", domaine:"Guichet unique", tache:"NAFEZA — numéro ACID", change:"ACID obligatoire avant tout chargement à l'étranger", nouvelle:"Enregistrement 48h avant chargement ; multi-administrations connectées" },
  { pays:"Rwanda", flag:"🇷🇼", region:"Afrique", domaine:"Dédouanement numérique", tache:"ASYCUDA + eTrade RRA", change:"Leader Afrique de l'Est en délai mainlevée", nouvelle:"Mainlevée <30 min ; déclarations 24/7 ; KPIs publiés mensuellement" },
  { pays:"Sénégal", flag:"🇸🇳", region:"Afrique", domaine:"Guichet unique", tache:"GAINDE 2000 + ORBUS", change:"ORBUS 2 pour formalités export ; interconnexion douane-banques", nouvelle:"Pré-dédouanement 48h avant arrivée ; 4 canaux sélectivité" },
  { pays:"Kenya", flag:"🇰🇪", region:"Afrique", domaine:"Transit & logistique", tache:"Corridor Northern — OSBP", change:"Harmonisation corridor avec Ouganda ; WTO TFA Article 8", nouvelle:"OSBP Kenya-Ouganda fonctionnel ; corridor Mombasa 11 → 5 jours de transit" },
  { pays:"Nigeria", flag:"🇳🇬", region:"Afrique", domaine:"Dédouanement numérique", tache:"DESTINATION (NCS)", change:"Migration DESTINATION ; désengagement progressif du papier", nouvelle:"Déclarations électroniques ; paiement e-banking ; validation HS en ligne" },
  { pays:"Côte d'Ivoire", flag:"🇨🇮", region:"Afrique", domaine:"Guichet unique", tache:"SYDAM World + GUCE", change:"GUCE Abidjan : guichet unique portuaire renforcé 2024", nouvelle:"Mainlevée <24h port Abidjan ; interconnexion BCEAO" },
  { pays:"Cameroun", flag:"🇨🇲", region:"Afrique", domaine:"Dédouanement numérique", tache:"CAMCIS (ASYCUDA ++)", change:"Migration ASYCUDA vers CAMCIS v2 — 2023", nouvelle:"Dépôt électronique obligatoire Douala ; paiement mobile intégré" },
  { pays:"Japon", flag:"🇯🇵", region:"Asie", domaine:"Dédouanement numérique", tache:"NACCS7 guichet unique", change:"NACCS7 — mise à jour 2024", nouvelle:"Mainlevée <2h générale ; AEO Japon 700+ entreprises certifiées" },
  { pays:"Corée du Sud", flag:"🇰🇷", region:"Asie", domaine:"Opérateur agréé (AEO)", tache:"AEO Korea Customs Service", change:"15 MRAs actifs — leader mondial AEO", nouvelle:"Mainlevée en 1h30 pour AEO ; programme self-assessment avancé" },
]

type CompEntry = { flag: string; region: string; score: number; sw: string; aeo: string; risk: string; eco: string; strengths: string[]; vigilance: string[] }
const COMP_DATA: Record<string, CompEntry> = {
  "USA":           { flag:"🇺🇸", region:"Amérique du Nord", score:82, sw:"ACE (guichet unique fédéral)", aeo:"C-TPAT (11 MRAs)", risk:"IA/datamining CBP", eco:"Seuil minimis 800 USD", strengths:["ACE très intégré","C-TPAT reconnu mondialement","Mainlevée <1h pour agréés"], vigilance:["Tarifs réciproques 2025","Règles USMCA complexes","Contrôles renforcés colis Chine"] },
  "Grande-Bretagne": { flag:"🇬🇧", region:"Europe", score:78, sw:"CDS (depuis juin 2024)", aeo:"UK AEO + UKIMS Windsor", risk:"BTOM catégorisation risque", eco:"Seuil minimis 135 GBP", strengths:["CDS moderne et structuré","Green Lane NI agréés","GVMS fluide"], vigilance:["Post-Brexit contrôles SPS UE","CBAM UK 2027-2028","Déclarations NI doubles"] },
  "France":        { flag:"🇫🇷", region:"Europe", score:76, sw:"GUN + DELTA-G + France Sésame", aeo:"OEA (programme EU)", risk:"Datamining 3D", eco:"Seuil minimis 150 EUR", strengths:["GUN interconnecte 11 admins","Réforme CDU 2024 adoptée","France Sésame ports"], vigilance:["DAU → H1 nov.2024 (120 champs)","CBAM UE applicable","Transition mai 2025"] },
  "Chine":         { flag:"🇨🇳", region:"Asie", score:88, sw:"Guichet unique GACC/CIFER", aeo:"AEO programme national", risk:"Smart Customs IA", eco:"Enregistrement GACC préalable", strengths:["Smart Customs -90% temps","IA bois 10 min","CIFER simplifié"], vigilance:["GACC obligatoire 18 catégories","Traçabilité 18 chiffres","Règles supply chain export 2025"] },
  "Maroc":         { flag:"🇲🇦", region:"Afrique", score:65, sw:"PORTNET + ADII", aeo:"OEA ADII (programme actif)", risk:"Ciblage ADII / GAINDE", eco:"Zones franches Tanger Med/CFZ", strengths:["PORTNET mainlevée <2h OEA","Tanger Med hub continental","47 mesures simplification ADII"], vigilance:["Contrôles ONSSA agro-alimentaire","Transit Sahel complexe","MRAs limités à étendre"] },
  "EAU (Dubai)":   { flag:"🇦🇪", region:"Golfe", score:91, sw:"Dubai Trade (portail unique)", aeo:"AEO 3.0 (130 membres)", risk:"Smart borders + scoring", eco:"45 zones franches", strengths:["Meilleur AEO du Golfe","Digital corridors fast-track","45 FTZ franchise totale"], vigilance:["GCC Tariff 2025 +13 400 lignes","Contrôles produits dual-use","MRAs à valider"] },
  "Inde":          { flag:"🇮🇳", region:"Asie", score:72, sw:"SWIFT + ICEGATE", aeo:"AEO-T1/T2/T3 CBIC", risk:"Analyse risque ICES", eco:"Procédures MSME spécifiques", strengths:["AEO reconnu WTO 2024","DPD livraison directe port","Mainlevée <48h pour AEOs"], vigilance:["MRAs limités (2 pays)","Complexité FSSAI + DGFT","Exigences SION EXIM"] },
  "Rwanda":        { flag:"🇷🇼", region:"Afrique", score:70, sw:"RRA ASYCUDA + eTrade", aeo:"Programme RRA leader EAC", risk:"Analyse risque automatisée", eco:"Facilitation PME", strengths:["Mainlevée <30 min","KPIs publiés mensuellement","Interopérabilité EAC"], vigilance:["Dépendance transit Mombasa","Capacité inspecteurs à renforcer","SPS partiellement manuel"] },
  "Corée du Sud":  { flag:"🇰🇷", region:"Asie", score:86, sw:"UNI-PASS Korea", aeo:"AEO KCS (15 MRAs)", risk:"Analyse risque intégrée", eco:"FTA 60+ partenaires", strengths:["15 MRAs actifs — leader mondial","Mainlevée 1h30 pour AEO","Self-assessment avancé"], vigilance:["Réglementations CHIPS complexes","Conformité REACH/RoHS","Règles origine FTA strictes"] },
  "Japon":         { flag:"🇯🇵", region:"Asie", score:87, sw:"NACCS7 (guichet unique)", aeo:"AEO Japan Customs (700+)", risk:"NACCS analyse risque", eco:"Franchise diplomatique étendue", strengths:["Mainlevée <2h générale","AEO 700+ certifiés","NACCS interconnecte 40 admins"], vigilance:["Shizai kigo préalable","Inspection SPS végétaux","Lourdeur documentaire certains produits"] },
}

const WATCHLIST = [
  { date:"Avr. 2026", pays:"🇺🇸 USA",           titre:"Tarifs réciproques — révision IEEPA", niveau:"critique", desc:"Réajustement des taux douaniers sur 80+ pays suite Executive Order 14257. Suivi hebdomadaire requis." },
  { date:"Avr. 2026", pays:"🇪🇺 UE",            titre:"CBAM — phase définitive juillet 2026", niveau:"critique", desc:"Mécanisme d'ajustement carbone aux frontières — secteurs acier, ciment, aluminium, engrais, électricité, hydrogène." },
  { date:"Mar. 2026", pays:"🇬🇧 UK",            titre:"Post-Brexit SPS controls phase 3", niveau:"alerte",   desc:"Nouveaux contrôles physiques produits animaux et végétaux UE → UK. Certificats sanitaires requis." },
  { date:"Mar. 2026", pays:"🇲🇦 Maroc",         titre:"Accord commercial Maroc-UK post-Brexit", niveau:"info",    desc:"Négociations en cours pour révision de l'accord de libre-échange Maroc-UK (remplace accord UE-Maroc)." },
  { date:"Fév. 2026", pays:"🇨🇳 Chine",         titre:"GACC Regulation 249 — nouvelles catégories", niveau:"alerte",   desc:"Extension liste produits soumis à enregistrement GACC préalable à 22 catégories supplémentaires dès juin 2026." },
  { date:"Fév. 2026", pays:"🌍 AfCFTA",          titre:"AfCFTA Zone II — activation protocole", niveau:"info",    desc:"Activation du protocole commerce services AfCFTA — 54 pays. Impact sur corridor Maroc-Afrique subsaharienne." },
  { date:"Jan. 2026", pays:"🌍 GCC",             titre:"GCC Integrated Customs Tariff 2025", niveau:"alerte",   desc:"Nouveau tarif harmonisé 12 chiffres GCC — 13 400+ lignes. Obligatoire pour toutes déclarations dans les 6 États membres." },
  { date:"Jan. 2026", pays:"🇮🇳 Inde",          titre:"Budget 2026 — révision droits de douane", niveau:"info",    desc:"Réduction droits sur équipements solaires et EV ; hausse sur composants électroniques non manufacturés en Inde." },
  { date:"Déc. 2025", pays:"🇪🇬 Égypte",        titre:"ACID — extension secteurs", niveau:"alerte",   desc:"Extension obligation ACID à 8 nouveaux secteurs : chimie, plastiques, textiles finis. Délai enregistrement réduit à 24h." },
  { date:"Nov. 2025", pays:"🇫🇷 France",         titre:"DAU papier → formulaire H1/B1", niveau:"info",    desc:"Fin du DAU papier — passage au formulaire H1/B1 (120 champs). Toutes déclarations import doivent migrer avant mai 2025." },
]

const NC: Record<string,string> = { critique:'var(--dn)', alerte:'var(--gold)', info:'var(--up)' }
const NB: Record<string,string> = { critique:'rgba(232,93,93,.07)', alerte:'rgba(201,168,76,.07)', info:'rgba(76,175,124,.07)' }

export default function FacilitationHub() {
  const [tab, setTab] = useState<Tab>('maroc')
  const [marSearch, setMarSearch] = useState('')
  const [codeFilter, setCodeFilter] = useState('')
  const [marSel, setMarSel] = useState<number|null>(null)
  const [copied, setCopied] = useState(false)
  const [wRegion, setWRegion] = useState('')
  const [wDomain, setWDomain] = useState('')
  const [wSearch, setWSearch] = useState('')
  const [ctrA, setCtrA] = useState('Maroc')
  const [ctrB, setCtrB] = useState('France')
  const [aiResult, setAiResult] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [watchNiveau, setWatchNiveau] = useState('')

  const marocFiltered = MAROC_DATA.map((m,i) => ({...m,i})).filter(m => {
    const q = marSearch.toLowerCase()
    const codeOk = !codeFilter || m.codes.some(c => c.includes(codeFilter))
    const textOk = !q || m.d.toLowerCase().includes(q) || m.c.toLowerCase().includes(q)
    return codeOk && textOk
  })

  const worldFiltered = WORLD_DATA.filter(d =>
    (!wRegion || d.region === wRegion) &&
    (!wDomain || d.domaine === wDomain) &&
    (!wSearch || d.pays.toLowerCase().includes(wSearch.toLowerCase()) || d.nouvelle.toLowerCase().includes(wSearch.toLowerCase()))
  )

  const copyFiche = () => {
    if (marSel === null) return
    const m = MAROC_DATA[marSel]
    const txt = [m.d, '', 'Conditions : ' + m.c, m.codes.length ? 'Codes régime : ' + m.codes.join(', ') : '', m.refs.length ? 'Références : ' + m.refs.join(', ') : ''].filter(Boolean).join('\n')
    navigator.clipboard?.writeText(txt)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const analyserIA = async () => {
    setAiLoading(true); setAiResult('')
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          model:'claude-sonnet-4-20250514', max_tokens:1000,
          system:"Tu es Expertt One, expert en facilitation douanière internationale (OMC/TFA, OMD/WCO, OCDE). Tu maîtrises les procédures douanières de 40+ pays dont le Maroc (ADII, PORTNET). Réponds de façon précise, opérationnelle, en français. Cite les codes régime, circulaires ADII, délais réels 2026. Sois concis et orienté praticien (transitaire/importateur).",
          messages:[{role:'user', content:`Analyse approfondie commerce ${ctrA} vers ${ctrB} et retour : documents requis pour importateur marocain, incoterms recommandés selon mode transport, erreurs fréquentes transitaires, délais réels dédouanement 2026, codes régime douane marocaine applicables, points de vigilance pratiques ?`}]
        })
      })
      const data = await res.json()
      setAiResult(data.content?.map((c: any) => c.text||'').join('') || 'Analyse non disponible.')
    } catch { setAiResult("Erreur lors de l'appel IA.") }
    setAiLoading(false)
  }

  const dA = COMP_DATA[ctrA], dB = COMP_DATA[ctrB]
  const watchFiltered = WATCHLIST.filter(w => !watchNiveau || w.niveau === watchNiveau)

  return (
    <ModuleLayout
      kicker="MODULE CFH"
      title="Customs Facilitation Global Hub"
      sub="Plateforme de référence mondiale sur les mesures de facilitation douanière — Volet Maroc ADII exclusif (47 mesures), comparateur interactif IA, base mondiale 20+ pays, watchlist réformes."
    >
      <style dangerouslySetInnerHTML={{__html:CSS}} />

      <div className="h-kpis">
        {[['47','Mesures ADII Maroc'],['20+','Pays couverts'],['10','Comparateurs actifs'],['Avr. 2026','Dernière mise à jour']].map(([n,l]) => (
          <div key={l} className="h-kpi"><div className="h-kpi-n">{n}</div><div className="h-kpi-l">{l}</div></div>
        ))}
      </div>

      <div className="h-tabs">
        {([['maroc','🇲🇦 Mesures Maroc ADII'],['base','🌍 Base Mondiale'],['comparateur','⚖️ Comparateur IA'],['watchlist','🔔 Watchlist'],['benchmark','📊 Benchmark']] as [Tab,string][]).map(([t,l]) => (
          <button key={t} className={`h-tab${tab===t?' act':''}`} onClick={() => setTab(t)}>{l}</button>
        ))}
      </div>

      {/* ─── MAROC ─── */}
      {tab==='maroc' && (
        <div className="h-tab-body">
          <div className="h-maroc-hdr">
            <div>
              <div className="h-maroc-title">🇲🇦 Mesures de Facilitations Douanières — Maroc (ADII)</div>
              <div className="h-maroc-sub">47 mesures officielles · Source : Administration des Douanes et Impôts Indirects</div>
            </div>
            <div className="h-mstats">
              {[['47','Mesures'],['12','Régimes AT/ATPA'],['8','ETPP/EIF'],['ADII','Administration']].map(([v,l]) => (
                <div key={l} className="h-mstat"><div className="h-mstat-v">{v}</div><div className="h-mstat-l">{l}</div></div>
              ))}
            </div>
          </div>
          <div className="h-mlayout">
            <div className="h-mleft">
              <div className="h-search-row">
                <input className="h-inp" placeholder="Mot-clé..." value={marSearch} onChange={e => setMarSearch(e.target.value)} />
                <input className="h-inp" style={{width:110}} placeholder="Code régime..." value={codeFilter} onChange={e => setCodeFilter(e.target.value)} />
              </div>
              <div className="h-mcount">{marocFiltered.length} mesure{marocFiltered.length>1?'s':''}</div>
              <div className="h-mlist">
                {marocFiltered.length===0 ? <div className="h-empty">Aucun résultat</div> :
                  marocFiltered.map(m => (
                    <div key={m.i} className={`h-mitem${marSel===m.i?' sel':''}`} onClick={() => setMarSel(m.i)}>
                      <span className="h-mnum">{m.i+1}.</span>{m.d}
                      {m.codes.length>0 && <span className="h-micode">{m.codes[0]}</span>}
                    </div>
                  ))
                }
              </div>
            </div>
            <div className="h-mright">
              {marSel===null ? (
                <div className="h-fiche-empty">
                  <div style={{fontSize:30,marginBottom:'.75rem'}}>⬅️</div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:'var(--ink2)',marginBottom:'.5rem'}}>Sélectionnez une mesure</div>
                  <div style={{fontSize:12,color:'var(--ink3)'}}>Cliquez sur une mesure dans la liste pour afficher les conditions d'application complètes.</div>
                </div>
              ) : (() => {
                const m = MAROC_DATA[marSel]
                return (
                  <div className="h-fiche">
                    <div className="h-fiche-hd">
                      <div><div className="h-fiche-num">Mesure {marSel+1} / 47</div><div className="h-fiche-title">{m.d}</div></div>
                      <button className="h-copy-btn" onClick={copyFiche}>{copied?'✅ Copié':'📋 Copier'}</button>
                    </div>
                    <div className="h-fiche-lbl">CONDITIONS D'APPLICATION</div>
                    <div className="h-fiche-cond">{m.c}</div>
                    {m.codes.length>0 && (<><div className="h-fiche-lbl" style={{marginTop:'.75rem'}}>CODES RÉGIME</div><div className="h-tags-row">{m.codes.map(c => <span key={c} className="h-tag-code">Régime {c}</span>)}</div></>)}
                    {m.refs.length>0 && (<><div className="h-fiche-lbl" style={{marginTop:'.75rem'}}>RÉFÉRENCES JURIDIQUES</div><div className="h-tags-row">{m.refs.map(r => <span key={r} className="h-tag-ref">{r}</span>)}</div></>)}
                    <div className="h-nav-btns">
                      <button className="h-nav-btn" disabled={marSel===0} onClick={() => setMarSel(s => s!-1)}>← Précédent</button>
                      <button className="h-nav-btn" disabled={marSel===MAROC_DATA.length-1} onClick={() => setMarSel(s => s!+1)}>Suivant →</button>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ─── BASE MONDIALE ─── */}
      {tab==='base' && (
        <div className="h-tab-body">
          <div className="h-filters">
            <select className="h-sel" value={wRegion} onChange={e => setWRegion(e.target.value)}>
              <option value="">Toutes les régions</option>
              {Array.from(new Set(WORLD_DATA.map(d => d.region))).map(r => <option key={r}>{r}</option>)}
            </select>
            <select className="h-sel" value={wDomain} onChange={e => setWDomain(e.target.value)}>
              <option value="">Tous les domaines</option>
              {Array.from(new Set(WORLD_DATA.map(d => d.domaine))).map(d => <option key={d}>{d}</option>)}
            </select>
            <input className="h-inp" style={{flex:1}} placeholder="Rechercher pays, mesure..." value={wSearch} onChange={e => setWSearch(e.target.value)} />
            <span className="h-count">{worldFiltered.length} entrées</span>
          </div>
          <div className="h-scroll-table">
            <table className="h-table">
              <thead><tr><th>Pays</th><th>Région</th><th>Domaine</th><th>Mesure / Tâche</th><th>Changement 2024-2026</th><th>Nouveauté opérateur</th></tr></thead>
              <tbody>
                {worldFiltered.map((d,i) => {
                  const dc: Record<string,string> = {'Dédouanement numérique':'h-tag-blue','Guichet unique':'h-tag-purple','Opérateur agréé (AEO)':'h-tag-green','Gestion des risques':'h-tag-amber','Transit & logistique':'h-tag-coral'}
                  return (
                    <tr key={i}>
                      <td><strong>{d.flag} {d.pays}</strong></td>
                      <td className="h-td-sub">{d.region}</td>
                      <td><span className={`h-tag ${dc[d.domaine]||'h-tag-gray'}`}>{d.domaine}</span></td>
                      <td>{d.tache}</td>
                      <td className="h-td-sub">{d.change}</td>
                      <td>{d.nouvelle}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="h-source-note">Sources : OCDE · OMC/TFA · OMD/WCO · Banque Mondiale · CNUCED · Administrations nationales · Avril 2026</div>
        </div>
      )}

      {/* ─── COMPARATEUR ─── */}
      {tab==='comparateur' && (
        <div className="h-tab-body">
          <div className="h-comp-selects">
            <div className="h-comp-sel-wrap"><label className="h-lbl">PAYS A</label>
              <select className="h-sel-big" value={ctrA} onChange={e => { setCtrA(e.target.value); setAiResult('') }}>
                {Object.keys(COMP_DATA).map(k => <option key={k}>{k}</option>)}
              </select>
            </div>
            <div className="h-comp-vs">↔</div>
            <div className="h-comp-sel-wrap"><label className="h-lbl">PAYS B</label>
              <select className="h-sel-big" value={ctrB} onChange={e => { setCtrB(e.target.value); setAiResult('') }}>
                {Object.keys(COMP_DATA).map(k => <option key={k}>{k}</option>)}
              </select>
            </div>
          </div>
          {ctrA===ctrB ? (
            <div className="h-empty" style={{padding:'2rem',textAlign:'center'}}>Choisissez deux pays différents pour lancer la comparaison.</div>
          ) : dA && dB && (
            <>
              <div className="h-comp-cards">
                {([{key:ctrA,d:dA},{key:ctrB,d:dB}] as {key:string,d:CompEntry}[]).map(({key,d}) => (
                  <div key={key} className="h-comp-card">
                    <div className="h-comp-card-hd">{d.flag} {key} <span className="h-comp-region">— {d.region}</span></div>
                    <div className="h-comp-score-row">
                      <div className="h-comp-score-num">{d.score}<span style={{fontSize:14}}>/100</span></div>
                      <div style={{flex:1}}>
                        <div className="h-score-bar"><div className="h-score-fill" style={{width:`${d.score}%`}} /></div>
                        <div className="h-score-lbl">Score facilitation OCDE</div>
                      </div>
                    </div>
                    <div className="h-comp-grid2">
                      {[['Guichet unique',d.sw],['Programme AEO',d.aeo],['Gestion risque',d.risk],['E-commerce / seuil',d.eco]].map(([k,v]) => (
                        <div key={k} className="h-comp-info"><div className="h-comp-info-k">{k}</div><div className="h-comp-info-v">{v}</div></div>
                      ))}
                    </div>
                    <div className="h-comp-lbl">POINTS FORTS</div>
                    {d.strengths.map(s => <div key={s} className="h-strength">{s}</div>)}
                    <div className="h-comp-lbl">POINTS DE VIGILANCE</div>
                    {d.vigilance.map(v => <div key={v} className="h-vigilance">{v}</div>)}
                  </div>
                ))}
              </div>
              <div className="h-conv-box">
                <div className="h-conv-title">Convergences & Divergences — {ctrA} ↔ {ctrB}</div>
                <div className="h-conv-grid">
                  <div>
                    <div className="h-comp-lbl">POINTS DE CONVERGENCE</div>
                    {['Signataires AFE/TFA OMC — engagements facilitation communs','Guichet unique opérationnel dans les deux pays','Programme AEO actif aligné cadre SAFE OMD','Analyse de risque automatisée dans les deux administrations'].map(c => <div key={c} className="h-conv-item">{c}</div>)}
                  </div>
                  <div>
                    <div className="h-comp-lbl">POINTS DE DIVERGENCE</div>
                    <div className="h-div-item">Écart maturité numérique : {ctrA} ({dA.score}/100) vs {ctrB} ({dB.score}/100) — delta {Math.abs(dA.score-dB.score)} pts</div>
                    <div className="h-div-item">Régimes e-commerce différents : {dA.eco} vs {dB.eco}</div>
                    <div className="h-div-item">MRAs AEO non symétriques — avantages non réciproques dans les deux sens</div>
                  </div>
                </div>
              </div>
              <div className="h-ai-box">
                <div className="h-ai-hd">
                  <div><div className="h-ai-title">Analyse IA approfondie — {ctrA} ↔ {ctrB}</div><div className="h-ai-sub">Documents requis · Incoterms · Erreurs fréquentes · Délais réels 2026 · Codes régime ADII</div></div>
                  <button className="h-ai-btn" onClick={analyserIA} disabled={aiLoading}>{aiLoading ? <span className="h-spin">⟳</span> : '🤖 Analyser avec IA →'}</button>
                </div>
                {aiLoading && <div className="h-ai-loading"><span className="h-spin">⟳</span> Analyse en cours par Expertt One...</div>}
                {aiResult && <div className="h-ai-result">{aiResult.split('\n').map((line,i) => line.trim() ? <p key={i} style={{marginBottom:'.5rem'}}>{line}</p> : null)}</div>}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── WATCHLIST ─── */}
      {tab==='watchlist' && (
        <div className="h-tab-body">
          <div className="h-watch-hd">
            <div><div className="h-watch-title">🔔 Watchlist Réformes Douanières</div><div className="h-watch-sub">Suivi des réformes et modifications réglementaires — 30 jours glissants</div></div>
            <select className="h-sel" value={watchNiveau} onChange={e => setWatchNiveau(e.target.value)}>
              <option value="">Tous les niveaux</option>
              <option value="critique">🔴 Critique</option>
              <option value="alerte">🟡 Alerte</option>
              <option value="info">🟢 Information</option>
            </select>
          </div>
          <div className="h-watch-list">
            {watchFiltered.map((w,i) => (
              <div key={i} className="h-watch-item" style={{borderLeftColor:NC[w.niveau],background:NB[w.niveau]}}>
                <div className="h-watch-meta">
                  <span className="h-watch-date">{w.date}</span>
                  <span className="h-watch-pays">{w.pays}</span>
                  <span className="h-watch-niveau" style={{color:NC[w.niveau]}}>{w.niveau==='critique'?'🔴':w.niveau==='alerte'?'🟡':'🟢'} {w.niveau.charAt(0).toUpperCase()+w.niveau.slice(1)}</span>
                </div>
                <div className="h-watch-titre">{w.titre}</div>
                <div className="h-watch-desc">{w.desc}</div>
              </div>
            ))}
          </div>
          <div className="h-source-note">Sources : OCDE · OMC · OMD · Banque Mondiale · Administrations nationales · Mise à jour : Avril 2026</div>
        </div>
      )}

      {/* ─── BENCHMARK ─── */}
      {tab==='benchmark' && (
        <div className="h-tab-body">
          <div className="h-bench-intro"><div className="h-bench-title">📊 Benchmark Concurrentiel — Customs Facilitation Global Hub</div><div className="h-bench-sub">Analyse des plateformes existantes et positionnement différenciant</div></div>
          <div className="h-bench-grid">
            {[{org:'OMC / Banque Mondiale',outil:'TFA Country Tracking',gap:'Juridique uniquement — zéro vue opérateur'},{org:'OCDE',outil:'TFI Policy Simulator',gap:'160+ pays, 11 indicateurs. Macro/statistique — zéro utilité transitaire'},{org:'CNUCED',outil:'UNCTAD Reform Tracker',gap:'Gouvernements only — non public'},{org:'OMD/WCO',outil:'WCO TRS Guide 2025',gap:'PDF statiques — pas de visualisation corridor'},{org:'Flexport / C.H. Robinson',outil:'Plateformes logistiques',gap:'Excellent UX mais USA-centré — zéro Afrique'}].map(p => (
              <div key={p.outil} className="h-bench-card h-bench-comp"><div className="h-bench-org">{p.org}</div><div className="h-bench-outil">{p.outil}</div><div className="h-bench-gap">{p.gap}</div></div>
            ))}
            <div className="h-bench-card h-bench-us"><div className="h-bench-org" style={{color:'var(--gold)'}}>Notre plateforme</div><div className="h-bench-outil">Customs Facilitation Global Hub</div><div className="h-bench-gap" style={{color:'var(--up)'}}>Couverture Maroc ADII + comparateur IA + base mondiale + watchlist réformes</div></div>
          </div>
          <div className="h-diff-box">
            <div className="h-diff-title">Avantages différenciants exclusifs</div>
            <div className="h-diff-grid">
              {['Seul outil avec 30+ pays Afrique opérationnels','Volet Maroc ADII : 47 mesures détaillées (unique au monde)','Comparateur interactif avec analyse IA (Claude API)','Watchlist publique réformes douanières (30 jours glissants)','Vue opérateur privé — pas vue gouvernement/chercheur','Base mondiale filtrée par région, domaine, pays','Checklist documentaire par code SH (phase 2)','Score facilitation OCDE comparé visuellement'].map(a => <div key={a} className="h-diff-item">{a}</div>)}
            </div>
          </div>
          <div className="h-modules-box">
            <div className="h-diff-title">Modules phase 2 — En développement</div>
            <div className="h-modules-grid">
              {[['M3','critique','Checklist documentaire par code SH + incoterm + route'],['M4','critique','Simulateur landed cost complet (droits + CBAM + SPS)'],['M5','alerte','Radar risque douanier (6 axes OCDE/LPI/UNCTAD)'],['M6','alerte','Corridors interactifs (délais réels vs officiels)'],['M7','info','Guide AEO mondial — critères, MRAs, avantages'],['M8','info','Watchlist réformes étendue (50+ pays)']].map(([code,level,desc]) => (
                <div key={code} className="h-module-item" style={{borderLeftColor:NC[level]}}><strong style={{color:'var(--gold)'}}>{code}</strong> {desc}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="h-footer">Sources : OCDE · OMC · OMD · Banque Mondiale · CNUCED · ADII Maroc · Dernière mise à jour : Avril 2026 · Plateforme Expertt One</div>
    </ModuleLayout>
  )
}

const CSS = `
.h-kpis{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--bd);margin-bottom:1.25rem;background:var(--white)}
.h-kpi{padding:.875rem 1rem;border-right:1px solid var(--bd);text-align:center}.h-kpi:last-child{border-right:none}
.h-kpi-n{font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:600;color:var(--gold)}
.h-kpi-l{font-size:10px;color:var(--ink2);margin-top:2px}
@media(max-width:600px){.h-kpis{grid-template-columns:1fr 1fr}}
.h-tabs{display:flex;border:1px solid var(--bd);margin-bottom:1rem;background:var(--white);overflow-x:auto}
.h-tab{padding:.75rem 1.25rem;font-size:11px;letter-spacing:.06em;color:var(--ink2);background:var(--white);border:none;border-right:1px solid var(--bd);cursor:pointer;font-family:inherit;white-space:nowrap;transition:all .12s}
.h-tab:last-child{border-right:none}.h-tab:hover{background:var(--gold4);color:var(--gold)}
.h-tab.act{background:var(--gold4);color:var(--ink);border-bottom:2px solid var(--gold);font-weight:600}
.h-tab-body{display:flex;flex-direction:column;gap:1rem}
.h-maroc-hdr{background:linear-gradient(135deg,#0F6E56,#1D9E75);padding:1.25rem 1.5rem;display:flex;align-items:flex-start;justify-content:space-between;gap:1.5rem;flex-wrap:wrap}
.h-maroc-title{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:#fff}
.h-maroc-sub{font-size:11px;color:rgba(255,255,255,.75);margin-top:3px}
.h-mstats{display:flex;gap:.5rem;flex-wrap:wrap}
.h-mstat{padding:.5rem .875rem;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.2);text-align:center;min-width:68px}
.h-mstat-v{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:#fff}
.h-mstat-l{font-size:9px;color:rgba(255,255,255,.7);margin-top:1px}
.h-mlayout{display:grid;grid-template-columns:1fr 1.4fr;gap:1rem;background:var(--white);border:1px solid var(--bd);padding:1.25rem}
@media(max-width:750px){.h-mlayout{grid-template-columns:1fr}}
.h-mleft{display:flex;flex-direction:column;gap:.625rem}
.h-search-row{display:flex;gap:.5rem}
.h-inp{flex:1;border:1px solid var(--bd2);padding:.625rem .875rem;font-family:'DM Sans',sans-serif;font-size:12px;color:var(--ink);outline:none;background:var(--g4)}.h-inp:focus{border-color:var(--gold)}
.h-mcount{font-size:10px;color:var(--ink3);letter-spacing:.08em}
.h-mlist{border:1px solid var(--bd);max-height:380px;overflow-y:auto}
.h-mitem{padding:.625rem .875rem;font-size:12px;border-bottom:1px solid var(--bd);cursor:pointer;color:var(--ink2);line-height:1.45;transition:background .1s;display:flex;align-items:flex-start;gap:.5rem}
.h-mitem:last-child{border-bottom:none}.h-mitem:hover{background:var(--gold4)}.h-mitem.sel{background:#E1F5EE;color:#085041;font-weight:500}
.h-mnum{color:var(--ink3);font-size:10px;min-width:18px;padding-top:1px;flex-shrink:0}
.h-micode{font-size:9px;padding:1px 6px;background:rgba(29,158,117,.12);color:#085041;border:1px solid rgba(29,158,117,.25);margin-left:auto;flex-shrink:0}
.h-empty{padding:1rem;font-size:12px;color:var(--ink3);text-align:center}
.h-mright{display:flex;flex-direction:column}
.h-fiche-empty{border:1px dashed var(--bd2);padding:2rem;text-align:center;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--g4)}
.h-fiche{display:flex;flex-direction:column;gap:.875rem;border:1px solid var(--bd);padding:1.25rem;background:var(--white)}
.h-fiche-hd{display:flex;align-items:flex-start;justify-content:space-between;gap:.75rem}
.h-fiche-num{font-size:9px;letter-spacing:.14em;color:var(--gold);margin-bottom:.375rem}
.h-fiche-title{font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:600;color:var(--ink);line-height:1.4}
.h-copy-btn{font-size:11px;padding:5px 12px;border:1px solid var(--bd2);background:var(--white);color:var(--ink2);cursor:pointer;font-family:inherit;flex-shrink:0;white-space:nowrap;transition:all .12s}
.h-copy-btn:hover{border-color:var(--gold);color:var(--gold)}
.h-fiche-lbl{font-size:9px;letter-spacing:.14em;color:var(--ink3);font-weight:600;margin-bottom:.375rem}
.h-fiche-cond{font-size:13px;color:var(--ink2);line-height:1.75;padding:.875rem 1rem;background:var(--g4);border:1px solid var(--bd)}
.h-tags-row{display:flex;flex-wrap:wrap;gap:.375rem}
.h-tag-code{font-size:10px;padding:3px 9px;background:#E1F5EE;color:#085041;border:1px solid rgba(29,158,117,.3)}
.h-tag-ref{font-size:10px;padding:3px 9px;background:#EEEDFE;color:#3C3489;border:1px solid rgba(100,90,200,.3)}
.h-nav-btns{display:flex;gap:.5rem;margin-top:.25rem}
.h-nav-btn{padding:5px 14px;border:1px solid var(--bd2);background:var(--white);color:var(--ink2);font-size:11px;cursor:pointer;font-family:inherit;transition:all .12s}
.h-nav-btn:hover:not(:disabled){border-color:var(--gold);color:var(--gold)}.h-nav-btn:disabled{opacity:.4;cursor:not-allowed}
.h-filters{display:flex;gap:.625rem;align-items:center;flex-wrap:wrap}
.h-sel{padding:.625rem .875rem;border:1px solid var(--bd2);background:var(--g4);font-family:'DM Sans',sans-serif;font-size:12px;color:var(--ink);outline:none}.h-sel:focus{border-color:var(--gold)}
.h-count{font-size:11px;color:var(--ink3);padding:.375rem .75rem;background:var(--g4);border:1px solid var(--bd);white-space:nowrap}
.h-scroll-table{overflow-x:auto;border:1px solid var(--bd)}
.h-table{width:100%;border-collapse:collapse;font-size:12px}
.h-table thead th{padding:.625rem .875rem;background:var(--ink);color:var(--gold2);font-size:9px;letter-spacing:.1em;font-weight:500;text-align:left;border:1px solid #222}
.h-table tbody td{padding:.625rem .875rem;border:1px solid var(--bd);color:var(--ink2);vertical-align:top}
.h-table tbody tr:nth-child(even) td{background:var(--g4)}.h-table tbody tr:hover td{background:var(--gold4)}
.h-td-sub{font-size:10px;color:var(--ink3)}
.h-tag{font-size:10px;padding:2px 7px;font-weight:500;display:inline-block}
.h-tag-blue{background:#E6F1FB;color:#0C447C}.h-tag-purple{background:#EEEDFE;color:#3C3489}
.h-tag-green{background:#EAF3DE;color:#27500A}.h-tag-amber{background:rgba(201,168,76,.15);color:#633806}
.h-tag-coral{background:#FAECE7;color:#712B13}.h-tag-gray{background:var(--g4);color:var(--ink2)}
.h-comp-selects{display:flex;align-items:center;gap:1rem;background:var(--white);border:1px solid var(--bd);padding:1.25rem 1.5rem}
.h-comp-sel-wrap{display:flex;flex-direction:column;gap:.375rem;flex:1}
.h-lbl{font-size:9px;letter-spacing:.14em;color:var(--ink3);font-weight:600}
.h-sel-big{padding:.75rem 1rem;border:1px solid var(--bd2);background:var(--g4);font-family:'DM Sans',sans-serif;font-size:13px;color:var(--ink);outline:none;width:100%}.h-sel-big:focus{border-color:var(--gold)}
.h-comp-vs{font-family:'Cormorant Garamond',serif;font-size:28px;color:var(--gold);font-weight:600;flex-shrink:0}
.h-comp-cards{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
@media(max-width:700px){.h-comp-cards{grid-template-columns:1fr}}
.h-comp-card{border:1px solid var(--bd);background:var(--white);padding:1.25rem;display:flex;flex-direction:column;gap:.75rem}
.h-comp-card-hd{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:600;color:var(--ink)}
.h-comp-region{font-size:13px;color:var(--ink3);font-weight:400}
.h-comp-score-row{display:flex;align-items:center;gap:.875rem}
.h-comp-score-num{font-family:'Cormorant Garamond',serif;font-size:36px;font-weight:600;color:var(--ink);line-height:1;flex-shrink:0}
.h-score-bar{height:6px;background:var(--bd);border-radius:3px;margin-bottom:4px}
.h-score-fill{height:100%;border-radius:3px;background:var(--gold)}
.h-score-lbl{font-size:10px;color:var(--ink3)}
.h-comp-grid2{display:grid;grid-template-columns:1fr 1fr;gap:.375rem}
.h-comp-info{background:var(--g4);padding:.5rem .75rem;border:1px solid var(--bd)}
.h-comp-info-k{font-size:9px;letter-spacing:.1em;color:var(--ink3);margin-bottom:2px}
.h-comp-info-v{font-size:11px;color:var(--ink2)}
.h-comp-lbl{font-size:9px;letter-spacing:.14em;color:var(--ink3);font-weight:600}
.h-strength{font-size:12px;padding:.375rem .75rem;border-left:2px solid var(--up);background:rgba(76,175,124,.06);color:var(--ink2)}
.h-vigilance{font-size:12px;padding:.375rem .75rem;border-left:2px solid var(--gold);background:rgba(201,168,76,.06);color:var(--ink2)}
.h-conv-box{border:1px solid var(--bd);background:var(--white);padding:1.25rem 1.5rem}
.h-conv-title{font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:600;color:var(--ink);margin-bottom:.875rem}
.h-conv-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem}
@media(max-width:600px){.h-conv-grid{grid-template-columns:1fr}}
.h-conv-item{font-size:12px;padding:.375rem .75rem;border-left:2px solid var(--up);background:rgba(76,175,124,.06);color:var(--ink2);margin-bottom:.375rem}
.h-div-item{font-size:12px;padding:.375rem .75rem;border-left:2px solid var(--dn);background:rgba(232,93,93,.06);color:var(--ink2);margin-bottom:.375rem}
.h-ai-box{border:1px solid var(--gold3);background:var(--gold4);padding:1.25rem 1.5rem}
.h-ai-hd{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:.875rem}
.h-ai-title{font-size:14px;font-weight:500;color:var(--ink)}.h-ai-sub{font-size:11px;color:var(--ink3);margin-top:3px}
.h-ai-btn{padding:.75rem 1.25rem;background:var(--white);color:var(--ink);font-size:11px;border:2px solid var(--gold);cursor:pointer;font-family:inherit;font-weight:600;transition:all .15s;white-space:nowrap;flex-shrink:0}
.h-ai-btn:hover:not(:disabled){background:var(--gold4)}.h-ai-btn:disabled{opacity:.5;cursor:not-allowed}
.h-spin{display:inline-block;animation:hspin .6s linear infinite}
@keyframes hspin{to{transform:rotate(360deg)}}
.h-ai-loading{font-size:12px;color:var(--ink3);display:flex;align-items:center;gap:.5rem;padding:.875rem 1rem;background:var(--white);border:1px solid var(--bd)}
.h-ai-result{font-size:13px;color:var(--ink2);line-height:1.75;padding:1rem;background:var(--white);border:1px solid var(--bd)}
.h-watch-hd{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap}
.h-watch-title{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:600;color:var(--ink)}
.h-watch-sub{font-size:11px;color:var(--ink3);margin-top:3px}
.h-watch-list{display:flex;flex-direction:column;gap:.5rem}
.h-watch-item{border-left:3px solid;padding:.875rem 1.25rem;display:flex;flex-direction:column;gap:.375rem}
.h-watch-meta{display:flex;align-items:center;gap:.75rem;flex-wrap:wrap}
.h-watch-date{font-size:10px;color:var(--ink3);letter-spacing:.08em}
.h-watch-pays{font-size:11px;font-weight:500;color:var(--ink2)}
.h-watch-niveau{font-size:10px;font-weight:600}
.h-watch-titre{font-size:13px;font-weight:500;color:var(--ink);line-height:1.4}
.h-watch-desc{font-size:12px;color:var(--ink2);line-height:1.6}
.h-bench-intro{background:var(--white);border:1px solid var(--bd);padding:1.25rem 1.5rem}
.h-bench-title{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:var(--ink)}
.h-bench-sub{font-size:12px;color:var(--ink3);margin-top:4px}
.h-bench-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:.75rem}
@media(max-width:700px){.h-bench-grid{grid-template-columns:1fr}}
.h-bench-card{border:1px solid var(--bd);background:var(--white);padding:1rem}
.h-bench-comp{opacity:.75}.h-bench-us{border-color:var(--gold);background:var(--gold4)}
.h-bench-org{font-size:9px;letter-spacing:.14em;color:var(--ink3);margin-bottom:4px}
.h-bench-outil{font-size:13px;font-weight:500;color:var(--ink);margin-bottom:6px}
.h-bench-gap{font-size:11px;color:var(--ink2);line-height:1.6}
.h-diff-box{border:1px solid var(--gold3);background:var(--gold4);padding:1.25rem 1.5rem}
.h-diff-title{font-size:11px;font-weight:600;color:var(--ink2);margin-bottom:.875rem;letter-spacing:.06em}
.h-diff-grid{display:grid;grid-template-columns:1fr 1fr;gap:.5rem}
@media(max-width:600px){.h-diff-grid{grid-template-columns:1fr}}
.h-diff-item{font-size:12px;padding:.5rem .875rem;background:var(--white);border:1px solid var(--gold3);color:var(--ink2);display:flex;align-items:flex-start;gap:.5rem}
.h-diff-item::before{content:'✓';color:var(--up);font-weight:700;flex-shrink:0}
.h-modules-box{border:1px solid var(--bd);background:var(--white);padding:1.25rem 1.5rem}
.h-modules-grid{display:grid;grid-template-columns:1fr 1fr;gap:.5rem}
@media(max-width:600px){.h-modules-grid{grid-template-columns:1fr}}
.h-module-item{font-size:12px;padding:.5rem .875rem;background:var(--g4);border-left:3px solid;color:var(--ink2)}
.h-source-note{font-size:10px;color:var(--ink3);padding:.75rem 0;border-top:1px solid var(--bd);margin-top:.5rem;font-style:italic}
.h-footer{font-size:10px;color:var(--ink3);padding:.875rem 1rem;background:var(--g4);border:1px solid var(--bd);margin-top:1rem;text-align:center;letter-spacing:.04em}
`