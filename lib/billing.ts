// lib/billing.ts
// ─────────────────────────────────────────────────────────────────────────────
// Facturation — types, formats d'affichage et montant en lettres. Aucune
// dépendance serveur : importable côté client (espace client, backoffice,
// documents imprimables).
//
// Formats (migration 0010_facturation.sql) — stockés sans séparateur :
//   abonné     ABIXP2701AA  → affiché ABIXP27.01AA
//   pro-forma  PFIXP27AA01  → affiché PF-IXP27AA01 (= référence de virement)
//   facture    IXP27AA01    → affiché IXP27AA01
//   avoir      AVIXP27AA01  → affiché AV-IXP27AA01
// ─────────────────────────────────────────────────────────────────────────────

/** Taux de TVA par défaut (affichage) — le taux appliqué est celui des paramètres de facturation. */
export const VAT_DEFAULT = 20

export interface BillingSettings {
  site_code:            string
  site_nom:             string
  site_url:             string | null
  raison_sociale:       string
  forme_juridique:      string | null
  capital_social:       string | null
  adresse:              string | null
  ville:                string | null
  pays:                 string
  ice:                  string | null
  if_fiscal:            string | null
  rc:                   string | null
  rc_ville:             string | null
  taxe_professionnelle: string | null
  cnss:                 string | null
  telephone:            string | null
  email_facturation:    string | null
  banque:               string | null
  titulaire_compte:     string | null
  rib:                  string | null
  swift:                string | null
  tva_rate:             number
  delai_paiement_jours: number
  mentions_pied:        string | null
}

/** Champs modifiables depuis le backoffice (paramètres de facturation). */
export const SETTINGS_FIELDS: { key: keyof BillingSettings; label: string; group: string; help?: string }[] = [
  { key: 'raison_sociale',       label: 'Raison sociale',            group: 'Émetteur' },
  { key: 'forme_juridique',      label: 'Forme juridique',           group: 'Émetteur', help: 'ex. SARL, SARL AU, SA' },
  { key: 'capital_social',       label: 'Capital social',            group: 'Émetteur', help: 'ex. 100 000 DH' },
  { key: 'adresse',              label: 'Adresse du siège',          group: 'Émetteur' },
  { key: 'ville',                label: 'Ville',                     group: 'Émetteur' },
  { key: 'telephone',            label: 'Téléphone',                 group: 'Émetteur' },
  { key: 'email_facturation',    label: 'Email de facturation',      group: 'Émetteur', help: 'Expéditeur et contact des documents' },
  { key: 'ice',                  label: 'ICE (15 chiffres)',         group: 'Identifiants fiscaux' },
  { key: 'if_fiscal',            label: 'Identifiant fiscal (IF)',   group: 'Identifiants fiscaux' },
  { key: 'rc',                   label: 'Registre du commerce (n°)', group: 'Identifiants fiscaux' },
  { key: 'rc_ville',             label: 'RC — ville',                group: 'Identifiants fiscaux' },
  { key: 'taxe_professionnelle', label: 'Taxe professionnelle (TP)', group: 'Identifiants fiscaux' },
  { key: 'cnss',                 label: 'CNSS',                      group: 'Identifiants fiscaux' },
  { key: 'banque',               label: 'Banque',                    group: 'Paiement' },
  { key: 'titulaire_compte',     label: 'Titulaire du compte',       group: 'Paiement' },
  { key: 'rib',                  label: 'RIB (24 chiffres)',         group: 'Paiement' },
  { key: 'swift',                label: 'Code SWIFT',                group: 'Paiement' },
  { key: 'delai_paiement_jours', label: 'Validité pro-forma (jours)', group: 'Paiement' },
  { key: 'site_code',            label: 'Code site (3 lettres)',     group: 'Site', help: 'IXP — SIV, LRF, IML pour les autres sites. Ne pas changer en cours d’année.' },
  { key: 'site_nom',             label: 'Nom du site',               group: 'Site' },
  { key: 'site_url',             label: 'URL du site',               group: 'Site' },
  { key: 'mentions_pied',        label: 'Mentions de pied de page',  group: 'Site' },
]

export interface ClientProfile {
  type_client:    'entreprise' | 'particulier' | null
  raison_sociale: string | null
  ice:            string | null
  if_fiscal:      string | null
  rc:             string | null
  adresse:        string | null
  code_postal:    string | null
  ville:          string | null
  pays:           string | null
}

export interface ClientSnapshot extends Partial<ClientProfile> {
  numero_abonne?: string
  nom?:           string | null
  email?:         string
  telephone?:     string | null
}

export interface DocLine {
  designation:      string
  quantite:         number
  unite:            string
  prix_unitaire_ht: number
  total_ht:         number
}

export interface BillingDoc {
  id:                string
  user_id:           string | null
  numero_abonne:     string | null
  plan_code:         string
  years:             number
  status:            'proforma_envoyee' | 'payee' | 'annulee'
  proforma_number:   string | null
  invoice_number:    string | null
  payment_reference: string | null
  amount:            number
  amount_ht:         number | null
  vat_rate:          number | null
  vat_amount:        number | null
  amount_ttc:        number | null
  sent_at:           string | null
  paid_at:           string | null
  issued_at:         string | null
  due_date:          string | null
  period_start:      string | null
  period_end:        string | null
  days_carried:      number
  lines:             DocLine[] | null
  client_snapshot:   ClientSnapshot | null
  issuer_snapshot:   Partial<BillingSettings> | null
  origin:            string
  created_at:        string
  cancelled_at:      string | null
}

