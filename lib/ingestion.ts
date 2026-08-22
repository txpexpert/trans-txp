// lib/ingestion.ts
// ─────────────────────────────────────────────────────────────────────────────
// Ingestion UNIVERSELLE vers la table knowledge_chunks.
// Un seul mécanisme d'entrée pour tous les documents à racine
// "circulaire" | "note" | "document" (circulaires, notes ADII, dépliants,
// brochures, dahirs, codes, instructions communes, etc.) — aucune logique
// spécifique par type de document. Les champs non reconnus comme colonnes
// de knowledge_chunks sont automatiquement rangés dans metadata_extra, au
// niveau document comme au niveau chunk.
//
// Les JSON "à entrées" (faq / tarifs / procedures / glossaire / decisions)
// restent traités séparément vers leurs tables dédiées, hors RAG.
// ─────────────────────────────────────────────────────────────────────────────

import OpenAI from 'openai'
import { supabase } from './supabase'

export { supabase }

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

// ─────────────────────────────────────────────────────────────────────────────
// CHUNKING (texte brut, hors schéma v2) + EMBEDDINGS
// ─────────────────────────────────────────────────────────────────────────────

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
// INGESTION UNIVERSELLE — knowledge_chunks
// ─────────────────────────────────────────────────────────────────────────────

export interface UniversalIngestResult {
  numero: string | null
  titre: string | null
  status: 'inserted' | 'skipped_doublon' | 'rejected_invalide' | 'error'
  chunksInserted?: number
  errors?: string[]
}

// Colonnes reconnues au niveau document (racine circulaire/note/document).
// Tout champ du document parent qui n'apparaît PAS dans cette liste part
// automatiquement dans metadata_extra — pas besoin de le lister à l'avance.
const DOC_KNOWN_FIELDS = new Set([
  'numero', 'titre', 'objet', 'date', 'date_gregorienne', 'emetteur',
  'statut', 'langue', 'type_document', 'abroge_ou_modifie', 'modifie_par',
  'date_fin_validite',
])

// Colonnes reconnues au niveau de chaque chunk.metadata.
const CHUNK_KNOWN_FIELDS = new Set([
  'source_type', 'domaine', 'sous_domaine', 'article', 'articles_couverts',
  'regime_douanier', 'nc8_concerne', 'mots_cles', 'chunk_index', 'total_chunks',
  // champs dupliqués parfois présents au niveau chunk mais déjà gérés au
  // niveau document — on les ignore ici pour ne pas les remettre dans
  // metadata_extra en double :
  'numero', 'date', 'emetteur', 'titre', 'statut',
])

function extractRootKey(raw: Record<string, unknown>): 'circulaire' | 'note' | 'document' | null {
  if ('circulaire' in raw) return 'circulaire'
  if ('note' in raw) return 'note'
  if ('document' in raw) return 'document'
  return null
}

export function isUniversalDocument(raw: unknown): boolean {
  if (typeof raw !== 'object' || raw === null) return false
  const asRaw = raw as Record<string, unknown>
  return extractRootKey(asRaw) !== null && Array.isArray(asRaw.chunks)
}

