// lib/risques.ts
// ─────────────────────────────────────────────────────────────────────────────
// Risques et litiges : source unique des cartes de /risques.
// Chaque fiche renvoie vers sa page détaillée /risques/{slug}, servie depuis
// public/tools/risques/{slug}.html (réécriture dans next.config.js).
// Mettre à jour `actu` et MAJ_RISQUES à chaque nouveau texte intégré.
// ─────────────────────────────────────────────────────────────────────────────

export type FicheRisque = {
  slug: string
  code: string            // pastille
  titre: string
  nature: string
  textes: string          // textes de base
  autorites: string
  delais: string          // délais critiques
  sanctions: string       // ordre de grandeur des sanctions
  actu: string            // dernière évolution notable
  langue?: string         // si la fiche n'est pas en français
}

export const MAJ_RISQUES = '9 novembre 2026'

export const RISQUES: FicheRisque[] = [
  {
    slug: 'commerce-exterieur', code: 'CE',
    titre: 'Ce qui déclenche le contentieux du commerce extérieur',
    nature: 'Titres d’importation, licences, contingents, défense commerciale, conformité',
    textes: 'Lois 91-14, 15-09, 24-09 et 19-06',
    autorites: 'Commerce extérieur, Commerce (qualité), Office des changes, douane',
    delais: 'Droit antidumping provisoire possible 60 jours après l’ouverture d’enquête, rétroactif jusqu’à 90 jours',
    sanctions: 'Jusqu’à 1 000 000 DH et 2 ans (loi 24-09) ; droits additionnels recouvrés comme en douane',
    actu: 'Quatre arrêtés 2026 ont modifié la liste des licences ; antidumping définitif sur les fils galvanisés et le contreplaqué (septembre 2026).',
  },
  {
    slug: 'change', code: 'OC',
    titre: 'Contrôle des changes',
    nature: 'Domiciliation, règlement des importations, rapatriement des exportations, devises',
    textes: 'IGOC 2026, dahir du 30 août 1949, loi 19-06',
    autorites: 'Office des changes, banques domiciliataires, douane',
    delais: 'Rapatriement : 150 jours (biens), 90 jours (services) ; acompte import limité à 30 %',
    sanctions: 'Poursuites de change ; amende égale aux capitaux non déclarés à la frontière ; retrait des facilités',
    actu: 'IGOC 2026 en vigueur ; bordereaux de change SARF à code QR vérifiés aux frontières depuis juillet 2026.',
  },
  {
    slug: 'contentieux-douanier', code: 'DO',
    titre: 'Risques du contentieux douanier',
    nature: 'Infractions, sanctions, transaction, poursuites, recouvrement, prescription',
    textes: 'Code des douanes (art. 204 à 305), note générale D50/2021, loi 58.25',
    autorites: 'Administration des douanes, juridictions, juge de l’exécution',
    delais: 'Prescription 4 ans ; pourvoi en cassation 30 jours ; commissions consultatives 60 jours',
    sanctions: 'Délits : jusqu’à 3 ans et une fois la valeur ; contraventions : de 500 DH à des multiples des droits éludés',
    actu: 'Nouveau Code de procédure civile depuis le 24/08/2026 ; mémoires répressifs digitalisés dans BADR (septembre 2026).',
    langue: 'Fiche en arabe',
  },
  {
    slug: 'autorisations', code: 'AU',
    titre: 'Licences et autorisations préalables',
    nature: 'ONSSA, ANRT, normes obligatoires, AMMPS, NARSA, déchets, armes',
    textes: 'Arrêté 1308-94, lois 24-09, 28-07, 28-00, 10-20',
    autorites: 'Commerce, ONSSA, ANRT, AMMPS, NARSA, Développement durable',
    delais: 'Contre-analyse : 8 jours après un résultat non conforme',
    sanctions: 'Refoulement ou destruction ; jusqu’à 1 000 000 DH et 2 ans (loi 24-09)',
    actu: 'Normes obligatoires pour les produits alternatifs du tabac depuis le 20/02/2026 ; véhicules neufs : nouvelles règles NARSA.',
  },
]

export const risqueBySlug = (s: string) => RISQUES.find(r => r.slug === s)
