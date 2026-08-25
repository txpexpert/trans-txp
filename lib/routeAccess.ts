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

  // Vitrines/démos marketing — choix assumé : aperçu de fonctionnalités
  // Pro/Cabinet en accès libre pour convaincre. Changement futur possible
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
