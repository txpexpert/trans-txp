// lib/auditReport.ts
// ============================================================
// Génère le rapport narratif complet de l'Audit Douanier à partir
// des réponses de l'utilisateur (answers). Logique pure, aucune
// dépendance réseau — appelable côté client (pages/modules/audit.tsx)
// ou côté serveur si besoin plus tard.
//
// Le contenu éditorial (textes de synthèse, verdicts) vit dans
// content/audit-report-content.json — même patron que
// content/scanner-report-content.json. Pour modifier la formulation
// du rapport, éditer uniquement ce JSON, jamais ce fichier.
// ============================================================

import {
  AUDIT_DOMAINS,
  computeDomainScore,
  computeGlobalScore,
  type Answer,
  type CheckItem,
} from './auditData'
import reportContent from '../content/audit-report-content.json'

type DomainLevelKey = 'critique' | 'ameliorer' | 'conforme'
type GlobalLevelKey = 'critique' | 'modere' | 'conforme'

export interface AuditReportItem {
  id: string
  question: string
  conseil: string
  risque: CheckItem['risque']
  reference?: string
}

export interface AuditReportDomain {
  id: number
  slug: string
  label: string
  icon: string
  color: string
  score: number
  levelKey: DomainLevelKey
  levelLabel: string
  synthese: string
  action: string
  pointsNonConformes: AuditReportItem[]
}

export interface AuditReport {
  intro: string
  globalScore: number
  globalLevelKey: GlobalLevelKey
  globalVerdictLabel: string
  globalSynthese: string
  globalPlan: string
  domaines: AuditReportDomain[]
  genereLe: string
}

// Seuils identiques à getScoreLevel() dans lib/auditData.ts, pour rester cohérent
// avec les couleurs déjà affichées dans l'interface (radar, cartes de domaine).
function domainLevelKey(score: number): DomainLevelKey {
  if (score >= 80) return 'conforme'
  if (score >= 50) return 'ameliorer'
  return 'critique'
}

function globalLevelKey(score: number): GlobalLevelKey {
  if (score >= 80) return 'conforme'
  if (score >= 50) return 'modere'
  return 'critique'
}

const RISQUE_ORDRE: Record<CheckItem['risque'], number> = {
  critique: 0,
  important: 1,
  normal: 2,
}

export function generateAuditReport(answers: Record<string, Answer>): AuditReport {
  const globalScore = computeGlobalScore(answers)
  const gKey = globalLevelKey(globalScore)
  const gContent = reportContent.global[gKey]

  const domaines: AuditReportDomain[] = AUDIT_DOMAINS.map((domain) => {
    const score = computeDomainScore(domain, answers)
    const dKey = domainLevelKey(score)
    const dContent = reportContent.niveauxDomaine[dKey]

    const pointsNonConformes: AuditReportItem[] = domain.items
      .filter((item) => {
        const ans = answers[item.id]
        return ans === 'non' || ans === 'partiel'
      })
      .map((item) => ({
        id: item.id,
        question: item.question,
        conseil: item.conseil,
        risque: item.risque,
        reference: item.reference,
      }))
      // Points critiques en tête de liste, pour prioriser la lecture du rapport
      .sort((a, b) => RISQUE_ORDRE[a.risque] - RISQUE_ORDRE[b.risque])

    return {
      id: domain.id,
      slug: domain.slug,
      label: domain.label,
      icon: domain.icon,
      color: domain.color,
      score,
      levelKey: dKey,
      levelLabel: dContent.label,
      synthese: dContent.synthese.replace(/\{domaine\}/g, domain.label),
      action: dContent.action,
      pointsNonConformes,
    }
  })

  return {
    intro: reportContent.intro,
    globalScore,
    globalLevelKey: gKey,
    globalVerdictLabel: gContent.verdictLabel,
    globalSynthese: gContent.synthese,
    globalPlan: gContent.plan,
    domaines,
    genereLe: new Date().toISOString(),
  }
}
