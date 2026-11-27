// lib/textesLiens.ts — adresses des pages « Textes officiels » de la Bibliothèque.
// Sans dépendance serveur : importable depuis les composants comme depuis les routes API.
// Une adresse par texte : /espaces/bibliotheque/textes/<numero>, le « / » du numéro remplacé
// par « - » (6165/313 → 6165-313). Certains numéros contiennent déjà des tirets (dahirs,
// décrets : 1-77-339) : la page essaie d'abord le numéro tel quel, puis avec « - » → « / ».

export const CHEMIN_TEXTES = '/espaces/bibliotheque/textes'
export const CHEMIN_TEXTES_AR = '/ar/bibliotheque/textes'

/** Segment d'URL d'un numéro : « / » → « - », le reste encodé (espaces, « N° »…). */
export function slugNumero(numero: string): string {
  return encodeURIComponent(String(numero || '').trim().replace(/\//g, '-'))
}

/** Adresse de la page d'un texte. */
export function lienTexte(numero: string, ar = false): string {
  return `${ar ? CHEMIN_TEXTES_AR : CHEMIN_TEXTES}/${slugNumero(numero)}`
}

/** Numéros possibles derrière un segment d'URL, dans l'ordre où les essayer. */
export function candidatsNumero(segment: string): string[] {
  let s = String(segment || '')
  try { s = decodeURIComponent(s) } catch { /* segment déjà décodé */ }
  s = s.trim()
  if (!s) return []
  const out = [s]
  if (s.includes('-')) out.push(s.replace(/-/g, '/'))
  return out
}

/** Comparaison de numéros : sans espaces ni casse. */
export const normNumero = (s: string) => String(s || '').replace(/\s+/g, '').toLowerCase()

/** Numéro d'une circulaire tel qu'il figure dans une décision de classement (« Circulaire n° 5796/232 » → « 5796/232 »). */
export function numeroCirculaire(champ: string | null | undefined): string {
  return String(champ || '').replace(/^\s*circulaire\s*/i, '').replace(/^n\s*[°o]\s*/i, '').trim()
}

// Numéros de circulaires de l'ADII cités dans un texte : 6165/313, 5796/232…
const RE_NUMERO = /\b\d{3,5}\s?\/\s?\d{2,3}\b/g

/** Numéros de circulaires cités dans une réponse (sans doublons, 12 au plus). */
export function numerosCites(texte: string): string[] {
  const vus = new Set<string>()
  for (const m of String(texte || '').match(RE_NUMERO) || []) vus.add(m.replace(/\s+/g, ''))
  return Array.from(vus).slice(0, 12)
}

/** Découpe un texte en morceaux, les numéros présents dans `liens` devenant des liens. */
export function decouperAvecLiens(texte: string, liens: Record<string, string> | null | undefined): { t: string; href?: string }[] {
  if (!liens || !Object.keys(liens).length) return [{ t: texte }]
  const out: { t: string; href?: string }[] = []
  let dernier = 0
  for (const m of Array.from(String(texte).matchAll(RE_NUMERO))) {
    const href = liens[m[0].replace(/\s+/g, '')]
    if (!href || m.index === undefined) continue
    if (m.index > dernier) out.push({ t: texte.slice(dernier, m.index) })
    out.push({ t: m[0], href })
    dernier = m.index + m[0].length
  }
  if (dernier < texte.length) out.push({ t: texte.slice(dernier) })
  return out
}
