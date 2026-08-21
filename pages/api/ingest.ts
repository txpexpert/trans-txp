// pages/api/ingest.ts
// ─────────────────────────────────────────────────────────────────────────────
// Ingestion modulaire : PDF (extraction Anthropic) + JSON (insertion directe)
// Types JSON supportés : circulaires | faq | tarifs | procedures | glossaire
// Auth : cookie httpOnly dia_session (rôle admin requis)
// ─────────────────────────────────────────────────────────────────────────────

import type { NextApiRequest, NextApiResponse } from 'next'
import Anthropic                                from '@anthropic-ai/sdk'
import formidable, { File as FormFile }         from 'formidable'
import fs                                       from 'fs'
import path                                     from 'path'
import { COOKIE_NAME, verifyToken }             from '../../lib/adminAuth'
import {
  supabase, chunkText, embedText,
  ingestCirculairesJSON, ingestFaqJSON, ingestTarifsJSON,
  ingestDecisionsJSON, ingestProceduresJSON, ingestGlossaireJSON,
} from '../../lib/ingestion'

export const config = { api: { bodyParser: false } }

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMAS JSON SUPPORTÉS
// ─────────────────────────────────────────────────────────────────────────────
//
// TYPE: "circulaires"
// {
//   "type": "circulaires",
//   "source": "ADII",                    // optionnel
//   "entries": [
//     {
//       "numero":  "6234",               // obligatoire — clé de déduplication
//       "titre":   "Circulaire ...",      // obligatoire
//       "objet":   "Résumé court",        // optionnel
//       "date":    "2026-01-15",          // optionnel — format ISO
//       "texte":   "Texte complet..."     // obligatoire — sera chunké et embedé
//     }
//   ]
// }
//
// TYPE: "faq"
// {
//   "type": "faq",
//   "entries": [
//     {
//       "question":  "Quel est le taux DI sur ...",  // obligatoire
//       "reponse":   "Le taux est de ...",            // obligatoire
//       "categorie": "TVA",                           // optionnel
//       "tags":      ["import", "exo"]                // optionnel
//     }
//   ]
// }
//
// TYPE: "tarifs"
// {
//   "type": "tarifs",
//   "entries": [
//     {
//       "code_sh":      "8703.23.10",    // obligatoire — clé de déduplication
//       "designation":  "...",           // obligatoire
//       "taux_di":      17.5,            // optionnel
//       "tva":          20,              // optionnel
//       "tic":          0,               // optionnel
//       "notes":        "..."            // optionnel
//     }
//   ]
// }
//
// TYPE: "procedures"
// {
//   "type": "procedures",
//   "entries": [
//     {
//       "code":   "DED-001",             // obligatoire
//       "titre":  "Dédouanement normal", // obligatoire
//       "texte":  "Étapes détaillées...", // obligatoire
//       "etapes": ["Étape 1", "..."]     // optionnel
//     }
//   ]
// }
//
// TYPE: "glossaire"
// {
//   "type": "glossaire",
//   "entries": [
//     {
//       "terme":       "Déclaration en détail", // obligatoire
//       "definition":  "...",                   // obligatoire
//       "domaine":     "Procédures",            // optionnel
//       "synonymes":   ["DUM", "déclaration"]   // optionnel
//     }
//   ]
// }
// ─────────────────────────────────────────────────────────────────────────────

type JsonType = 'circulaires' | 'faq' | 'tarifs' | 'procedures' | 'glossaire' | 'decisions'

interface JsonPayload {
  type:    JsonType
  source?: string
  entries: Record<string, unknown>[]
}

interface IngestResult {
  fichier:         string
  type:           'pdf' | JsonType
  status:         'success' | 'error' | 'skipped'
  numero?:         string
  chunksInserted?: number
  entriesInserted?: number
  error?:          string
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS COMMUNS
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER PDF
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

    const { data: existing } = await supabase.from('circulaires').select('id').eq('numero', numero).single()
    if (existing) return { fichier, type: 'pdf', status: 'skipped', numero }

    const { data: circ, error: circErr } = await supabase
      .from('circulaires')
      .insert({ numero, titre: path.basename(fichier, '.pdf'), objet: text.slice(0, 200), date: new Date().toISOString().split('T')[0], texte: text })
      .select('id').single()

    if (circErr || !circ) throw new Error(circErr?.message ?? 'Erreur insertion')

    const chunks = chunkText(text)
    let inserted = 0
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await embedText(chunks[i])
      const { error } = await supabase.from('circulaires_chunks').insert({ circulaire_id: circ.id, numero, chunk_index: i, contenu: chunks[i], embedding })
      if (!error) inserted++
    }
    return { fichier, type: 'pdf', status: 'success', numero, chunksInserted: inserted }
  } finally {
    try { fs.unlinkSync(file.filepath) } catch {}
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLERS JSON PAR TYPE
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER JSON — DISPATCH PAR TYPE
// ─────────────────────────────────────────────────────────────────────────────

async function ingestJSON(file: FormFile): Promise<IngestResult> {
  const fichier = file.originalFilename ?? file.newFilename ?? 'data.json'
  try {
    const raw:     JsonPayload = JSON.parse(fs.readFileSync(file.filepath, 'utf-8'))
    const type     = raw.type
    const entries  = raw.entries ?? []
    const source   = raw.source  ?? 'manual'

    if (!type || !Array.isArray(entries) || entries.length === 0)
      throw new Error('Format invalide — champs "type" et "entries" requis')

    let result: { inserted: number; skipped: number }

    switch (type) {
      case 'circulaires': result = await ingestCirculairesJSON(entries, source); break
      case 'faq':         result = await ingestFaqJSON(entries);                 break
      case 'tarifs':      result = await ingestTarifsJSON(entries);              break
      case 'procedures':  result = await ingestProceduresJSON(entries);          break
      case 'glossaire':   result = await ingestGlossaireJSON(entries);           break
      case 'decisions':   result = await ingestDecisionsJSON(entries);           break
      default: throw new Error(`Type inconnu : "${type}". Types supportés : circulaires | faq | tarifs | procedures | glossaire | decisions`)
    }

    return {
      fichier,
      type,
      status:          result.inserted > 0 ? 'success' : 'skipped',
      entriesInserted: result.inserted,
      chunksInserted:  result.skipped, // réutilisé pour afficher les doublons côté UI
    }
  } catch (err) {
    return { fichier, type: 'circulaires', status: 'error', error: err instanceof Error ? err.message : 'Erreur JSON' }
  } finally {
    try { fs.unlinkSync(file.filepath) } catch {}
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  // ✅ Corrigé — vérifiait auparavant le cookie dia_session (utilisateur
  // régulier + email admin), incompatible avec das_admin, le cookie
  // réellement posé par /api/admin/login et vérifié par le reste du backoffice.
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