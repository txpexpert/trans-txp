// pages/api/piloter/intel.ts
// ============================================================
// Données des pages Piloter « Intelligence import » et
// « Intelligence stratégique », lues dans Supabase :
//   - tarifs                 → taux du tarif en vigueur par code SH
//   - decisions_classement   → recherche de décisions (12 résultats au plus)
//   - v_mesures_defense, v_textes_recents, v_tarif_changements (migration 0008)
//     → mis à jour automatiquement à chaque ingestion de circulaire ou de tarif
// Accès : module intelligence-import, intelligence-strategique ou analyses ;
// accords-preferentiels pour la seule actualité des accords (a=recent&kind=accords).
// Anti-extraction : jamais de liste complète, recherche obligatoire,
// plafonds de résultats et limite de débit (lib/decisionsGuard.ts).
// ============================================================

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { checkAnyModuleAccess } from '../../../lib/apiAuth'
import { checkRate, normalizeQuery } from '../../../lib/decisionsGuard'

const MAX_DECISIONS = 12
const MAX_CODES = 40

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
}

async function access(req: NextApiRequest) {
  let first = await checkAnyModuleAccess(req, 'intelligence-strategique')
  if (first.ok) return first
  for (const m of ['intelligence-import', 'analyses']) {
    const r = await checkAnyModuleAccess(req, m)
    if (r.ok) return r
  }
  return first
}

type Rate = { code: string; designation: string; taux: number }

