// pages/api/decisions/[id].ts
// Fiche d'une seule décision, consultée après sélection dans la liste.
// Quota : LIMITS.detail fiches par compte et par IP.
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { checkAnyModuleAccess } from '../../../lib/apiAuth'
import { checkRate } from '../../../lib/decisionsGuard'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Robots-Tag', 'noindex')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée' })

  const access = await checkAnyModuleAccess(req, 'decisions-classement')
  if (!access.ok) return res.status(access.status).json({ error: access.error })

  const id = String(req.query.id || '')
  if (!UUID.test(id)) return res.status(400).json({ error: 'Identifiant invalide' })

  const rate = await checkRate(req, 'detail')
  res.setHeader('X-Quota-Max', String(rate.max))
  res.setHeader('X-Quota-Remaining', String(rate.remaining))
  res.setHeader('X-Quota-Reset', String(rate.reset))
  if (!rate.ok) return res.status(429).json({ error: 'Limite de consultation atteinte' })

  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
    const { data, error } = await supabase
      .from('decisions_classement')
      .select('designation, circulaire, code_sh, resume, date_circulaire')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Décision introuvable' })
    return res.status(200).json({ data })
  } catch (err) {
    console.error('[API decisions/detail]', err)
    return res.status(500).json({ error: 'Erreur base de données' })
  }
}
