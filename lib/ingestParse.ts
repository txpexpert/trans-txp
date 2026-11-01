// lib/ingestParse.ts
// ─────────────────────────────────────────────────────────────────────────────
// Lecture et contrôle, côté navigateur, des fichiers d'ingestion (aucune
// dépendance serveur). La base revérifie tout (fonctions SQL de la migration
// 0007) ; ces contrôles servent à afficher les erreurs ligne par ligne avant
// l'envoi.
//
// TARIF — format unifié définitif, 4 colonnes sans en-tête :
//   code SH (10 chiffres) · désignation (espaces en tête = retrait visuel) ·
//   droit d'importation (« 2,5 », vide pour une ligne de titre) · unité (« KG »)
//
// DÉCISIONS — JSON : tableau, ou { "entries": [...] } / { "decisions": [...] },
//   champs designation, code_sh, circulaire, date_circulaire, objet, resume.
// ─────────────────────────────────────────────────────────────────────────────

export const normTxt = (v: unknown) => String(v ?? '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim()

// ── Tarif ────────────────────────────────────────────────────────────────────
export interface TarifRow {
  n: number            // n° de ligne dans le fichier / le collage (1 = première ligne)
  code_sh: string
  designation: string
  indent: number       // espaces en tête de la désignation (affichage seulement)
  taux: string         // « 2,5 », « 10 », ou '' pour une ligne de titre
  unite: string        // « kg », « u »…
  errs: string[]
  warns: string[]
}

const UNIT_MAP: Record<string, string> = {
  KG: 'kg', U: 'u', G: 'g', M: 'm', M2: 'm²', 'M²': 'm²', M3: 'm³', 'M³': 'm³', L: 'L',
  CARAT: 'carat', NOMBRE: 'nombre', '1000U': '1000u', '2U': '2u', 'KW/H': 'KW/H',
}
export const normUnit = (v: unknown) => { const t = normTxt(v); return t ? (UNIT_MAP[t.toUpperCase()] ?? t.toLowerCase()) : '' }

/** « 2.5 », « 2,5 % », « 10% » → « 2,5 » / « 10 » ; « - » ou « — » → '' (ligne de titre). */
export const normTaux = (v: unknown) => {
  const t = normTxt(v).replace(/\s*%$/, '').replace('.', ',')
  return /^[-–—]+$/.test(t) ? '' : t
}

/** Code SH : chiffres seulement ; un code à 9 chiffres (0 initial perdu par Excel) est complété. */
export function normCodeTarif(v: unknown): string {
  const d = String(v ?? '').replace(/\D/g, '')
  return d.length === 9 ? '0' + d : d
}

export function rowsFromText(text: string): string[][] {
  return text.split(/\r?\n/).filter(l => l.trim()).map(l => (l.includes('\t') ? l.split('\t') : l.split(';')))
}

export function parseTarif(raw: unknown[][]): TarifRow[] {
  // Ligne d'en-tête éventuelle (première cellule sans chiffre) : ignorée.
  const start = raw.length && raw[0] && raw[0][0] !== undefined && !/\d/.test(String(raw[0][0])) ? 1 : 0
  const seen = new Set<string>()
  const out: TarifRow[] = []
  raw.slice(start).forEach((r, idx) => {
    if (!r || !r.some(c => normTxt(c))) return
    const rawDes = String(r[1] ?? '').replace(/ /g, ' ')
    const row: TarifRow = {
      n: idx + start + 1,
      code_sh: normCodeTarif(r[0]),
      designation: normTxt(rawDes),
      indent: (rawDes.match(/^ */) || [''])[0].length,
      taux: normTaux(r[2]),
      unite: normUnit(r[3]),
      errs: [], warns: [],
    }
    if (!row.code_sh) row.errs.push('code SH manquant')
    else if (row.code_sh.length !== 10) row.errs.push(`le code doit avoir 10 chiffres (« ${normTxt(r[0])} »)`)
    if (!row.designation) row.errs.push('désignation manquante')
    if (row.taux && !/^\d+(,\d+)?$/.test(row.taux)) row.errs.push(`droit non numérique « ${row.taux} »`)
    if (row.taux && !row.unite) row.warns.push('unité absente')
    if (String(r[0] ?? '').replace(/\D/g, '').length === 9) row.warns.push('0 initial rétabli')
    const key = row.code_sh + '|' + row.designation.toLowerCase()
    if (!row.errs.length && seen.has(key)) row.errs.push('ligne en double dans l’import')
    seen.add(key)
    out.push(row)
  })
  return out
}

/** Découpe en lots (≤ max lignes) sans jamais séparer les lignes d'un même code SH. */
export function batchByCode<T extends { code_sh: string }>(rows: T[], max = 5000): T[][] {
  const groups = new Map<string, T[]>()
  rows.forEach(r => { const g = groups.get(r.code_sh); if (g) g.push(r); else groups.set(r.code_sh, [r]) })
  const batches: T[][] = []
  let cur: T[] = []
  groups.forEach(g => {
    if (cur.length && cur.length + g.length > max) { batches.push(cur); cur = [] }
    cur.push(...g)
  })
  if (cur.length) batches.push(cur)
  return batches
}

// ── Décisions ────────────────────────────────────────────────────────────────
export interface DecisionRow {
  n: number
  designation: string
  code_sh: string
  circulaire: string
  date_circulaire: string | null
  objet: string
  resume: string
  errs: string[]
  warns: string[]
}

function normDate(v: unknown): { v: string | null; err?: string } {
  const t = normTxt(v)
  if (!t) return { v: null }
  let m = t.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return { v: `${m[1]}-${m[2]}-${m[3]}` }
  m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) return { v: `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` }
  return { v: null, err: `date illisible « ${t} » (AAAA-MM-JJ ou JJ/MM/AAAA)` }
}

