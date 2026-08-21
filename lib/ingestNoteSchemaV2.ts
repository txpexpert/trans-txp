// lib/ingestNoteSchemaV2.ts
// ─────────────────────────────────────────────────────────────────────────────
// Ingestion des notes ADII (JSON produit par le projet Claude dédié, clé racine
// "note" au lieu de "circulaire" — c'est ce qui permet au serveur de distinguer
// une note d'une circulaire officielle sans champ à deviner). Cible notes_adii /
// notes_adii_chunks, séparées de circulaires / circulaires_chunks.
//
// Réutilise la même logique de validation que les circulaires (structure interne
// identique : numero, date, objet, statut, chunks...), juste sous une clé racine
// différente — pas de duplication de la logique de contrôle qualité.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase, embedText } from './ingestion'
import { validateCirculaireDocument, type CirculaireDocument } from './circulaireSchemaV2'
import type { ImportOneResult } from './ingestCirculaireSchemaV2'

export function isNoteDocument(raw: unknown): boolean {
  return typeof raw === 'object' && raw !== null && 'note' in raw && 'chunks' in (raw as Record<string, unknown>)
}

export async function ingestNoteSchemaV2(raw: unknown, source: string): Promise<ImportOneResult> {
  const asRaw = raw as Record<string, unknown>
  // Revêt la forme attendue par le validateur des circulaires (même structure
  // interne, clé racine différente) sans dupliquer la logique de contrôle.
  const reshaped = { circulaire: asRaw?.['note'], chunks: asRaw?.['chunks'] }
  const validation = validateCirculaireDocument(reshaped)
  const numero = (asRaw?.['note'] as Record<string, unknown> | undefined)?.['numero'] as string ?? '?'

  if (!validation.valid) {
    return { numero, status: 'rejected_invalide', errors: validation.errors, warnings: validation.warnings }
  }

  const doc = reshaped as CirculaireDocument
  const { numero: n, date, objet, emetteur, statut, abroge_ou_modifie, modifie_par, date_fin_validite, langue } = doc.circulaire

  const { data: existing } = await supabase.from('notes_adii').select('id').eq('numero', n).single()
  if (existing) {
    return { numero: n, status: 'skipped_doublon', warnings: validation.warnings }
  }

  const texteIntegral = doc.chunks.map(c => c.content).join('\n\n')

  const { data: note, error: noteError } = await supabase
    .from('notes_adii')
    .insert({
      numero: n, titre: objet, objet, date, texte: texteIntegral, source,
      emetteur, statut, abroge_ou_modifie, modifie_par, date_fin_validite, langue,
    })
    .select('id').single()

  if (noteError || !note) {
    return { numero: n, status: 'error', errors: [noteError?.message ?? 'insert note échoué'] }
  }

  const chunkErrors: string[] = []
  for (const chunk of doc.chunks) {
    const embedding = await embedText(chunk.content)
    const { error: chunkError } = await supabase.from('notes_adii_chunks').insert({
      note_id: note.id,
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

  // Mise à jour rétroactive si cette note abroge une note déjà en base (même
  // logique que les circulaires — reste dans notes_adii, pas de croisement
  // avec la table circulaires).
  if (abroge_ou_modifie && abroge_ou_modifie.length > 0) {
    for (const targetNumero of abroge_ou_modifie) {
      const { data: target } = await supabase.from('notes_adii').select('id').eq('numero', targetNumero).single()
      if (target) {
        await supabase.from('notes_adii').update({ statut: 'abroge', modifie_par: n, date_fin_validite: date }).eq('id', target.id)
        await supabase.from('notes_adii_chunks').update({ statut: 'abroge' }).eq('numero', targetNumero)
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

export async function ingestNotesSchemaV2Batch(rawEntries: unknown[], source: string): Promise<ImportOneResult[]> {
  const results: ImportOneResult[] = []
  for (const raw of rawEntries) {
    results.push(await ingestNoteSchemaV2(raw, source))
  }
  return results
}
