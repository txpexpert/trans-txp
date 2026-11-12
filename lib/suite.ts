import { PRICING, fmtDH, priceLine } from './pricing'
// lib/suite.ts
// ─────────────────────────────────────────────────────────────────────────────
// Architecture d'offre Import-eXPert (refonte 2026) — source unique de vérité
// pour l'accueil, la page Plateforme, les espaces et la tarification.
// Les modules existants ne sont ni supprimés ni déplacés : chaque espace les
// regroupe en onglets et pointe vers leur route actuelle.
// ─────────────────────────────────────────────────────────────────────────────

export type Tool = { label: string; path: string; desc: string; tier: 'decouverte' | 'operateur' | 'expert' | 'entreprise' }

export type Espace = {
  slug: string
  num: string          // '01'…'05' pour la chaîne, '—' pour les couches
  verb: string         // QUALIFIER, OPTIMISER…
  title: string        // nom de l'espace
  question: string     // question de l'opérateur
  promise: string      // phrase d'accroche
  livrable: string
  transmet: string
  chain: boolean       // fait partie de la chaîne en 5 étapes
  tools: Tool[]
}

export const ESPACES: Espace[] = [
  {
    slug: 'qualifier', num: '01', verb: 'Qualifier', title: 'Fiche produit', chain: true,
    question: "Qu'est-ce que je fais entrer, et qu'est-ce que cela implique ?",
    promise: "Un code SH justifié, et tout ce qu'il déclenche : documents, licences, marquage, marchandises dangereuses.",
    livrable: 'Fiche produit douane, sourcée et datée',
    transmet: 'Code SH et contraintes réglementaires',
    tools: [
      { label: 'Classement tarifaire SH', path: '/modules/classement', desc: 'Codes SH à jour (LF 2026), recherche guidée et arbre RGI', tier: 'operateur' },
      { label: 'Décisions de classement : recherche', path: '/modules/decisions-classement', desc: 'Précédents officiels par produit et par code', tier: 'operateur' },
      { label: 'Documents requis par code SH', path: '/modules/documents-sh', desc: 'Formalités et pièces exigées à l’importation', tier: 'operateur' },
      { label: 'Autorisations et licences', path: '/modules/autorisations-licences', desc: 'Contrôles techniques, licences et visas préalables', tier: 'operateur' },
      { label: 'Marchandises dangereuses', path: '/modules/substances-dangereuses', desc: 'Classification des substances et obligations associées', tier: 'expert' },
      { label: 'Marquage et signalisation', path: '/modules/marquage-warnings', desc: 'Étiquetage, pictogrammes et mentions obligatoires', tier: 'expert' },
      { label: 'Accords préférentiels', path: '/accords', desc: 'UE, Royaume-Uni, États-Unis, Türkiye et Chine : régime, règles d’origine, preuves et contingents', tier: 'operateur' },
    ],
  },
  {
    slug: 'optimiser', num: '02', verb: 'Optimiser', title: 'Origine et régime', chain: true,
    question: 'Sous quelle origine et quel régime payer le moins, en toute légalité ?',
    promise: "Le bon accord de libre-échange, le bon régime économique, et la trajectoire de facilitation qui va avec.",
    livrable: 'Stratégie de dédouanement argumentée',
    transmet: 'Origine, régime et taux préférentiel',
    tools: [
      { label: 'Origine ALECA / UE', path: '/modules/origine-aleca', desc: 'Règles d’origine, preuves, cumul (PEM 2025)', tier: 'operateur' },
      { label: 'Comparateur de régimes', path: '/modules/comparateur', desc: 'Coût réel de chaque régime : droits, garantie, redevances, trésorerie', tier: 'expert' },
      { label: 'Régimes économiques', path: '/modules/regimes-economiques', desc: '12 régimes, garanties et nouveautés 2024-2026', tier: 'expert' },
      { label: 'Calculateur conteneurs', path: '/modules/calc-conteneurs', desc: 'Chargement d’un conteneur 20 ou 40 pieds, volume et poids', tier: 'operateur' },
      { label: 'Calculateur colis', path: '/modules/calc-colis-sre', desc: 'Dimensions, poids volumétrique et colisage', tier: 'operateur' },
      { label: 'Générateur de documents', path: '/modules/generateur-docs', desc: 'Facture, pro forma, packing list, CMR, EUR.1', tier: 'operateur' },
      { label: 'Qui paie quoi ? (Incoterms)', path: '/modules/incoterms-shipping', desc: 'Incoterms croisés avec les termes armateurs', tier: 'operateur' },
      { label: 'Facilitation douanière', path: '/modules/facilitation', desc: '48 mesures, nouveautés 2024-2026, OEA et exportateur agréé', tier: 'expert' },
      { label: 'Commerce international', path: '/modules/index-commerce', desc: 'Index des accords et institutions', tier: 'decouverte' },
    ],
  },
  {
    slug: 'chiffrer', num: '03', verb: 'Chiffrer', title: 'Coût rendu', chain: true,
    question: 'Combien me coûte réellement cette marchandise, rendue chez moi ?',
    promise: "Droits, TVA, TIC, valeur en douane, Incoterm et change : un prix de revient import défendable devant votre direction financière.",
    livrable: 'Prix de revient import (coût rendu)',
    transmet: 'Valeur, droits, taxes et Incoterm',
    tools: [
      { label: 'Coût de revient à l’import', path: '/modules/simulateur', desc: 'Droits, taxes et coût rendu : plusieurs articles, origine, Incoterm, frais locaux', tier: 'decouverte' },
      { label: 'Valeur en douane', path: '/modules/valeur-douane', desc: 'Méthodes OMC, frais à inclure, ajustements', tier: 'operateur' },
      { label: 'TIC', path: '/modules/tic-reference', desc: 'Taxes intérieures de consommation : assiette et taux', tier: 'operateur' },
      { label: 'Recherche CGI', path: '/modules/cgi-search', desc: 'Code général des impôts 2026, recherche assistée', tier: 'decouverte' },
      { label: 'Change (IGOC 2026)', path: '/modules/regime-change', desc: 'Règles de l’Office des Changes et simulateurs', tier: 'operateur' },
      { label: 'Optimisation fiscale', path: '/modules/intelligence-fiscale', desc: 'Leviers fiscaux et valorisation', tier: 'entreprise' },
    ],
  },
  {
    slug: 'executer', num: '04', verb: 'Exécuter', title: "Dossier d'opération", chain: true,
    question: 'Mon dossier est-il complet, et ma DUM est-elle juste ?',
    promise: "Les documents de transit générés, la DUM vérifiée avant dépôt, l'opération suivie jusqu'à la sortie du port.",
    livrable: 'Dossier documentaire et DUM vérifiée',
    transmet: "Historique complet de l'opération",
    tools: [
      { label: 'Régimes & Procédures à l’import', path: '/modules/procedures-process', desc: 'Codes de référence, parcours de dédouanement, procédures par flux', tier: 'operateur' },
      { label: 'Dossier documentaire par procédure', path: '/modules/transit-doc-generator', desc: 'Pièces à réunir par procédure, de l’arrivée à l’apurement', tier: 'operateur' },
      { label: 'Vérifier vos documents d’import', path: '/modules/verificateur-dum', desc: 'Contrôle de cohérence avant dépôt', tier: 'expert' },
      { label: 'Suivi et Tracking', path: '/modules/tracking', desc: 'Suivi de vos expéditions et marchandises', tier: 'operateur' },
      { label: 'Surestaries et pénalités', path: '/modules/surestaries', desc: 'Délais de franchise, coûts, recours', tier: 'operateur' },
      { label: 'Opérateurs maritimes', path: '/modules/operateurs-maritimes', desc: 'De la déclaration sommaire à la mainlevée : délais, écarts et nouveautés 2025-2026', tier: 'operateur' },
      { label: 'Bureaux et ports', path: '/modules/carte-bureauxdouaniers', desc: 'PortNet, Tanger Med, bureaux douaniers', tier: 'decouverte' },
      { label: 'Module Export', path: '/modules/export', desc: 'Guide, check-list et DDP à l’export', tier: 'operateur' },
    ],
  },
  {
    slug: 'securiser', num: '05', verb: 'Sécuriser', title: 'Conformité', chain: true,
    question: "Qu'est-ce qui pourrait être contesté, et comment m'en prémunir ?",
    promise: "Votre exposition mesurée, vos risques cartographiés, vos contentieux préparés, votre trajectoire OEA tracée.",
    livrable: "Score de conformité et plan d'action",
    transmet: 'Corrections renvoyées vers les fiches produit',
    tools: [
      { label: 'Diagnostic de conformité', path: '/diagnostic', desc: '8 domaines, exposition chiffrée, plan d’action suivi dans le temps', tier: 'decouverte' },
      { label: 'Audit des processus : auto-diagnostic', path: '/modules/audit', desc: '60 points de contrôle et recommandations', tier: 'expert' },
      { label: 'Contrôle et maîtrise des risques', path: '/modules/risques', desc: '38 situations de risque documentées', tier: 'expert' },
      { label: 'Comment éviter les risques et litiges ?', path: '/risques', desc: 'Commerce extérieur, change, contentieux douanier, licences et autorisations', tier: 'operateur' },
      { label: 'Catégorisation en OEA (Opérateur Économique Agréé)', path: '/modules/oea', desc: 'Critères, préparation et avantages du statut', tier: 'expert' },
      { label: 'Veille réglementaire', path: '/modules/veille-reglementaire', desc: 'Restez vigilants et informés', tier: 'operateur' },
      { label: 'Alertes fiscales', path: '/modules/alertes-fiscales', desc: 'Échéances et changements fiscaux', tier: 'operateur' },
    ],
  },
  {
    slug: 'bibliotheque', num: '—', verb: 'Bibliothèque', title: 'Le socle réglementaire', chain: false,
    question: 'Où est le texte exact, et quelle est sa portée ?',
    promise: "Tout le corpus douanier, fiscal et de change marocain, consultable en un seul endroit et cité par IXP-Assistant.",
    livrable: 'Référence opposable : texte, article, circulaire',
    transmet: 'Sources citées dans chaque espace',
    tools: [
      { label: 'FAQ douanière', path: '/modules/faq', desc: '173 questions, réponses sourcées', tier: 'decouverte' },
      { label: 'Glossaire FR/AR', path: '/modules/glossaire-douanier', desc: '1 081 termes douaniers', tier: 'decouverte' },
    ],
  },
  {
    slug: 'piloter', num: '—', verb: 'Piloter', title: 'Intelligence et stratégie', chain: false,
    question: 'Où sourcer, où investir, à quoi m’exposer demain ?',
    promise: "Pour la direction générale : flux d'import, intelligence concurrentielle, géopolitique tarifaire, analyses stratégiques.",
    livrable: 'Notes de décision et tableaux de bord',
    transmet: 'Orientations de sourcing et d’investissement',
    tools: [
      { label: 'Global MondoScope', path: '/modules/mondoscope', desc: 'Veille stratégique mondiale', tier: 'entreprise' },
      { label: 'Intelligence import', path: '/modules/intelligence-import', desc: 'Flux 2026, gisement préférentiel, signaux tarifaires', tier: 'entreprise' },
      { label: 'Intelligence stratégique', path: '/modules/intelligence-strategique', desc: 'Décisions de classement, défense commerciale, accords', tier: 'entreprise' },
      { label: 'Analyses stratégiques', path: '/modules/analyses', desc: 'Assistant sourcé et notes d’analyse mensuelles', tier: 'expert' },
    ],
  },
]

