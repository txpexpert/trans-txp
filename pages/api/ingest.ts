// pages/api/ingest.ts
// ─────────────────────────────────────────────────────────────────────────────
// Ingestion modulaire : PDF (extraction Anthropic) + JSON (insertion directe)
// JSON schéma universel (circulaire | note | document + chunks) → knowledge_chunks
// JSON "à entrées" (faq | tarifs | procedures | glossaire | decisions) → tables dédiées
// Auth : cookie httpOnly das_admin (rôle admin requis)
// ─────────────────────────────────────────────────────────────────────────────

import type { NextApiRequest, NextApiResponse } from 'next'
import Anthropic                                from '@anthropic-ai/sdk'
import formidable, { File as FormFile }         from 'formidable'
import fs                                       from 'fs'
import path                                     from 'path'
import { COOKIE_NAME, verifyToken }             from '../../lib/adminAuth'
import {
  supabase, chunkText, embedText,
  ingestFaqJSON, ingestTarifsJSON,
  ingestDecisionsJSON, ingestProceduresJSON, ingestGlossaireJSON,
} from '../../lib/ingestion'
// Ingestion universelle — couvre circulaires, notes ADII, documents
// informatifs, textes réglementaires fondateurs, etc. Un seul mécanisme,
// aucune fonction spécifique par type de document : tout part dans
// knowledge_chunks, avec les champs non standard rangés en metadata_extra.
import { ingestUniversalDocument, isUniversalDocument } from '../../lib/ingestion'

export const config = { api: { bodyParser: false } }

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMAS JSON SUPPORTÉS
// ─────────────────────────────────────────────────────────────────────────────
//
// SCHÉMA UNIVERSEL (RAG — knowledge_chunks) : un fichier = un document.
// Clé racine "circulaire" | "note" | "document" + tableau "chunks".
// {
//   "circulaire": { "numero": "...", "date": "...", "objet": "...", "emetteur": "..." },
//   // ou "note": { ... , "statut", "abroge_ou_modifie", "modifie_par", "date_fin_validite", "langue" }
//   // ou "document": { "titre", "type_document", "numero"?, "date"?, "objet"?, "statut"?, "langue"?, ...tout champ additionnel propre au type }
//   "chunks": [
//     {
//       "content": "texte du chunk",
//       "metadata": {
//         "source_type": "circulaire" | "note" | "document_informatif" | "circulaire_note" | "texte_reglementaire_fondateur" | "...",
//         "domaine": "...", "sous_domaine": "...", "article": "...",
//         "articles_couverts": ["..."], "regime_douanier": "...", "nc8_concerne": "...",
//         "mots_cles": ["..."], "chunk_index": 0, "total_chunks": 1
//       }
//     }
//   ]
// }
// Tout champ présent mais non listé ci-dessus (co_emetteur, reference,
// signataire, vise, textes_modificatifs, articles_abroges, date_hijri...)
// est automatiquement conservé dans metadata_extra, sans code spécifique.
//
// TYPE: "faq" — { "type": "faq", "entries": [{ "question", "reponse", "categorie"?, "tags"? }] }
// TYPE: "tarifs" — { "type": "tarifs", "entries": [{ "code_sh", "designation", "taux_di"?, "tva"?, "tic"?, "notes"? }] }
// TYPE: "procedures" — { "type": "procedures", "entries": [{ "code", "titre", "texte", "etapes"? }] }
// TYPE: "glossaire" — { "type": "glossaire", "entries": [{ "terme", "definition", "domaine"?, "synonymes"? }] }
// TYPE: "decisions" — { "type": "decisions", "entries": [{ "reference", "titre", "texte", "date"? }] }
// ─────────────────────────────────────────────────────────────────────────────

type JsonType = 'faq' | 'tarifs' | 'procedures' | 'glossaire' | 'decisions'

interface JsonPayload {
  type:    JsonType
  source?: string
  entries: Record<string, unknown>[]
}

interface IngestResult {
  fichier:         string
  type:           'pdf' | 'universel' | JsonType
  status:         'success' | 'error' | 'skipped'
  numero?:         string | null
  titre?:          string | null
  chunksInserted?: number
  entriesInserted?: number
  error?:          string
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER PDF — extraction brute, reste sur l'ancien circuit texte simple
// ─────────────────────────────────────────────────────────────────────────────

async function extractTextFromPDF(filePath: string): Promise<string> {
  const base64 = fs.readFileSync(filePath).toString('base64')
  const response = await anthropic.messages.create({
    model:      'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
        { type: 'text',     text: 'Extrais le texte complet. Conserve la structure, les numéros de circulaire, les articles. Retourne uniquement le texte, sans commentaire.' },
      ],
    }],
  })
  return response.content.filter(b => b.type === 'text').map(b => (b as { type:'text'; text:string }).text).join('\n')
}

function extractNumero(filename: string, text: string): string {
  const fnMatch  = filename.match(/(\d{3,6})/)?.[1]
  if (fnMatch) return fnMatch
  const txtMatch = text.match(/circulaire\s+n[°o]?\s*(\d{3,6})/i)?.[1]
  if (txtMatch) return txtMatch
  return Date.now().toString().slice(-6)
}

