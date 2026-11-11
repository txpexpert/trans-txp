// lib/calculateurDum.ts
// Calculateur « argent laissé sur la table » : lecture d'un export de DUM (CSV),
// rapprochement origine / accords préférentiels et contrôle du taux appliqué
// par rapport au tarif 2026. Tout le calcul se fait dans le navigateur.

export const ACCORDS_IMPORT: { nom: string; pays: string[] }[] = [
  { nom: 'Union européenne (accord d’association)', pays: ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'] },
  { nom: 'AELE', pays: ['CH','NO','IS','LI'] },
  { nom: 'Royaume-Uni (accord d’association)', pays: ['GB'] },
  { nom: 'Türkiye (accord de libre-échange)', pays: ['TR'] },
  { nom: 'États-Unis (accord de libre-échange)', pays: ['US'] },
  { nom: 'Accord d’Agadir', pays: ['EG','JO','TN'] },
  { nom: 'Émirats arabes unis (accord de libre-échange)', pays: ['AE'] },
  { nom: 'Grande zone arabe de libre-échange', pays: ['DZ','SA','QA','KW','BH','OM','IQ','LB','SY','PS','LY','SD','YE'] },
]

const NOMS: Record<string, string> = {
  autriche:'AT',belgique:'BE',bulgarie:'BG',croatie:'HR',chypre:'CY','republique tcheque':'CZ',tchequie:'CZ',danemark:'DK',estonie:'EE',finlande:'FI',
  france:'FR',allemagne:'DE',grece:'GR',hongrie:'HU',irlande:'IE',italie:'IT',lettonie:'LV',lituanie:'LT',luxembourg:'LU',malte:'MT','pays-bas':'NL','pays bas':'NL',hollande:'NL',
  pologne:'PL',portugal:'PT',roumanie:'RO',slovaquie:'SK',slovenie:'SI',espagne:'ES',suede:'SE',suisse:'CH',norvege:'NO',islande:'IS',liechtenstein:'LI',
  'royaume-uni':'GB','royaume uni':'GB','grande-bretagne':'GB',angleterre:'GB',uk:'GB',turquie:'TR',turkiye:'TR','etats-unis':'US','etats unis':'US',usa:'US',
  egypte:'EG',jordanie:'JO',tunisie:'TN','emirats arabes unis':'AE',emirats:'AE',eau:'AE',algerie:'DZ','arabie saoudite':'SA',qatar:'QA',koweit:'KW',bahrein:'BH',
  oman:'OM',irak:'IQ',liban:'LB',syrie:'SY',palestine:'PS',libye:'LY',soudan:'SD',yemen:'YE',chine:'CN',inde:'IN',japon:'JP','coree du sud':'KR',coree:'KR',
  vietnam:'VN','viet nam':'VN',bresil:'BR',indonesie:'ID',thailande:'TH',malaisie:'MY',bangladesh:'BD',pakistan:'PK',russie:'RU',ukraine:'UA',canada:'CA',
  mexique:'MX',argentine:'AR','afrique du sud':'ZA',taiwan:'TW',singapour:'SG','hong kong':'HK',
}
const sansAccent = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

export function codePays(v: string): string | null {
  const s = sansAccent(v || '')
  if (!s) return null
  if (/^[a-z]{2}$/.test(s)) return s.toUpperCase() === 'UK' ? 'GB' : s.toUpperCase()
  return NOMS[s] || null
}
export function accordPour(iso: string | null) {
  return iso ? ACCORDS_IMPORT.find(a => a.pays.includes(iso)) || null : null
}

/** Lecture CSV : séparateur détecté (; , tabulation), guillemets gérés. */
export function lireCsv(texte: string): string[][] {
  const t = texte.replace(/^﻿/, '')
  const premiere = t.split(/\r?\n/)[0] || ''
  const sep = [';', '\t', ','].map(c => [c, premiere.split(c).length] as [string, number]).sort((a, b) => b[1] - a[1])[0][0]
  const lignes: string[][] = []
  let ligne: string[] = [], champ = '', q = false
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (q) {
      if (c === '"' && t[i + 1] === '"') { champ += '"'; i++ }
      else if (c === '"') q = false
      else champ += c
    } else if (c === '"') q = true
    else if (c === sep) { ligne.push(champ); champ = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++
      ligne.push(champ); champ = ''
      if (ligne.some(x => x.trim() !== '')) lignes.push(ligne)
      ligne = []
    } else champ += c
  }
  ligne.push(champ)
  if (ligne.some(x => x.trim() !== '')) lignes.push(ligne)
  return lignes
}

/** Nombre au format français ou anglais : « 1 234,56 », « 1.234,56 », « 1,234.56 », « 12,5 % ». */
export function nombre(v: string | undefined): number | null {
  if (v == null) return null
  let s = String(v).replace(/[\s  %]|MAD|DH/gi, '')
  if (!s) return null
  if (s.includes(',') && s.includes('.')) s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '')
  else if (s.includes(',')) s = s.replace(',', '.')
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : null
}