export async function ingestUniversalDocument(
  raw: unknown,
  source: string
): Promise<UniversalIngestResult> {
  const asRaw = raw as Record<string, unknown>
  const rootKey = extractRootKey(asRaw)

  if (!rootKey || !Array.isArray(asRaw.chunks)) {
    return { numero: null, titre: null, status: 'rejected_invalide', errors: ['Structure invalide — clé racine circulaire/note/document ou chunks manquants'] }
  }

  const docRaw = asRaw[rootKey] as Record<string, unknown>
  const chunksRaw = asRaw.chunks as Record<string, unknown>[]

  if (!docRaw || chunksRaw.length === 0) {
    return { numero: null, titre: null, status: 'rejected_invalide', errors: ['Document ou chunks vides'] }
  }

  // ── Extraction générique du document parent ──────────────────────────────
  const numero = (docRaw.numero as string) ?? null
  const titre  = (docRaw.titre as string) ?? (docRaw.objet as string) ?? null
  const dateDocument = (docRaw.date_gregorienne as string) ?? (docRaw.date as string) ?? null
  const emetteur = (docRaw.emetteur as string) ?? null
  const statut = (docRaw.statut as string) ?? 'en_vigueur'
  const langue = (docRaw.langue as string) ?? 'fr'
  const typeDocument = (docRaw.type_document as string) ?? rootKey
  const abrogeOuModifie = docRaw.abroge_ou_modifie ?? null
  const modifiePar = docRaw.modifie_par ?? null
  const dateFinValidite = (docRaw.date_fin_validite as string) ?? null

  // Tout ce qui n'est pas une colonne connue part dans metadata_extra.doc
  const docExtra: Record<string, unknown> = {}
  for (const key of Object.keys(docRaw)) {
    if (!DOC_KNOWN_FIELDS.has(key)) docExtra[key] = docRaw[key]
  }

  if (!titre) {
    return { numero, titre: null, status: 'rejected_invalide', errors: ['Aucun titre/objet trouvé pour ce document'] }
  }

  // ── Déduplication ──────────────────────────────────────────────────────
  // Priorité au numéro quand il existe (circulaires, notes, dahirs numérotés).
  // À défaut (brochures, dépliants, formulaires sans numéro), on déduplique
  // sur le couple titre + type_document.
  let existingQuery = supabase.from('knowledge_chunks').select('id').limit(1)
  existingQuery = numero
    ? existingQuery.eq('numero', numero)
    : existingQuery.eq('titre', titre).eq('type_document', typeDocument)

  const { data: existing } = await existingQuery.maybeSingle()
  if (existing) {
    return { numero, titre, status: 'skipped_doublon' }
  }

  // ── Insertion d'un row par chunk ──────────────────────────────────────
  const chunkErrors: string[] = []
  let inserted = 0

  for (const chunk of chunksRaw) {
    const content = (chunk.content as string) ?? ''
    const meta = (chunk.metadata as Record<string, unknown>) ?? {}

    if (!content) { chunkErrors.push('chunk sans contenu ignoré'); continue }

    const chunkExtra: Record<string, unknown> = {}
    for (const key of Object.keys(meta)) {
      if (!CHUNK_KNOWN_FIELDS.has(key)) chunkExtra[key] = meta[key]
    }

    let embedding: number[]
    try {
      embedding = await embedText(content)
    } catch (err) {
      chunkErrors.push(`embedding échoué (chunk ${meta.chunk_index ?? '?'}): ${err instanceof Error ? err.message : 'erreur inconnue'}`)
      continue
    }

    const { error } = await supabase.from('knowledge_chunks').insert({
      source_type: (meta.source_type as string) ?? (rootKey === 'document' ? 'document_informatif' : rootKey),
      type_document: typeDocument,
      numero,
      titre,
      date_document: dateDocument,
      emetteur,
      statut,
      langue,
      domaine: meta.domaine ?? null,
      sous_domaine: meta.sous_domaine ?? null,
      article: meta.article ?? null,
      articles_couverts: meta.articles_couverts ?? null,
      regime_douanier: meta.regime_douanier ?? null,
      nc8_concerne: meta.nc8_concerne ?? null,
      mots_cles: meta.mots_cles ?? [],
      chunk_index: meta.chunk_index ?? null,
      total_chunks: meta.total_chunks ?? chunksRaw.length,
      contenu: content,
      embedding,
      abroge_ou_modifie: abrogeOuModifie,
      modifie_par: modifiePar,
      date_fin_validite: dateFinValidite,
      metadata_extra: { ...docExtra, ...(Object.keys(chunkExtra).length > 0 ? { chunk: chunkExtra } : {}), source },
    })

    if (error) {
      chunkErrors.push(`chunk ${meta.chunk_index ?? '?'}: ${error.message}`)
      continue
    }
    inserted++
  }

  if (inserted === 0) {
    return { numero, titre, status: 'error', errors: chunkErrors.length > 0 ? chunkErrors : ['Aucun chunk inséré'] }
  }

  return {
    numero, titre,
    status: 'inserted',
    chunksInserted: inserted,
    ...(chunkErrors.length > 0 ? { errors: chunkErrors } : {}),
  }
}

