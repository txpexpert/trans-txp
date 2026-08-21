// lib/ingestCirculaireSchemaV2.ts
// ─────────────────────────────────────────────────────────────────────────────
// Ingestion des circulaires déjà structurées en JSON (schéma v2) par le projet
// Claude dédié — 1 chunk = 1 article, métadonnées complètes (statut, domaine,
// abroge_ou_modifie...). Ne fait AUCUN re-chunking : respecte le découpage
// déjà fait à la génération.
//
// ⚠️ PRÉREQUIS : exécuter migration_schema_v2.sql dans Supabase avant utilisation
// (colonnes statut/domaine/sous_domaine/article/mots_cles/regime_douanier/
// nc8_concerne/abroge_ou_modifie/modifie_par/date_fin_validite/langue/emetteur).
// ─────────────────────────────────────────────────────────────────────────────

import { supabase, embedText } from './supabase'
import { validateCirculaireDocument, type CirculaireDocument } from './circulaireSchemaV2'

export interface ImportOneResult {
  numero: string
  status: 'inserted' | 'skipped_doublon' | 'rejected_invalide' | 'error'
  errors?: string[]
  warnings?: string[]
}

export async function ingestCirculaireSchemaV2(
  raw: unknown,
  source: string
): Promise<ImportOneResult> {
  const validation = validateCirculaireDocument(raw)
  const numero = (raw as any)?.circulaire?.numero ?? '?'

  if (!validation.valid) {
    return { numero, status: 'rejected_invalide', errors: validation.errors, warnings: validation.warnings }
  }

  const doc = raw as CirculaireDocument
  const { numero: n, date, objet, emetteur, statut, abroge_ou_modifie, modifie_par, date_fin_validite, langue } = doc.circulaire

  const { data: existing } = await supabase.from('circulaires').select('id').eq('numero', n).single()
  if (existing) {
    return { numero: n, status: 'skipped_doublon', warnings: validation.warnings }
  }

  const texteIntegral = doc.chunks.map(c => c.content).join('\n\n')

  const { data: circ, error: circError } = await supabase
    .from('circulaires')
    .insert({
      numero: n, titre: objet, objet, date, texte: texteIntegral, source,
      emetteur, statut, abroge_ou_modifie, modifie_par, date_fin_validite, langue,
    })
    .select('id').single()

  if (circError || !circ) {
    return { numero: n, status: 'error', errors: [circError?.message ?? 'insert circulaire échoué'] }
  }

  const chunkErrors: string[] = []
  for (const chunk of doc.chunks) {
    const embedding = await embedText(chunk.content)
    const { error: chunkError } = await supabase.from('circulaires_chunks').insert({
      circulaire_id: circ.id,
      numero: n,
      chunk_index: chunk.metadata.chunk_index,
      contenu: chunk.content,
      embedding,
      statut: chunk.metadata.statut,
      domaine: chunk.metadata.domaine,
      sous_domaine: chunk.metadata.sous_domaine ?? null,
      article: chunk.metadata.article,
      mots_cles: chunk.metadata.mots_cles ?? [],
      regime_douanier: chunk.metadata.regime_douanier ?? null,
      nc8_concerne: chunk.metadata.nc8_concerne ?? null,
    })
    if (chunkError) chunkErrors.push(`chunk ${chunk.metadata.chunk_index}: ${chunkError.message}`)
  }

  // Mise à jour rétroactive du texte abrogé, si déjà en base (cf. règle stricte :
  // abroge_ou_modifie n'est rempli par le projet Claude que sur formule explicite).
  if (abroge_ou_modifie && abroge_ou_modifie.length > 0) {
    for (const targetNumero of abroge_ou_modifie) {
      const { data: target } = await supabase.from('circulaires').select('id').eq('numero', targetNumero).single()
      if (target) {
        await supabase.from('circulaires').update({ statut: 'abroge', modifie_par: n, date_fin_validite: date }).eq('id', target.id)
        await supabase.from('circulaires_chunks').update({ statut: 'abroge' }).eq('numero', targetNumero)
      }
    }
  }

  return {
    numero: n,
    status: 'inserted',
    warnings: validation.warnings,
    ...(chunkErrors.length > 0 ? { errors: chunkErrors } : {}),
  }
}

export async function ingestCirculairesSchemaV2Batch(
  rawEntries: unknown[],
  source: string
): Promise<ImportOneResult[]> {
  const results: ImportOneResult[] = []
  for (const raw of rawEntries) {
    results.push(await ingestCirculaireSchemaV2(raw, source))
  }
  return results
}