async function ingestPDF(file: FormFile): Promise<IngestResult> {
  const fichier = file.originalFilename ?? file.newFilename ?? 'inconnu.pdf'
  try {
    const text   = await extractTextFromPDF(file.filepath)
    const numero = extractNumero(fichier, text)

    // Route directement vers l'ingestion universelle (knowledge_chunks),
    // même circuit que les JSON schéma v2.
    const reshaped = {
      circulaire: { numero, date: new Date().toISOString().split('T')[0], objet: path.basename(fichier, '.pdf'), emetteur: 'ADII' },
      chunks: chunkText(text).map((content, i) => ({
        content,
        metadata: { source_type: 'circulaire', chunk_index: i },
      })),
    }
    const result = await ingestUniversalDocument(reshaped, 'pdf-upload')
    return {
      fichier,
      type: 'universel',
      status: result.status === 'inserted' ? 'success' : result.status === 'skipped_doublon' ? 'skipped' : 'error',
      numero: result.numero,
      titre: result.titre,
      chunksInserted: result.chunksInserted,
      error: result.errors?.join('; '),
    }
  } finally {
    try { fs.unlinkSync(file.filepath) } catch {}
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER JSON — DISPATCH
// ─────────────────────────────────────────────────────────────────────────────

async function ingestJSON(file: FormFile): Promise<IngestResult> {
  const fichier = file.originalFilename ?? file.newFilename ?? 'data.json'
  try {
    const raw = JSON.parse(fs.readFileSync(file.filepath, 'utf-8'))

    // ── Schéma universel : circulaire | note | document + chunks ───────────
    // Un seul chemin de code pour tous les types de documents du RAG —
    // aucune distinction requise ici, ingestUniversalDocument route en
    // interne selon la clé racine et les métadonnées de chaque chunk.
    if (isUniversalDocument(raw)) {
      const result = await ingestUniversalDocument(raw, 'projet-claude-json')
      return {
        fichier,
        type: 'universel',
        status: result.status === 'inserted' ? 'success' : result.status === 'skipped_doublon' ? 'skipped' : 'error',
        numero: result.numero,
        titre: result.titre,
        chunksInserted: result.chunksInserted,
        error: result.errors?.join('; '),
      }
    }

    // ── Formats "à entrées" — hors RAG, tables dédiées ─────────────────────
    const payload: JsonPayload = raw
    const type     = payload.type
    const entries  = payload.entries ?? []

    if (!type || !Array.isArray(entries) || entries.length === 0)
      throw new Error('Format invalide — champs "type"/"entries" requis, ou schéma universel { circulaire|note|document, chunks }')

    let result: { inserted: number; skipped: number }

    switch (type) {
      case 'faq':         result = await ingestFaqJSON(entries);          break
      case 'tarifs':      result = await ingestTarifsJSON(entries);       break
      case 'procedures':  result = await ingestProceduresJSON(entries);   break
      case 'glossaire':   result = await ingestGlossaireJSON(entries);    break
      case 'decisions':   result = await ingestDecisionsJSON(entries);    break
      default: throw new Error(`Type inconnu : "${type}". Types supportés : faq | tarifs | procedures | glossaire | decisions (ou schéma universel)`)
    }

    return {
      fichier,
      type,
      status:          result.inserted > 0 ? 'success' : 'skipped',
      entriesInserted: result.inserted,
    }
  } catch (err) {
    return { fichier, type: 'universel', status: 'error', error: err instanceof Error ? err.message : 'Erreur JSON' }
  } finally {
    try { fs.unlinkSync(file.filepath) } catch {}
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const isAdmin = verifyToken(req.cookies[COOKIE_NAME])
  if (!isAdmin) return res.status(403).json({ error: 'Accès refusé — droits admin requis' })

  const form = formidable({ multiples: true, maxFiles: 20, maxFileSize: 50 * 1024 * 1024 })
  const [, files] = await form.parse(req)
  const uploaded  = (files['files'] ?? []) as FormFile[]

  if (!uploaded.length) return res.status(400).json({ error: 'Aucun fichier reçu' })

  const results:    IngestResult[] = []
  let   totalOk     = 0
  let   totalSkip   = 0
  let   totalErrors = 0

  for (const file of uploaded) {
    const name = (file.originalFilename ?? '').toLowerCase()
    let result: IngestResult

    if (name.endsWith('.json')) {
      result = await ingestJSON(file)
    } else if (name.endsWith('.pdf')) {
      result = await ingestPDF(file)
    } else {
      result = { fichier: file.originalFilename ?? 'inconnu', type: 'pdf', status: 'error', error: 'Format non supporté — PDF ou JSON uniquement' }
    }

    results.push(result)
    if (result.status === 'success') totalOk++
    else if (result.status === 'skipped') totalSkip++
    else totalErrors++
  }

  return res.status(200).json({
    summary: { total: uploaded.length, success: totalOk, skipped: totalSkip, errors: totalErrors },
    results,
  })
}
