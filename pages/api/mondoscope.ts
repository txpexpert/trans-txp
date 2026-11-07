// pages/api/mondoscope.ts
// ============================================================
// Repères de la page Global MondoScope (public/tools/mondoscope-veillestrategique.html
// et sa version intégrée à l'application mobile).
// Source : table Supabase veille_mondoscope (migration 0009), modifiable sans
// redéploiement. Si la table est absente ou vide, repli sur lib/mondoscopeData.json.
// Données publiques datées et sourcées : pas de contrôle d'abonnement, mais
// limite de débit et cache court.
// ============================================================
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { checkRate } from '../../lib/decisionsGuard'
import fallback from '../../lib/mondoscopeData.json'

type Row = { section: string; cle: string; ordre: number; payload: any }

let cache: { data: any; ts: number } | null = null
const TTL = 10 * 60 * 1000

async function fromDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) return null
  const sb = createClient(url, key)
  const { data, error } = await sb
    .from('veille_mondoscope')
    .select('section, cle, ordre, payload')
    .eq('actif', true)
    .order('ordre')
  if (error || !data || !data.length) return null
  const rows = data as Row[]
  const pick = (s: string) => rows.filter(r => r.section === s).map(r => r.payload)
  const maj = rows.find(r => r.section === 'maj')?.payload?.date
  const out = {
    maj: maj || new Date().toISOString().slice(0, 10),
    retenir: pick('retenir'),
    reperes: pick('repere'),
    routes: pick('route'),
    origines: pick('origine'),
    agenda: pick('agenda'),
  }
  if (!out.reperes.length || !out.origines.length) return null
  return out
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const rate = await checkRate(req, 'suggest')
  if (!rate.ok) return res.status(429).json({ error: 'Trop de requêtes, réessayez dans un instant.' })
  if (!cache || Date.now() - cache.ts > TTL) {
    let data: any = null
    try { data = await fromDb() } catch (e) { console.error('[mondoscope] lecture Supabase', e) }
    cache = { data: data || fallback, ts: Date.now() }
  }
  res.setHeader('Cache-Control', 'private, max-age=300')
  return res.status(200).json(cache.data)
}