export const CHAIN = ESPACES.filter(e => e.chain)
export const espaceBySlug = (s: string) => ESPACES.find(e => e.slug === s)

export const TIER_LABEL: Record<Tool['tier'], string> = {
  decouverte: 'Découverte', operateur: 'Pro', expert: 'Premium', entreprise: 'Entreprise',
}

export const PROOFS = [
  { n: 'SH', l: 'codes à jour' },
  { n: '366+', l: 'circulaires ADII indexées' },
  { n: '9', l: 'régimes comparés' },
  { n: '1 081', l: 'termes FR / AR' },
  { n: '18 ans', l: "d'expertise douanière" },
]

export const PROFILS = [
  {
    id: 'transitaire', titre: 'Transitaires et commissionnaires',
    accroche: 'Traitez plus de dossiers, avec moins de reprises.',
    points: [
      'Classement, documents et vérification DUM dans un même dossier, client par client',
      'Moins d’allers-retours avec les importateurs : la fiche produit sert de référence partagée',
      'Un avis d’expert à l’acte quand un dossier sort de l’ordinaire',
    ],
    espaces: ['qualifier', 'executer', 'securiser'],
  },
  {
    id: 'industriel', titre: 'Importateurs industriels',
    accroche: 'Sécurisez vos flux avant que l’ADII ne les examine.',
    points: [
      'Un référentiel produit audité, opposable en cas de contrôle a posteriori',
      'Régimes économiques et origine préférentielle exploités au maximum',
      'Une trajectoire OEA préparée, étape par étape',
    ],
    espaces: ['qualifier', 'optimiser', 'securiser'],
  },
  {
    id: 'daf', titre: 'Directions financières',
    accroche: 'Le vrai coût rendu de vos importations, au dirham près.',
    points: [
      'Droits, TVA, TIC, valeur et change chiffrés par opération',
      'L’impact des accords de libre-échange mesuré, pas supposé',
      'Une exposition fiscale et douanière lisible pour le comité de direction',
    ],
    espaces: ['chiffrer', 'optimiser', 'piloter'],
  },
]

