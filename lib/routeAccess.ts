/**
 * lib/routeAccess.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Config de contrôle d'accès pour middleware.ts.
 * FREE_PATHS : pages toujours ouvertes, sans compte.
 * pathToModuleCode : convertit une URL en code module pour canAccessModule().
 * Remplace l'ancien lib/access-control.ts (basé sur Supabase Auth, abandonné).
 */

export const FREE_PATHS = [
  // Pages structurelles — indispensables, jamais bloquées
  '/',
  '/abonnements',
  '/abonnement-requis',
  '/auth/login',
  '/auth/register',
  '/contact',
  '/a-propos',
  '/mobile',

  // Vitrine refonte 2026 : pages publiques de présentation de la suite
  '/plateforme',
  '/tarifs',
  '/expertise',
  '/espaces/qualifier',
  '/espaces/optimiser',
  '/espaces/chiffrer',
  '/espaces/executer',
  '/espaces/securiser',
  '/espaces/bibliotheque',
  '/espaces/piloter',
  '/diagnostic',
  '/enquete',
  '/tools/enquete-barometre.html',
  '/tools/diagnostic-conformite.html',
  // Kits opérationnels téléchargeables (démo : accès libre, à arbitrer)
  '/kits/Kit01_Origine_preferentielle_ALE.html',
  '/kits/Kit02_Regimes_suspensifs_economiques.html',
  '/kits/Kit03_Classement_SH_controle_a_posteriori.html',
  '/kits/Kit04_Pack_conformite_integral.html',
  // Kits pratiques (page Présentation) : consultation et téléchargement libres
  '/kits/pratiques/IXP_Kit01_Origine_ALE.html',
  '/kits/pratiques/IXP_Kit02_Regimes_economiques.html',
  '/kits/pratiques/IXP_Kit03_Classement_SH.html',
  '/kits/pratiques/IXP_Kit04_Pack_conformite.html',
  '/kits/pratiques/IXP_Kit05_Commerce_exterieur.html',
  '/kits/pratiques/IXP_Kit06_Regime_de_change.html',
  '/kits/pratiques/IXP_Kit07_Logistique.html',

  // Pages légales / conformité stores — doivent rester accessibles sans
  // compte pour les reviewers Google Play et les visiteurs anonymes
  // (Data safety / Privacy policy / Delete account declarations).
  '/politique-confidentialite.html',
  '/suppression-compte.html',
  '/politique-confidentialite', // page Next.js (pages/politique-confidentialite.tsx) — sans .html, distincte du fichier statique ci-dessus

  // Pages légales / consentement à l'inscription (CGU + confidentialité,
  // liées depuis le formulaire d'inscription — doivent être consultables
  // par un visiteur qui n'a pas encore de compte, avant de s'inscrire).
  '/cgu',
  '/confidentialite',

  // Vitrines/démos marketing — choix assumé : aperçu de fonctionnalités
  // Pro/Premium en accès libre pour convaincre. Changement futur possible
  // mais rare — si le module est retiré des plans payants, le retirer ici.
  '/tools/carte-bureauxdouaniers.html',
  '/modules/conseil',
  '/modules/export',
  '/tools/douane-engineering.html',
  '/modules/index-commerce',
  '/tools/mondoscope-veillestrategique.html',
  '/tools/Substances-dangereuses.html',
  '/tools/marquage-warnings.html',
  '/tools/transit-doc-generator.html',
  '/tools/glossaire-douanier.html',

  '/modules/analyses',

  '/tools/alertes-fiscales.html',
  '/modules/contentieux',
  '/modules/veille-reglementaire',
  '/tools/surestaries.html',
]

/**
 * Convertit un chemin d'URL en code module pour canAccessModule().
 * /modules/{code}      → code
 * /tools/{fichier}.ext → fichier (sans extension, en minuscules)
 * Tout le reste (backoffice, pages inconnues...) → null : ces routes ne
 * sont pas gérées par cette matrice et suivent une politique par défaut
 * (voir middleware.ts).
 */
export function pathToModuleCode(pathname: string): string | null {
  if (pathname.startsWith('/modules/')) {
    return pathname.replace(/^\/modules\//, '').replace(/\/$/, '')
  }
  if (pathname.startsWith('/tools/')) {
    const file = pathname.replace(/^\/tools\//, '')
    return file.replace(/\.[a-zA-Z0-9]+$/, '').toLowerCase()
  }
  return null
}
