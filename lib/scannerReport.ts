// lib/scannerReport.ts
// ============================================================
// Génère le rapport de synthèse du Scanner de vulnérabilité douanière
// à partir des 3 réponses et du score déjà calculé (voir
// pages/api/scanner-lead.ts, seule source de vérité pour le score —
// jamais recalculé ici pour éviter toute divergence).
//
// Le contenu éditorial (textes par axe, verdicts par palier) vit dans
// content/scanner-report-content.json. Pour modifier la formulation,
// éditer uniquement ce JSON, jamais ce fichier.
// ============================================================

import reportContent from '../content/scanner-report-content.json'

export type ScannerTier = 'faible' | 'modere' | 'critique'

export interface ScannerReportAxe {
  cle: 'sh' | 'ale' | 'ctrl'
  titre: string
  label: string
  niveau: string
  texte: string
}

export interface ScannerReport {
  score: number
  tier: ScannerTier
  verdictLabel: string
  syntheseGlobale: string
  planAction: string
  axes: ScannerReportAxe[]
}

// Seuils identiques à ceux déjà utilisés côté client pour la jauge visuelle
// (voir updateGauge() dans pages/index.tsx : v-low / v-mid / v-high).
function getTier(score: number): ScannerTier {
  if (score <= 35) return 'faible'
  if (score <= 70) return 'modere'
  return 'critique'
}

export function generateScannerReport(
  reponseSH: string,
  reponseALE: string,
  reponseCtrl: string,
  score: number
): ScannerReport {
  const tier = getTier(score)
  const tierContent = reportContent.tiers[tier]

  const axesData: Array<{ cle: 'sh' | 'ale' | 'ctrl'; reponse: string }> = [
    { cle: 'sh', reponse: reponseSH },
    { cle: 'ale', reponse: reponseALE },
    { cle: 'ctrl', reponse: reponseCtrl },
  ]

  const axes: ScannerReportAxe[] = axesData.map(({ cle, reponse }) => {
    const axeContent = (reportContent.axes as any)[cle]
    const reponseContent = axeContent[reponse]
    return {
      cle,
      titre: axeContent.titre,
      label: reponseContent.label,
      niveau: reponseContent.niveau,
      texte: reponseContent.texte,
    }
  })

  return {
    score,
    tier,
    verdictLabel: tierContent.verdictLabel,
    syntheseGlobale: tierContent.synthese,
    planAction: tierContent.plan,
    axes,
  }
}