function validDate(iso: string): boolean {
  const d = new Date(iso + 'T00:00:00Z')
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso
}

export function extractDecisionList(json: unknown): Record<string, unknown>[] {
  if (Array.isArray(json)) return json as Record<string, unknown>[]
  if (json && typeof json === 'object') {
    const o = json as Record<string, unknown>
    for (const k of ['entries', 'decisions', 'items']) if (Array.isArray(o[k])) return o[k] as Record<string, unknown>[]
  }
  return []
}

export function parseDecisions(list: Record<string, unknown>[]): DecisionRow[] {
  const seen = new Set<string>()
  return list.map((e, i) => {
    const code = String(e.code_sh ?? e.code ?? e.position ?? '').replace(/\D/g, '')
    const d = normDate(e.date_circulaire ?? e.date)
    const r: DecisionRow = {
      n: i + 1,
      designation: normTxt(e.designation ?? e.produit),
      // Points acceptés ; un code à 4, 6 ou 8 chiffres est complété à 10 par des zéros.
      code_sh: [4, 6, 8].includes(code.length) ? code.padEnd(10, '0') : code.length === 9 ? '0' + code : code,
      circulaire: normTxt(e.circulaire ?? e.numero_circulaire ?? e.reference),
      date_circulaire: d.v,
      objet: normTxt(e.objet),
      resume: normTxt(e.resume ?? e.texte),
      errs: [], warns: [],
    }
    if (!r.designation) r.errs.push('désignation manquante')
    if (!r.code_sh) r.errs.push('code SH manquant')
    else if (r.code_sh.length !== 10) r.errs.push(`code SH invalide « ${normTxt(e.code_sh ?? e.code)} »`)
    if (!r.circulaire) r.errs.push('n° de circulaire manquant')
    if (d.err) r.warns.push(d.err)
    if (r.date_circulaire && !validDate(r.date_circulaire)) { r.errs.push(`date inexistante « ${r.date_circulaire} »`); r.date_circulaire = null }
    const key = r.code_sh + '|' + r.designation.toLowerCase()
    if (!r.errs.length && seen.has(key)) r.errs.push('décision en double dans le fichier')
    seen.add(key)
    return r
  })
}

// ── Lecture Excel (SheetJS chargé à la demande depuis cdnjs) ─────────────────
const XLSX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'

export function loadXlsx(): Promise<any> {
  const w = window as any
  if (w.XLSX) return Promise.resolve(w.XLSX)
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = XLSX_URL
    s.async = true
    s.onload = () => (w.XLSX ? resolve(w.XLSX) : reject(new Error('lecteur Excel indisponible')))
    s.onerror = () => reject(new Error('le lecteur Excel n’a pas pu être chargé — collez les lignes à la place'))
    document.head.appendChild(s)
  })
}

export async function readSpreadsheet(file: File): Promise<unknown[][]> {
  if (/\.(txt|tsv|csv)$/i.test(file.name)) return rowsFromText(await file.text())
  const XLSX = await loadXlsx()
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  return XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' })
}
