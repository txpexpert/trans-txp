// lib/auditData.ts
// Module Audit Douanier & Contrôle des Risques
// Données extraites du Titre 11 — Conseils pratiques aux investisseurs

export interface CheckItem {
  id: string
  question: string
  conseil: string        // conseil préventif si réponse Non
  reference?: string     // référence FAQ liée
  poids: number          // importance dans le score (1-3)
  risque: 'critique' | 'important' | 'normal'
}

export interface AuditDomain {
  id: number
  slug: string
  label: string
  icon: string
  color: string
  light: string
  description: string
  items: CheckItem[]
}

export const AUDIT_DOMAINS: AuditDomain[] = [
  {
    id: 1, slug: 'dedouanement',
    label: 'Procédures de dédouanement',
    icon: '⊞', color: '#1E40AF', light: '#DBEAFE',
    description: 'Conformité des processus d\'import/export, documentation DUM et circuit marchandises',
    items: [
      { id:'1.1', poids:3, risque:'critique',
        question: 'Votre transitaire est-il agréé par l\'ADII et compétent pour votre secteur ?',
        conseil: 'La responsabilité de la déclaration incombe au déclarant. Un transitaire non agréé expose l\'entreprise à des irrégularités et des litiges.',
        reference: '1.44' },
      { id:'1.2', poids:3, risque:'critique',
        question: 'La DUM est-elle vérifiée avant soumission (données quantitatives, espèce, origine, valeur) ?',
        conseil: 'Une DUM inexacte engage définitivement le déclarant. Vérifiez la cohérence entre facture, note de colisage, titre de transport et SH déclaré.',
        reference: '1.11' },
      { id:'1.3', poids:2, risque:'important',
        question: 'La documentation complète est-elle préparée avant l\'arrivée des marchandises ?',
        conseil: 'Préparez à l\'avance : connaissement, factures commerciales, certificat d\'origine, certificats vétérinaires/sanitaires si nécessaire.',
        reference: '1.14' },
      { id:'1.4', poids:2, risque:'important',
        question: 'Utilisez-vous la déclaration anticipée pour les produits périssables ou à fort enjeu de délai ?',
        conseil: 'La déclaration anticipée permet de déposer la DUM avant l\'arrivée physique, réduisant les délais de passage en douane.',
        reference: '1.6' },
      { id:'1.5', poids:1, risque:'normal',
        question: 'Vos agents sont-ils formés aux obligations déclaratives et aux sanctions applicables ?',
        conseil: 'Toute omission ou inexactitude dans la déclaration constitue une infraction. Une formation annuelle est recommandée.',
        reference: '1.12' },
      { id:'1.6', poids:2, risque:'important',
        question: 'Avez-vous un suivi des délais d\'apurement de vos déclarations sommaires ?',
        conseil: 'La déclaration sommaire doit être déposée dans les 24h suivant l\'arrivée du navire. Un suivi rigoureux évite les pénalités.',
        reference: '1.8' },
      { id:'1.7', poids:1, risque:'normal',
        question: 'Maîtrisez-vous l\'utilisation de Portnet et la signature électronique PKI Barid el Maghreb ?',
        conseil: 'L\'accès au système BADR requiert une signature électronique authentifiée. Assurez-vous que vos déclarants ont des certificats valides.',
        reference: '1.5' },
    ]
  },
  {
    id: 2, slug: 'droit',
    label: 'Conformité droit douanier',
    icon: '≡', color: '#065F46', light: '#D1FAE5',
    description: 'Maîtrise du cadre juridique, des sources réglementaires et des obligations légales',
    items: [
      { id:'2.1', poids:3, risque:'critique',
        question: 'Faites-vous une veille régulière des lois de finances et circulaires ADII ?',
        conseil: 'Le droit douanier évolue chaque année via la loi de finances. Une veille mensuelle est indispensable pour éviter l\'application de dispositions obsolètes.',
        reference: '2.4' },
      { id:'2.2', poids:2, risque:'important',
        question: 'Connaissez-vous les accords commerciaux applicables à votre secteur (UE, USA, pays arabes) ?',
        conseil: 'Les accords commerciaux dérogent au principe de la nation la plus favorisée. Identifier les accords applicables permet d\'optimiser les taux de droits.',
        reference: '2.5' },
      { id:'2.3', poids:2, risque:'important',
        question: 'Les rectifications de DUM sont-elles traitées dans les délais réglementaires ?',
        conseil: 'Une déclaration enregistrée est irrévocable sauf demande formelle. La procédure de rectification doit être maîtrisée pour corriger les erreurs.',
        reference: '2.17' },
      { id:'2.4', poids:3, risque:'critique',
        question: 'Conservez-vous tous les documents douaniers et commerciaux pendant la durée légale (4 ans) ?',
        conseil: 'Le contrôle a posteriori peut couvrir une période non prescrite. L\'absence de documents peut entraîner des redressements fiscaux.',
        reference: '2.11' },
      { id:'2.5', poids:1, risque:'normal',
        question: 'Disposez-vous d\'un conseil juridique spécialisé en droit douanier marocain ?',
        conseil: 'La technicité du droit douanier exige une expertise spécialisée. Un conseil interne ou externe permet d\'anticiper les risques réglementaires.',
        reference: '2.1' },
    ]
  },
  {
    id: 3, slug: 'tarification',
    label: 'Tarification & SH',
    icon: '◇', color: '#78350F', light: '#FEF3C7',
    description: 'Classement tarifaire correct, application des taux et utilisation des RTC',
    items: [
      { id:'3.1', poids:3, risque:'critique',
        question: 'Le classement SH de vos produits a-t-il été vérifié par un expert douanier ?',
        conseil: 'Une classification erronée est une forme de fraude. Investissez dans une expertise pour un classement tarifaire précis basé sur les Règles Générales d\'Interprétation (RGI).',
        reference: '6.3' },
      { id:'3.2', poids:3, risque:'critique',
        question: 'Avez-vous demandé un Renseignement Tarifaire Contraignant (RTC) pour vos produits complexes ?',
        conseil: 'Le RTC donne une décision juridiquement contraignante sur le classement, offrant une sécurité juridique face aux contestations de l\'administration.',
        reference: '6.11' },
      { id:'3.3', poids:2, risque:'important',
        question: 'Vérifiez-vous régulièrement les mises à jour du tarif douanier marocain ADII ?',
        conseil: 'Le tarif est mis à jour annuellement. Une désynchronisation entre votre classement et le tarif en vigueur expose à des redressements.',
        reference: '3.1' },
      { id:'3.4', poids:2, risque:'important',
        question: 'Les taux de droits appliqués intègrent-ils les accords préférentiels disponibles ?',
        conseil: 'Identifiez les accords bilatéraux applicables (UE, USA, AELE, pays arabes) pour réduire légalement les droits d\'importation.',
        reference: '3.2' },
      { id:'3.5', poids:1, risque:'normal',
        question: 'Maîtrisez-vous le système du triple circuit (vert/orange/rouge) et ses critères de déclenchement ?',
        conseil: 'Concentrez-vous sur la conformité pour viser le circuit vert. Les critères incluent l\'opérateur, le régime, l\'origine, la valeur et l\'espèce.',
        reference: '3.9' },
    ]
  },
  {
    id: 4, slug: 'fraudes',
    label: 'Contrôles & Fraudes',
    icon: '⊕', color: '#7F1D1D', light: '#FEE2E2',
    description: 'Prévention des infractions douanières et gestion des contrôles ADII',
    items: [
      { id:'4.1', poids:3, risque:'critique',
        question: 'Vérifiez-vous que la valeur déclarée correspond aux prix de marché réels ?',
        conseil: 'La sous-évaluation est la fraude la plus fréquente et la plus sévèrement sanctionnée. La reconstitution de valeur par l\'agent douanier peut déclencher un redressement majeur.',
        reference: '4.1' },
      { id:'4.2', poids:3, risque:'critique',
        question: 'Avez-vous formellement interdit à votre transitaire toute pratique de sous-évaluation en votre nom ?',
        conseil: 'Les commettants sont responsables des opérations effectuées par leurs employés et mandataires. Une clause contractuelle explicite est indispensable.',
        reference: '9.2' },
      { id:'4.3', poids:3, risque:'critique',
        question: 'Tous les frais annexes (fret, assurance, manutention) sont-ils intégrés dans la valeur déclarée ?',
        conseil: 'L\'omission de frais annexes constitue une infraction. Vérifiez systématiquement l\'inclusion du fret, assurance, aconage, désarrimage.',
        reference: '3.15' },
      { id:'4.4', poids:2, risque:'important',
        question: 'Maintenez-vous une comptabilité matières rigoureuse pour les marchandises sous régimes suspensifs ?',
        conseil: 'La comptabilité matières est obligatoire pour les régimes économiques. Son absence lors d\'un contrôle a posteriori peut être assimilée à une infraction.',
        reference: '4.2' },
      { id:'4.5', poids:2, risque:'important',
        question: 'Anticipez-vous les contrôles différés et a posteriori (conservation des preuves) ?',
        conseil: 'Le contrôle différé intervient 1 semaine à 1 mois après la mainlevée. Maintenez un dossier complet pour chaque déclaration.',
        reference: '3.14' },
      { id:'4.6', poids:2, risque:'important',
        question: 'Vérifiez-vous la concordance des poids déclarés avec la note de colisage et la réalité physique ?',
        conseil: 'Les écarts de poids sont un signal d\'alarme fort pour l\'administration douanière et peuvent déclencher une visite physique (circuit rouge).',
        reference: '3.16' },
      { id:'4.7', poids:1, risque:'normal',
        question: 'Avez-vous mis en place une procédure interne de vérification avant chaque dédouanement ?',
        conseil: 'Une checklist interne systématique réduit significativement les risques d\'erreurs et d\'infractions involontaires.',
        reference: '4.3' },
    ]
  },
  {
    id: 5, slug: 'regimes',
    label: 'Régimes économiques',
    icon: '⬡', color: '#4C1D95', light: '#EDE9FE',
    description: 'Utilisation optimale des RED, gestion des cautionnements et apurement des comptes',
    items: [
      { id:'5.1', poids:3, risque:'critique',
        question: 'Avez-vous analysé les régimes économiques disponibles pour votre activité (AT, ATPA, Entrepôt, ZAI) ?',
        conseil: 'Les régimes économiques procurent des avantages considérables : suspension des droits et taxes jusqu\'à la mise à la consommation. Un audit annuel des régimes utilisés est recommandé.',
        reference: '5.1' },
      { id:'5.2', poids:3, risque:'critique',
        question: 'Vos comptes de régimes suspensifs sont-ils apurés dans les délais réglementaires ?',
        conseil: 'Le dépassement des délais d\'apurement entraîne la mise en jeu de la caution et des pénalités. Mettez en place un tableau de bord de suivi des échéances.',
        reference: '5.56' },
      { id:'5.3', poids:2, risque:'important',
        question: 'La comptabilité matières de votre régime AT/ATPA est-elle à jour et accessible rapidement ?',
        conseil: 'Lors d\'un contrôle, la comptabilité matières doit être présentée immédiatement. Une tenue irréprochable est la meilleure protection contre un redressement.',
        reference: '5.20' },
      { id:'5.4', poids:2, risque:'important',
        question: 'Avez-vous obtenu les autorisations préalables requises (Diw@nati) pour vos régimes économiques ?',
        conseil: 'La plateforme Diw@nati est désormais obligatoire pour l\'ouverture des EPP, EPPS et certains régimes suspensifs. Vérifiez la validité de vos autorisations.',
        reference: '5.2' },
      { id:'5.5', poids:2, risque:'important',
        question: 'Le taux de transformation et les produits compensateurs sont-ils correctement déclarés ?',
        conseil: 'Les fiches techniques de transformation doivent être déposées et respectées. Un écart entre réalité et déclaration expose à une infraction grave.',
        reference: '5.23' },
      { id:'5.6', poids:1, risque:'normal',
        question: 'Profitez-vous du cautionnement sur engagement si votre entreprise est exportatrice ?',
        conseil: 'Les entreprises exportatrices peuvent bénéficier de cautionnements souples réduisant les charges financières de garantie.',
        reference: '5.49' },
    ]
  },
  {
    id: 6, slug: 'classement',
    label: 'Classement tarifaire SH',
    icon: '◉', color: '#164E63', light: '#CFFAFE',
    description: 'Maîtrise du Système Harmonisé, des RGI et des nomenclatures tarifaires',
    items: [
      { id:'6.1', poids:3, risque:'critique',
        question: 'Disposez-vous d\'une liste exhaustive et à jour des codes SH de tous vos produits ?',
        conseil: 'Un code SH incorrect est une source majeure de litiges douaniers. Maintenez un catalogue produits avec les SH validés et révisez-le annuellement.',
        reference: '6.2' },
      { id:'6.2', poids:2, risque:'important',
        question: 'Connaissez-vous les 6 Règles Générales d\'Interprétation (RGI) du SH ?',
        conseil: 'Les RGI sont juridiquement contraignantes. Une maîtrise de base évite les erreurs de classement pour les produits composites ou non standards.',
        reference: '6.3' },
      { id:'6.3', poids:2, risque:'important',
        question: 'Les notes de sections et de chapitres du tarif sont-elles consultées lors du classement ?',
        conseil: 'Les notes légales ont une valeur juridique supérieure aux libellés de positions. Leur ignorance est la première cause d\'erreur de classement.',
        reference: '6.9' },
      { id:'6.4', poids:1, risque:'normal',
        question: 'Avez-vous identifié les produits pour lesquels un RTC serait utile ?',
        conseil: 'Pour tout produit de valeur significative ou de classement ambigu, demandez un RTC. C\'est votre meilleure protection juridique.',
        reference: '6.11' },
    ]
  },
  {
    id: 7, slug: 'origine',
    label: "Règles d'origine",
    icon: '△', color: '#14532D', light: '#DCFCE7',
    description: 'Certification de l\'origine, accords préférentiels et cumul d\'origine',
    items: [
      { id:'7.1', poids:3, risque:'critique',
        question: 'Les certificats d\'origine (EUR.1, Form A, ATR) sont-ils valides et correctement remplis ?',
        conseil: 'Un certificat d\'origine erroné ou périmé invalide l\'application du taux préférentiel et peut déclencher un redressement sur tous les droits non payés.',
        reference: '7.6' },
      { id:'7.2', poids:3, risque:'critique',
        question: 'Vérifiez-vous que vos fournisseurs respectent les critères d\'origine des accords préférentiels ?',
        conseil: 'La responsabilité de l\'importateur est engagée si l\'origine déclarée est inexacte, même si le fournisseur est à l\'origine de l\'erreur.',
        reference: '7.7' },
      { id:'7.3', poids:2, risque:'important',
        question: 'La règle de transport direct est-elle respectée pour vos importations sous régimes préférentiels ?',
        conseil: 'Les marchandises doivent transiter directement entre pays partenaires. Un transbordement non documenté peut annuler l\'origine préférentielle.',
        reference: '7.5' },
      { id:'7.4', poids:2, risque:'important',
        question: 'Avez-vous identifié les accords commerciaux applicables à votre secteur et produits ?',
        conseil: 'Le Maroc a signé des accords avec l\'UE, l\'AELE, les USA, les pays arabes et africains. Chaque accord a des règles d\'origine spécifiques.',
        reference: '7.9' },
      { id:'7.5', poids:1, risque:'normal',
        question: 'Maîtrisez-vous le principe du cumul diagonal pan euro-méditerranéen ?',
        conseil: 'Le cumul permet de considérer des matières de pays partenaires comme originaires. Une maîtrise de ce principe ouvre des opportunités d\'optimisation.',
        reference: '7.10' },
    ]
  },
  {
    id: 8, slug: 'valeur',
    label: 'Valeur en douane',
    icon: '◎', color: '#1E3A8A', light: '#EFF6FF',
    description: 'Détermination correcte de la valeur transactionnelle et gestion des ajustements',
    items: [
      { id:'8.1', poids:3, risque:'critique',
        question: 'La valeur transactionnelle déclarée inclut-elle tous les éléments à ajouter (fret, assurance, redevances) ?',
        conseil: 'L\'omission d\'éléments obligatoires de la valeur (redevances, droits de licence, commissions) constitue une infraction grave.',
        reference: '8.11' },
      { id:'8.2', poids:3, risque:'critique',
        question: 'Les Incoterms utilisés sont-ils cohérents avec la valeur déclarée en douane ?',
        conseil: 'Chaque Incoterm implique des frais différents à inclure ou exclure de la valeur en douane. Une maîtrise des Incoterms est indispensable.',
        reference: '8.16' },
      { id:'8.3', poids:2, risque:'important',
        question: 'En cas de relation entre acheteur et vendeur, avez-vous vérifié que le prix n\'est pas influencé ?',
        conseil: 'Les transactions entre parties liées sont scrutées par l\'administration. Documentez les conditions de fixation du prix pour justifier la valeur transactionnelle.',
        reference: '8.9' },
      { id:'8.4', poids:2, risque:'important',
        question: 'Disposez-vous d\'un dossier de reconstitution de valeur pour vos principaux produits ?',
        conseil: 'En cas de contrôle, la reconstitution de valeur par l\'administration peut aboutir à un redressement. Anticipez avec votre propre reconstitution documentée.',
        reference: '8.19' },
      { id:'8.5', poids:1, risque:'normal',
        question: 'Connaissez-vous les 6 méthodes d\'évaluation en douane et leur ordre d\'application ?',
        conseil: 'Les méthodes s\'appliquent dans un ordre précis. La valeur transactionnelle est prioritaire, mais les méthodes de substitution doivent être maîtrisées.',
        reference: '8.17' },
    ]
  },
  {
    id: 9, slug: 'contentieux',
    label: 'Contentieux & Litiges',
    icon: '✦', color: '#831843', light: '#FDF2F8',
    description: 'Prévention des infractions, gestion des transactions et protection juridique',
    items: [
      { id:'9.1', poids:3, risque:'critique',
        question: 'Avez-vous une procédure documentée pour réagir en cas de notification de contrôle ADII ?',
        conseil: 'En cas de contrôle, la rapidité et l\'organisation de la réponse sont déterminantes. Désignez un référent douane et préparez un dossier type.',
        reference: '9.1' },
      { id:'9.2', poids:3, risque:'critique',
        question: 'Connaissez-vous les types d\'infractions douanières et leurs sanctions applicables ?',
        conseil: 'La méconnaissance de la loi n\'est pas une excuse. Délits et contraventions peuvent entraîner confiscation, amendes et emprisonnement.',
        reference: '9.9' },
      { id:'9.3', poids:2, risque:'important',
        question: 'Avez-vous recours à la procédure de transaction douanière en cas d\'irrégularité constatée ?',
        conseil: 'La transaction permet d\'éteindre les poursuites en échange d\'un paiement négocié. C\'est souvent préférable à un contentieux long et coûteux.',
        reference: '9.8' },
      { id:'9.4', poids:2, risque:'important',
        question: 'Les pouvoirs des agents douaniers (visite domiciliaire, saisie) vous sont-ils connus ?',
        conseil: 'Connaître les droits et obligations lors d\'un contrôle permet d\'éviter les situations aggravantes et de protéger vos droits.',
        reference: '9.7' },
      { id:'9.5', poids:1, risque:'normal',
        question: 'Un conseil juridique spécialisé est-il identifié pour intervenir en cas de litige douanier ?',
        conseil: 'Le contentieux douanier est très technique. Identifiez en amont un avocat ou expert douanier pour une intervention rapide.',
        reference: '9.5' },
    ]
  },
  {
    id: 10, slug: 'fiscalite',
    label: 'Fiscalité douanière',
    icon: '◆', color: '#3F3F46', light: '#F4F4F5',
    description: 'Maîtrise des droits et taxes, modes de paiement et optimisation fiscale légale',
    items: [
      { id:'10.1', poids:3, risque:'critique',
        question: 'Les modes de calcul des droits et taxes appliqués à vos produits sont-ils maîtrisés ?',
        conseil: 'Droits ad valorem, spécifiques, composites — chaque mode de calcul a ses spécificités. Une erreur de base de calcul peut générer un redressement significatif.',
        reference: '10.8' },
      { id:'10.2', poids:2, risque:'important',
        question: 'Utilisez-vous le Transfert Électronique de Fonds (TEF) comme mode de paiement privilégié ?',
        conseil: 'Le TEF est le mode de paiement officiel recommandé. Il offre rapidité, sécurité et traçabilité, réduisant les risques de litige sur les paiements.',
        reference: '10.7' },
      { id:'10.3', poids:2, risque:'important',
        question: 'Suivez-vous les évolutions des taux de droits via les lois de finances annuelles ?',
        conseil: 'Les taux peuvent changer chaque année. Une veille systématique sur la loi de finances évite l\'application de taux obsolètes.',
        reference: '10.2' },
      { id:'10.4', poids:2, risque:'important',
        question: 'Les pénalités et intérêts de retard applicables à votre secteur sont-ils connus ?',
        conseil: 'Les pénalités peuvent s\'accumuler rapidement. Une connaissance des seuils de déclenchement permet d\'agir avant que la situation ne devienne critique.',
        reference: '10.10' },
      { id:'10.5', poids:1, risque:'normal',
        question: 'Avez-vous analysé les exonérations et franchises disponibles pour votre activité ?',
        conseil: 'De nombreux régimes d\'exonération existent (investissement, secteurs prioritaires). Un audit fiscal douanier annuel peut révéler des opportunités non exploitées.',
        reference: '10.3' },
    ]
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

export type Answer = 'oui' | 'non' | 'partiel' | null

export function computeDomainScore(domain: AuditDomain, answers: Record<string, Answer>): number {
  let total = 0, earned = 0
  for (const item of domain.items) {
    total += item.poids
    const ans = answers[item.id]
    if (ans === 'oui')     earned += item.poids
    if (ans === 'partiel') earned += item.poids * 0.5
  }
  return total > 0 ? Math.round((earned / total) * 100) : 0
}

export function getScoreLevel(score: number): { label: string; color: string; bg: string } {
  if (score >= 80) return { label: 'Conforme',    color: '#166534', bg: '#DCFCE7' }
  if (score >= 50) return { label: 'À améliorer', color: '#92400E', bg: '#FEF3C7' }
  return              { label: 'Critique',        color: '#991B1B', bg: '#FEE2E2' }
}

export function computeGlobalScore(answers: Record<string, Answer>): number {
  const scores = AUDIT_DOMAINS.map(d => computeDomainScore(d, answers))
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}
