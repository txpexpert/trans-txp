// lib/ingestion.ts
// ─────────────────────────────────────────────────────────────────────────────
// Briques d'ingestion réutilisées par pages/api/ingest.ts :
// - client Supabase
// - chunking de texte long + embeddings OpenAI
// - une fonction d'insertion par type de contenu JSON (circulaires, faq,
//   tarifs, procedures, glossaire, decisions), avec déduplication simple.
// ─────────────────────────────────────────────────────────────────────────────

import OpenAI from 'openai'
import { supabase } from './supabase'

export { supabase }

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

// ─────────────────────────────────────────────────────────────────────────────
// CHUNKING + EMBEDDINGS
// ─────────────────────────────────────────────────────────────────────────────

// Découpe un texte long en morceaux d'environ `maxWords` mots, avec un léger
// chevauchement pour ne pas couper une idée en deux au milieu d'un chunk.
export function chunkText(text: string, maxWords = 300, overlap = 50): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return []

  const chunks: string[] = []
  let start = 0
  while (start < words.length) {
    const end = Math.min(start + maxWords, words.length)
    chunks.push(words.slice(start, end).join(' '))
    if (end === words.length) break
    start = end - overlap
  }
  return chunks
}

export async function embedText(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 30000),
    encoding_format: 'float',
  })
  return res.data[0].embedding
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS COMMUNS
// ─────────────────────────────────────────────────────────────────────────────

interface JsonIngestResult {
  inserted: number
  skipped: number
}

// Insère une entrée simple (sans chunking/embedding) dans une table, avec
// déduplication sur une colonne clé. Réutilisé par faq/tarifs/procedures/
// glossaire/decisions, qui sont de courtes fiches et non des textes longs.
async function insertSimpleEntries(
  table: string,
  dedupeColumn: string,
  entries: Record<string, unknown>[],
  mapRow: (entry: Record<string, unknown>) => Record<string, unknown> | null
): Promise<JsonIngestResult> {
  let inserted = 0
  let skipped = 0

  for (const entry of entries) {
    const row = mapRow(entry)
    if (!row) { skipped++; continue }

    const dedupeValue = row[dedupeColumn]
    if (dedupeValue !== undefined && dedupeValue !== null) {
      const { data: existing } = await supabase
        .from(table)
        .select('id')
        .eq(dedupeColumn, dedupeValue as string)
        .maybeSingle()
      if (existing) { skipped++; continue }
    }

    const { error } = await supabase.from(table).insert(row)
    if (error) {
      console.error(`[ingestion] insert error (${table}):`, error.message)
      skipped++
      continue
    }
    inserted++
  }

  return { inserted, skipped }
}

// ─────────────────────────────────────────────────────────────────────────────
// CIRCULAIRES — texte long, chunké et embedé, dédupliqué par "numero"
// ─────────────────────────────────────────────────────────────────────────────

export async function ingestCirculairesJSON(
  entries: Record<string, unknown>[],
  source: string
): Promise<JsonIngestResult> {
  let inserted = 0
  let skipped = 0

  for (const entry of entries) {
    const numero = String(entry.numero ?? '').trim()
    const titre  = String(entry.titre  ?? '').trim()
    const texte  = String(entry.texte  ?? '').trim()

    if (!numero || !titre || !texte) { skipped++; continue }

    const { data: existing } = await supabase
      .from('circulaires')
      .select('id')
      .eq('numero', numero)
      .maybeSingle()
    if (existing) { skipped++; continue }

    const { data: circ, error: circErr } = await supabase
      .from('circulaires')
      .insert({
        numero,
        titre,
        objet:  entry.objet ?? titre.slice(0, 200),
        date:   entry.date  ?? null,
        texte,
        source,
      })
      .select('id')
      .single()

    if (circErr || !circ) {
      console.error('[ingestion] circulaires insert error:', circErr?.message)
      skipped++
      continue
    }

    const chunks = chunkText(texte)
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await embedText(chunks[i])
      await supabase.from('circulaires_chunks').insert({
        circulaire_id: circ.id,
        numero,
        chunk_index: i,
        contenu: chunks[i],
        embedding,
      })
    }

    inserted++
  }

  return { inserted, skipped }
}

// ─────────────────────────────────────────────────────────────────────────────
// FAQ — fiches courtes, pas de chunking, dédupliquées par "question"
// ─────────────────────────────────────────────────────────────────────────────

export async function ingestFaqJSON(entries: Record<string, unknown>[]): Promise<JsonIngestResult> {
  return insertSimpleEntries('faq', 'question', entries, (e) => {
    const question = String(e.question ?? '').trim()
    const reponse  = String(e.reponse  ?? '').trim()
    if (!question || !reponse) return null
    return {
      question,
      reponse,
      categorie: e.categorie ?? null,
      tags:      e.tags ?? [],
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// TARIFS — dédupliqués par "code_sh"
// ─────────────────────────────────────────────────────────────────────────────

export async function ingestTarifsJSON(entries: Record<string, unknown>[]): Promise<JsonIngestResult> {
  return insertSimpleEntries('tarifs', 'code_sh', entries, (e) => {
    const code_sh     = String(e.code_sh     ?? '').trim()
    const designation = String(e.designation ?? '').trim()
    if (!code_sh || !designation) return null
    return {
      code_sh,
      designation,
      taux_di: e.taux_di ?? null,
      tva:     e.tva     ?? null,
      tic:     e.tic     ?? null,
      notes:   e.notes   ?? null,
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// PROCEDURES — dédupliquées par "code"
// ─────────────────────────────────────────────────────────────────────────────

export async function ingestProceduresJSON(entries: Record<string, unknown>[]): Promise<JsonIngestResult> {
  return insertSimpleEntries('procedures', 'code', entries, (e) => {
    const code  = String(e.code  ?? '').trim()
    const titre = String(e.titre ?? '').trim()
    const texte = String(e.texte ?? '').trim()
    if (!code || !titre || !texte) return null
    return {
      code,
      titre,
      texte,
      etapes: e.etapes ?? [],
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// GLOSSAIRE — dédupliqué par "terme"
// ─────────────────────────────────────────────────────────────────────────────

export async function ingestGlossaireJSON(entries: Record<string, unknown>[]): Promise<JsonIngestResult> {
  return insertSimpleEntries('glossaire', 'terme', entries, (e) => {
    const terme      = String(e.terme      ?? '').trim()
    const definition = String(e.definition ?? '').trim()
    if (!terme || !definition) return null
    return {
      terme,
      definition,
      domaine:    e.domaine    ?? null,
      synonymes:  e.synonymes  ?? [],
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// DECISIONS — dédupliquées par "reference" (ou "numero" en repli)
// ─────────────────────────────────────────────────────────────────────────────

export async function ingestDecisionsJSON(entries: Record<string, unknown>[]): Promise<JsonIngestResult> {
  return insertSimpleEntries('decisions', 'reference', entries, (e) => {
    const reference = String(e.reference ?? e.numero ?? '').trim()
    const titre     = String(e.titre      ?? '').trim()
    const texte     = String(e.texte      ?? '').trim()
    if (!reference || !titre || !texte) return null
    return {
      reference,
      titre,
      texte,
      date: e.date ?? null,
    }
  })
}
