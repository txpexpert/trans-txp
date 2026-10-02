// lib/responseLength.ts
// ============================================================
// Contrôle de longueur des réponses du copilote — côté serveur.
//
// Règle :
//   - Cible : 200 mots.
//   - Si la 200e tombe au milieu d'une phrase, on COMPLÈTE la phrase
//     en cours, tant que la réponse ne dépasse pas le plafond `max`.
//   - Plafond configurable : 250 mots (défaut) ou 300 mots.
//   - Si la phrase en cours ferait dépasser le plafond, on s'arrête à
//     la dernière phrase complète avant la cible.
//   - Cas extrême (une seule phrase plus longue que le plafond) : coupe
//     au dernier séparateur de proposition (, ; :) avant le plafond, + « … ».
//
// Réglage sans redéploiement de code : variables d'environnement Vercel
//   RESPONSE_TARGET_WORDS (défaut 200)
//   RESPONSE_MAX_WORDS    (défaut 250 — mettre 300 pour l'option large)
// Réglage par palier : LIMITS_BY_PLAN ci-dessous.
// ============================================================

import type { Plan } from './moduleAccess'

export type LengthLimits = { target: number; max: number }

function envInt(name: string, fallback: number): number {
  const v = parseInt(process.env[name] ?? '', 10)
  return Number.isFinite(v) && v > 0 ? v : fallback
}

export const DEFAULT_LIMITS: LengthLimits = {
  target: envInt('RESPONSE_TARGET_WORDS', 200),
  max: envInt('RESPONSE_MAX_WORDS', 250),
}

// Surcharges éventuelles par palier. Vide = même règle pour tous.
// Exemple : premium: { target: 200, max: 300 }
const LIMITS_BY_PLAN: Partial<Record<Plan, LengthLimits>> = {}

export function limitsForPlan(plan: Plan): LengthLimits {
  const l = LIMITS_BY_PLAN[plan] ?? DEFAULT_LIMITS
  return { target: l.target, max: Math.max(l.max, l.target) }
}

// ---- Découpage en phrases ----------------------------------------------------

// Abréviations courantes du domaine après lesquelles un point ne termine pas
// une phrase (« art. 6 », « n. », « cf. », « réf. »…).
const ABBREVIATIONS = new Set([
  'art', 'arts', 'al', 'cf', 'ex', 'etc', 'n', 'no', 'p', 'pp', 'réf', 'ref',
  'min', 'max', 'env', 'm', 'mme', 'mm', 'dr', 'st', 'vol', 'ch', 'chap',
])

function countWords(s: string): number {
  const t = s.trim()
  return t ? t.split(/\s+/).length : 0
}

/** Découpe en phrases, en conservant la ponctuation et les retours à la ligne. */
export function splitSentences(text: string): string[] {
  const out: string[] = []
  let start = 0
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '\n') {
      // une ligne (ex. élément de liste « - … ») est une unité à part entière ;
      // un saut de ligne seul est rattaché à l'unité précédente (sinon perdu)
      const seg = text.slice(start, i + 1)
      if (!seg.trim() && out.length > 0) out[out.length - 1] += seg
      else out.push(seg)
      start = i + 1
      continue
    }
    if (ch === '.' || ch === '!' || ch === '?' || ch === '…') {
      // avaler la ponctuation consécutive et les guillemets/parenthèses fermants
      let j = i + 1
      while (j < text.length && /[.!?…»"')\]]/.test(text[j])) j++
      const next = text[j]
      const atBoundary = j >= text.length || next === ' ' || next === '\n' || next === '\t'
      if (!atBoundary) continue // ex. 17.5 %, 8471.30
      if (ch === '.') {
        const prevWord = text.slice(start, i).split(/\s+/).pop()?.toLowerCase().replace(/[^a-zà-ÿ]/g, '') ?? ''
        if (ABBREVIATIONS.has(prevWord)) continue
      }
      out.push(text.slice(start, j))
      start = j
      i = j - 1
    }
  }
  if (start < text.length) out.push(text.slice(start))
  return out.filter((s) => s.trim().length > 0)
}

// ---- Application de la règle -------------------------------------------------

export type LengthResult = { text: string; words: number; wasCut: boolean }

export function enforceLength(raw: string, limits: LengthLimits): LengthResult {
  const text = raw.trim()
  const total = countWords(text)
  if (total <= limits.target) return { text, words: total, wasCut: false }

  const sentences = splitSentences(text)
  let kept = ''
  let count = 0

  for (const s of sentences) {
    const w = countWords(s)
    if (count + w <= limits.target) {
      kept += s
      count += w
      continue
    }
    // Phrase « en cours » au moment où l'on atteint la cible : on la complète
    // si elle tient sous le plafond.
    if (count < limits.target && count + w <= limits.max) {
      kept += s
      count += w
    }
    break
  }

  if (count > 0) {
    return { text: tidy(kept), words: count, wasCut: true }
  }

  // Aucune phrase complète ne tient sous le plafond (phrase-fleuve) :
  // coupe au dernier séparateur de proposition avant le plafond.
  const words = text.split(/\s+/).slice(0, limits.max)
  let cutAt = words.length
  for (let k = words.length - 1; k >= limits.target - 1 && k >= 0; k--) {
    if (/[,;:]$/.test(words[k])) {
      cutAt = k + 1
      break
    }
  }
  const head = words.slice(0, cutAt).join(' ').replace(/[,;:]$/, '')
  return { text: head + '…', words: cutAt, wasCut: true }
}

function tidy(s: string): string {
  return s.replace(/\n{3,}/g, '\n\n').trim()
}
