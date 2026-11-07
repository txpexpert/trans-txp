// ============================================================
// pages/api/calculs/cout-revient.ts
// Moteur unique du simulateur « Coût de revient à l'import »
// (fusion du simulateur de droits et taxes et du simulateur fiscal).
// Les formules restent côté serveur ; la page n'affiche que les résultats.
//
// Actions :
//   search      — recherche tarifaire (code ou désignation), table tarifs
//   complet     — calcul multi-articles, comparaison d'origines, sensibilité au change
//   rapide      — calcul des droits et taxes à partir d'une valeur CAF
//   majoration  — majoration pour paiement non électronique (LF 2025, art. 95)
//   tbi         — taxe sur les bois importés (LF 2025 / LF 2026)
// ============================================================

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { checkDesktopModuleAccess } from '../../../lib/apiAuth'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
}

/* ---------- Référentiels ---------- */
// Origines couvertes par un accord préférentiel (règle simplifiée en attendant
// la table tarifs_preferentiels) ; tx : textiles et habillement à vérifier (Turquie).
const ACCORDS: Record<string, { tx?: boolean }> = {
  UE: {}, AELE: {}, UK: {}, TR: { tx: true }, US: {}, AE: {}, EG: {}, TN: {}, JO: {},
}
// Mesures commerciales tirées des circulaires de la base documentaire.
const MESURES = [
  { pref: ['3904'], orig: 'US', type: 'Antidumping', taux: 5.5, ref: 'Circ. 6537/211', du: '2024-02-01', au: null, statut: 'Maintien provisoire dans l’attente du réexamen' },
  { pref: ['2002909011', '2002909019', '2002909091', '2002909099', '2005993500'], orig: 'EG', type: 'Antidumping', taux: 29.93, ref: 'Circ. 6569/211', du: '2024-05-31', au: '2024-11-30', statut: 'Mesure provisoire de 6 mois' },
  { pref: ['85166000', '851660'], orig: 'TR', type: 'Antidumping', taux: null, ref: 'Circ. 6577/211', du: '2024-06-25', au: '2024-12-24', statut: 'Taux variable selon l’exportateur (annexe de la circulaire)' },
]
const TPI = 0.0025          // Taxe parafiscale à l'importation (décret 2-94-734 ; exclusion : circ. 5970/211)
const TBI_2026 = 0.06       // Taxe sur les bois importés, taux unique 2026 (circ. 6702/210)
const MAJ_TAUX = 0.01, MAJ_MIN = 1000 // Paiement non électronique (LF 2025, art. 95)

const n = (v: any) => { const x = parseFloat(v); return isFinite(x) ? x : 0 }

function tauxPref(code: string, orig: string): number | null {
  const a = ACCORDS[orig]; if (!a) return null
  const ch = parseInt(code.slice(0, 2), 10)
  if (ch >= 25) return (a.tx && ch >= 50 && ch <= 63) ? null : 0
  return null // produits agricoles : protocole propre à chaque accord
}

function mesures(code: string, orig: string) {
  const today = new Date().toISOString().slice(0, 10)
  return MESURES.filter(m => m.orig === orig && m.pref.some(p => code.startsWith(p)))
    .map(m => ({ ...m, expiree: !!(m.au && m.au < today) }))
}

function calcComplet(S: any, orig: string, txMult = 1) {
  const tx = n(S.tx) * txMult
  const arts = (S.arts || []).filter((a: any) => a.code && a.taux != null && n(a.val) > 0)
  if (!arts.length) return null
  const inco = String(S.inco || 'FOB')
  const totVal = arts.reduce((s: number, a: any) => s + n(a.val), 0)
  const add = (['EXW', 'FCA'].includes(inco) ? n(S.pre) : 0)
    + (['CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU'].includes(inco) ? 0 : n(S.fret))
    + (['CIF', 'CIP', 'DAP', 'DPU'].includes(inco) ? 0 : n(S.ass))
    - (['DAP', 'DPU'].includes(inco) ? n(S.post) : 0)
  const tvaRate = n(S.tva) / 100
  const lines = arts.map((a: any) => {
    const code = String(a.code)
    const vd = (n(a.val) + add * n(a.val) / totVal) * tx
    const p = tauxPref(code, orig)
    const tDI = p != null ? p : n(a.taux)
    const di = vd * tDI / 100
    const q = n(a.qte)
    const tic = a.ticMode === 'ad_valorem' ? vd * n(a.ticVal) / 100 : a.ticMode === 'specifique' ? q * n(a.ticVal) : 0
    const ch = code.slice(0, 2)
    const tbi = (ch === '44' || (ch === '94' && a.bois)) ? vd * TBI_2026 : 0
    const ad = vd * n(a.ad) / 100
    const tpi = (tDI === 0 && tvaRate === 0) ? 0 : vd * TPI
    const baseTva = vd + di + tic + tbi + ad + tpi
    const tva = baseTva * tvaRate
    return { code, des: a.des || '', unite: a.unite || '', ticMode: a.ticMode || '', adTaux: n(a.ad), vd, tDI, pref: p != null, di, tic, tbi, ad, tpi, baseTva, tva, q, net: 0, unit: null as number | null }
  })
  const sum = (k: string) => lines.reduce((s: number, l: any) => s + l[k], 0)
  const vd = sum('vd'), di = sum('di'), tic = sum('tic'), tbi = sum('tbi'), ad = sum('ad'), tpi = sum('tpi'), baseTva = sum('baseTva'), tva = sum('tva')
  const droits = di + tic + tbi + ad + tpi + tva
  const maj = S.elec ? 0 : Math.max(droits * MAJ_TAUX, MAJ_MIN)
  const frais = Object.values(S.frais || {}).reduce((s: number, v: any) => s + n(v), 0) as number
  const brut = vd + droits + maj + frais
  const net = brut - (S.assuj ? tva : 0)
  lines.forEach((l: any) => {
    const share = vd ? l.vd / vd : 0
    l.net = l.vd + l.di + l.tic + l.tbi + l.ad + l.tpi + (S.assuj ? 0 : l.tva) + (maj + frais) * share
    l.unit = l.q ? l.net / l.q : null
  })
  return { lines, vd, di, tic, tbi, ad, tpi, baseTva, tva, droits, maj, frais, brut, net, taux: vd ? (droits + maj) / vd * 100 : 0 }
}