// Tarification : abonnement ANNUEL + prestations expertes à l'acte.
// Montants HT issus de lib/pricing.ts (source unique, grille du 2026-11-07).
export const PLANS = [
  {
    id: 'free', nom: 'Découverte', resultat: 'Mesurer mon exposition', prix: '0', unite: 'pour toujours',
    pour: 'Pour évaluer la plateforme',
    inclus: ['Diagnostic de conformité et exposition en dirhams', '3 fiches produits et alerte mensuelle sur vos produits', 'Coût de revient à l’import', 'Bibliothèque : FAQ, glossaire, recherche CGI', 'IXP-Assistant : questions limitées'],
    cta: 'Créer un compte', href: '/auth/register?plan=free',
  },
  {
    id: 'pro', nom: 'Pro', resultat: 'Importer juste', prix: fmtDH(PRICING.pro.annual!), unite: priceLine('pro').replace(/^DH /, ''),
    pour: 'PME importatrices',
    inclus: ['Qualifier, Chiffrer et Exécuter', '50 références suivies, dossiers défendables', 'Veille hebdomadaire et rapport mensuel au dirigeant', 'Bibliothèque complète', 'IXP-Assistant illimité'],
    cta: 'Essai 14 jours', href: '/auth/register?plan=pro',
  },
  {
    id: 'premium', nom: 'Premium', resultat: 'Sécuriser et prouver', prix: fmtDH(PRICING.premium.annual!), unite: priceLine('premium').replace(/^DH /, ''), vedette: true,
    pour: 'Transitaires, commissionnaires, cabinets',
    inclus: ['Les 5 espaces de la chaîne', 'Vérification des documents d’import et générateur de documents', 'Audit douanier, risques, trajectoire OEA', '120 références suivies, gestion multi-clients et portail clients à votre nom', 'Rapport trimestriel au comité de direction', '24 renseignements experts par an inclus, soit 36 000 DH HT au tarif à l’acte'],
    cta: 'Essai 14 jours', href: '/auth/register?plan=premium',
  },
  {
    id: 'enterprise', nom: 'Entreprise', resultat: 'Piloter l’exposition', prix: 'Sur contrat', unite: PRICING.enterprise.note,
    pour: 'Groupes industriels, directions financières',
    inclus: ['Tout Premium, pour toute l’équipe', 'Espace Piloter et contentieux avancé', 'API ERP / TMS', 'Expert dédié et onboarding', 'Engagement de service (SLA)'],
    cta: 'Parler à un expert', href: '/contact?sujet=entreprise',
  },
]

