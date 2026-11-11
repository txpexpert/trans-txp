// lib/barometreAgregats.ts — agrégats du Baromètre (serveur). Aucune réponse individuelle n'est exposée.
import { supabaseAdmin } from './supabaseAdmin'
import { QUESTIONS, SEUIL_AGREGATS, SEUIL_PUBLICATION } from './barometre'

export type Agregats = { n: number; publie: boolean; seuil: number; resultats: Record<string, { n: number; cnt: number[] }> | null; maj: string }

export async function agregatsBarometre(edition = '2026'): Promise<Agregats> {
  const db = supabaseAdmin()
  const { count } = await db.from('barometre_reponses').select('id', { count: 'exact', head: true }).eq('edition', edition)
  const n = count ?? 0
  const base = { n, publie: n >= SEUIL_PUBLICATION, seuil: SEUIL_PUBLICATION, maj: new Date().toISOString() }
  if (n < SEUIL_AGREGATS) return { ...base, resultats: null }
  const { data } = await db.rpc('barometre_agregats', { p_edition: edition })
  const resultats: Record<string, { n: number; cnt: number[] }> = {}
  for (const q of QUESTIONS) resultats[q.id] = { n: 0, cnt: q.o.map(() => 0) }
  for (const r of (data ?? []) as any[]) {
    const x = resultats[r.question]; if (!x) continue
    x.n = Number(r.repondants)
    if (r.option_index >= 0 && r.option_index < x.cnt.length) x.cnt[r.option_index] = Number(r.nb)
  }
  return { ...base, resultats }
}
