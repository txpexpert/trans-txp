// lib/kitsPratiques.ts — les 7 kits pratiques présentés sur la page Présentation.
// Fichiers HTML autonomes dans public/kits/pratiques/ : consultables en ligne et téléchargeables.
export type KitPratique = { num: string; titre: string; resume: string; fichier: string }

export const KITS_PRATIQUES: KitPratique[] = [
  { num: '01', titre: 'Origine préférentielle et ALE', resume: 'Règles d’origine, preuves, vérifications a posteriori.', fichier: 'IXP_Kit01_Origine_ALE.html' },
  { num: '02', titre: 'Régimes suspensifs et économiques', resume: 'ATPA, entrepôt, admission temporaire, cautionnement.', fichier: 'IXP_Kit02_Regimes_economiques.html' },
  { num: '03', titre: 'Classement SH et contrôle a posteriori', resume: 'Classement tarifaire, décisions anticipées, contrôle.', fichier: 'IXP_Kit03_Classement_SH.html' },
  { num: '04', titre: 'Pack conformité intégral', resume: 'Programme de conformité piloté, trajectoire OEA.', fichier: 'IXP_Kit04_Pack_conformite.html' },
  { num: '05', titre: 'Commerce extérieur', resume: 'Loi 91-14, licences, normes, défense commerciale.', fichier: 'IXP_Kit05_Commerce_exterieur.html' },
  { num: '06', titre: 'Régime de change', resume: 'IGOC 2026, règlement des importations, rapatriement.', fichier: 'IXP_Kit06_Regime_de_change.html' },
  { num: '07', titre: 'Logistique internationale', resume: 'Incoterms, transport, surestaries, zones franches.', fichier: 'IXP_Kit07_Logistique.html' },
]

export const kitHref = (k: KitPratique) => `/kits/pratiques/${k.fichier}`