// Interventions expertes. Les forfaits sont annoncés avant toute intervention ;
// les packs sont déduits du premier abonnement annuel souscrit dans les 30 jours.
// Prix HT proposés (11/11/2026), à valider par les associés : modifier ici uniquement.
export const PRIX_RENSEIGNEMENT = 1500
export const PRESTATIONS = [
  { nom: 'Renseignement express', prix: '1 500 DH HT', delai: 'Sous 48 h ouvrées', desc: 'Une question précise, une réponse écrite et sourcée par un expert : classement, origine, régime, document.' },
  { nom: 'Avis motivé', prix: '4 000 DH HT', delai: 'Sous 5 jours ouvrés', desc: 'Une analyse argumentée sur un point sensible, prête à être jointe à un dossier ou présentée à l’administration.' },
  { nom: 'Accompagnement de dossier', prix: 'Sur devis', delai: 'Sur devis', desc: 'Contentieux, demande de régime économique, audit sur site : une mission Douane Engineering cadrée.' },
]

export const PACKS = [
  { nom: 'Audit flash du classement', prix: 5000, delai: '20 références', pour: 'PME importatrices', desc: 'Vingt références produits revues par un expert, avec une note écrite des écarts de classement et des documents exigés.' },
  { nom: 'Bilan origine', prix: 7500, delai: '12 mois d’importations', pour: 'Directions financières', desc: 'Ce que vos accords de libre-échange vous font gagner, ce qu’ils pourraient vous faire gagner, et les preuves à sécuriser.' },
  { nom: 'Préparation au contrôle a posteriori', prix: 12000, delai: 'Avant ou pendant un contrôle', pour: 'Importateurs contrôlés', desc: 'Revue du dossier, points de fragilité et liste des pièces à réunir pour répondre à l’administration.' },
  { nom: 'Pré-OEA', prix: 15000, delai: 'Écart et feuille de route', pour: 'Industriels et transitaires', desc: 'Écart entre votre situation et les critères de l’Opérateur Économique Agréé, avec un plan pour y arriver.' },
]
