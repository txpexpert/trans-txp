import { useState, useMemo } from 'react'
import ModuleLayout from '../../components/ModuleLayout'

interface CodeDUM { code: string; label: string }
interface Procedure {
  id:          string
  categorie:   Cat
  titre:       string
  codes:       CodeDUM[]
  description: string
  vigilance:   string[]
  vigilanceQ:  string[]
  procedures:  string[]
  normes:      string[]
  documents:   string[]
  checklist:   string[]
  conseilIA:   string
  questionsOuvertes: string[]
}
type Cat = 'IMPORT' | 'EXPORT' | 'TRANSIT' | 'STOCKAGE' | 'ZAI'
type Tab = 'vigilance' | 'procedures' | 'normes' | 'documents'

const PROCEDURES: Procedure[] = [
  {
    id:'import-dc', categorie:'IMPORT',
    titre:'Droit Commun — Mise à la consommation directe',
    codes:[{code:'010',label:'Mise à la consommation directe'}],
    description:'Importation définitive avec paiement intégral des droits et taxes. Régime général applicable à toute marchandise ne bénéficiant pas d\'un régime économique ou d\'exonération.',
    vigilance:[
      'Vérifier la classification SH à 10 chiffres — une erreur entraîne un rappel de droits',
      'Valeur en douane = valeur CAF (Cost + Assurance + Fret jusqu\'au port marocain)',
      'Contrôler les licences et autorisations préalables (médicaments, pesticides, électronique…)',
      'Vérifier l\'origine pour application d\'accords préférentiels (ALECA, ALE USA, Turquie…)',
      'Circuit BADR (vert/orange/rouge) conditionne les délais d\'enlèvement',
      'Droits exigibles dès le dépôt de la DUM — prévoir trésorerie suffisante',
    ],
    vigilanceQ:[],
    procedures:[
      'Déterminer le code SH et calculer les droits (DI + TVA + TIC si applicable)',
      'Obtenir les autorisations préalables (ONSSA, AMIP, IMANOR…)',
      'Préparer le dossier documentaire complet',
      'Créer la DUM sur PortNet (code régime 010) et valider avec le transitaire',
      'Payer les droits et taxes (en ligne ou au bureau de douane)',
      'Suivre le circuit de contrôle — attendre la mainlevée',
      'Enlever la marchandise après obtention du BAE (Bon à Enlever)',
    ],
    normes:[
      'Code des Douanes et Impôts Indirects (CDII)',
      'Tarif Douanier Marocain (TDM) — Nomenclature SH à 10 chiffres',
      'Loi de finances annuelle — taux droits et taxes',
      'Circulaires ADII en vigueur (douane.gov.ma)',
      'Réglementation ONSSA pour produits agroalimentaires',
    ],
    documents:[
      'Facture commerciale (français ou arabe) — prix, quantité, poids, origine, Incoterm',
      'Connaissement (Bill of Lading) ou Lettre de Transport Aérien (LTA)',
      'Certificat d\'origine (selon accord préférentiel applicable)',
      'Police ou certificat d\'assurance transport',
      'Packing list détaillée',
      'Certificat phytosanitaire / sanitaire (si produits alimentaires ou végétaux)',
      'Licence d\'importation (si marchandise soumise à restriction)',
    ],
    checklist:[
      'Code SH à 10 chiffres confirmé',
      'Droits et taxes calculés',
      'Autorisations préalables obtenues',
      'Dossier documentaire complet',
      'DUM créée et validée sur PortNet',
      'Droits payés',
      'Mainlevée obtenue — BAE en main',
      'Marchandise enlevée',
    ],
    conseilIA:'Pour les importations régulières d\'un même produit, demandez une "décision de classement" à l\'ADII. Ce document sécurise votre position tarifaire et évite tout litige sur le code SH.',
    questionsOuvertes:['Délais moyens de dédouanement par bureau (Tanger Med, Casablanca Port, aéroport) à préciser'],
  },
  {
    id:'import-franchises', categorie:'IMPORT',
    titre:'Franchises et exonérations',
    codes:[
      {code:'012',label:'Investissement'},{code:'013',label:'Import. Accords/Conventions'},
      {code:'014',label:'Franchises diplomatiques'},{code:'016',label:'Mat./Prod. Agricol. Franchise'},
      {code:'018',label:'Dons'},{code:'019',label:'Autres franchises'},
    ],
    description:'Importation en exonération totale ou partielle des droits et taxes, sur la base d\'une décision administrative préalable. Chaque code correspond à un régime spécifique d\'exonération.',
    vigilance:[
      'Décision administrative d\'octroi obligatoire AVANT toute importation en franchise',
      'La marchandise ne peut être revendue sans régularisation préalable',
      'Contrôles a posteriori fréquents — conserver tous les justificatifs d\'utilisation',
      'La revente sans régularisation constitue une infraction douanière',
      'Délais de traitement des demandes : 15 à 60 jours selon la nature',
    ],
    vigilanceQ:[],
    procedures:[
      'Identifier le type d\'exonération applicable et le texte légal fondateur',
      'Constituer le dossier de demande auprès de l\'organisme compétent',
      'Obtenir la décision d\'octroi de franchise',
      'Créer la DUM avec le code régime approprié et joindre la décision',
      'Dédouanement sans paiement (ou paiement partiel selon le régime)',
      'Utiliser la marchandise conformément aux conditions d\'octroi',
      'Tenir un registre d\'utilisation si requis',
    ],
    normes:[
      'CDII — Titre III relatif aux exonérations et franchises',
      'Charte de l\'Investissement (pour code 012)',
      'Accords bilatéraux et multilatéraux applicables (pour code 013)',
      'Convention de Vienne (pour franchises diplomatiques — code 014)',
    ],
    documents:[
      'Décision administrative d\'octroi de franchise',
      'Facture commerciale ou pro-forma',
      'Packing list',
      'Connaissement ou LTA',
      'Justificatif de la qualité du bénéficiaire',
      'Descriptif technique de la marchandise',
    ],
    checklist:[
      'Texte légal fondateur identifié',
      'Décision administrative obtenue avant arrivée de la marchandise',
      'DUM créée avec le bon code régime',
      'Décision jointe à la DUM',
      'Marchandise utilisée conformément aux conditions',
      'Registre d\'utilisation tenu si requis',
    ],
    conseilIA:'Les franchises à l\'investissement (code 012) nécessitent souvent une validation par la Commission des Investissements ou le CRI. Anticipez ces délais dans votre planning.',
    questionsOuvertes:['Détail des conditions par sous-type de franchise à enrichir'],
  },
  {
    id:'import-atpa', categorie:'IMPORT',
    titre:'ATPA — Admission Temporaire Pour Perfectionnement Actif',
    codes:[
      {code:'022',label:'ATPA avec paiement'},{code:'023',label:'ATPA sans paiement'},
      {code:'221',label:'ATPA avec paiement depuis ZF'},{code:'231',label:'ATPA sans paiement depuis ZF'},
      {code:'040',label:'MAC en suite d\'ATPA'},
      {code:'070',label:'Export en suite d\'ATPA avec paiement'},{code:'072',label:'Export en suite d\'ATPA sans paiement'},
    ],
    description:'Importation de matières premières ou semi-finis en suspension de droits, transformation sur le TA, puis réexportation des produits finis. Régime phare pour les industries de transformation (textile, automobile, électronique).',
    vigilance:[
      'Délai de réexportation : généralement 36 mois (prorogeable) — respecter scrupuleusement',
      'Compte matière obligatoire : suivi des entrées/sorties/déchets en temps réel',
      'Taux de rendement (taux de déchet industriel) à déclarer et justifier',
      'ATPA avec paiement (022) : droits acquittés à l\'entrée avec remboursement à l\'export',
      'ATPA sans paiement (023) : dispense totale de droits + caution obligatoire',
      'Tout déficit non justifié entraîne mise en recouvrement + pénalités',
      'En cas de MAC partielle (040) : droits exigibles sur la fraction mise à la consommation',
    ],
    vigilanceQ:[],
    procedures:[
      'Obtenir l\'agrément ATPA auprès de la Direction Régionale des Douanes',
      'Définir et faire valider le taux de rendement et le taux de déchet',
      'Déposer la DUM ATPA (022 ou 023) à chaque importation',
      'Ouvrir et tenir le compte matière (entrées matières + sorties produits finis + déchets)',
      'Réaliser la transformation sur le TA',
      'Exporter les produits finis (DUM code 070 ou 072)',
      'Apurer le compte matière auprès de l\'ADII',
    ],
    normes:[
      'CDII — Articles 196 à 218 (régimes économiques — perfectionnement actif)',
      'Décret d\'application des régimes économiques',
      'Circulaires ADII relatives à l\'ATPA',
      'Convention de garantie ou cautionnement global',
    ],
    documents:[
      'Décision d\'agrément ATPA',
      'DUM ATPA (code 022 ou 023)',
      'Facture commerciale des matières importées',
      'Connaissement ou LTA',
      'Compte matière (registre modèle ADII)',
      'Caution bancaire (ATPA sans paiement)',
      'DUM d\'exportation des produits finis',
    ],
    checklist:[
      'Agrément ATPA obtenu et valide',
      'Taux de rendement validé par l\'ADII',
      'DUM ATPA déposée pour chaque importation',
      'Compte matière ouvert et tenu à jour',
      'Transformation réalisée dans les délais',
      'DUM d\'exportation déposée pour chaque sortie',
      'Compte matière apuré',
    ],
    conseilIA:'Le compte matière est le document le plus sensible en ATPA. Tenez-le en temps réel avec les quantités exactes. En contrôle, l\'ADII compare le compte matière avec les pesées réelles des produits finis et déchets.',
    questionsOuvertes:['Références circulaires ADII spécifiques ATPA à compléter','Modalités cautionnement global vs caution par opération'],
  },
  {
    id:'import-at', categorie:'IMPORT',
    titre:'AT — Admission Temporaire (sans transformation)',
    codes:[
      {code:'030',label:'IT Mat. recherche hydrocarbure'},{code:'031',label:'IT Mat. soumis à redevances'},
      {code:'032',label:'IT Mat. non soumis à redevance'},{code:'033',label:'IT Véhicules automobiles'},
      {code:'034',label:'Autres IT'},{code:'501',label:'Admission temporaire'},
    ],
    description:'Importation temporaire de matériels ou véhicules sur le TA, sans transformation, avec réexportation en l\'état dans le délai imparti. Aucun droit de douane dû si les conditions sont respectées.',
    vigilance:[
      'Délai de séjour : 12 mois en règle générale, prorogeable sur demande motivée',
      'La marchandise doit être réexportée en l\'état — aucune transformation autorisée',
      'Les véhicules en AT ne peuvent être prêtés, cédés ou utilisés à des fins commerciales',
      'En cas de perte ou destruction : les droits et taxes deviennent exigibles',
      'Toute cession nécessite une régularisation préalable (code 961)',
    ],
    vigilanceQ:['Durée exacte par sous-type d\'AT à préciser selon le code (033 vs 031)'],
    procedures:[
      'Vérifier l\'éligibilité au régime AT',
      'Déposer la DUM AT (code approprié selon le type de matériel)',
      'Constituer et déposer la caution si requise',
      'Obtenir la mainlevée du matériel',
      'Demander une prorogation si nécessaire avant expiration',
      'Réexporter le matériel en l\'état avant expiration du délai',
      'Apurement de l\'engagement de réexportation',
    ],
    normes:[
      'CDII — Articles 186 à 195 (admission temporaire)',
      'Convention d\'Istanbul sur l\'admission temporaire (si applicable)',
    ],
    documents:[
      'DUM AT (code approprié)',
      'Facture ou liste descriptive du matériel',
      'Titre de transport',
      'Engagement de réexportation',
      'Caution bancaire si requise',
      'Carnet ATA (si convention internationale applicable)',
    ],
    checklist:[
      'Type d\'AT identifié et code régime correct',
      'DUM AT déposée et mainlevée obtenue',
      'Caution constituée si requise',
      'Dates de validité suivies',
      'Prorogation demandée si nécessaire',
      'Réexportation effectuée avant expiration',
      'Apurement confirmé',
    ],
    conseilIA:'Pour les matériels récurrents (équipements de forage, matériel de BTP), envisagez un carnet ATA ou un régime d\'AT global, qui simplifie les formalités pour des entrées/sorties multiples.',
    questionsOuvertes:['Durée exacte par sous-type d\'AT','Nombre maximum de prorogations possibles'],
  },
  {
    id:'import-tsd', categorie:'IMPORT',
    titre:'TSD — Transformation Sous Douane',
    codes:[
      {code:'220',label:'Transformation sous douane'},{code:'241',label:'TSD importation fractionnée'},
      {code:'242',label:'TSD papier d\'édition'},{code:'243',label:'TSD autres'},
      {code:'430',label:'MAC en suite de TSD'},{code:'700',label:'Export en suite de TSD'},
    ],
    description:'Transformation de marchandises importées sous contrôle douanier permanent. Les droits sont calculés sur les PRODUITS FINIS et non sur les matières premières — avantageux si le DI des finis est inférieur à celui des matières.',
    vigilance:[
      'Contrôle ADII continu et in situ — inspecteurs présents lors des opérations',
      'Droits calculés sur les produits FINIS (pas sur les matières premières)',
      'Taux de rendement et pertes de fabrication validés par l\'ADII',
      'Les produits ne peuvent pas quitter les locaux agréés sans autorisation',
      'Toute modification du process nécessite un avenant à l\'agrément',
    ],
    vigilanceQ:['Conditions spécifiques TSD papier d\'édition (code 242) à détailler'],
    procedures:[
      'Obtenir l\'agrément TSD auprès de la Direction Régionale des Douanes',
      'Faire valider le process de transformation et le taux de rendement',
      'Déposer la DUM TSD (code 220 ou variante) pour chaque importation',
      'Réaliser la transformation sous surveillance douanière',
      'Tenir le registre de fabrication (entrées matières, sorties produits, déchets)',
      'Déposer la DUM de sortie : MAC (430) ou export (700)',
      'Apurer le compte de transformation',
    ],
    normes:[
      'CDII — Articles régimes économiques et TSD',
      'Circulaires ADII spécifiques à la TSD',
      'Cahier des charges de l\'agrément TSD',
    ],
    documents:[
      'Décision d\'agrément TSD',
      'DUM TSD (code approprié)',
      'Factures des matières premières importées',
      'Registre de fabrication (modèle ADII)',
      'DUM de sortie (MAC ou export)',
      'Rapport de transformation signé',
    ],
    checklist:[
      'Agrément TSD valide',
      'Process et taux de rendement validés',
      'DUM TSD déposée à chaque importation',
      'Registre de fabrication tenu à jour',
      'Supervision ADII assurée',
      'Destination des produits déclarée',
      'Compte de transformation apuré',
    ],
    conseilIA:'La TSD est avantageuse quand le DI des produits finis est inférieur à celui des matières premières. Faites une simulation comparative entre ATPA et TSD avant de choisir votre régime.',
    questionsOuvertes:['Durée maximale de transformation sous TSD'],
  },
  {
    id:'import-et', categorie:'IMPORT',
    titre:'ET — Exportation Temporaire (réimportation)',
    codes:[
      {code:'251',label:'E. Temporaire (entrée initiale)'},{code:'078',label:'Exportation temporaire'},
      {code:'052',label:'Réimportation en suite d\'ET'},
    ],
    description:'Exportation temporaire de marchandises marocaines pour usage à l\'étranger (expositions, chantiers, maintenance), avec réimportation en l\'état dans le délai imparti, sans paiement de droits au retour.',
    vigilance:[
      'Marchandise doit revenir en l\'état — toute transformation → régime ETPP',
      'En cas de vente à l\'étranger : régularisation obligatoire (annule le régime ET)',
      'Marchandises doivent rester identifiables (numéros de série, marquage)',
      'Délai de réimportation à respecter — prorogation possible sur demande',
    ],
    vigilanceQ:['Délai standard ET au Maroc à confirmer'],
    procedures:[
      'Déposer la DUM d\'exportation temporaire (code 078) avant départ',
      'Identifier la marchandise (numéros de série, photos)',
      'Utiliser la marchandise à l\'étranger',
      'Réimporter avant expiration du délai',
      'Déposer la DUM de réimportation (code 052)',
    ],
    normes:['CDII — Articles exportation temporaire','Circulaires ADII applicables'],
    documents:[
      'DUM exportation temporaire (code 078)',
      'Description détaillée de la marchandise',
      'Justificatif de l\'usage à l\'étranger',
      'DUM de réimportation (code 052)',
    ],
    checklist:[
      'DUM ET déposée avant départ',
      'Marchandise identifiée précisément',
      'Délai de retour noté',
      'Prorogation demandée si nécessaire',
      'DUM de réimportation (052) déposée',
    ],
    conseilIA:'Pour les matériels exportés temporairement vers plusieurs pays successivement, vérifiez si le carnet ATA est applicable — il simplifie les formalités dans les pays signataires de la Convention d\'Istanbul.',
    questionsOuvertes:['Délai standard ET et nombre de prorogations possibles'],
  },
  {
    id:'import-etpp', categorie:'IMPORT',
    titre:'ETPP — Exportation Temporaire Pour Perfectionnement Passif',
    codes:[
      {code:'077',label:'ETPP de marchandises marocaines ou nationalisées'},
      {code:'051',label:'Réimportation en suite d\'ETPP'},
      {code:'510',label:'Réimportation ETPP avec échange standard'},
      {code:'511',label:'Réimportation ETPP en suite d\'ATPA'},
      {code:'770',label:'ETPP avec échange standard'},
      {code:'771',label:'ETPP en suite d\'ATPA'},
    ],
    description:'Exportation temporaire de marchandises vers l\'étranger pour transformation/perfectionnement, puis réimportation des produits transformés. Droits calculés uniquement sur la valeur ajoutée à l\'étranger.',
    vigilance:[
      'Seule la valeur ajoutée à l\'étranger est soumise aux droits à la réimportation',
      'Contrat de sous-traitance avec le partenaire étranger obligatoire',
      'Délai de réimportation fixé dans la DUM initiale — respecter scrupuleusement',
      'ETPP échange standard (770) : remplacement d\'un produit défectueux par équivalent neuf',
      'ETPP en suite d\'ATPA (771) : matières ATPA transformées au Maroc puis renvoyées à l\'étranger',
      'Conserver tous les justificatifs (factures sous-traitant, attestations de travaux)',
    ],
    vigilanceQ:['Modalités spécifiques ETPP échange standard (code 770) à détailler'],
    procedures:[
      'Déposer la DUM ETPP (code 077) avant exportation',
      'Exporter les marchandises chez le sous-traitant étranger',
      'Faire réaliser le perfectionnement',
      'Obtenir la facture de sous-traitance détaillant la valeur ajoutée',
      'Réimporter avant expiration du délai',
      'Déposer la DUM de réimportation (code 051) avec déclaration de la valeur ajoutée',
      'Payer les droits sur la valeur ajoutée étrangère uniquement',
    ],
    normes:['CDII — Articles ETPP','ALE applicable si perfectionnement dans pays partenaire'],
    documents:[
      'DUM ETPP initiale (code 077)',
      'Contrat de sous-traitance avec le partenaire étranger',
      'Facture de sous-traitance (valeur des travaux)',
      'DUM de réimportation (code 051)',
    ],
    checklist:[
      'DUM ETPP déposée avant exportation',
      'Contrat de sous-traitance établi',
      'Exportation effectuée',
      'Facture sous-traitant reçue avec détail des travaux',
      'Réimportation dans les délais',
      'DUM réimportation (051) déposée',
      'Droits payés sur valeur ajoutée uniquement',
    ],
    conseilIA:'Si le perfectionnement est réalisé dans un pays lié au Maroc par un ALE, les droits sur la valeur ajoutée étrangère peuvent bénéficier d\'un taux préférentiel. Vérifiez les règles d\'origine applicables au produit fini.',
    questionsOuvertes:['Délai standard ETPP à confirmer'],
  },
  {
    id:'export-et', categorie:'EXPORT',
    titre:'ET — Exportation Temporaire',
    codes:[
      {code:'078',label:'Exportation temporaire'},{code:'765',label:'ET vers les zones franches'},
      {code:'052',label:'Réimportation en suite d\'ET'},
      {code:'800',label:'Export. temporaire de conteneurs (D21)'},
      {code:'900',label:'Export. temporaire de véhicules commerciaux (D20)'},
    ],
    description:'Exportation temporaire de marchandises marocaines pour usage à l\'étranger (chantiers, expositions, maintenance), avec engagement de réimportation en l\'état.',
    vigilance:[
      'Obligation de réimportation dans le délai — tout dépassement = infraction',
      'Marchandise doit rester identifiable à son retour',
      'Conteneurs (800) et véhicules commerciaux (900) : formulaires spécifiques D21/D20',
      'En cas de vente à l\'étranger : régularisation obligatoire (exportation définitive)',
    ],
    vigilanceQ:[],
    procedures:[
      'Déposer la DUM ET (code 078) avant départ',
      'Identifier précisément la marchandise',
      'Utiliser à l\'étranger dans le cadre prévu',
      'Réimporter avant expiration et déposer DUM code 052',
    ],
    normes:['CDII — Articles exportation temporaire'],
    documents:[
      'DUM ET (code 078)',
      'Description détaillée — photos, numéros de série',
      'Justificatif de l\'usage à l\'étranger',
      'Formulaire D20 ou D21 selon le cas',
      'DUM de réimportation (code 052)',
    ],
    checklist:[
      'DUM ET déposée avant départ',
      'Marchandise identifiée précisément',
      'Délai de retour noté',
      'Réimportation dans le délai',
      'DUM 052 déposée au retour',
    ],
    conseilIA:'Pour les véhicules à usage commercial exportés temporairement, le formulaire D20 doit être établi AVANT le passage en frontière. Son absence expose à une infraction douanière.',
    questionsOuvertes:[],
  },
  {
    id:'export-etpp', categorie:'EXPORT',
    titre:'ETPP — Exportation Temporaire Pour Perfectionnement Passif',
    codes:[
      {code:'077',label:'ETPP de marchandises marocaines ou nationalisées'},
      {code:'766',label:'ETPP vers les zones franches'},
      {code:'680',label:'Export. définitive en suite d\'ETPP ou ET'},
      {code:'681',label:'Export. définitive en régularisation ETPP/ET vers ZF'},
      {code:'770',label:'ETPP avec échange standard'},
      {code:'771',label:'ETPP en suite d\'ATPA'},
    ],
    description:'Export de marchandises marocaines pour perfectionnement à l\'étranger ou en ZAI, puis réimportation ou exportation définitive. Le régime peut se terminer par une vente directe à l\'étranger (codes 680/681).',
    vigilance:[
      'Si le produit ne revient pas au Maroc → déposer DUM 680 pour régularisation',
      'ETPP vers ZF (766) : perfectionnement en ZAI — exonération totale côté ZAI',
      'ETPP échange standard : justifier l\'équivalence entre le produit défectueux et le neuf',
      'La valeur ajoutée en ZAI n\'est pas soumise à droits si réexportation vers l\'étranger',
    ],
    vigilanceQ:[],
    procedures:[
      'DUM ETPP (077 ou 766 si vers ZAI) avant exportation',
      'Exportation vers le sous-traitant étranger ou la ZAI',
      'Perfectionnement réalisé',
      'Si retour au Maroc → DUM réimportation (051)',
      'Si vente directe à l\'étranger → DUM 680 (régularisation export définitive)',
    ],
    normes:['CDII — Articles ETPP','Réglementation ZAI (Loi 19-94, Loi 53-00)'],
    documents:[
      'DUM ETPP initiale (077 ou 766)',
      'Contrat de sous-traitance ou convention ZAI',
      'Facture de transformation',
      'DUM de régularisation (051 ou 680 selon destination finale)',
    ],
    checklist:[
      'DUM ETPP déposée avant exportation',
      'Destination du perfectionnement confirmée',
      'Délai suivi',
      'Destination finale du produit déterminée',
      'DUM de régularisation déposée',
    ],
    conseilIA:'L\'ETPP vers ZAI (766) permet de combiner la compétitivité de la ZAI avec la flexibilité de l\'ETPP. Idéal pour les industries qui sous-traitent certaines étapes de production en ZAI.',
    questionsOuvertes:[],
  },
  {
    id:'transit-zai', categorie:'TRANSIT',
    titre:'Transit vers ZAI',
    codes:[{code:'855',label:'Transit à l\'import de l\'étranger à destination des ZF'}],
    description:'Mouvement de marchandises en provenance de l\'étranger, acheminées sous douane vers une ZAI sans passer par la mise à la consommation sur le TA. Circulation sous scellement douanier jusqu\'à la ZAI de destination.',
    vigilance:[
      'Marchandises sous scellement douanier tout au long du trajet',
      'Délai de transit à respecter (fixé par la DUM)',
      'Tout déroutement ou rupture de scellement = infraction',
      'La ZAI de destination doit être agréée',
      'À l\'arrivée en ZAI, mainlevée douanière sur place',
    ],
    vigilanceQ:[],
    procedures:[
      'Dépôt DUM transit (855) au bureau douanier d\'entrée',
      'Apposition des scellements douaniers',
      'Transport sous scellement jusqu\'à la ZAI',
      'Présentation au bureau douanier de la ZAI',
      'Levée des scellements et prise en charge par la ZAI',
      'Apurement de la déclaration de transit',
    ],
    normes:['CDII — Articles transit douanier','Loi sur les ZAI (Loi 19-94 modifiée Loi 53-00)'],
    documents:['DUM transit (code 855)','Facture ou liste de colisage','Connaissement ou LTA','Autorisation d\'entrée en ZAI'],
    checklist:[
      'DUM transit (855) déposée au bureau d\'entrée',
      'Scellements apposés et intacts',
      'Itinéraire de transit respecté',
      'Arrivée à la ZAI dans le délai',
      'Scellements levés par le bureau douanier ZAI',
      'Apurement de transit confirmé',
    ],
    conseilIA:'Pour les importations régulières vers une même ZAI, envisagez un transit groupé sous engagement de la ZAI — cela réduit les formalités pour chaque envoi.',
    questionsOuvertes:['Délai standard du transit douanier marocain à confirmer'],
  },
  {
    id:'transit-bureau', categorie:'TRANSIT',
    titre:'Transit vers bureau douanier (TA)',
    codes:[
      {code:'085',label:'Transit à l\'import'},{code:'086',label:'Transit à l\'export'},
      {code:'841',label:'Transit'},{code:'842',label:'Transit en sortie d\'entrepôt'},
      {code:'844',label:'Transit imp. vers MEAD même bureau'},{code:'877',label:'Transit au sein du même bureau'},
    ],
    description:'Mouvement de marchandises sous douane entre deux bureaux douaniers sur le TA, ou entre un point d\'entrée et un bureau de dédouanement intérieur. Droits et taxes suspendus pendant le transit.',
    vigilance:[
      'Itinéraire douanier obligatoire — toute déviation doit être signalée',
      'Scellements à maintenir intacts',
      'Délai de transit : généralement 48 à 72 heures selon la distance',
      'Caution ou garantie couvrant les droits en cas de détournement',
    ],
    vigilanceQ:[],
    procedures:[
      'Dépôt DUM transit au bureau d\'entrée/départ',
      'Apposition des scellements',
      'Acheminement selon itinéraire douanier',
      'Présentation au bureau de destination dans le délai',
      'Levée des scellements et dédouanement ou placement sous nouveau régime',
      'Apurement de la déclaration de transit',
    ],
    normes:['CDII — Articles transit','Note de service ADII sur les itinéraires douaniers'],
    documents:['DUM transit (code approprié)','Lettre de voiture ou CMR','Facture et packing list','Garantie ou caution si requise'],
    checklist:[
      'DUM transit déposée et acceptée',
      'Scellements apposés',
      'Délai de transit noté',
      'Arrivée à destination dans les délais',
      'Apurement confirmé par le bureau destinataire',
    ],
    conseilIA:'Le transit vers un MEAD (code 844) est souvent utilisé pour les marchandises en attente de dédouanement. Vérifiez les tarifs de stockage et les délais maximum de séjour autorisés.',
    questionsOuvertes:[],
  },
  {
    id:'transit-inter-zai', categorie:'TRANSIT',
    titre:'Transit inter-ZAI',
    codes:[
      {code:'856',label:'Transit entre ZF autres que portuaires et aéroportuaires'},
      {code:'866',label:'Transit à l\'export vers l\'étranger depuis ZF'},
    ],
    description:'Mouvement de marchandises entre deux ZAI distinctes, ou depuis une ZAI vers l\'étranger. La marchandise reste dans la sphère des ZAI sans passer par le TA.',
    vigilance:[
      'Les deux ZAI doivent être agréées et identifiées dans la DUM',
      'Scellements douaniers obligatoires pour tout déplacement inter-ZAI',
      'La marchandise ne transite pas par le TA — reste dans la sphère des ZAI',
      'En cas de transit vers l\'étranger (866) : présentation obligatoire au bureau frontière',
    ],
    vigilanceQ:['Procédure spécifique inter-ZAI portuaires/aéroportuaires à documenter'],
    procedures:[
      'DUM de transit inter-ZAI (code 856) au bureau douanier de la ZAI source',
      'Scellement des marchandises',
      'Transport vers la ZAI destinataire',
      'Présentation à la ZAI destinataire et levée des scellements',
      'Apurement et prise en charge dans la ZAI destinataire',
    ],
    normes:['Loi sur les ZAI','CDII — Articles transit'],
    documents:['DUM transit inter-ZAI (856 ou 866)','Bon de sortie ZAI source','Bon d\'entrée ZAI destinataire','Facture ou liste de colisage'],
    checklist:[
      'DUM transit inter-ZAI déposée',
      'Autorisation des deux ZAI obtenue',
      'Scellements apposés',
      'Arrivée ZAI destinataire confirmée',
      'Apurement de la DUM de transit',
    ],
    conseilIA:'Le transit inter-ZAI est particulièrement utilisé dans les clusters industriels. La coordination logistique avec les bureaux douaniers des deux ZAI est essentielle.',
    questionsOuvertes:[],
  },
  {
    id:'stockage-eif', categorie:'STOCKAGE',
    titre:'EIF — Entrepôt Industriel Franc',
    codes:[
      {code:'385',label:'EIF importation directe de matériel'},
      {code:'386',label:'EIF en suite d\'EPP'},
      {code:'048',label:'MAC en suite d\'EIF'},
      {code:'751',label:'Exportation en suite d\'EIF'},
    ],
    description:'Régime de stockage sur le TA permettant la suspension des droits et taxes sur des marchandises importées, dans l\'attente de leur MAC. Géré au niveau des RED (Régies d\'Entrepôts Douaniers).',
    vigilance:[
      'EIF géré par les RED — vérifier l\'entrepôt agréé',
      'La MAC (048) déclenche le paiement des droits et taxes en totalité',
      'L\'exportation en suite d\'EIF (751) permet la sortie sans paiement',
      'Durée de stockage limitée — vérifier le délai maximum autorisé',
    ],
    vigilanceQ:['POINT NON RÉSOLU : Distinction entre code 038 et 385 à clarifier avec l\'ADII'],
    procedures:[
      'Identifier et choisir l\'entrepôt EIF agréé (géré par les RED)',
      'Déposer la DUM EIF (code 385)',
      'Placer les marchandises sous contrôle douanier dans l\'EIF',
      'Tenir le registre de stock EIF',
      'Décider de la destination : MAC (048) ou export (751)',
      'Déposer la DUM de sortie',
    ],
    normes:['CDII — Articles entrepôts sous douane','Réglementation des RED','Conditions d\'agrément EIF'],
    documents:['DUM EIF (code 385)','Facture et packing list','Registre de stock EIF','DUM de sortie (048 ou 751)'],
    checklist:[
      'EIF agréé sélectionné',
      'DUM EIF déposée',
      'Marchandises placées sous contrôle EIF',
      'Registre de stock tenu',
      'Destination décidée (MAC ou export)',
      'DUM de sortie déposée',
    ],
    conseilIA:'L\'EIF est stratégique pour les importateurs qui constituent des stocks tampons sans immobiliser de trésorerie en droits de douane. Idéal pour les achats en gros volumes avec livraisons échelonnées.',
    questionsOuvertes:['POINT NON RÉSOLU : Clarifier codes 038 vs 385 avec l\'ADII','Durée maximale de stockage en EIF'],
  },
  {
    id:'stockage-epp', categorie:'STOCKAGE',
    titre:'EPP — Entrepôt Privé Particulier',
    codes:[
      {code:'037',label:'Entrepôt Privé Particulier (EPP)'},
      {code:'047',label:'MAC en suite d\'EPP'},
      {code:'075',label:'Export en suite d\'EPP'},
      {code:'721',label:'Entrepôt Privé Particulier (code alternatif)'},
      {code:'822',label:'TSD en suite d\'EPP'},
      {code:'386',label:'EIF en suite d\'EPP'},
    ],
    description:'Entrepôt sous douane créé et géré exclusivement par une société pour ses propres besoins. Même principe que l\'EIF mais sur initiative et gestion privée. Usage exclusif du titulaire.',
    vigilance:[
      'L\'EPP est à usage exclusif — aucune marchandise de tiers ne peut y être stockée',
      'Agrément personnel et non cessible',
      'Inventaire contradictoire ADII obligatoire à intervalles réguliers',
      'La MAC déclenche le paiement intégral des droits et taxes différés',
    ],
    vigilanceQ:['Fréquence des inventaires contradictoires ADII à préciser'],
    procedures:[
      'Déposer la demande d\'agrément EPP (locaux, sécurité, garanties financières)',
      'Obtenir l\'agrément de la Direction Régionale des Douanes',
      'Déposer la DUM EPP (code 037) pour chaque lot importé',
      'Stocker sous contrôle douanier',
      'Tenir le registre de stock selon modèle ADII',
      'Choisir la sortie : MAC (047), Export (075), TSD (822) ou EIF (386)',
    ],
    normes:['CDII — Articles entrepôts privés','Conditions techniques d\'agrément','Circulaires ADII sur les EPP'],
    documents:['Décision d\'agrément EPP','DUM EPP (code 037)','Registre de stock (modèle ADII)','Procès-verbaux d\'inventaire contradictoire','DUM de sortie'],
    checklist:[
      'Agrément EPP valide',
      'DUM EPP déposée pour chaque entrée',
      'Registre de stock tenu à jour quotidiennement',
      'Inventaires contradictoires réalisés aux dates prévues',
      'DUM de sortie déposée dans les délais',
    ],
    conseilIA:'Un EPP est rentable à partir d\'un volume annuel d\'importations supérieur à 5 millions DH. En dessous, l\'entrepôt public ou le MEAD offrent plus de flexibilité sans engagement de locaux propres.',
    questionsOuvertes:['Superficie minimale requise pour agrément EPP'],
  },
  {
    id:'stockage-mead', categorie:'STOCKAGE',
    titre:'MEAD — Magasins et Aires de Dédouanement',
    codes:[
      {code:'844',label:'Transit import vers MEAD même bureau'},
      {code:'006',label:'Déclaration provisoire import simple'},
      {code:'007',label:'Déclaration provisoire import sous régimes économiques'},
    ],
    description:'Espaces de stockage temporaire sous contrôle douanier, situés dans ou à proximité des ports, aéroports ou postes frontières. Marchandises en attente de dédouanement sans paiement de droits. Délai de séjour limité.',
    vigilance:[
      'Délai de séjour strict : généralement 30 à 90 jours selon le type de MEAD',
      'Frais de magasinage s\'accumulent dès l\'entrée',
      'En cas de dépassement du délai : l\'ADII peut procéder à la vente aux enchères',
      'Les MEAD portuaires sont soumis à la réglementation ANP',
    ],
    vigilanceQ:['Durée exacte de séjour selon type de MEAD (portuaire vs intérieur) à préciser'],
    procedures:[
      'Arrivée de la marchandise et placement en MEAD par le gestionnaire',
      'Dépôt de la déclaration provisoire (code 006 ou 007)',
      'Préparer le dossier de dédouanement',
      'Déposer la DUM définitive dans le délai de séjour',
      'Payer les droits et obtenir le BAE',
      'Enlever la marchandise du MEAD',
    ],
    normes:['CDII — Articles MEAD','Réglementation ANP pour MEAD portuaires'],
    documents:['Avis d\'arrivée / manifeste','Déclaration provisoire (006/007)','DUM définitive','BAE (Bon à Enlever)'],
    checklist:[
      'Arrivée marchandise confirmée et avis reçu',
      'Déclaration provisoire déposée',
      'DUM définitive préparée et déposée dans les délais',
      'Droits payés',
      'BAE obtenu',
      'Marchandise enlevée du MEAD',
    ],
    conseilIA:'Le dédouanement par anticipation (avant arrivée du navire) permet d\'éviter les frais de magasinage MEAD. Activez-le via PortNet 72h avant l\'ETA du navire.',
    questionsOuvertes:[],
  },
  {
    id:'stockage-zonelogistique', categorie:'STOCKAGE',
    titre:'Zone Logistique (TA)',
    codes:[{code:'844',label:'Transit vers MEAD / zone même bureau (à confirmer)'}],
    description:'Zone de stockage logistique sur le territoire assujetti (TA), différente de la ZAI. Pas d\'exonération totale — les droits restent dus à la mise à la consommation. Avantage : infrastructures logistiques optimisées (multimodalité, accès routier/ferroviaire).',
    vigilance:[
      'La zone logistique TA n\'offre PAS d\'exonération totale — contrairement à la ZAI',
      'Droits et taxes dus à la mise à la consommation',
      'Suspension possible uniquement sous régime économique (AT, entrepôt…)',
      'Frais de logistique et manutention propres à chaque opérateur',
    ],
    vigilanceQ:['Codes DUM spécifiques à ces zones à confirmer avec l\'ADII'],
    procedures:[
      'Sélectionner la zone logistique TA adaptée',
      'Convenir des conditions de stockage',
      'Placer les marchandises sous régime douanier approprié (AT, entrepôt…)',
      'Gérer les flux de sortie selon la destination',
    ],
    normes:['CDII selon régime économique choisi','Loi 80-14 relative aux ports si zone portuaire'],
    documents:['Contrat de stockage avec l\'opérateur logistique','DUM selon régime économique choisi','Bons d\'entrée et de sortie'],
    checklist:[
      'Zone logistique identifiée et contrat signé',
      'Régime douanier approprié sélectionné',
      'DUM déposée selon le régime',
      'Suivi des marchandises en zone',
      'DUM de sortie déposée',
    ],
    conseilIA:'Combinez le stockage en zone logistique avec un régime d\'entrepôt sous douane (AT ou EPP) pour bénéficier à la fois des infrastructures logistiques et de la suspension des droits.',
    questionsOuvertes:['Liste des principales zones logistiques TA au Maroc à compléter','Codes DUM spécifiques à confirmer'],
  },
  {
    id:'zai-et', categorie:'ZAI',
    titre:'ZAI → ET (Exportation Temporaire)',
    codes:[{code:'765',label:'ET vers les zones franches'},{code:'052',label:'Réimportation en suite d\'ET'}],
    description:'Exportation temporaire depuis le TA vers une ZAI de marchandises marocaines ou nationalisées, avec engagement de retour sur le TA. La ZAI est traitée comme territoire étranger sur le plan douanier.',
    vigilance:[
      'La ZAI est considérée comme territoire étranger sur le plan douanier',
      'L\'ET vers ZAI suspend les droits jusqu\'au retour sur le TA',
      'Si la marchandise est transformée en ZAI et ne revient pas → ETPP, pas ET',
      'En cas de vente en ZAI ou export depuis ZAI → régularisation obligatoire',
    ],
    vigilanceQ:[],
    procedures:[
      'DUM ET vers ZAI (code 765) au bureau douanier TA',
      'Entrée en ZAI avec scellements si requis',
      'Utilisation en ZAI',
      'Retour sur TA → DUM réimportation (052)',
      'Vente en ZAI ou export → régularisation (DUM appropriée)',
    ],
    normes:['Loi ZAI','CDII — Articles ET'],
    documents:['DUM ET vers ZAI (765)','Autorisation d\'entrée en ZAI','DUM de retour (052 si retour TA)'],
    checklist:[
      'DUM 765 déposée avant sortie du TA',
      'Autorisation ZAI obtenue',
      'Délai de retour noté',
      'DUM de régularisation déposée à la sortie de la ZAI',
    ],
    conseilIA:'L\'ET vers ZAI est utilisé pour les matériels de production qui travaillent alternativement sur le TA et en ZAI. Un suivi précis des délais est indispensable.',
    questionsOuvertes:['Délai standard ET vers ZAI à confirmer'],
  },
  {
    id:'zai-etpp', categorie:'ZAI',
    titre:'ZAI → ETPP (Exportation Temporaire Pour Perfectionnement Passif)',
    codes:[{code:'766',label:'ETPP vers les zones franches'},{code:'680',label:'Export définitive en suite d\'ETPP ou ET'}],
    description:'Exportation temporaire de marchandises du TA vers une ZAI pour perfectionnement, puis retour sur le TA ou exportation définitive vers l\'étranger. La ZAI agit comme sous-traitant exempté.',
    vigilance:[
      'Si retour sur TA : droits calculés sur la valeur ajoutée en ZAI uniquement',
      'Si export définitive depuis ZAI → DUM 680 (pas de retour sur TA)',
      'Contrat de sous-traitance avec l\'entreprise ZAI requis',
      'Justifier précisément les opérations réalisées en ZAI',
    ],
    vigilanceQ:[],
    procedures:[
      'DUM ETPP vers ZAI (code 766)',
      'Exportation vers la ZAI',
      'Perfectionnement en ZAI',
      'Retour sur TA → DUM 051 + droits sur VA',
      'Export étranger → DUM 680',
    ],
    normes:['Loi ZAI','CDII — Articles ETPP'],
    documents:['DUM ETPP (code 766)','Contrat de sous-traitance ZAI','Facture de transformation ZAI','DUM de sortie (051 ou 680)'],
    checklist:['DUM 766 déposée','Contrat ZAI établi','Destination finale déterminée','DUM de régularisation déposée'],
    conseilIA:'L\'ETPP vers ZAI permet de combiner l\'exonération totale de la ZAI avec la souplesse du régime ETPP. Outil puissant pour les industries qui externalisent certaines étapes de production en ZAI.',
    questionsOuvertes:[],
  },
  {
    id:'zai-transit', categorie:'ZAI',
    titre:'ZAI → Transit',
    codes:[
      {code:'855',label:'Transit import étranger → ZF'},
      {code:'856',label:'Transit entre ZF (hors port/aéro)'},
      {code:'866',label:'Transit export ZF → étranger'},
    ],
    description:'Mouvements de marchandises en transit à destination, en provenance ou entre ZAI. Circulation sans paiement de droits sous scellement douanier.',
    vigilance:[
      'Scellements douaniers obligatoires',
      'Bureau douanier de la ZAI à informer à l\'avance',
      'Transit depuis ZAI vers étranger (866) : formalités d\'export à respecter',
    ],
    vigilanceQ:[],
    procedures:[
      'DUM de transit (855, 856 ou 866 selon sens)',
      'Scellement et transport',
      'Levée des scellements à destination',
      'Apurement',
    ],
    normes:['CDII — Transit','Loi ZAI'],
    documents:['DUM transit','Bons de sortie/entrée ZAI','Facture ou liste de colisage'],
    checklist:['DUM de transit appropriée déposée','Scellements apposés','Destination confirmée','Apurement réalisé'],
    conseilIA:'Pour les ZAI portuaires, les procédures de transit sont souvent intégrées dans PortNet ou TMSA. Vérifiez les interfaces disponibles pour fluidifier les opérations.',
    questionsOuvertes:[],
  },
  {
    id:'zai-atpp', categorie:'ZAI',
    titre:'ZAI → ATPP (Admission Temporaire Pour Perfectionnement Passif)',
    codes:[{code:'—',label:'Code s\'adapte comme export vers étranger (à confirmer ADII)'}],
    description:'Régime spécifique : des produits ou matières issus du TA entrent en ZAI pour un complément d\'ouvraison ou d\'usinage, puis retournent sur le TA. Le régime s\'adapte comme un export vers l\'étranger.',
    vigilance:[
      'Code DUM dédié non identifié — le régime s\'adapte aux codes ET/ETPP selon le flux',
      'La ZAI est considérée comme territoire étranger : flux TA→ZAI→TA = comme ETPP',
      'Le complément d\'ouvraison doit être documenté (contrat, facture de prestation)',
      'À la réimportation sur le TA : droits calculés sur la valeur ajoutée en ZAI uniquement',
    ],
    vigilanceQ:['CODE NON CONFIRMÉ : Valider le code DUM exact pour flux TA→ZAI→TA avec l\'ADII'],
    procedures:[
      'Identifier le code régime adapté (flux comme export vers étranger)',
      'DUM de sortie TA → ZAI',
      'Ouvraison/usinage en ZAI',
      'Retour sur TA avec DUM d\'importation',
      'Paiement droits sur valeur ajoutée ZAI uniquement',
    ],
    normes:['CDII','Loi ZAI','Conventions de sous-traitance ZAI'],
    documents:['DUM de sortie TA (code à confirmer)','Contrat d\'ouvraison avec l\'entreprise ZAI','Facture de prestation ZAI','DUM de réimportation sur TA'],
    checklist:[
      'Code régime validé avec l\'ADII',
      'DUM de sortie déposée',
      'Contrat d\'ouvraison établi',
      'Ouvraison réalisée en ZAI',
      'DUM de réimportation déposée',
      'Droits calculés sur VA uniquement',
    ],
    conseilIA:'L\'ATPP ZAI est un régime hybride peu formalisé. Avant de l\'utiliser, consultez le bureau douanier de la ZAI concernée pour valider la procédure et les codes DUM applicables.',
    questionsOuvertes:['CODE À CONFIRMER : Quel code DUM exact pour flux TA→ZAI pour ouvraison→TA ?'],
  },
  {
    id:'zai-at', categorie:'ZAI',
    titre:'ZAI → AT (Admission Temporaire)',
    codes:[{code:'763',label:'Export suite AT vers les zones franches'},{code:'501',label:'Admission temporaire'}],
    description:'Introduction temporaire en ZAI de matériels ou équipements en provenance du TA, sans transformation, pour un usage temporaire (chantier, maintenance, tests). Retour sur le TA en l\'état.',
    vigilance:[
      'Marchandise doit revenir sur le TA en l\'état — aucune transformation autorisée',
      'Délai de séjour en ZAI à respecter',
      'Toute cession en ZAI nécessite une régularisation',
    ],
    vigilanceQ:[],
    procedures:[
      'DUM AT vers ZAI (code 763)',
      'Entrée en ZAI avec scellement si requis',
      'Usage temporaire en ZAI',
      'Retour sur TA — DUM de réimportation',
    ],
    normes:['CDII — AT','Loi ZAI'],
    documents:['DUM AT (code 763)','Autorisation ZAI','DUM de retour sur TA'],
    checklist:['DUM 763 déposée','Usage en ZAI conforme à l\'AT','Délai respecté','Retour sur TA documenté'],
    conseilIA:'L\'AT vers ZAI est utilisé pour les équipements de maintenance que les techniciens du TA apportent temporairement en ZAI. Standardisez le bon de sortie entre le bureau TA et la ZAI.',
    questionsOuvertes:[],
  },
  {
    id:'zai-mac', categorie:'ZAI',
    titre:'ZAI → MAC (Mise À la Consommation)',
    codes:[{code:'050',label:'MAC de marchandises en provenance des ZF'},{code:'491',label:'MAC suite provisions ZF Tanger'}],
    description:'Mise à la consommation sur le TA de marchandises initialement placées en ZAI. Les droits et taxes deviennent exigibles sur la valeur totale. Sortie définitive de la sphère ZAI vers le marché marocain.',
    vigilance:[
      'Droits et taxes dus sur la VALEUR TOTALE des marchandises',
      'Toutes les conditions d\'importation du TA s\'appliquent (licences, certificats, normes…)',
      'La MAC depuis ZAI est un point de contrôle ADII renforcé',
      'Vérifier si des accords préférentiels s\'appliquent selon l\'origine',
    ],
    vigilanceQ:['Délai maximum de stockage en ZAI avant obligation de MAC ou réexport'],
    procedures:[
      'Décision de mise à la consommation',
      'Calculer les droits et taxes (valeur totale)',
      'Obtenir les autorisations préalables (licences import si nécessaires)',
      'Déposer la DUM MAC (code 050)',
      'Payer les droits et taxes',
      'Obtenir la mainlevée et enlever depuis la ZAI',
    ],
    normes:['CDII — Articles MAC','Loi ZAI','Tarif Douanier Marocain'],
    documents:['DUM MAC (code 050)','Facture ou document de valeur','Certificat d\'origine','Licences et autorisations import si requises'],
    checklist:[
      'Droits calculés sur valeur totale',
      'Autorisations préalables obtenues',
      'DUM MAC (050) déposée',
      'Droits payés',
      'Mainlevée obtenue',
      'Marchandise enlevée de la ZAI',
    ],
    conseilIA:'La MAC depuis ZAI est souvent moins rentable que l\'exportation directe à l\'étranger. Comparez le coût des droits avec les conditions de revente sur le marché marocain vs l\'export avant de décider.',
    questionsOuvertes:[],
  },
]

