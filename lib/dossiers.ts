// lib/dossiers.ts
// Dossier défendable : copie figée d'une ou plusieurs fiches produits, horodatée,
// avec un numéro et une empreinte SHA-256. La page publique /verifier/<numéro>
// recalcule l'empreinte à partir de la copie conservée : si quelqu'un modifie le
// document imprimé, l'empreinte ne correspond plus.
import { createHash, randomBytes } from 'crypto'

const CHAMPS_FICHE = ['designation','ref_interne','description','photo_url','poids_net_kg','poids_brut_kg','unite_tarif','quantite_type',
  'code_sh','libelle_tarif','taux_droit','decision_ref','justification','fournisseur','pays_origine','accord','preuve_origine',
  'valeur_unitaire','devise','incoterm','fret','assurance','redevances','controle_mic','dangereuse','marquage','documents',
  'autres_taxes','textes','notes','verifie_le','prochaine_revue','statut','id']

/** Ne garde que les rubriques de la fiche (pas l'identifiant du compte ni les dates techniques). */
export function figerFiche(f: Record<string, any>) {
  const out: Record<string, any> = {}
  for (const k of CHAMPS_FICHE) out[k] = f[k] ?? null
  return out
}

/** JSON à clés triées : la même donnée donne toujours la même chaîne, donc la même empreinte. */
export function canonique(v: any): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v ?? null)
  if (Array.isArray(v)) return '[' + v.map(canonique).join(',') + ']'
  return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canonique(v[k])).join(',') + '}'
}

export function empreinte(d: { numero: string; created_at: string; type: string; titre: string; operation: any; titulaire: any; fiches: any[] }) {
  // created_at normalisé (la base peut renvoyer un format différent de celui envoyé)
  const base = { ...d, created_at: new Date(d.created_at).toISOString() }
  return createHash('sha256').update(canonique(base)).digest('hex')
}

const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function nouveauNumero(date = new Date()) {
  const b = randomBytes(6)
  const suffixe = Array.from(b).map(x => ALPHA[x % ALPHA.length]).join('')
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, '')
  return `IXP-${ymd}-${suffixe}`
}

export { pointsOuverts } from './dossiersClient'