export type Colonnes = { code: number; pays: number; valeur: number; droits: number; taux: number; dum: number; designation: number }
const DEVINE: Record<keyof Colonnes, RegExp> = {
  code: /(code|position|nomenclature|ngp|sh|hs|tarif)/i,
  pays: /(origine|pays|country)/i,
  valeur: /(valeur|value|vd|base)/i,
  droits: /(droit|di\b|duty|montant.*(di|droit))/i,
  taux: /(taux|rate|quotit)/i,
  dum: /(dum|declaration|déclaration|n°|numero|numéro|ref)/i,
  designation: /(designation|désignation|libell|description|marchandise)/i,
}
export function devinerColonnes(entetes: string[]): Colonnes {
  const pris = new Set<number>()
  const out: any = {}
  for (const k of ['taux', 'droits', 'valeur', 'pays', 'code', 'designation', 'dum'] as (keyof Colonnes)[]) {
    const i = entetes.findIndex((h, j) => !pris.has(j) && DEVINE[k].test(h))
    out[k] = i; if (i >= 0) pris.add(i)
  }
  return out
}

export type Ligne = {
  n: number; dum: string; designation: string; code: string; chap: number; iso: string | null; accord: string | null
  valeur: number; droits: number; tauxApplique: number | null; tauxTarif: number | null
  categorie: 'probable' | 'a_etudier' | 'ecart_haut' | 'ecart_bas' | null; gain: number; risque: number; note: string
}

/** Analyse d'une ligne, une fois connu le taux du tarif 2026. */
export function analyser(l: Omit<Ligne, 'categorie' | 'gain' | 'risque' | 'note' | 'accord' | 'chap'>): Ligne {
  const chap = parseInt(l.code.slice(0, 2), 10)
  const acc = accordPour(l.iso)
  const out: Ligne = { ...l, chap, accord: acc?.nom || null, categorie: null, gain: 0, risque: 0, note: '' }
  const applique = l.tauxApplique ?? (l.valeur > 0 ? (l.droits / l.valeur) * 100 : null)
  if (acc && l.droits > 0) {
    const textile = l.iso === 'TR' && chap >= 50 && chap <= 63
    if (chap >= 25 && !textile) {
      out.categorie = 'probable'; out.gain = l.droits
      out.note = 'Produit industriel d’une origine couverte par un accord : droit d’importation payé alors que la préférence peut le réduire à zéro, sous réserve de la preuve d’origine.'
    } else {
      out.categorie = 'a_etudier'; out.gain = l.droits
      out.note = textile ? 'Textile d’origine turque : mesures spécifiques applicables, préférence à vérifier.' : 'Produit agricole ou agroalimentaire : préférence partielle ou contingent, à vérifier selon l’accord.'
    }
    return out
  }
  if (!acc && applique != null && l.tauxTarif != null && l.valeur > 0) {
    if (applique > l.tauxTarif + 0.5) {
      out.categorie = 'ecart_haut'; out.gain = l.valeur * (applique - l.tauxTarif) / 100
      out.note = `Taux appliqué (${applique.toFixed(1).replace('.', ',')} %) supérieur au tarif 2026 (${String(l.tauxTarif).replace('.', ',')} %) : trop-perçu possible ou code SH à revoir.`
    } else if (applique < l.tauxTarif - 0.5) {
      out.categorie = 'ecart_bas'; out.risque = l.valeur * (l.tauxTarif - applique) / 100
      out.note = `Taux appliqué (${applique.toFixed(1).replace('.', ',')} %) inférieur au tarif 2026 (${String(l.tauxTarif).replace('.', ',')} %) : exonération ou régime à justifier, sinon risque de redressement.`
    }
  }
  return out
}

// Exemple fictif (valeurs inventées), codes et taux réels du tarif 2026.
export const EXEMPLE_CSV = `N° DUM;Désignation;Code SH;Pays d'origine;Valeur en douane (MAD);Droit d'importation payé (MAD);Taux appliqué (%)
301-2026-000101;Pompes pour piscines;8413701100;Italie;412000;10300;2,5
301-2026-000102;Supports métalliques (pylônes);7308901000;Espagne;268500;80550;30
301-2026-000103;Compteurs d'électricité;9028301090;Chine;230100;69030;30
301-2026-000104;Robinetterie en laiton;8481800081;Allemagne;158000;27650;17,5
301-2026-000105;Tissus de coton élastiques;5208321000;Turquie;96000;9600;10
301-2026-000106;Édulcorants en comprimés;2106901000;France;54000;5400;10
301-2026-000107;Pneumatiques légers;4011101000;Chine;184000;18400;10
301-2026-000108;Moteurs à embrayage;8501521000;Türkiye;121000;3025;2,5
301-2026-000109;Meubles de bureau en métal;9403201100;Chine;76000;7600;10
301-2026-000110;Machines d'emballage;8422400000;États-Unis;390000;9750;2,5`