async function search(q: string) {
  q = q.trim()
  if (q.length < 2) return []
  const digits = q.replace(/[\s.]/g, '')
  const supabase = getSupabase()
  let query = supabase.from('tarifs').select('code_sh, designation_clean, taux_droit, unite_norm').eq('est_feuille', true).not('taux_droit', 'is', null)
  if (/^\d+$/.test(digits)) query = query.like('code_sh', `${digits}%`)
  else query = query.ilike('designation_clean', `%${q.replace(/[%,()]/g, ' ')}%`)
  const { data, error } = await query.order('code_sh').limit(12)
  if (error) throw error
  // une ligne par code ; taux aberrants écartés (voir rapport de correction de la table)
  const seen = new Set<string>()
  return (data || []).filter((r: any) => {
    const t = Number(r.taux_droit)
    if (seen.has(r.code_sh) || t < 1 && t !== 0 || t > 300) return false
    seen.add(r.code_sh); return true
  }).slice(0, 10).map((r: any) => ({ code: r.code_sh, des: r.designation_clean, taux: Number(r.taux_droit), unite: r.unite_norm || '' }))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Méthode non autorisée' })
  const access = checkDesktopModuleAccess(req, 'simulateur')
  if (!access.ok) return res.status(access.status).json({ ok: false, error: access.error })

  try {
    const { action, params = {} } = req.body || {}

    if (action === 'search') {
      return res.status(200).json({ ok: true, results: await search(String(params.q || '')) })
    }

    if (action === 'complet') {
      const S = params.state || {}
      const orig = String(S.orig || 'XX')
      const main = calcComplet(S, orig)
      if (!main) return res.status(200).json({ ok: true, main: null })
      const origins = Array.from(new Set([orig, ...((S.cmp || []) as string[])])).slice(0, 3)
      const comp = origins.map(o => { const r = calcComplet(S, o); return { o, di: r.di, net: r.net } })
      const lo = calcComplet(S, orig, 0.95), hi = calcComplet(S, orig, 1.05)
      const alerts = main.lines.map((l: any) => ({ code: l.code, mesures: mesures(l.code, orig) }))
      return res.status(200).json({ ok: true, main, comp, sens: { lo: lo.net, hi: hi.net }, alerts })
    }

    if (action === 'rapide') {
      const caf = n(params.caf)
      if (caf <= 0) return res.status(400).json({ ok: false, error: 'Valeur CAF invalide' })
      const tDI = params.accord === 'pref0' ? 0 : params.accord === 'prefx' ? n(params.tauxPref) : n(params.tauxDI)
      const tva = n(params.tauxTVA) / 100
      const di = caf * tDI / 100
      const tic = params.ticActif ? (params.ticMode === 'ad_valorem' ? caf * n(params.ticTaux) / 100 : n(params.ticTaux) * (n(params.ticQte) || 1)) : 0
      const ad = params.antiActif ? caf * n(params.tauxAnti) / 100 : 0
      const tpi = params.tpiActif && !(tDI === 0 && tva === 0) ? caf * TPI : 0
      const baseTVA = caf + di + tic + ad + tpi
      const TVA = baseTVA * tva
      const total = di + tic + ad + tpi + TVA
      return res.status(200).json({ ok: true, r: { caf, tDI, di, tic, ad, tpi, baseTVA, TVA, total, tauxEffectif: total / caf * 100 } })
    }

    if (action === 'majoration') {
      const d = n(params.droits), nb = Math.max(1, Math.floor(n(params.nb)) || 1)
      const unite = Math.max(d * MAJ_TAUX, MAJ_MIN)
      return res.status(200).json({ ok: true, r: { unite, total: unite * nb, minimum: d * MAJ_TAUX < MAJ_MIN, nb } })
    }

    if (action === 'tbi') {
      const v = n(params.caf)
      const taux = String(params.annee) === '2025' ? (params.produit === '44' ? 12 : 6) : 6
      return res.status(200).json({ ok: true, r: { taux, montant: v * taux / 100 } })
    }

    return res.status(400).json({ ok: false, error: 'Action inconnue' })
  } catch (err) {
    console.error('[API cout-revient]', err)
    return res.status(500).json({ ok: false, error: 'Erreur serveur' })
  }
}
