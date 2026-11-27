// lib/langues.ts — deux interfaces, française et arabe, selon la langue choisie par le visiteur.
// Le choix est gardé dans un cookie ; le middleware renvoie ensuite chaque page vers son équivalent
// dans la langue choisie, quand il existe. Les robots (sans cookie) voient chaque page telle quelle.

export type Langue = 'fr' | 'ar'
export const COOKIE_LANGUE = 'ixp_lang'

// Pages disponibles dans les deux langues : [français, arabe]
export const EQUIVALENTS: [string, string][] = [
  ['/', '/ar'],
  ['/tarifs', '/ar/tarifs'],
  ['/diagnostic', '/ar/diagnostic'],
  ['/tools/diagnostic-conformite.html', '/tools/diagnostic-conformite-ar.html'],
  ['/tools/enquete-barometre.html', '/tools/enquete-barometre-ar.html'],
  ['/auth/register', '/ar/inscription'],
  ['/contact', '/ar/contact'],
  ['/echange-expert', '/ar/echange-expert'],
]

// Rubriques disponibles dans les deux langues, page par page : [préfixe français, préfixe arabe]
export const PREFIXES_EQUIVALENTS: [string, string][] = [
  ['/espaces/bibliotheque/textes', '/ar/bibliotheque/textes'],
]

const sansSlashFinal = (p: string) => (p.length > 1 ? p.replace(/\/+$/, '') : p)

/** Équivalent d'une page dans l'autre langue, ou null s'il n'existe pas. */
export function equivalent(chemin: string, vers: Langue): string | null {
  const p = sansSlashFinal(chemin.split(/[?#]/)[0] || '/')
  const ligne = EQUIVALENTS.find(([fr, ar]) => (vers === 'ar' ? fr === p : ar === p))
  if (ligne) return vers === 'ar' ? ligne[1] : ligne[0]
  for (const [fr, ar] of PREFIXES_EQUIVALENTS) {
    const de = vers === 'ar' ? fr : ar, vers_ = vers === 'ar' ? ar : fr
    if (p === de || p.startsWith(de + '/')) return vers_ + p.slice(de.length)
  }
  return null
}

export function estArabe(chemin: string): boolean {
  const p = sansSlashFinal(chemin.split(/[?#]/)[0] || '/')
  return p === '/ar' || p.startsWith('/ar/') || EQUIVALENTS.some(([, ar]) => ar === p)
}

/** Lien du sélecteur de langue : enregistre le choix puis ouvre la page équivalente (ou l'accueil). */
export function lienLangue(vers: Langue, cheminActuel: string): string {
  const cible = equivalent(cheminActuel, vers) || (vers === 'ar' ? '/ar' : '/')
  return `/api/langue?l=${vers}&r=${encodeURIComponent(cible)}`
}
