// lib/tarifLibelle.ts
// Libellé complet d'une position tarifaire : on remonte les niveaux supérieurs
// du tarif (position à 4, 6, 8 et 9 chiffres) pour obtenir par exemple
// « Compteurs d'électricité › basse et moyenne tension › autres » au lieu de « autres ».
import type { SupabaseClient } from '@supabase/supabase-js'

const net = (s: string) => s.replace(/\s+/g, ' ').replace(/[\s:;,.]+$/, '').trim()

/** Codes des niveaux supérieurs possibles d'un code à 10 chiffres (du plus général au plus précis). */
export function codesParents(code: string): string[] {
  const c = code.replace(/[^0-9]/g, '')
  if (c.length !== 10) return []
  const out = [c.slice(0, 4) + '000000', c.slice(0, 6) + '0000', c.slice(0, 8) + '00', c.slice(0, 9) + '0']
  return Array.from(new Set(out)).filter(x => x !== c)
}

/** Ajoute `libelle_complet` à chaque ligne de tarif (une seule requête pour toutes les lignes). */
export async function ajouterLibellesComplets<T extends { code_sh: string; designation_clean: string | null }>(db: SupabaseClient, rows: T[]) {
  const parents = Array.from(new Set(rows.flatMap(r => codesParents(r.code_sh))))
  const map = new Map<string, string>()
  if (parents.length) {
    const { data } = await db.from('tarifs').select('code_sh, designation_clean').in('code_sh', parents)
    for (const p of data ?? []) if (p.designation_clean) map.set(p.code_sh, net(p.designation_clean))
  }
  return rows.map(r => {
    const niveaux = codesParents(r.code_sh).map(c => map.get(c)).filter(Boolean) as string[]
    const propre = net(r.designation_clean || '')
    // On évite les répétitions quand un niveau reprend le libellé du précédent
    const chaine: string[] = []
    for (const n of [...niveaux, propre]) if (n && chaine[chaine.length - 1]?.toLowerCase() !== n.toLowerCase()) chaine.push(n)
    return { ...r, libelle_complet: chaine.join(' › ') }
  })
}
