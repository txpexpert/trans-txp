// pages/api/ingest.ts
// ─────────────────────────────────────────────────────────────────────────────
// Ingestion modulaire : PDF (extraction Anthropic) + JSON (insertion directe)
// JSON schéma universel (circulaire | note | document + chunks) → knowledge_chunks
// JSON "à entrées" (faq | tarifs | procedures | glossaire | decisions) → tables dédiées
// Auth : cookie httpOnly das_admin (rôle admin requis)
//
// ✅ Gestion d'erreur globale — toute erreur, où qu'elle survienne (parsing
// du formulaire, lecture de fichier, appel API externe...), est systématiquement
// renvoyée en JSON avec un message clair, jamais un crash silencieux qui casse
// le fetch() côté interface (=> "Erreur réseau" générique et inexploitable).
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
  ingestUniversalDocument, isUniversalDocument,
} from '../../lib/ingestion'

export const config = { api: { bodyParser: false } }

let anthropic: Anthropic | null = null
function getAnthropic(): Anthropic {
  if (!anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY manquante — vérifier les variables d\'environnement Vercel')
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return anthropic
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMAS JSON SUPPORTÉS
// ─────────────────────────────────────────────────────────────────────────────
//
// SCHÉMA UNIVERSEL (RAG — knowledge_chunks) : un fichier = un document.
// Clé racine "circulaire" | "note" | "document" + tableau "chunks".
// Tout champ non standard (co_emetteur, reference, signataire, vise,
// textes_modificatifs, articles_abroges, date_hijri...) est automatiquement
// conservé dans metadata_extra, sans code spécifique par type.
//
// TYPE: "faq" | "tarifs" | "procedures" | "glossaire" | "decisions"
// { "type": "...", "entries": [...] } → tables dédiées, hors RAG.
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
// HANDLER PDF
// ─────────────────────────────────────────────────────────────────────────────

async function extractTextFromPDF(filePath: string): Promise<string> {
  const base64 = fs.readFileSync(filePath).toString('base64')
  const response = await getAnthropic().messages.create({
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
  } catch (err) {
    return { fichier, type: 'pdf', status: 'error', error: err instanceof Error ? err.message : 'Erreur PDF inconnue' }
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
    return { fichier, type: 'universel', status: 'error', error: err instanceof Error ? err.message : 'Erreur JSON inconnue' }
  } finally {
    try { fs.unlinkSync(file.filepath) } catch {}
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER PRINCIPAL — try/catch global : toute exception renvoie un JSON
// exploitable par l'interface, jamais un crash brut.
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })

    const isAdmin = verifyToken(req.cookies[COOKIE_NAME])
    if (!isAdmin) return res.status(403).json({ error: 'Accès refusé — droits admin requis' })

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY manquante — vérifier les variables d\'environnement Vercel' })
    }
    if (!process.env.SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return res.status(500).json({ error: 'SUPABASE_URL manquante — vérifier les variables d\'environnement Vercel' })
    }

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
  } catch (err) {
    console.error('[api/ingest] erreur globale:', err)
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Erreur serveur inconnue',
      summary: { total: 0, success: 0, skipped: 0, errors: 1 },
      results: [],
    })
  }
}
