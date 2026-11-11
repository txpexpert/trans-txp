// lib/dossiersClient.ts — fonctions des dossiers utilisables dans le navigateur.
export function pointsOuverts(f: Record<string, any>): string[] {
  const p: string[] = []
  if (!f.code_sh) p.push('Code SH non retenu')
  if (!f.decision_ref) p.push('Décision de classement non vérifiée')
  if (!f.pays_origine || !f.accord) p.push('Origine ou accord non renseignés')
  if (!['oui', 'non'].includes(f.controle_mic)) p.push('Contrôle MIC à vérifier')
  if (!['oui', 'non'].includes(f.dangereuse)) p.push('Statut de marchandise dangereuse non renseigné')
  if (f.marquage !== 'conforme') p.push('Marquage et étiquetage à vérifier')
  if (!Array.isArray(f.documents) || !f.documents.length) p.push('Liste des documents non établie')
  return p
}