export interface Avoir {
  id:              string
  avoir_number:    string
  invoice_id:      string
  invoice_number:  string
  invoice_date:    string | null
  numero_abonne:   string | null
  motif:           string
  amount_ht:       number
  vat_rate:        number
  vat_amount:      number
  amount_ttc:      number
  resiliation:     boolean
  client_snapshot: ClientSnapshot | null
  issuer_snapshot: Partial<BillingSettings> | null
  issued_at:       string
  actor:           string
}

export interface Paiement {
  id:                string
  invoice_id:        string | null
  user_id:           string | null
  numero_abonne:     string | null
  montant:           number | null
  date_valeur:       string | null
  reference_libelle: string | null
  source:            'manuel' | 'client' | 'releve' | 'banque'
  justificatif_path: string | null
  justificatif_nom:  string | null
  statut:            'declare' | 'rapproche' | 'rejete'
  motif_rejet:       string | null
  declare_par:       string | null
  valide_par:        string | null
  valide_le:         string | null
  note:              string | null
  created_at:        string
}

// ── Formats d'affichage ──────────────────────────────────────────────────────

/** ABIXP2701AA → ABIXP27.01AA (les anciens formats sont rendus tels quels). */
export function fmtAbonne(n: string | null | undefined): string {
  if (!n) return '—'
  const m = /^(AB[A-Z]{3}\d{2})(\d{2}[A-Z]{2})$/.exec(n)
  return m ? `${m[1]}.${m[2]}` : n
}

/** PFIXP27AA01 → PF-IXP27AA01 ; AVIXP27AA01 → AV-IXP27AA01 ; IXP27AA01 inchangé. */
export function fmtDocNumber(n: string | null | undefined): string {
  if (!n) return '—'
  const m = /^(PF|AV)([A-Z]{3}\d{2}[A-Z]{2}\d{2})$/.exec(n)
  return m ? `${m[1]}-${m[2]}` : n
}

/** Normalise une référence saisie (espaces, tirets, points, minuscules). */
export function normRef(s: string): string {
  return (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function fmtMAD(n: number | null | undefined): string {
  if (n == null || Number.isNaN(Number(n))) return '—'
  return Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/ | /g, ' ') + ' DH'
}

export function fmtDateLong(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Africa/Casablanca' })
}

export function docTTC(d: Pick<BillingDoc, 'amount_ttc' | 'amount'>): number {
  return Number(d.amount_ttc ?? d.amount)
}

export const DOC_STATUS_LABEL: Record<BillingDoc['status'], string> = {
  proforma_envoyee: 'En attente de paiement',
  payee:            'Payée',
  annulee:          'Annulée',
}

export const PAIEMENT_STATUT_LABEL: Record<Paiement['statut'], string> = {
  declare:   'Justificatif reçu — en cours de vérification',
  rapproche: 'Paiement validé',
  rejete:    'Non accepté',
}

/** Profil suffisant pour émettre une facture. */
export function profileComplete(p: Partial<ClientProfile> & { nom?: string | null; prenom?: string | null }): boolean {
  if (p.type_client === 'entreprise') return !!p.raison_sociale && /^\d{15}$/.test(p.ice || '')
  if (p.type_client === 'particulier') return !!(p.nom || p.prenom)
  return false
}

// ── Montant en lettres (français, dirhams et centimes) ───────────────────────
const UNITS = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix',
  'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf']
const TENS = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante']

function below100(n: number): string {
  if (n < 20) return UNITS[n]
  if (n < 70) {
    const t = Math.floor(n / 10), u = n % 10
    return TENS[t] + (u === 0 ? '' : u === 1 ? '-et-un' : '-' + UNITS[u])
  }
  if (n < 80) return n === 71 ? 'soixante-et-onze' : 'soixante-' + UNITS[n - 60]
  const u = n - 80
  return u === 0 ? 'quatre-vingts' : 'quatre-vingt-' + UNITS[u]
}

function below1000(n: number): string {
  const c = Math.floor(n / 100), r = n % 100
  let s = ''
  if (c === 1) s = 'cent'
  else if (c > 1) s = UNITS[c] + '-cent' + (r === 0 ? 's' : '')
  if (r > 0) s = s ? s + '-' + below100(r) : below100(r)
  return s || 'zéro'
}

function intToWords(n: number): string {
  if (n === 0) return 'zéro'
  const parts: string[] = []
  const millions = Math.floor(n / 1_000_000)
  const thousands = Math.floor((n % 1_000_000) / 1000)
  const rest = n % 1000
  if (millions) parts.push(millions === 1 ? 'un million' : below1000(millions).replace(/-cents$/, '-cent') + ' millions')
  if (thousands) parts.push(thousands === 1 ? 'mille' : below1000(thousands).replace(/s$/, '') + '-mille')
  if (rest) parts.push(below1000(rest))
  return parts.join(' ')
}

/** 6000 → « six mille dirhams » ; 1234.5 → « mille deux-cent-trente-quatre dirhams et cinquante centimes ». */
export function amountInWords(amount: number): string {
  const cents = Math.round(Number(amount) * 100)
  const dh = Math.floor(cents / 100), c = cents % 100
  let s = `${intToWords(dh)} dirham${dh > 1 ? 's' : ''}`
  if (c) s += ` et ${intToWords(c)} centime${c > 1 ? 's' : ''}`
  return s.charAt(0).toUpperCase() + s.slice(1)
}
