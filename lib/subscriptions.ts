// lib/subscriptions.ts
// ─────────────────────────────────────────────────────────────────────────────
// Types et libellés partagés par le backoffice (abonnements, utilisateurs,
// dashboard) et l'API /api/admin/subscriptions. Aucune dépendance serveur :
// importable côté client.
// ─────────────────────────────────────────────────────────────────────────────

export interface Subscriber {
  id:             string
  numero_abonne:  string        // identifiant unique, format ABIXP2701AA (affiché ABIXP27.01AA)
  email:          string
  nom:            string | null
  prenom:         string | null
  societe:        string | null
  telephone:      string | null
  profil:         string | null
  plan:           string
  statut:         string
  trial_ends_at:  string | null
  plan_ends_at:   string | null
  created_at:     string | null
  last_login_at:  string | null
  email_verified: boolean
  role:           string | null
  plan_souhaite?:  string | null
  type_client?:    'entreprise' | 'particulier' | null
  raison_sociale?: string | null
  ice?:            string | null
  if_fiscal?:      string | null
  rc?:             string | null
  adresse_facturation?: string | null
  code_postal?:    string | null
  ville?:          string | null
  pays?:           string | null
}

export interface Invoice {
  id:              string
  user_id:         string | null  // NULL si le compte a été supprimé (facture conservée)
  numero_abonne:   string | null
  client_email:    string | null
  plan_code:       string
  years:           number
  amount:          number
  currency:        string
  status:          'proforma_envoyee' | 'payee' | 'annulee'
  proforma_number: string | null
  invoice_number:  string | null
  payment_reference?: string | null
  amount_ht?:      number | null
  vat_amount?:     number | null
  amount_ttc?:     number | null
  period_end?:     string | null
  days_carried?:   number
  origin?:         string
  sent_at:         string | null
  paid_at:         string | null
  created_at:      string
}

export interface SubscriptionEvent {
  id:           string
  numero_abonne: string | null
  user_email:   string | null
  type:         string
  from_plan:    string | null
  to_plan:      string | null
  from_statut:  string | null
  to_statut:    string | null
  plan_ends_at: string | null
  amount:       number | null
  note:         string | null
  actor:        string
  created_at:   string
}

export interface PlanRow {
  code:           string
  label:          string
  price_per_year: number | null
  monthly_ref:    number | null
  note:           string | null
}

export type AdminAction =
  | { action: 'activate_plan';   userId: string; plan: string; years?: number; amount?: number | null; note?: string }
  | { action: 'create_proforma'; userId: string; plan: string; years?: number; amount?: number | null; note?: string }
  | { action: 'confirm_payment'; invoiceId: string; amount: number; dateValeur?: string; reference?: string; paiementId?: string | null; note?: string }
  | { action: 'reject_payment';  paiementId: string; motif: string }
  | { action: 'resend_proforma'; invoiceId: string }
  | { action: 'create_avoir';    invoiceId: string; motif: string; amountHT?: number | null; resilier?: boolean }
  | { action: 'set_generaladmin'; userId: string; on: boolean; note?: string }
  | { action: 'update_profile';  userId: string; profile: Record<string, string> }
  | { action: 'cancel_proforma'; invoiceId: string; note?: string }
  | { action: 'suspend';         userId: string; note?: string }
  | { action: 'reactivate';      userId: string; note?: string }
  | { action: 'extend';          userId: string; days: number; note?: string }
  | { action: 'delete';          userId: string; confirm: string; note?: string }

export interface UserSession {
  id:            string
  numero_abonne: string
  email:         string | null
  session_id:    string
  ip:            string | null
  user_agent:    string | null
  created_at:    string
}

export const PLAN_LABEL: Record<string, string> = {
  trial: 'Essai', free: 'Gratuit', pro: 'Pro', premium: 'Premium', enterprise: 'Entreprise',
}

export const GENERALADMIN = 'generaladmin'

export const STATUT_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  active:    { bg: '#E6F7EE', color: '#1A7A40', label: 'Actif' },
  trial:     { bg: '#EEF4FE', color: '#1A3A9A', label: 'Essai' },
  expired:   { bg: '#F2F2F2', color: '#666',    label: 'Expiré' },
  suspended: { bg: '#FEE8E8', color: '#C0392B', label: 'Suspendu' },
  pending:   { bg: '#FEF5E4', color: '#8A5A10', label: 'En attente' },
}

export const EVENT_LABEL: Record<string, string> = {
  proforma:          'Pro-forma émise',
  paiement_valide:   'Paiement validé — plan activé',
  activation:        'Activation',
  suspension:        'Compte suspendu',
  reactivation:      'Compte réactivé',
  prolongation:      'Échéance prolongée',
  expiration:        'Abonnement expiré',
  proforma_annulee:  'Pro-forma annulée',
  suppression:       'Compte supprimé',
  paiement_declare:  'Justificatif de virement déposé',
  paiement_rejete:   'Paiement non accepté',
  avoir:             'Avoir émis',
  generaladmin:      'Rôle generaladmin',
  profil_facturation:'Profil de facturation mis à jour',
}

export const PAID_PLANS = ['pro', 'premium', 'enterprise'] as const

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** Montant TTC d'une pro-forma / facture (colonne amount = TTC). */
export function invTTC(i: Pick<Invoice, 'amount' | 'amount_ttc'>): number {
  return Number(i.amount_ttc ?? i.amount)
}

export function fmtAmount(n: number | null | undefined): string {
  if (n == null) return '—'
  return Number(n).toLocaleString('fr-FR').replace(/ | /g, ' ') + ' DH'
}

export function displayName(u: Pick<Subscriber, 'prenom' | 'nom' | 'email'>): string {
  const n = [u.prenom, u.nom].filter(Boolean).join(' ').trim()
  return n || u.email
}

/** Date d'échéance pertinente : fin d'abonnement payé, sinon fin d'essai. */
export function endDate(u: Pick<Subscriber, 'plan' | 'plan_ends_at' | 'trial_ends_at'>): string | null {
  return u.plan === 'trial' ? u.trial_ends_at : u.plan_ends_at
}

export function daysLeft(iso: string | null): number | null {
  if (!iso) return null
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
}
