// lib/pricing.ts
// ─────────────────────────────────────────────────────────────────────────────
// Grille tarifaire — SOURCE UNIQUE pour toutes les pages qui affichent les
// abonnements (pages/abonnements.tsx, pages/tarifs.tsx via lib/suite.ts,
// lib/moduleAccess.ts, backoffice). Aucune dépendance Node : importable depuis
// l'Edge Runtime.
//
// Décision (2026-11-07) : prix fixés HORS TAXES, TVA 20 % en sus, facturation
// ANNUELLE uniquement. L'équivalent mensuel TTC est affiché à titre indicatif ;
// aucune remise en % n'est annoncée tant qu'il n'existe pas d'abonnement
// mensuel réellement proposé (prix de référence fictif = pratique trompeuse).
// La table Supabase public.subscription_plans reprend ces montants HT
// (migration 0010_facturation.sql) : en cas de changement, modifier les deux.
// ─────────────────────────────────────────────────────────────────────────────

export type PaidPlan = 'pro' | 'premium' | 'enterprise'

export const VAT_RATE = 20 // %

export interface PlanPricing {
  label:      string
  /** Montant facturé pour 12 mois, HT, en DH. null = sur contrat. */
  annual:     number | null
  /** Montant annuel TTC (calculé). null = sur contrat. */
  annualTTC:  number | null
  /** Équivalent mensuel TTC, indicatif. null = sur contrat. */
  monthlyTTC: number | null
  /** Mention commerciale sous le prix. */
  note:       string
}

const ttc = (ht: number) => Math.round(ht * (100 + VAT_RATE)) / 100

function paid(label: string, annualHT: number): PlanPricing {
  return {
    label,
    annual:     annualHT,
    annualTTC:  ttc(annualHT),
    monthlyTTC: Math.round(ttc(annualHT) / 12),
    note:       'Abonnement annuel',
  }
}

export const PRICING: Record<PaidPlan, PlanPricing> = {
  pro:     paid('Pro', 5000),       // 6 000 TTC · 500 TTC / mois
  premium: paid('Premium', 9000),   // 10 800 TTC · 900 TTC / mois
  enterprise: {
    label:      'Entreprise',
    annual:     null,
    annualTTC:  null,
    monthlyTTC: null,
    note:       'Sur contrat, conditions personnalisées. Accès illimité aux ressources et accompagnement par l’équipe.',
  },
}

export const BILLING_PERIOD_MONTHS = 12

/** 6000 → "6 000" (espace fine insécable, format fr). */
export function fmtDH(n: number): string {
  return n.toLocaleString('fr-FR').replace(/ | /g, ' ')
}

/** « 5 000 DH HT / an · soit 6 000 DH TTC · équivalent 500 DH TTC / mois » */
export function priceLine(plan: PaidPlan): string {
  const p = PRICING[plan]
  if (p.annual == null) return p.note
  // Pas d'équivalent mensuel affiché : abonnement annuel uniquement, payable par virement (décision du 11/11/2026)
  return `DH HT / an · soit ${fmtDH(p.annualTTC!)} DH TTC (TVA ${VAT_RATE} %), facturé à l’année`
}
