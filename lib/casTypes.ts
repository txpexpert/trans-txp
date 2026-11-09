// lib/casTypes.ts
// ─────────────────────────────────────────────────────────────────────────────
// Cas types : situations illustratives construites à partir des textes
// officiels indexés dans la base documentaire. Les entreprises sont fictives ;
// chaque mécanisme est rattaché au texte qui le fonde. Ne jamais les présenter
// comme des témoignages ou des clients réels.
// ─────────────────────────────────────────────────────────────────────────────

export type CasType = {
  slug: string
  domaine: string
  titre: string
  accroche: string
  situation: string
  ceQuiCoince: string
  consequence: string
  ceQueVoitIxp: string
  textes: { ref: string; objet: string }[]
  outils: { label: string; path: string }[]
}

export const CAS_TYPES: CasType[] = [
  {
    slug: 'redevance-oubliee',
    domaine: 'Valeur en douane',
    titre: 'La redevance de marque oubliée',
    accroche: 'La facture du fournisseur est juste. La valeur déclarée, elle, est incomplète.',
    situation:
      "Un distributeur importe des produits de marque. Il déclare le prix de la facture du fournisseur. En parallèle, il verse chaque trimestre une redevance au titulaire de la marque, prévue au contrat de licence comme condition pour acheter ces produits.",
    ceQuiCoince:
      "Les redevances et droits de licence que l'acheteur doit acquitter comme condition de la vente s'ajoutent au prix payé pour déterminer la valeur en douane, au même titre que les commissions, l'emballage, le transport et l'assurance jusqu'à la frontière. La redevance n'apparaît pas sur la facture : elle est oubliée à chaque déclaration.",
    consequence:
      "Les erreurs d'assiette peuvent être réparées jusqu'à l'expiration de la quatrième année. Un contrôle a posteriori peut donc reprendre quatre années d'importations en une fois. En cas de fraude, le délai ne court qu'à partir de la découverte.",
    ceQueVoitIxp:
      "La fiche produit signale le contrat de licence, et le module Valeur en douane passe en revue chaque élément à ajouter avant le dépôt de la DUM. La valeur déclarée est justifiée et datée dans le dossier.",
    textes: [
      { ref: 'Code des douanes et impôts indirects, art. 20 ter-1° c)', objet: 'Redevances et droits de licence à ajouter au prix payé' },
      { ref: 'Code des douanes et impôts indirects, art. 99 bis et 99 ter', objet: 'Prescription de quatre ans ; point de départ en cas de fraude' },
    ],
    outils: [
      { label: 'Valeur en douane', path: '/modules/valeur-douane' },
      { label: 'Vérifier vos documents d’import', path: '/modules/verificateur-dum' },
    ],
  },
  {
    slug: 'eur1-sans-cumul',
    domaine: 'Origine préférentielle',
    titre: 'Le certificat EUR.1 sans mention de cumul',
    accroche: 'La préférence est accordée au dédouanement. Elle se vérifie après.',
    situation:
      "Un importateur achète dans l'Union européenne des articles fabriqués à partir de matières d'un autre pays partenaire. Le fournisseur applique le cumul pour conférer l'origine préférentielle et joint un certificat EUR.1. Le droit préférentiel est accordé à l'importation.",
    ceQuiCoince:
      "Depuis les nouvelles règles d'origine, une preuve émise dans le cadre d'un cumul doit porter, en anglais, la mention « CUMULATION APPLIED WITH » suivie du nom des parties concernées, en case 7 de l'EUR.1 ou à la fin de la déclaration d'origine. Le certificat reçu ne la porte pas.",
    consequence:
      "L'administration dispose des adresses des autorités douanières des États membres pour le contrôle a posteriori des preuves d'origine. Si la preuve ne tient pas, la préférence peut être refusée et les droits du tarif commun redeviennent exigibles sur les opérations concernées.",
    ceQueVoitIxp:
      "Le module Origine vérifie la forme de la preuve (type, mentions, validité de 10 mois) avant l'opération, et la fiche produit conserve la preuve et l'analyse de l'origine pour la durée du contrôle possible.",
    textes: [
      { ref: 'Circulaire n° 6706/233 du 31/12/2025', objet: 'Règles d’origine UE, Turquie, Accord d’Agadir et AELE : preuves, mention de cumul, validité' },
      { ref: 'Note n° D105/2026/ADII/AC/100 du 30/04/2026', objet: 'Cachets EUR.1 et adresses pour le contrôle a posteriori des preuves d’origine' },
    ],
    outils: [
      { label: 'Origine ALECA / UE', path: '/modules/origine-aleca' },
      { label: 'Accords préférentiels', path: '/accords' },
    ],
  },
  {
    slug: 'piece-arrivee-trop-tot',
    domaine: 'Régimes économiques',
    titre: 'La pièce de rechange arrivée avant l’autorisation',
    accroche: 'Le régime existe. Encore faut-il l’avoir obtenu avant d’importer.',
    situation:
      "Une machine de production tombe en panne. L'industriel fait venir en urgence une pièce de remplacement, en prévoyant de renvoyer la pièce défectueuse au fournisseur dans le cadre d'un échange standard avec importation anticipée. La demande d'autorisation est déposée après l'arrivée de la pièce.",
    ceQuiCoince:
      "L'autorisation doit impérativement être accordée avant l'importation : aucune autorisation rétroactive n'est admise. L'importation anticipée est couverte par un acquit à caution (régime 323) et une garantie, avec l'engagement d'exporter la pièce défectueuse dans un délai de deux mois.",
    consequence:
      "Sans autorisation préalable, le régime ne peut pas s'appliquer à la pièce déjà importée : elle relève du régime commun, droits et taxes compris. Si l'engagement d'exportation n'est pas tenu dans le délai, la garantie est en jeu.",
    ceQueVoitIxp:
      "Le comparateur de régimes et le kit Régimes économiques posent les conditions préalables avant l'opération, et le dossier d'opération suit le délai d'apurement de deux mois.",
    textes: [
      { ref: 'Circulaire n° 5361/313 du 17/01/2013', objet: 'Échange standard avec importation anticipée : autorisation préalable, régime 323, délai de deux mois' },
      { ref: 'Circulaire n° 6348/313 du 06/07/2022', objet: 'Régimes économiques : opérations restant soumises à autorisation préalable' },
    ],
    outils: [
      { label: 'Comparateur de régimes', path: '/modules/comparateur' },
      { label: 'Régimes économiques', path: '/modules/regimes-economiques' },
    ],
  },
]
