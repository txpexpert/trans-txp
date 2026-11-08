// lib/adminPermissions.ts
// ─────────────────────────────────────────────────────────────────────────────
// Habilitations des administrateurs de type 2 (« gestionnaires »). Aucune
// dépendance serveur : importable côté client. La liste doit rester identique
// à la contrainte admin_accounts_permissions_known (migration 0006).
// ─────────────────────────────────────────────────────────────────────────────

export const PERMISSIONS = [
  { code: 'activer_plans',     label: 'Activer / renouveler un plan',      help: 'Boutons « Activer Pro / Premium / Entreprise » et « Renouveler », paiement reçu.' },
  { code: 'emettre_proformas', label: 'Émettre des pro-formas',            help: 'Mode « En attente de virement » dans la fenêtre d’activation.' },
  { code: 'valider_paiements', label: 'Valider ou annuler une pro-forma',  help: 'Boutons « Valider le paiement » et « Annuler pro-forma ».' },
  { code: 'prolonger',         label: 'Prolonger une échéance',            help: 'Bouton « Prolonger » (geste commercial, sans facture).' },
  { code: 'voir_montants',     label: 'Voir les montants encaissés',       help: 'Tuiles et colonnes de chiffre d’affaires.' },
  { code: 'ingerer_decisions', label: 'Ingérer des décisions de classement', help: 'Onglet « Ingestion Décisions » : import JSON vers decisions_classement.' },
  { code: 'maj_tarif',         label: 'Mettre à jour le tarif SH',         help: 'Onglet « Ingestion Tarif SH » : import des lignes au format unifié.' },
] as const

export type PermissionCode = typeof PERMISSIONS[number]['code']
export const ALL_PERMISSIONS: PermissionCode[] = PERMISSIONS.map(p => p.code)

export type AdminNiveau = 'super' | 'gestionnaire'

/** Ce que l'administrateur connecté a le droit de faire — transmis aux pages. */
export interface AdminCapabilities {
  email:       string
  niveau:      AdminNiveau
  permissions: PermissionCode[]   // super : toutes
}

// Actions de /api/admin/subscriptions → habilitation requise.
// null = réservé au super-administrateur (jamais délégable à un type 2).
export const ACTION_PERMISSION: Record<string, PermissionCode | null> = {
  activate_plan:   'activer_plans',
  create_proforma: 'emettre_proformas',
  confirm_payment: 'valider_paiements',
  cancel_proforma: 'valider_paiements',
  reject_payment:  'valider_paiements',
  resend_proforma: 'emettre_proformas',
  update_profile:  'emettre_proformas',
  create_avoir:    null,
  set_generaladmin: null,
  extend:          'prolonger',
  suspend:         null,
  reactivate:      null,
  delete:          null,
}

export function can(caps: AdminCapabilities | null | undefined, action: string): boolean {
  if (!caps) return false
  if (caps.niveau === 'super') return true
  const perm = ACTION_PERMISSION[action]
  return !!perm && caps.permissions.includes(perm)
}

export function hasPermission(caps: AdminCapabilities | null | undefined, perm: PermissionCode): boolean {
  if (!caps) return false
  return caps.niveau === 'super' || caps.permissions.includes(perm)
}
