/**
 * lib/moduleAccess.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Logique pure de plans / accès modules — AUCUNE dépendance Node (pas de
 * 'crypto', pas de bcrypt). Extrait de userAuth.ts pour être importable
 * depuis l'Edge Runtime (middleware.ts), qui ne supporte pas les modules
 * Node natifs. userAuth.ts réexporte tout ce fichier pour compatibilité.
 */

export const USER_COOKIE = 'dia_session'
export const TRIAL_TTL_MS = 14 * 24 * 60 * 60 * 1000 // 14 jours essai — harmonisé avec pages/abonnements.tsx

// ── Plans et leurs labels ─────────────────────────────────────────────────────
export const PLANS = {
  trial:      { label: 'Essai gratuit 14j', prix: 0,    duree: '14 jours' },
  free:       { label: 'Gratuit',           prix: 0,    duree: 'Illimité' },
  pro:        { label: 'Pro',               prix: 799,  duree: '/mois'    },
  premium:    { label: 'Premium',           prix: 1990, duree: '/mois'    },
  enterprise: { label: 'Enterprise',        prix: 4990, duree: '/mois'    },
} as const

export type Plan   = keyof typeof PLANS
export type Statut = 'trial' | 'active' | 'suspended' | 'expired' | 'pending'

// ── Matrice accès modules ─────────────────────────────────────────────────────
const MODULE_ACCESS: Record<Plan, string[]> = {

  trial: ['*'],

  free: [
    'faq',
    'simulateur',

    'glossaire-douanier',
  ],

  pro: [
    'faq',
    'simulateur',
    'glossaire-douanier',
    'comparateur',
    'risques',
    'audit',
    'tracking',
    'export',
    'incoterms-shipping',
    'logistique2',
    'veille-reglementaire',
    'vlw',
    'index-commerce',
    'calc-conteneurs',
    'valeur-douane',
    'intelligence-import',
    'carte-bureauxdouaniers',
    'generateur-docs',
    'chat-homepage', // ✅ module chat — réservé aux comptes abonnés (trial ou payant)
  ],

  premium: [
    'faq',
    'simulateur',
    'glossaire-douanier',
    'comparateur',
    'risques',
    'audit',

    'tracking',
    'export',
    'incoterms-shipping',
    'logistique2',
    'veille-reglementaire',
    'vlw',
    'index-commerce',
    'calc-conteneurs',
    'valeur-douane',
    'intelligence-import',
    'carte-bureauxdouaniers',
    'generateur-docs',
    'chat-homepage', // ✅ module chat — réservé aux comptes abonnés (trial ou payant)
    'classement',
    'decisions-classement',
    'analyses',
    'oea',
    'origine-aleca',
    'facilitation',
    'regimes-economiques',
    'documents-sh',
    'intelligence-fiscale',
    'intelligence-strategique',
    'classificateur',
    'douane-engineering',
    'procedures',
    'procedures-process',
    'simulateur-fiscal',
    'autorisations-licences',
    'marquage-warnings',
    'substances-dangereuses',
    'transit-doc-generator',

    'mondoscope',
    'verificateur-dum',
    'contentieux',
    'conseil',
    'calc-colis-sre',
    'regime-change',
    'surestaries',
    'alertes-fiscales',
    'tic-reference',
    'cgi-fiscal',
    'cgi-search',
  ],

  enterprise: ['*'],
}

// ── Vérification accès module ─────────────────────────────────────────────────
export function canAccessModule(
  plan:        Plan,
  statut:      Statut,
  moduleCode:  string,
  trialEnds?:  number
): boolean {
  if (statut === 'suspended' || statut === 'expired') return false
  if (statut === 'trial' && trialEnds && Date.now() > trialEnds) return false

  const perms = MODULE_ACCESS[plan] ?? []
  if (perms.includes('*')) return true
  return perms.some(p => moduleCode === p || moduleCode.startsWith(p + '/'))
}

// ── Helper : plan minimum requis pour un module ───────────────────────────────

export function getMinPlanForModule(moduleCode: string): Plan | null {
  const order: Plan[] = ['free', 'pro', 'premium', 'enterprise']
  for (const plan of order) {
    const perms = MODULE_ACCESS[plan]
    if (!perms) continue
    if (perms.includes('*')) return plan
    if (perms.some(p => moduleCode === p || moduleCode.startsWith(p + '/'))) return plan
  }
  return null
}