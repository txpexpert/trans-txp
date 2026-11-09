// lib/accords.ts
// ─────────────────────────────────────────────────────────────────────────────
// Accords préférentiels du Maroc — source unique des cartes de /accords.
// Chaque fiche renvoie vers sa page détaillée /accords/{slug}, servie depuis
// public/tools/accords/{slug}.html (réécriture dans next.config.js).
// Mettre à jour `maj` et `actu` à chaque nouvelle circulaire intégrée.
// ─────────────────────────────────────────────────────────────────────────────

export type Accord = {
  slug: string
  partenaire: string
  code: string            // code pays affiché en pastille
  nature: string          // type d'accord
  signature: string
  vigueur: string
  circulaires: string[]   // circulaires de base et d'origine
  preuve: string          // preuve d'origine à l'importation au Maroc
  actu: string            // dernière évolution notable
  maj: string             // date de mise à jour de la fiche
  unilateral?: boolean
}

export const MAJ_ACCORDS = '9 novembre 2026'

export const ACCORDS: Accord[] = [
  {
    slug: 'ue', partenaire: 'Union européenne', code: 'UE',
    nature: 'Accord d’association',
    signature: 'Bruxelles, 26 février 1996', vigueur: '1er mars 2000',
    circulaires: ['4978/233 (2005)', '6706/233 (CRR, 31/12/2025)', '6777/222 (accord agricole, 29/09/2026)'],
    preuve: 'EUR.1 ou déclaration d’origine (CRR depuis le 1er janvier 2026)',
    actu: 'Contingents agricoles du 1er octobre 2026 au 30 septembre 2027 ; preuves sans mention « REVISED RULES » recevables.',
    maj: MAJ_ACCORDS,
  },
  {
    slug: 'royaume-uni', partenaire: 'Royaume-Uni', code: 'UK',
    nature: 'Accord d’association',
    signature: 'Londres, 26 octobre 2019', vigueur: '1er janvier 2021 (application provisoire)',
    circulaires: ['6139/222 (31/12/2020)', '6705/222 (contingents 2026)', '6758/233 (origine, 07/07/2026)'],
    preuve: 'EUR.1, EUR-MED ou déclaration sur facture (Protocole n° 4)',
    actu: 'Décision n° 01/2026 : cumul élargi (UE, AELE, Turquie, Agadir) et transport direct assoupli.',
    maj: MAJ_ACCORDS,
  },
  {
    slug: 'etats-unis', partenaire: 'États-Unis', code: 'US',
    nature: 'Accord de libre-échange',
    signature: 'Washington, 15 juin 2004', vigueur: '1er janvier 2006',
    circulaires: ['4977/222 (30/12/2005)', '5562/222 (2015)', '6705/222 (contingents 2026)'],
    preuve: 'Pas de certificat : l’importateur revendique l’origine et la justifie sur demande',
    actu: 'À l’export vers les États-Unis : droit additionnel de 12,5 % (Section 301) depuis le 24 juillet 2026, ALE compris.',
    maj: MAJ_ACCORDS,
  },
  {
    slug: 'turquie', partenaire: 'Türkiye', code: 'TR',
    nature: 'Accord de libre-échange',
    signature: 'Avril 2004', vigueur: '1er janvier 2006',
    circulaires: ['6706/233 (CRR, 31/12/2025)', '6722/233 (preuves, 10/02/2026)'],
    preuve: 'EUR.1 ou déclaration d’origine (CRR depuis le 1er janvier 2026)',
    actu: 'Antidumping en vigueur sur les fours électriques et les fils galvanisés turcs ; nouveaux formats d’exportateur agréé.',
    maj: MAJ_ACCORDS,
  },
  {
    slug: 'chine', partenaire: 'Chine', code: 'CN',
    nature: 'Régime préférentiel unilatéral (tarif zéro chinois)',
    signature: 'Annonce du 14 février 2026', vigueur: '1er mai 2026 – 30 avril 2028',
    circulaires: ['Annonce de la Commission tarifaire du Conseil des affaires d’État (28/04/2026)'],
    preuve: 'Certificat d’origine marocain ; règles d’origine chinoises à vérifier',
    actu: 'Concerne les exportations marocaines vers la Chine ; à l’import au Maroc, les produits chinois restent au droit commun.',
    maj: MAJ_ACCORDS, unilateral: true,
  },
]

export const accordBySlug = (s: string) => ACCORDS.find(a => a.slug === s)
