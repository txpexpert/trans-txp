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
      { label: 'Classement tarifaire SH', path: '/modules/classement', desc: '17 224 codes, recherche guidée et arbre RGI', tier: 'operateur' },
      { label: 'Décisions de classement ADII', path: '/modules/decisions-classement', desc: 'Précédents officiels par produit et par code', tier: 'operateur' },
      { label: 'Documents requis par code SH', path: '/modules/documents-sh', desc: 'Formalités et pièces exigées à l’importation', tier: 'operateur' },
      { label: 'Autorisations et licences', path: '/modules/autorisations-licences', desc: 'Contrôles techniques, licences et visas préalables', tier: 'operateur' },
      { label: 'Marchandises dangereuses', path: '/modules/substances-dangereuses', desc: 'Classification des substances et obligations associées', tier: 'expert' },
      { label: 'Marquage et signalisation', path: '/modules/marquage-warnings', desc: 'Étiquetage, pictogrammes et mentions obligatoires', tier: 'expert' },
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
      { label: 'Comparateur de régimes', path: '/modules/comparateur', desc: '9 régimes du Code des douanes comparés', tier: 'expert' },
      { label: 'Régimes économiques', path: '/modules/regimes-economiques', desc: 'Admission temporaire, perfectionnement, entrepôt', tier: 'expert' },
      { label: 'Facilitation douanière', path: '/modules/facilitation', desc: 'Mesures de facilitation et bonnes pratiques', tier: 'expert' },
      { label: 'Module Export', path: '/modules/export', desc: 'Guide, check-list et DDP à l’export', tier: 'operateur' },
    ],
  },
  {
    slug: 'chiffrer', num: '03', verb: 'Chiffrer', title: 'Coût rendu', chain: true,
    question: 'Combien me coûte réellement cette marchandise, rendue chez moi ?',
    promise: "Droits, TVA, TIC, valeur en douane, Incoterm et change : un prix de revient import défendable devant votre direction financière.",
    livrable: 'Prix de revient import (coût rendu)',
    transmet: 'Valeur, droits, taxes et Incoterm',
    tools: [
      { label: 'Simulateur droits et taxes', path: '/modules/simulateur', desc: 'Calcul complet à partir du code SH et de l’origine', tier: 'decouverte' },
      { label: 'Simulateur fiscal douanier', path: '/modules/simulateur-fiscal', desc: 'Coût de revient détaillé, taxe par taxe', tier: 'operateur' },
      { label: 'Valeur en douane', path: '/modules/valeur-douane', desc: 'Méthodes OMC, frais à inclure, ajustements', tier: 'operateur' },
      { label: 'TIC', path: '/modules/tic-reference', desc: 'Taxes intérieures de consommation : assiette et taux', tier: 'operateur' },
      { label: 'Qui paie quoi ? Incoterms', path: '/modules/incoterms-shipping', desc: 'Incoterms croisés avec les termes armateurs', tier: 'operateur' },
      { label: 'Change (IGOC 2026)', path: '/modules/regime-change', desc: 'Règles de l’Office des Changes et simulateurs', tier: 'operateur' },
      { label: 'Logistique : conteneurs et colis', path: '/modules/calc-conteneurs', desc: 'Chargement conteneur, colisage, cartons', tier: 'operateur' },
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
      { label: 'Suite documentaire transit', path: '/modules/transit-doc-generator', desc: 'Génération des documents de l’opération', tier: 'operateur' },
      { label: 'Vérificateur DUM', path: '/modules/verificateur-dum', desc: 'Contrôle de cohérence avant dépôt sur BADR', tier: 'expert' },
      { label: 'Suivi et intelligence', path: '/modules/tracking', desc: 'Suivi des expéditions et des événements', tier: 'operateur' },
      { label: 'Surestaries et pénalités', path: '/modules/surestaries', desc: 'Délais de franchise, coûts, recours', tier: 'operateur' },
      { label: 'Bureaux et ports', path: '/modules/carte-bureauxdouaniers', desc: 'PortNet, Tanger Med, bureaux douaniers', tier: 'decouverte' },
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
      { label: 'Audit douanier', path: '/modules/audit', desc: '60 points de contrôle et recommandations', tier: 'expert' },
      { label: 'Audit Express', path: '/modules/audit-express', desc: 'Première mesure de votre exposition', tier: 'decouverte' },
      { label: 'Contrôle des risques', path: '/modules/risques', desc: '38 situations de risque documentées', tier: 'expert' },
      { label: 'Contentieux et litiges', path: '/modules/contentieux', desc: 'Procédures, délais et voies de recours', tier: 'entreprise' },
      { label: 'Trajectoire OEA', path: '/modules/oea', desc: 'Critères, préparation et avantages du statut', tier: 'expert' },
      { label: 'Veille réglementaire', path: '/modules/veille-reglementaire', desc: 'Loi de finances 2026, circulaires, alertes', tier: 'operateur' },
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
      { label: 'Recherche CGI', path: '/modules/cgi-search', desc: 'Code général des impôts 2026, recherche assistée', tier: 'decouverte' },
      { label: 'Index du CGI', path: '/modules/cgi-fiscal', desc: 'Navigation article par article', tier: 'operateur' },
      { label: 'Procédures douanières', path: '/modules/procedures-process', desc: '22 procédures pas à pas', tier: 'operateur' },
      { label: 'Fiches procédures', path: '/modules/procedures', desc: 'Synthèses par procédure', tier: 'operateur' },
      { label: 'FAQ douanière', path: '/modules/faq', desc: '173 questions, réponses sourcées', tier: 'decouverte' },
      { label: 'Glossaire FR/AR', path: '/modules/glossaire-douanier', desc: '1 081 termes douaniers', tier: 'decouverte' },
      { label: 'Commerce international', path: '/modules/index-commerce', desc: 'Index des accords et institutions', tier: 'decouverte' },
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
      { label: 'Intelligence import', path: '/modules/intelligence-import', desc: 'Flux, concurrents, volumes', tier: 'entreprise' },
      { label: 'Intelligence stratégique', path: '/modules/intelligence-strategique', desc: 'Intelligence commerciale et jurisprudence', tier: 'entreprise' },
      { label: 'Analyses stratégiques', path: '/modules/analyses', desc: 'Notes d’analyse sectorielle', tier: 'expert' },
    ],
  },
]

