// lib/fichesChamps.ts — champs modifiables d'une fiche produit et nettoyage des entrées.
const TEXTE = ['designation','ref_interne','description','photo_url','unite_tarif','code_sh','libelle_tarif','decision_ref','justification',
  'fournisseur','pays_origine','accord','preuve_origine','devise','incoterm','redevances','controle_mic','dangereuse','marquage','notes','prochaine_revue']
const NOMBRE = ['poids_net_kg','poids_brut_kg','quantite_type','taux_droit','valeur_unitaire','fret','assurance']
const LISTE = ['documents','autres_taxes','textes']

export function nettoyerFiche(b: any) {
  const out: Record<string, any> = {}
  if (!b || typeof b !== 'object') return out
  for (const k of TEXTE) if (k in b) out[k] = b[k] == null || b[k] === '' ? null : String(b[k]).slice(0, 2000)
  for (const k of NOMBRE) if (k in b) { const n = parseFloat(String(b[k]).replace(',', '.')); out[k] = Number.isFinite(n) ? n : null }
  for (const k of LISTE) if (k in b) out[k] = Array.isArray(b[k]) ? b[k].slice(0, 40) : []
  if (out.code_sh) out.code_sh = String(out.code_sh).replace(/[^0-9]/g, '').slice(0, 10)
  return out
}