/** Taux en vigueur (lignes finales du tarif) pour une liste de codes ou de préfixes SH. */
async function rates(prefixes: string[]): Promise<Record<string, Rate[]>> {
  const clean = Array.from(new Set(prefixes.map(p => p.replace(/\D/g, '')).filter(p => p.length >= 4))).slice(0, MAX_CODES)
  const out: Record<string, Rate[]> = {}
  if (!clean.length) return out
  const sb = db()
  const ors = clean.map(p => (p.length === 10 ? `code_sh.eq.${p}` : `code_sh.like.${p}%`)).join(',')
  const { data, error } = await sb
    .from('tarifs')
    .select('code_sh, designation_clean, taux_droit')
    .not('taux_droit', 'is', null)
    .or(ors)
    .order('code_sh')
    .limit(400)
  if (error) throw error
  for (const p of clean) {
    out[p] = (data ?? [])
      .filter(r => r.code_sh.startsWith(p))
      .slice(0, 8)
      .map(r => ({ code: r.code_sh, designation: r.designation_clean, taux: Number(r.taux_droit) }))
  }
  return out
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée' })
  // L'actualité des accords est aussi lue par la page /accords (module accords-preferentiels)
  let acc = await access(req)
  if (!acc.ok && req.query.a === 'recent' && req.query.kind === 'accords') {
    const r = await checkAnyModuleAccess(req, 'accords-preferentiels')
    if (r.ok) acc = r
  }
  if (!acc.ok) return res.status(acc.status).json({ error: acc.error })
  res.setHeader('Cache-Control', 'no-store')

  const a = String(req.query.a || '')
  const sb = db()
  try {
    // Taux du tarif pour des codes précis (signaux tarifaires, calculateur, fiches)
    if (a === 'taux') {
      const codes = String(req.query.codes || '').split(',')
      return res.status(200).json({ data: await rates(codes) })
    }

    // Compteurs affichés dans la barre de chiffres
    if (a === 'stats') {
      const [{ count: dec }, def] = await Promise.all([
        sb.from('decisions_classement').select('id', { count: 'exact', head: true }).not('code_sh', 'is', null),
        sb.from('v_mesures_defense').select('numero').limit(1000),
      ])
      const nDef = new Set((def.data ?? []).map((r: { numero: string }) => r.numero)).size
      return res.status(200).json({ decisions: dec ?? 0, defense: nDef })
    }

    // Les quatre décisions les plus récentes (aperçu, pas de liste complète)
    if (a === 'latest') {
      const { data, error } = await sb
        .from('decisions_classement')
        .select('designation, circulaire, code_sh, resume')
        .like('code_sh', '__________')
        .order('circulaire', { ascending: false })
        .limit(4)
      if (error) throw error
      const r = await rates((data ?? []).map(d => d.code_sh))
      return res.status(200).json({ data: (data ?? []).map(d => ({ ...d, taux: r[d.code_sh]?.[0]?.taux ?? null })) })
    }

    // Recherche de décisions de classement, avec le taux actuel du code retenu
    if (a === 'decisions') {
      const rate = await checkRate(req, 'suggest')
      if (!rate.ok) return res.status(429).json({ error: 'Trop de requêtes, réessayez dans un instant.' })
      const nq = normalizeQuery(req.query.q)
      const ch = String(req.query.ch || '').replace(/\D/g, '').slice(0, 2)
      if (!nq && ch.length !== 2) return res.status(200).json({ data: [], count: 0 })
      let q = sb.from('decisions_classement').select('designation, circulaire, code_sh, resume', { count: 'exact' }).like('code_sh', '__________')
      if (ch.length === 2) q = q.like('code_sh', `${ch}%`)
      if (nq) q = nq.sh ? q.like('code_sh', `${nq.q}%`) : q.or(`designation.ilike.%${nq.q}%,resume.ilike.%${nq.q}%`)
      const { data, error, count } = await q.order('circulaire', { ascending: false }).limit(MAX_DECISIONS)
      if (error) throw error
      const r = await rates((data ?? []).map(d => d.code_sh))
      return res.status(200).json({
        data: (data ?? []).map(d => ({ ...d, resume: (d.resume || '').slice(0, 220), taux: r[d.code_sh]?.[0]?.taux ?? null })),
        count: count ?? 0,
      })
    }

    // Mesures de défense commerciale (vue v_mesures_defense : type et statut calculés)
    if (a === 'defense') {
      const { data, error } = await sb
        .from('v_mesures_defense')
        .select('numero, titre, date_doc, type_mesure, statut_calcule, echeance, modifie_par')
        .order('date_doc', { ascending: false, nullsFirst: false })
        .limit(200)
      if (error) throw error
      return res.status(200).json({
        data: (data ?? []).map(d => ({ numero: d.numero, titre: d.titre, date: d.date_doc, type: d.type_mesure, statut: d.statut_calcule, echeance: d.echeance, modifie_par: d.modifie_par })),
      })
    }

    // Derniers textes intégrés à la base (mis à jour à chaque ingestion)
    //   kind=accords : accords préférentiels, origine, contingents, ZLECAf
    if (a === 'recent') {
      const kind = String(req.query.kind || '')
      const n = Math.min(12, Math.max(1, parseInt(String(req.query.n || '6'), 10) || 6))
      let q = sb.from('v_textes_recents').select('numero, titre, type_document, domaine, date_doc, extrait').not('date_doc', 'is', null)
      if (kind === 'accords') {
        q = q.or('domaine.eq.Origine des marchandises,titre.ilike.%accord%,titre.ilike.%origine%,titre.ilike.%contingent%,titre.ilike.%ZLECAf%')
      } else if (kind === 'reglementaire') {
        q = q.neq('domaine', 'Tarif et classification')
      }
      const { data, error } = await q.order('date_doc', { ascending: false }).limit(n)
      if (error) throw error
      return res.status(200).json({ data: data ?? [] })
    }

    // Derniers changements de droit enregistrés par l'ingestion du tarif
    if (a === 'changements') {
      const { data, error } = await sb
        .from('v_tarif_changements')
        .select('created_at, code_sh, designation, taux_avant, taux_apres')
        .not('taux_avant', 'is', null)
        .not('taux_apres', 'is', null)
        // lignes non officielles du chapitre 30 (« taux plein », « type 29 »…) : en attente d'audit
        .not('designation', 'ilike', '%taux plein%')
        .not('designation', 'ilike', '%taux général%')
        .not('designation', 'ilike', '%— type%')
        .order('created_at', { ascending: false })
        .order('code_sh')
        .limit(40)
      if (error) throw error
      return res.status(200).json({ data: data ?? [] })
    }

    return res.status(400).json({ error: 'Action inconnue' })
  } catch (err) {
    console.error('[API piloter/intel]', err)
    return res.status(500).json({ error: 'Erreur base de données' })
  }
}
