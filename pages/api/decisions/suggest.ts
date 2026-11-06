// pages/api/decisions/suggest.ts
// Liste déroulante de la recherche : 8 propositions au plus, sans motivation,
// code SH tronqué. Aucune réponse sans terme de recherche valide.
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { checkAnyModuleAccess } from '../../../lib/apiAuth'
import { checkRate, normalizeQuery } from '../../../lib/decisionsGuard'

const MAX = 8

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Robots-Tag', 'noindex')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée' })

  const access = await checkAnyModuleAccess(req, 'decisions-classement')
  if (!access.ok) return res.status(access.status).json({ error: access.error })

  const rate = await checkRate(req, 'suggest')
  if (!rate.ok) return res.status(429).json({ error: 'Trop de requêtes, réessayez dans un instant.' })

  const nq = normalizeQuery(req.query.q)
  if (!nq) return res.status(200).json({ data: [], more: false })

  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
    let query = supabase.from('decisions_classement').select('id, designation, code_sh')
    if (nq.sh) query = query.like('code_sh', `${nq.q}%`)
    else for (const w of nq.q.split(' ').filter(Boolean).slice(0, 5)) query = query.ilike('designation', `%${w}%`)
    const { data, error } = await query.order('designation').limit(MAX + 1)
    if (error) throw error
    const rows = ((data ?? []) as { id: string; designation: string; code_sh: string }[]).slice(0, MAX).map(d => ({
      id: d.id,
      designation: String(d.designation).length > 110 ? String(d.designation).slice(0, 109) + '…' : d.designation,
      sh: /^\d{10}$/.test(d.code_sh) ? `${d.code_sh.slice(0, 4)}.${d.code_sh.slice(4, 6)}…` : 'SH non précisé',
    }))
    return res.status(200).json({ data: rows, more: (data?.length ?? 0) > MAX })
  } catch (err) {
    console.error('[API decisions/suggest]', err)
    return res.status(500).json({ error: 'Erreur base de données' })
  }
}
