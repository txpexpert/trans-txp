// lib/kitsPratiques.ts — source unique des kits pratiques, utilisée par
// la page Présentation (/plateforme#kits) et la page Expertise (/expertise#kits).
// Fichiers HTML autonomes dans public/kits/pratiques/ : consultables en ligne et téléchargeables.
// `complet` : kit interactif complet (outils, calculateurs, modèles) dans public/kits/, quand il existe.
export type KitPratique = {
  num: string
  titre: string
  resume: string
  detail: string
  fichier: string
  complet?: string
}

export const KITS_PRATIQUES: KitPratique[] = [
  { num: '01', titre: 'Origine préférentielle et ALE', resume: 'Règles d’origine, preuves, vérifications a posteriori.',
    detail: 'Quel accord, quelle preuve, quelle règle d’origine : assistant de choix, calculateur d’origine, fiche d’origine, suivi des preuves et check-lists.',
    fichier: 'IXP_Kit01_Origine_ALE.html', complet: 'Kit01_Origine_preferentielle_ALE.html' },
  { num: '02', titre: 'Régimes suspensifs et économiques', resume: 'ATPA, entrepôt, admission temporaire, cautionnement.',
    detail: 'Choix du régime, échéances et apurement des comptes, facilités de cautionnement, modèles d’engagement et de mandat.',
    fichier: 'IXP_Kit02_Regimes_economiques.html', complet: 'Kit02_Regimes_suspensifs_economiques.html' },
  { num: '03', titre: 'Classement SH et contrôle a posteriori', resume: 'Classement tarifaire, décisions anticipées, contrôle.',
    detail: 'Arbre de décision RGI, fiche et registre de classement, décisions anticipées, délais du contrôle et conduite à tenir.',
    fichier: 'IXP_Kit03_Classement_SH.html', complet: 'Kit03_Classement_SH_controle_a_posteriori.html' },
  { num: '04', titre: 'Pack conformité intégral', resume: 'Programme de conformité piloté, trajectoire OEA.',
    detail: 'Maturité de la fonction import, plan de déploiement en 90 jours, matrice des responsabilités, contrôles clés et tableau de bord.',
    fichier: 'IXP_Kit04_Pack_conformite.html', complet: 'Kit04_Pack_conformite_integral.html' },
  { num: '05', titre: 'Commerce extérieur', resume: 'Loi 91-14, licences, normes, défense commerciale.',
    detail: 'Liberté des importations et ses exceptions : licences, normes obligatoires, contrôles techniques, mesures de défense commerciale.',
    fichier: 'IXP_Kit05_Commerce_exterieur.html' },
  { num: '06', titre: 'Régime de change', resume: 'IGOC 2026, règlement des importations, rapatriement.',
    detail: 'Instruction générale des opérations de change 2026 : règlement des importations, délais, engagements et rapatriement.',
    fichier: 'IXP_Kit06_Regime_de_change.html' },
  { num: '07', titre: 'Logistique internationale', resume: 'Incoterms, transport, surestaries, zones franches.',
    detail: 'Incoterms et répartition des coûts, choix du transport, surestaries et pénalités, zones franches et plateformes logistiques.',
    fichier: 'IXP_Kit07_Logistique.html' },
]

const NOMBRES = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix']
/** « Sept kits », « Huit kits »… calculé à partir de la liste. */
export const nbKitsEnLettres = () => {
  const n = KITS_PRATIQUES.length
  const w = NOMBRES[n] ?? String(n)
  return w.charAt(0).toUpperCase() + w.slice(1)
}

export const kitHref = (k: KitPratique) => `/kits/pratiques/${k.fichier}`
export const kitCompletHref = (k: KitPratique) => (k.complet ? `/kits/${k.complet}` : null)