const CAT_COLORS: Record<Cat, string> = {
  IMPORT: '#1A5276', EXPORT: '#0F6E56',
  TRANSIT: '#854F0B', STOCKAGE: '#534AB7', ZAI: '#993C1D',
}
const CAT_BG: Record<Cat, string> = {
  IMPORT: '#D6EAF8', EXPORT: '#D5F5E3',
  TRANSIT: '#FDEBD0', STOCKAGE: '#EEEDFE', ZAI: '#FAECE7',
}
const TABS: { id: Tab; label: string; color: string }[] = [
  { id:'vigilance',  label:'⚠ Vigilance',  color:'#C0392B' },
  { id:'procedures', label:'▶ Procédures', color:'#1A5276' },
  { id:'normes',     label:'§ Normes',     color:'#935116' },
  { id:'documents',  label:'📄 Documents', color:'#1E8449' },
]

export default function ProceduresProcessPage() {
  const [selectedCat, setSelectedCat] = useState<Cat|'ALL'>('ALL')
  const [selectedId,  setSelectedId]  = useState<string>(PROCEDURES[0].id)
  const [activeTab,   setActiveTab]   = useState<Tab>('vigilance')
  const [checks,      setChecks]      = useState<Record<string,boolean>>({})
  const [search,      setSearch]      = useState('')

  const cats: Cat[] = ['IMPORT','EXPORT','TRANSIT','STOCKAGE','ZAI']

  const filtered = useMemo(() => PROCEDURES.filter(p => {
    const matchCat = selectedCat === 'ALL' || p.categorie === selectedCat
    const matchQ   = !search || p.titre.toLowerCase().includes(search.toLowerCase()) || p.codes.some(c => c.code.includes(search))
    return matchCat && matchQ
  }), [selectedCat, search])

  const proc = PROCEDURES.find(p => p.id === selectedId) || PROCEDURES[0]
  const checkKey = (i: number) => `${proc.id}_${i}`
  const checkedCount = proc.checklist.filter((_, i) => checks[checkKey(i)]).length
  const progress = Math.round((checkedCount / proc.checklist.length) * 100)
  const toggleCheck = (i: number) => setChecks(prev => ({ ...prev, [checkKey(i)]: !prev[checkKey(i)] }))

  const tabContent: Record<Tab, string[]> = {
    vigilance:  [...proc.vigilance, ...proc.vigilanceQ],
    procedures: proc.procedures,
    normes:     proc.normes,
    documents:  proc.documents,
  }
  const tabIsQuestion = (tab: Tab, i: number) => tab === 'vigilance' && i >= proc.vigilance.length

  return (
    <ModuleLayout kicker="PROCÉDURES DOUANIÈRES" title="Régimes & Procédures" sub="22 procédures · 5 catégories · Codes régimes DUM · Version draft">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pr-search-wrap">
        <input className="pr-search" placeholder="Rechercher (titre ou code DUM)…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="pr-cats">
        <button className={`pr-cat${selectedCat==='ALL'?' on':''}`} onClick={() => setSelectedCat('ALL')} style={selectedCat==='ALL'?{background:'#0A0A0A',color:'#E8C97A',borderColor:'#0A0A0A'}:{}}>Tout ({PROCEDURES.length})</button>
        {cats.map(c => (
          <button key={c} className={`pr-cat${selectedCat===c?' on':''}`} onClick={() => setSelectedCat(c)} style={selectedCat===c?{background:CAT_COLORS[c],color:'#fff',borderColor:CAT_COLORS[c]}:{}}>
            {c} ({PROCEDURES.filter(p=>p.categorie===c).length})
          </button>
        ))}
      </div>
      <div className="pr-layout">
        <div className="pr-sidebar">
          {filtered.map(p => (
            <button key={p.id} className={`pr-item${p.id===selectedId?' on':''}`} onClick={() => { setSelectedId(p.id); setActiveTab('vigilance') }} style={p.id===selectedId?{borderLeftColor:CAT_COLORS[p.categorie]}:{}}>
              <span className="pr-item-cat" style={{background:CAT_BG[p.categorie],color:CAT_COLORS[p.categorie]}}>{p.categorie}</span>
              <span className="pr-item-label">{p.titre}</span>
            </button>
          ))}
          {filtered.length===0 && <div className="pr-empty">Aucune procédure trouvée</div>}
        </div>
        <div className="pr-content">
          <div className="pr-codes">{proc.codes.map(c => (<span key={c.code} className="pr-code"><span className="pr-code-num">{c.code}</span><span className="pr-code-lbl">{c.label}</span></span>))}</div>
          <div className="pr-proc-title" style={{color:CAT_COLORS[proc.categorie]}}>{proc.titre}</div>
          <div className="pr-desc">{proc.description}</div>
          <div className="pr-tab-row">
            {TABS.map(t => (<button key={t.id} className={`pr-tab${activeTab===t.id?' on':''}`} onClick={() => setActiveTab(t.id)} style={activeTab===t.id?{color:t.color,borderBottomColor:t.color}:{}}>{t.label}</button>))}
          </div>
          <div className="pr-tab-body">
            {tabContent[activeTab].map((item, i) => {
              const isQ = tabIsQuestion(activeTab, i)
              return (
                <div key={i} className={`pr-line${isQ?' pr-line-q':''}`}>
                  <span className="pr-line-bullet" style={{color:isQ?'#BA7517':TABS.find(t=>t.id===activeTab)?.color}}>{isQ?'❓':'→'}</span>
                  <span className="pr-line-text" style={{color:isQ?'#BA7517':undefined}}>{item}</span>
                </div>
              )
            })}
          </div>
          <div className="pr-check-section">
            <div className="pr-check-header"><span className="pr-check-title">Checklist opérationnelle</span><span className="pr-check-count">{checkedCount}/{proc.checklist.length}</span></div>
            <div className="pr-progress-bar"><div className="pr-progress-fill" style={{width:`${progress}%`,background:progress===100?'#4CAF7C':CAT_COLORS[proc.categorie]}} /></div>
            <div className="pr-checks">
              {proc.checklist.map((item, i) => {
                const checked = !!checks[checkKey(i)]
                return (
                  <div key={i} className={`pr-check-item${checked?' checked':''}`} onClick={() => toggleCheck(i)}>
                    <div className="pr-checkbox" style={checked?{background:'#4CAF7C',borderColor:'#4CAF7C'}:{}}>{checked&&<svg viewBox="0 0 10 10" fill="none" style={{width:10,height:10}}><path d="M1.5 5l2.5 2.5L8.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}</div>
                    <span className="pr-check-text" style={checked?{textDecoration:'line-through',color:'#8A8078'}:{}}>{item}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="pr-conseil"><div className="pr-conseil-label">CONSEIL Transit-IA</div><div className="pr-conseil-text">{proc.conseilIA}</div></div>
          {proc.questionsOuvertes.length>0&&(<div className="pr-qo"><div className="pr-qo-label">POINTS À COMPLÉTER / QUESTIONS NON RÉSOLUES</div>{proc.questionsOuvertes.map((q,i)=>(<div key={i} className="pr-qo-item">❓ {q}</div>))}</div>)}
        </div>
      </div>
    </ModuleLayout>
  )
}

const CSS = `
.pr-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1.25rem;flex-wrap:wrap;gap:.75rem}
.pr-kicker{font-size:9px;letter-spacing:.2em;color:var(--gold,#C9A84C);margin-bottom:.2rem}
.pr-title{font-family:'Cormorant Garamond',serif;font-size:clamp(22px,3vw,30px);font-weight:400;color:var(--ink,#0A0A0A);line-height:1.1}
.pr-sub{font-size:12px;color:var(--inkm,#8A8078);margin-top:.2rem}
.pr-search{padding:7px 14px;font-size:12px;border:1px solid var(--border,#E8DFC8);background:var(--white,#FDFCF8);color:var(--ink,#0A0A0A);width:260px;outline:none;font-family:'DM Sans',sans-serif}
.pr-search:focus{border-color:var(--gold,#C9A84C)}
.pr-cats{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:1.25rem}
.pr-cat{padding:5px 14px;font-size:11px;letter-spacing:.05em;border:1px solid var(--border2,#D4C8A8);background:transparent;color:var(--inkm,#8A8078);cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s}
.pr-cat:hover:not(.on){background:var(--gold4,#FBF5E6)}
.pr-layout{display:grid;grid-template-columns:260px 1fr;gap:1rem;min-height:600px}
@media(max-width:720px){.pr-layout{grid-template-columns:1fr}}
.pr-sidebar{display:flex;flex-direction:column;gap:3px;border:1px solid var(--border,#E8DFC8);padding:.5rem;background:var(--white,#FDFCF8);max-height:78vh;overflow-y:auto}
.pr-item{display:flex;flex-direction:column;align-items:flex-start;gap:3px;padding:.5rem .625rem;cursor:pointer;border:none;background:transparent;text-align:left;border-left:3px solid transparent;transition:all .15s;font-family:'DM Sans',sans-serif}
.pr-item:hover{background:var(--gold4,#FBF5E6)}
.pr-item.on{background:var(--gold4,#FBF5E6)}
.pr-item-cat{font-size:9px;letter-spacing:.1em;padding:1px 6px;font-weight:500}
.pr-item-label{font-size:11px;color:var(--ink,#0A0A0A);line-height:1.35}
.pr-empty{font-size:12px;color:var(--inkm,#8A8078);padding:1rem;text-align:center}
.pr-content{border:1px solid var(--border,#E8DFC8);background:var(--white,#FDFCF8);padding:1.25rem;overflow-y:auto;max-height:78vh}
.pr-codes{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:.75rem}
.pr-code{display:flex;align-items:center;gap:5px;background:var(--gold4,#FBF5E6);border:1px solid var(--gold3,#F5E4B0);padding:3px 8px}
.pr-code-num{font-family:'DM Mono',monospace;font-size:12px;font-weight:600;color:var(--ink,#0A0A0A)}
.pr-code-lbl{font-size:10px;color:var(--inkm,#8A8078)}
.pr-proc-title{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;margin-bottom:.4rem;line-height:1.2}
.pr-desc{font-size:12px;color:var(--ink2,#3A3530);line-height:1.65;margin-bottom:1rem;padding-bottom:.875rem;border-bottom:1px solid var(--border,#E8DFC8)}
.pr-tab-row{display:flex;border-bottom:1px solid var(--border,#E8DFC8);margin-bottom:.875rem;overflow-x:auto}
.pr-tab{padding:6px 16px;font-size:11px;letter-spacing:.05em;border:none;background:transparent;color:var(--inkm,#8A8078);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;white-space:nowrap;font-family:'DM Sans',sans-serif;transition:all .15s}
.pr-tab:hover:not(.on){color:var(--ink,#0A0A0A)}
.pr-tab-body{display:flex;flex-direction:column;gap:.375rem;margin-bottom:1.25rem}
.pr-line{display:flex;align-items:flex-start;gap:.5rem;padding:.375rem .625rem;background:var(--gold4,#FBF5E6)}
.pr-line-q{background:#FEF9ED}
.pr-line-bullet{font-size:11px;flex-shrink:0;margin-top:2px;width:16px}
.pr-line-text{font-size:12px;color:var(--ink,#0A0A0A);line-height:1.5}
.pr-check-section{border:1px solid var(--border,#E8DFC8);padding:1rem;margin-bottom:1rem}
.pr-check-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem}
.pr-check-title{font-size:10px;letter-spacing:.12em;color:var(--inkm,#8A8078)}
.pr-check-count{font-size:12px;font-weight:500;color:var(--ink,#0A0A0A)}
.pr-progress-bar{height:3px;background:var(--border,#E8DFC8);border-radius:2px;margin-bottom:.75rem;overflow:hidden}
.pr-progress-fill{height:100%;border-radius:2px;transition:width .3s}
.pr-checks{display:flex;flex-direction:column;gap:.3rem}
.pr-check-item{display:flex;align-items:center;gap:.5rem;cursor:pointer;padding:.3rem .25rem;transition:background .1s;border-radius:3px}
.pr-check-item:hover{background:var(--gold4,#FBF5E6)}
.pr-checkbox{width:16px;height:16px;border:1px solid var(--border2,#D4C8A8);border-radius:3px;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s;background:white}
.pr-check-text{font-size:12px;color:var(--ink,#0A0A0A);transition:all .15s}
.pr-conseil{border-left:2px solid var(--gold,#C9A84C);padding:.625rem .875rem;background:var(--gold4,#FBF5E6);margin-bottom:.875rem}
.pr-conseil-label{font-size:9px;letter-spacing:.14em;color:var(--gold,#C9A84C);margin-bottom:.25rem}
.pr-conseil-text{font-size:12px;color:var(--ink2,#3A3530);line-height:1.6}
.pr-qo{border:1px solid #F5CBA7;background:#FEF9ED;padding:.875rem;margin-top:.5rem}
.pr-qo-label{font-size:9px;letter-spacing:.14em;color:#935116;margin-bottom:.5rem}
.pr-qo-item{font-size:12px;color:#935116;line-height:1.5;margin-bottom:.3rem}
`