export async function ingestUniversalBatch(
  rawEntries: unknown[],
  source: string
): Promise<UniversalIngestResult[]> {
  const results: UniversalIngestResult[] = []
  for (const raw of rawEntries) {
    results.push(await ingestUniversalDocument(raw, source))
  }
  return results
}

// ─────────────────────────────────────────────────────────────────────────────
// TABLES SÉPARÉES HORS RAG — faq / tarifs / procedures / glossaire / decisions
// (architecture existante conservée telle quelle, non concernée par
// knowledge_chunks)
// ─────────────────────────────────────────────────────────────────────────────

interface JsonIngestResult {
  inserted: number
  skipped: number
}

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

export async function ingestCirculairesJSON(
  entries: Record<string, unknown>[],
  source: string
): Promise<JsonIngestResult> {
  // Compatibilité ascendante — redirige les anciens JSON "à entrées" vers
  // l'ingestion universelle knowledge_chunks (source_type: circulaire),
  // en reconstituant la forme { circulaire, chunks } attendue.
  let inserted = 0
  let skipped = 0
  for (const entry of entries) {
    const numero = String(entry.numero ?? '').trim()
    const titre  = String(entry.titre  ?? '').trim()
    const texte  = String(entry.texte  ?? '').trim()
    if (!numero || !titre || !texte) { skipped++; continue }

    const reshaped = {
      circulaire: { numero, date: entry.date ?? null, objet: entry.objet ?? titre, emetteur: 'ADII' },
      chunks: chunkText(texte).map((content, i) => ({
        content,
        metadata: { source_type: 'circulaire', chunk_index: i },
      })),
    }
    const result = await ingestUniversalDocument(reshaped, source)
    if (result.status === 'inserted') inserted++
    else skipped++
  }
  return { inserted, skipped }
}

export async function ingestFaqJSON(entries: Record<string, unknown>[]): Promise<JsonIngestResult> {
  return insertSimpleEntries('faq', 'question', entries, (e) => {
    const question = String(e.question ?? '').trim()
    const reponse  = String(e.reponse  ?? '').trim()
    if (!question || !reponse) return null
    return { question, reponse, categorie: e.categorie ?? null, tags: e.tags ?? [] }
  })
}

export async function ingestTarifsJSON(entries: Record<string, unknown>[]): Promise<JsonIngestResult> {
  return insertSimpleEntries('tarifs', 'code_sh', entries, (e) => {
    const code_sh     = String(e.code_sh     ?? '').trim()
    const designation = String(e.designation ?? '').trim()
    if (!code_sh || !designation) return null
    return { code_sh, designation, taux_di: e.taux_di ?? null, tva: e.tva ?? null, tic: e.tic ?? null, notes: e.notes ?? null }
  })
}

export async function ingestProceduresJSON(entries: Record<string, unknown>[]): Promise<JsonIngestResult> {
  return insertSimpleEntries('procedures', 'code', entries, (e) => {
    const code  = String(e.code  ?? '').trim()
    const titre = String(e.titre ?? '').trim()
    const texte = String(e.texte ?? '').trim()
    if (!code || !titre || !texte) return null
    return { code, titre, texte, etapes: e.etapes ?? [] }
  })
}

export async function ingestGlossaireJSON(entries: Record<string, unknown>[]): Promise<JsonIngestResult> {
  return insertSimpleEntries('glossaire', 'terme', entries, (e) => {
    const terme      = String(e.terme      ?? '').trim()
    const definition = String(e.definition ?? '').trim()
    if (!terme || !definition) return null
    return { terme, definition, domaine: e.domaine ?? null, synonymes: e.synonymes ?? [] }
  })
}

export async function ingestDecisionsJSON(entries: Record<string, unknown>[]): Promise<JsonIngestResult> {
  return insertSimpleEntries('decisions', 'reference', entries, (e) => {
    const reference = String(e.reference ?? e.numero ?? '').trim()
    const titre     = String(e.titre      ?? '').trim()
    const texte     = String(e.texte      ?? '').trim()
    if (!reference || !titre || !texte) return null
    return { reference, titre, texte, date: e.date ?? null }
  })
}