export const CHAIN = ESPACES.filter(e => e.chain)
export const espaceBySlug = (s: string) => ESPACES.find(e => e.slug === s)

export const TIER_LABEL: Record<Tool['tier'], string> = {
  decouverte: 'Découverte', operateur: 'Opérateur', expert: 'Expert', entreprise: 'Entreprise',
}

export const PROOFS = [
  { n: '17 224', l: 'codes SH' },
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

// Tarification : abonnement par utilisateur + prestations expertes à l'acte.
// Les montants reprennent la grille actuelle (pages/abonnements.tsx) — À VALIDER.
export const PLANS = [
  {
    id: 'free', nom: 'Découverte', prix: '0', unite: 'pour toujours',
    pour: 'Pour évaluer la plateforme',
    inclus: ['Bibliothèque : FAQ, glossaire, recherche CGI', 'Simulateur droits et taxes', 'Audit Express', 'IXP-Assistant : questions limitées'],
    cta: 'Créer un compte', href: '/auth/register?plan=free',
  },
  {
    id: 'pro', nom: 'Opérateur', prix: '799', unite: 'DH HT / utilisateur / mois',
    pour: 'PME importatrices',
    inclus: ['Qualifier, Chiffrer et Exécuter', 'Classement SH inclus', 'Bibliothèque complète', 'IXP-Assistant illimité', 'Support par email'],
    cta: 'Essai 14 jours', href: '/auth/register?plan=pro',
  },
  {
    id: 'premium', nom: 'Expert', prix: '1 990', unite: 'DH HT / utilisateur / mois', vedette: true,
    pour: 'Transitaires, commissionnaires, cabinets',
    inclus: ['Les 5 espaces de la chaîne', 'Vérificateur DUM et suite documentaire', 'Audit douanier, risques, trajectoire OEA', 'Gestion multi-clients', '2 renseignements experts inclus / mois'],
    cta: 'Essai 14 jours', href: '/auth/register?plan=premium',
  },
  {
    id: 'enterprise', nom: 'Entreprise', prix: '4 990', unite: 'DH HT / mois, à partir de',
    pour: 'Groupes industriels, directions financières',
    inclus: ['Tout Expert, pour toute l’équipe', 'Espace Piloter et contentieux avancé', 'API ERP / TMS', 'Expert dédié et onboarding', 'Engagement de service (SLA)'],
    cta: 'Parler à un expert', href: '/contact?sujet=entreprise',
  },
]

export const PRESTATIONS = [
  { nom: 'Renseignement express', delai: 'Sous 48 h ouvrées', desc: 'Une question précise, une réponse écrite et sourcée par un expert : classement, origine, régime, document.' },
  { nom: 'Avis motivé', delai: 'Sous 5 jours ouvrés', desc: 'Une analyse argumentée et opposable sur un point sensible, prête à être jointe à un dossier ou présentée à l’administration.' },
  { nom: 'Accompagnement de dossier', delai: 'Sur devis', desc: 'Contentieux, demande de régime économique, préparation OEA, audit sur site : une mission Douane Engineering cadrée.' },
]
