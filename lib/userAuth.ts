/**
 * lib/userAuth.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Gestion auth utilisateurs : hash bcrypt, sessions signées HMAC, accès modules
 * Séparé de adminAuth.ts — cookies et secrets distincts
 *
 * ✅ v2 — Matrice MODULE_ACCESS alignée sur pages/modules/ réels
 *    Corrections : ajout carte-bureauxdouaniers, generateur-docs, mondoscope,
 *    procedures-process ; suppression portnet-tanger et plateformes-portuaires
 *    (pages inexistantes) ; harmonisation durée essai 14 jours.
 */

import crypto from 'crypto'

// ── Constants ─────────────────────────────────────────────────────────────────
export const USER_COOKIE = 'dia_session'
const SECRET             = process.env.USER_SECRET || process.env.ADMIN_SECRET || 'dev-secret'
const SESSION_TTL        = parseInt(process.env.USER_SESSION_TTL || '604800', 10) // 7 jours session
export const TRIAL_TTL_MS = 14 * 24 * 60 * 60 * 1000 // ✅ 14 jours essai (harmonisé avec abonnements.tsx)

// ── Plans et leurs labels ─────────────────────────────────────────────────────
export const PLANS = {
  trial:      { label: 'Essai gratuit 14j', prix: 0,    duree: '14 jours' },
  free:       { label: 'Gratuit',           prix: 0,    duree: 'Illimité' },
  pro:        { label: 'Pro',               prix: 799,  duree: '/mois'    },
  cabinet:    { label: 'Cabinet',           prix: 1990, duree: '/mois'    },
  enterprise: { label: 'Enterprise',        prix: 4990, duree: '/mois'    },
} as const

export type Plan   = keyof typeof PLANS
export type Statut = 'trial' | 'active' | 'suspended' | 'expired' | 'pending'

export interface SessionPayload {
  userId:    string
  email:     string
  plan:      Plan
  statut:    Statut
  trialEnds?: number
  exp:       number
}

// ── Token de session signé HMAC-SHA256 ────────────────────────────────────────
export function createUserToken(payload: Omit<SessionPayload, 'exp'>): string {
  const data    = { ...payload, exp: Date.now() + SESSION_TTL * 1000 }
  const encoded = Buffer.from(JSON.stringify(data)).toString('base64url')
  const sig     = crypto.createHmac('sha256', SECRET).update(encoded).digest('base64url')
  return `${encoded}.${sig}`
}

export function verifyUserToken(token: string | undefined): SessionPayload | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [encoded, sig] = parts

  const expected = crypto.createHmac('sha256', SECRET).update(encoded).digest('base64url')
  try {
    const valid = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    if (!valid) return null
    const payload: SessionPayload = JSON.parse(Buffer.from(encoded, 'base64url').toString())
    if (Date.now() > payload.exp) return null
    return payload
  } catch {
    return null
  }
}

// ── Cookie options ─────────────────────────────────────────────────────────────
export function userCookieOptions(token: string): string {
  const parts = [
    `${USER_COOKIE}=${token}`,
    `Max-Age=${SESSION_TTL}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ]
  if (process.env.NODE_ENV === 'production') parts.push('Secure')
  return parts.join('; ')
}

export function clearUserCookie(): string {
  return `${USER_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`
}

// ── Matrice accès modules ─────────────────────────────────────────────────────
// ⚠️  Miroir de plan_permissions Supabase — mettre à jour ICI et en DB simultanément.
// Codes = derniers segments des routes /modules/{code}
// Référence : pages/modules/*.tsx (38 fichiers au 03/05/2026)
//
// LÉGENDE PLANS :
//   free       → 0 DH  — modules de base, sans IA avancée
//   pro        → 799 DH/mois — opérateurs import/export
//   cabinet    → 1 990 DH/mois — transitaires, cabinets conseil
//   enterprise → 4 990 DH/mois — wildcard, API, intégration ERP
// ─────────────────────────────────────────────────────────────────────────────
const MODULE_ACCESS: Record<Plan, string[]> = {

  // ── TRIAL : accès complet 14 jours ──────────────────────────────────────────
  trial: ['*'],

  // ── FREE : 3 modules consultation uniquement ─────────────────────────────────
  free: [
    'faq',
    'simulateur',
    'glossaire-douanier',
  ],

  // ── PRO : 799 DH/mois — outils opérationnels ────────────────────────────────
  // Modules ciblés : import/export courant, tarifs, tracking, logistique
  pro: [
    // Base
    'faq',
    'simulateur',
    'glossaire-douanier',
    // Opérationnel
    'comparateur',
    'risques',
    'audit',
    'tracking',
    'export',
    'incoterms-shipping',
    'logistique2',
    'veille-reglementaire',
    'vlw',
    // Commerce & données
    'index-commerce',
    'calc-conteneurs',
    'valeur-douane',
    'intelligence-import',
    // Référence
    'carte-bureauxdouaniers',   // ✅ ajouté (page réelle existante)
    'generateur-docs',          // ✅ ajouté (page réelle existante)
  ],

  // ── CABINET : 1 990 DH/mois — expertise douanière complète ──────────────────
  // Tout le plan Pro + modules avancés : classement, analyses, régimes, OEA…
  cabinet: [
    // Héritage Pro
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
    // Expertise avancée
    'classement',
    'decisions-classement', // ✅ ajouté — scindé de classement.tsx
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
    'procedures-process',       // ✅ ajouté (page réelle : RGM)
    'simulateur-fiscal',
    // Marchandises dangereuses & transit
    'autorisations-licences',
    'marquage-warnings',
    'substances-dangereuses',
    'transit-doc-generator',
    // Intelligence globale
    'mondoscope',               // ✅ ajouté (page réelle : GMS)
    // ✅ ajoutés (audit — absents de toute matrice, inaccessibles à tout
    // abonné payant malgré des pages réelles et fonctionnelles) :
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

  // ── ENTERPRISE : 4 990 DH/mois — accès illimité + API ───────────────────────
  enterprise: ['*'],
}

// ── Vérification accès module ─────────────────────────────────────────────────
export function canAccessModule(
  plan:        Plan,
  statut:      Statut,
  moduleCode:  string,
  trialEnds?:  number
): boolean {
  // Compte suspendu ou expiré
  if (statut === 'suspended' || statut === 'expired') return false

  // Trial expiré
  if (statut === 'trial' && trialEnds && Date.now() > trialEnds) return false

  const perms = MODULE_ACCESS[plan] ?? []

  // Wildcard
  if (perms.includes('*')) return true

  // Match exact ou préfixe de route
  return perms.some(p => moduleCode === p || moduleCode.startsWith(p + '/'))
}

// ── Helper : plan minimum requis pour un module ───────────────────────────────
// Utilisé pour afficher le badge "Plan Cabinet requis" dans le sidebar
export function getMinPlanForModule(moduleCode: string): Plan | null {
  const order: Plan[] = ['free', 'pro', 'cabinet', 'enterprise']
  for (const plan of order) {
    const perms = MODULE_ACCESS[plan]
    if (!perms) continue
    if (perms.includes('*')) return plan
    if (perms.some(p => moduleCode === p || moduleCode.startsWith(p + '/'))) return plan
  }
  return null // module non référencé
}