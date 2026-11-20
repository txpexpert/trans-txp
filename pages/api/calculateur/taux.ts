// pages/api/calculateur/taux.ts — taux du droit d'importation (tarif 2026) pour une liste de codes SH.
// Utilisé par le calculateur « argent laissé sur la table » : seuls les codes sont envoyés,
// les valeurs et les montants de l'export restent dans le navigateur du visiteur.
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

const vus = new Map<string, number[]>()
function tropDeDemandes(ip: string) {
  const t = Date.now(), l = (vus.get(ip) || []).filter(x => t - x < 600_000)
  l.push(t); vus.set(ip, l)
  return l.length > 20
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'inconnu'
  if (tropDeDemandes(ip)) return res.status(429).json({ error: 'Trop d’analyses en peu de temps, réessayez dans quelques minutes.' })
  const codes: string[] = Array.isArray(req.body?.codes)
    ? Array.from(new Set((req.body.codes as any[]).map(c => String(c).replace(/[^0-9]/g, '')).filter(c => c.length >= 6 && c.length <= 10))).slice(0, 3000) as string[]
    : []
  if (!codes.length) return res.status(400).json({ error: 'Aucun code SH exploitable' })
  const db = supabaseAdmin()
  const dix = codes.map(c => c.padEnd(10, '0'))
  const out: Record<string, { taux: number | null; libelle: string | null }> = {}
  for (let i = 0; i < dix.length; i += 500) {
    const { data, error } = await db.from('tarifs').select('code_sh, taux_droit, designation_clean, est_feuille').in('code_sh', dix.slice(i, i + 500))
    if (error) return res.status(500).json({ error: error.message })
    // Un même code peut figurer à plusieurs niveaux : on retient la ligne tarifaire finale qui porte un taux
    for (const t of (data ?? []).sort((a, z) => Number(!!a.est_feuille) - Number(!!z.est_feuille))) {
      if (t.taux_droit == null && out[t.code_sh]) continue
      out[t.code_sh] = { taux: t.taux_droit != null ? Number(t.taux_droit) : null, libelle: t.designation_clean }
    }
  }
  const taux: Record<string, { taux: number | null; libelle: string | null }> = {}
  codes.forEach((c, i) => { if (out[dix[i]]) taux[c] = out[dix[i]] })
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json({ taux, annee: 2026 })
}
