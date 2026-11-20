// lib/profils.ts — pages par profil (plan marketing) : la tâche du client, sa douleur, le gain promis
// et la première action qui lui donne une victoire rapide.
export type Profil = {
  id: string; titre: string; eyebrow: string; h1: [string, string]; lead: string
  douleurs: { t: string; d: string }[]; gains: string[]
  activation: { t: string; d: string; href: string; cta: string }
  offre: { nom: string; pourquoi: string; href: string }
  preuves: { href: string; t: string }[]
}

export const PROFILS_PAGES: Profil[] = [
  {
    id: 'pme', titre: 'PME importatrices', eyebrow: 'Dirigeants et acheteurs de PME',
    h1: ['Votre importation coûte plus cher', 'que votre facture.'],
    lead: 'Droits, TVA, fret, magasinage, change : le coût rendu réel se découvre souvent après la commande. Import-eXPert le chiffre avant, avec les documents à réunir, sans dépendre de votre transitaire pour savoir ce que vous payez.',
    douleurs: [
      { t: 'Une marge fausse sur toute la gamme', d: 'Le prix de vente est fixé sur le prix d’achat plus un forfait. Les droits réels, la TIC, les surestaries et le change n’y sont pas.' },
      { t: 'Un code SH hérité', d: '« On a toujours déclaré sous ce code. » La DUM est passée, cela ne prouve pas que le code est juste : la responsabilité du déclarant court jusqu’à la prescription.' },
      { t: 'Des jours perdus au port', d: 'Un document manquant, une licence oubliée, un contrôle technique : chaque jour d’attente a un prix.' },
    ],
    gains: ['Le coût rendu au dirham près, avant de commander', 'La liste des documents et autorisations, par code SH', 'Une fiche produit défendable, datée et sourcée'],
    activation: { t: 'Votre première victoire : un coût de revient complet', d: 'Prenez votre prochaine commande et calculez son coût rendu réel, droits et frais compris. Puis créez la fiche produit de l’article principal.', href: '/diagnostic', cta: 'Commencer par le diagnostic' },
    offre: { nom: 'Pro', pourquoi: 'Qualifier, chiffrer et exécuter vos importations, fiches sans limite et veille sur vos produits.', href: '/tarifs' },
    preuves: [{ href: '/demo/fiche-produit', t: 'Voir une fiche produit' }, { href: '/produits', t: 'Droits par produit' }],
  },
  {
    id: 'transitaire', titre: 'Transitaires et commissionnaires', eyebrow: 'Transitaires, commissionnaires, déclarants',
    h1: ['Plus de dossiers,', 'moins de reprises.'],
    lead: 'Vos clients arrivent avec des informations incomplètes, et c’est votre agrément qui est exposé. Import-eXPert vous donne une fiche produit partagée avec chaque client, les pièces demandées et l’avancement, à votre nom.',
    douleurs: [
      { t: 'Une responsabilité engagée sur les informations des autres', d: 'Classement, valeur, origine : vous déclarez sur la base de ce que le client vous transmet.' },
      { t: 'Des allers-retours sans fin', d: 'La pièce manquante se découvre à l’arrivée du navire, par téléphone ou par WhatsApp, sans trace.' },
      { t: 'Un service difficile à facturer', d: 'Le conseil en amont est attendu, rarement rémunéré.' },
    ],
    gains: ['Un portail clients à votre nom : fiche partagée, pièces demandées, statut en 5 étapes', 'Une DUM vérifiée avant dépôt', 'Un service à valeur ajoutée à refacturer à vos clients'],
    activation: { t: 'Votre première victoire : un dossier client partagé', d: 'Créez la fiche produit d’un client, ouvrez son dossier dans le portail et envoyez-lui le lien : il voit les pièces attendues et l’avancement.', href: '/auth/register?plan=premium', cta: 'Essai 14 jours' },
    offre: { nom: 'Premium', pourquoi: 'Les 5 espaces, 120 références suivies, le portail clients et 24 renseignements experts par an, soit 36 000 DH HT de valeur au tarif à l’acte.', href: '/tarifs' },
    preuves: [{ href: '/profils/prescripteurs', t: 'Programme partenaires' }, { href: '/demo/fiche-produit', t: 'Voir une fiche produit' }],
  },
  {
    id: 'industriel', titre: 'Industriels sous régimes économiques', eyebrow: 'Importateurs industriels, admission temporaire, entrepôt',
    h1: ['Votre régime économique', 'est une dette en sursis.'],
    lead: 'Admission temporaire, perfectionnement actif, entrepôt : les droits suspendus redeviennent exigibles si l’apurement dérape. Import-eXPert suit vos régimes, sécurise l’origine et prépare la trajectoire OEA.',
    douleurs: [
      { t: 'Des comptes échus sans que personne ne le voie', d: 'Le suivi est manuel et dispersé ; la garantie reste bloquée et la suspension se transforme en dette.' },
      { t: 'Une origine accordée puis remise en cause', d: 'La préférence est accordée à la déclaration et peut être contestée lors d’un contrôle a posteriori.' },
      { t: 'Le savoir d’une seule personne', d: 'Si le responsable import part demain, que reste-t-il du dossier ?' },
    ],
    gains: ['Les droits suspendus maîtrisés, régime par régime', 'Un référentiel produit audité, opposable en contrôle', 'Une trajectoire OEA préparée étape par étape'],
    activation: { t: 'Votre première victoire : le diagnostic complet', d: 'Huit domaines, une exposition chiffrée en dirhams et un plan d’action ; puis le comparateur de régimes sur votre flux principal.', href: '/diagnostic', cta: 'Mesurer mon exposition' },
    offre: { nom: 'Premium ou Entreprise', pourquoi: 'Audit douanier, risques, régimes économiques et accompagnement d’un expert.', href: '/tarifs' },
    preuves: [{ href: '/kits/pratiques/IXP_Kit02_Regimes_economiques.html', t: 'Kit Régimes économiques' }, { href: '/cas-types', t: 'Cas types' }],
  },
  {
    id: 'daf', titre: 'Directions financières', eyebrow: 'Directions financières et contrôle de gestion',
    h1: ['Les coûts d’import', 'que la comptabilité ne voit pas.'],
    lead: 'Redressements possibles sur quatre ans, préférences tarifaires non utilisées, coût rendu sous-estimé : l’exposition douanière n’apparaît dans aucun tableau de bord. Import-eXPert la chiffre, et mesure aussi l’argent récupérable.',
    douleurs: [
      { t: 'Une provision impossible à estimer', d: 'En 2025, l’administration a redressé 23,5 milliards de dirhams au titre de la sous-facturation, en hausse de 33 %.' },
      { t: 'De l’argent laissé sur la table', d: 'Des droits payés sur des produits originaires de pays liés au Maroc par un accord.' },
      { t: 'Une marge faussée', d: 'Le coût rendu réel n’est pas celui retenu pour fixer les prix.' },
    ],
    gains: ['Une exposition chiffrée en dirhams pour le comité de direction', 'Le gain préférentiel mesuré, pas supposé', 'Un rapport mensuel qui arrive sans se connecter'],
    activation: { t: 'Votre première victoire : l’argent laissé sur la table', d: 'Chargez l’export de vos déclarations : en une minute, les droits récupérables et les taux à risque. Vos montants restent dans votre navigateur.', href: '/calculateur-dum', cta: 'Analyser mes DUM' },
    offre: { nom: 'Entreprise', pourquoi: 'Pilotage de l’exposition du groupe, rapport au comité de direction et revue annuelle par un expert.', href: '/contact?sujet=entreprise' },
    preuves: [{ href: '/barometre', t: 'Baromètre 2026' }, { href: '/diagnostic', t: 'Diagnostic de conformité' }],
  },
  {
    id: 'prescripteurs', titre: 'Partenaires et prescripteurs', eyebrow: 'Transitaires, experts-comptables, banques, CCI, fédérations',
    h1: ['Offrez le diagnostic', 'à vos clients, sous votre nom.'],
    lead: 'Vos clients importateurs vous demandent conseil sur des sujets douaniers qui ne sont pas votre cœur de métier. Avec le programme partenaires, vous leur offrez le diagnostic de conformité sous votre nom.',
    douleurs: [
      { t: 'Des questions hors de votre spécialité', d: 'Classement, origine, valeur : vos clients attendent une réponse, vous n’êtes pas douanier.' },
      { t: 'Un risque que vos clients ne voient pas', d: 'L’erreur se découvre deux à quatre ans plus tard, lors d’un contrôle a posteriori.' },
    ],
    gains: ['Un lien « diagnostic offert par … » à votre nom', 'Les comptes créés depuis votre lien vous sont rattachés pendant 90 jours', 'Des conditions de partenariat définies avec vous, sur demande'],
    activation: { t: 'Recevoir votre lien partenaire', d: 'Écrivez-nous : nous créons votre lien et vous transmettons les conditions du programme.', href: '/contact?sujet=partenaire', cta: 'Devenir partenaire' },
    offre: { nom: 'Programme partenaires', pourquoi: 'Lien à votre nom, suivi des comptes rattachés ; conditions sur demande.', href: '/contact?sujet=partenaire' },
    preuves: [{ href: '/diagnostic', t: 'Voir le diagnostic' }, { href: '/calculateur-dum', t: 'Calculateur DUM' }],
  },
]
