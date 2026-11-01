// lib/pricing.ts
// ─────────────────────────────────────────────────────────────────────────────
// Grille tarifaire — SOURCE UNIQUE pour toutes les pages qui affichent les
// abonnements (pages/abonnements.tsx, pages/tarifs.tsx via lib/suite.ts,
// lib/moduleAccess.ts, backoffice). Aucune dépendance Node : importable depuis
// l'Edge Runtime.
//
// Décision (2026-11-01) : les abonnements sont facturés UNIQUEMENT à l'année.
// Le montant mensuel est affiché à titre de référence (« deux mois offerts »).
// La table Supabase public.subscription_plans reprend ces montants
// (migration supabase/migrations/0004_subscriptions.sql) : en cas de
// changement de prix, modifier les deux.
// ─────────────────────────────────────────────────────────────────────────────

export type PaidPlan = 'pro' | 'premium' | 'enterprise'

export interface PlanPricing {
  label:          string
  /** Montant facturé pour 12 mois, en DH. null = sur contrat. */
  annual:         number | null
  /** Montant mensuel de référence, en DH. null = sur contrat. */
  monthlyRef:     number | null
  /** Mention commerciale sous le prix. */
  note:           string
}

export const PRICING: Record<PaidPlan, PlanPricing> = {
  pro: {
    label:      'Pro',
    annual:     6000,
    monthlyRef: 680,
    note:       'Deux mois offerts',
  },
  premium: {
    label:      'Premium',
    annual:     9000,
    monthlyRef: 970,
    note:       'Deux mois offerts',
  },
  enterprise: {
    label:      'Entreprise',
    annual:     null,
    monthlyRef: null,
    note:       'Option contractuelle. Accès illimité aux ressources et accompagnement personnalisé par l’équipe.',
  },
}

export const BILLING_PERIOD_MONTHS = 12

/** 6000 → "6 000" (espace fine insécable, format fr). */
export function fmtDH(n: number): string {
  return n.toLocaleString('fr-FR').replace(/ | /g, ' ')
}
