// lib/textesOfficiels.ts — Bibliothèque, module « Textes officiels » (côté serveur uniquement).
// Appelle les fonctions Supabase existantes avec la clé service :
//  - rechercher_textes(q, nb) : recherche par numéro ou par mots du titre (sans accents) ;
//  - texte_integral(p_numero) : texte recomposé dans l'ordre à partir des morceaux.
// Ne jamais importer depuis un composant React : le texte complet ne doit quitter le serveur
// que pour un abonné (contrôle fait dans getServerSideProps, voir components/TextesOfficiels.tsx).
import { supabaseAdmin } from './supabaseAdmin'
import { candidatsNumero, lienTexte, normNumero } from './textesLiens'

export type ResultatTexte = { numero: string; titre: string | null; type_document: string | null; date_document: string | null; nb_chunks: number }
export type TexteIntegral = ResultatTexte & { emetteur: string | null; statut: string | null; total_chunks: number | null; complet: boolean; texte: string }

export async function rechercherTextes(q: string, nb = 20): Promise<ResultatTexte[]> {
  const query = String(q || '').trim().slice(0, 120)
  if (!query) return []
  const { data, error } = await supabaseAdmin().rpc('rechercher_textes', { q: query, nb })
  if (error) throw new Error(error.message)
  return (data || []) as ResultatTexte[]
}

export async function texteIntegral(numero: string): Promise<TexteIntegral | null> {
  const { data, error } = await supabaseAdmin().rpc('texte_integral', { p_numero: numero })
  if (error) throw new Error(error.message)
  const t = (data || [])[0] as TexteIntegral | undefined
  return t && t.numero ? t : null
}

/** Texte désigné par un segment d'URL (6165-313 → 6165/313 ; 1-77-339 reste tel quel). */
export async function texteParSegment(segment: string): Promise<TexteIntegral | null> {
  for (const n of candidatsNumero(segment)) {
    const t = await texteIntegral(n)
    if (t) return t
  }
  return null
}

/**
 * Liens vers les textes disponibles dans la Bibliothèque, pour une liste de numéros cités
 * (décisions de classement, réponses de l'assistant). Un seul aller-retour en base ; les
 * numéros absents de la Bibliothèque ne reçoivent pas de lien.
 */
export async function liensTextes(numeros: string[], ar = false): Promise<Record<string, string>> {
  const voulus = Array.from(new Set(numeros.map(n => String(n || '').trim()).filter(Boolean))).slice(0, 20)
  if (!voulus.length) return {}
  try {
    const variantes = Array.from(new Set(voulus.flatMap(n => [n, n.replace(/\s+/g, '')])))
    const { data, error } = await supabaseAdmin().from('knowledge_chunks').select('numero').in('numero', variantes).limit(500)
    if (error) throw new Error(error.message)
    const presents = new Map<string, string>()
    for (const r of (data || []) as { numero: string }[]) presents.set(normNumero(r.numero), r.numero)
    const out: Record<string, string> = {}
    for (const n of voulus) {
      const trouve = presents.get(normNumero(n))
      if (trouve) out[n] = lienTexte(trouve, ar)
    }
    return out
  } catch (e: any) {
    console.error('[textes/liens]', e?.message || e) // non bloquant : la réponse s'affiche sans liens
    return {}
  }
}
