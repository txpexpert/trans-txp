// lib/circulaireSchemaV2.ts
// ─────────────────────────────────────────────────────────────────────────────
// Types + validation pour le JSON produit par le projet Claude de génération
// de circulaires structurées (schéma v2 : circulaire/chunks, 1 chunk = 1 article,
// versioning statut/abroge_ou_modifie).
//
// Autonome : ne dépend d'aucun autre fichier custom, utilisable côté client
// (validation avant envoi) et côté serveur (re-validation avant insertion).
// ─────────────────────────────────────────────────────────────────────────────

export type Statut = 'en_vigueur' | 'abroge' | 'modifie_partiellement'

export const DOMAINES = [
  'Régimes économiques en douane',
  'Procédures et méthodes',
  'Catégorisation des opérateurs',
  'Tarif et classification',
  'Valeur en douane',
  'Origine des marchandises',
  'Régime de change',
  'Contentieux et contrôle',
  'Fiscalité douanière',
  'Zones franches et ZAI',
  'Transit',
  'Admission temporaire',
  'Divers / non classé',
] as const

export interface ChunkMetadata {
  source_type: 'circulaire'
  numero: string
  date: string
  emetteur: string
  statut: Statut
  domaine: string
  sous_domaine?: string
  article: string
  mots_cles?: string[]
  regime_douanier?: string
  nc8_concerne?: string | null
  chunk_index: number
  total_chunks: number
}

export interface Chunk {
  id: string
  content: string
  metadata: ChunkMetadata
}

export interface CirculaireMeta {
  numero: string
  date: string
  objet: string
  emetteur: 'ADII' | 'DGI' | 'Ministère des Finances'
  statut: Statut
  abroge_ou_modifie: string[] | null
  modifie_par: string | null
  date_fin_validite: string | null
  langue: 'fr' | 'ar'
}

export interface CirculaireDocument {
  circulaire: CirculaireMeta
  chunks: Chunk[]
}

export interface ValidationResult {
  valid: boolean
  errors: string[]     // bloquent l'import
  warnings: string[]   // n'empêchent pas l'import, à vérifier
}

const STATUTS: Statut[] = ['en_vigueur', 'abroge', 'modifie_partiellement']

/** Valide un objet JSON quelconque contre le schéma v2. Ne lève jamais — retourne le rapport. */
export function validateCirculaireDocument(raw: unknown): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (typeof raw !== 'object' || raw === null) {
    return { valid: false, errors: ['Le fichier ne contient pas un objet JSON valide.'], warnings }
  }
  const obj = raw as Record<string, unknown>

  const circ = obj.circulaire as Partial<CirculaireMeta> | undefined
  if (!circ || typeof circ !== 'object') {
    errors.push('Champ "circulaire" manquant ou invalide.')
  } else {
    if (!circ.numero) errors.push('circulaire.numero manquant.')
    if (!circ.date) errors.push('circulaire.date manquant.')
    if (!circ.objet) errors.push('circulaire.objet manquant.')
    if (!circ.emetteur) errors.push('circulaire.emetteur manquant.')
    if (circ.statut && !STATUTS.includes(circ.statut as Statut)) {
      errors.push(`circulaire.statut invalide : "${circ.statut}" (attendu : ${STATUTS.join(' | ')}).`)
    }
    if (circ.modifie_par && !circ.date_fin_validite) {
      warnings.push('modifie_par renseigné mais date_fin_validite absent.')
    }
  }

  const chunks = obj.chunks as Chunk[] | undefined
  if (!Array.isArray(chunks) || chunks.length === 0) {
    errors.push('Champ "chunks" manquant ou vide.')
  } else {
    const indices: number[] = []
    chunks.forEach((c, i) => {
      if (!c.content || c.content.trim().length === 0) errors.push(`chunk[${i}] : content vide.`)
      if (!c.metadata) {
        errors.push(`chunk[${i}] : metadata manquant.`)
        return
      }
      const m = c.metadata
      if (!m.numero) errors.push(`chunk[${i}] : metadata.numero manquant.`)
      if (!m.domaine) {
        errors.push(`chunk[${i}] : metadata.domaine manquant.`)
      } else if (!DOMAINES.includes(m.domaine as (typeof DOMAINES)[number])) {
        errors.push(`chunk[${i}] : domaine "${m.domaine}" hors taxonomie fermée.`)
      }
      if (!m.article) warnings.push(`chunk[${i}] : metadata.article vide.`)
      if (circ?.statut && m.statut && m.statut !== circ.statut) {
        errors.push(`chunk[${i}] : statut ("${m.statut}") ≠ statut circulaire ("${circ.statut}").`)
      }
      if (typeof m.chunk_index === 'number') indices.push(m.chunk_index)
    })
    const expectedTotal = chunks.length
    const sorted = [...indices].sort((a, b) => a - b)
    const expectedSeq = Array.from({ length: expectedTotal }, (_, i) => i)
    if (JSON.stringify(sorted) !== JSON.stringify(expectedSeq)) {
      errors.push(`chunk_index non contigu ou dupliqué : trouvé [${sorted.join(', ')}], attendu [0..${expectedTotal - 1}].`)
    }
    const totals = new Set(chunks.map(c => c.metadata?.total_chunks))
    if (totals.size > 1) {
      errors.push(`total_chunks incohérent entre chunks : ${[...totals].join(', ')}.`)
    } else if (totals.size === 1 && [...totals][0] !== expectedTotal) {
      errors.push(`total_chunks déclaré (${[...totals][0]}) ≠ nombre de chunks fournis (${expectedTotal}).`)
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}
