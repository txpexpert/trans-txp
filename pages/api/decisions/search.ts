// pages/api/decisions/search.ts
// ============================================================
// Remplace la lecture statique de public/data/decisions.json —
// permet aux nouvelles décisions ajoutées via le backoffice
// d'apparaître immédiatement, sans redéploiement.
//
// AJOUT — resume était en base mais jamais sélectionné ni renvoyé
// au frontend : la page publique n'affichait donc jamais ce champ.
// ============================================================

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { checkAnyModuleAccess } from '../../../lib/apiAuth'
import { checkRate, normalizeQuery } from '../../../lib/decisionsGuard'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée' })

  // ✅ Contrôle d'accès — module 'decisions-classement' (Premium+, desktop
  // /modules/decisions-classement.tsx et mobile /app/decisions-classement.tsx),
  // absent jusqu'ici : cette route répondait à quiconque l'appelait directement.
  const access = await checkAnyModuleAccess(req, 'decisions-classement')
  if (!access.ok) return res.status(access.status).json({ error: access.error })

  // Anti-extraction : plus de liste complète sans terme de recherche,
  // résultats plafonnés et limite de débit (voir lib/decisionsGuard.ts).
  res.setHeader('Cache-Control', 'no-store')
  const rate = await checkRate(req, 'suggest')
  if (!rate.ok) return res.status(429).json({ error: 'Trop de requêtes, réessayez dans un instant.' })
  const nq = normalizeQuery(req.query.q)
  if (!nq) return res.status(200).json({ data: [], count: 0 })
  const qStr = nq.q

  try {
    const supabase = getSupabase()
    let query = supabase.from('decisions_classement').select('designation, circulaire, code_sh, resume', { count: 'exact' })

    query = nq.sh
      ? query.like('code_sh', `${qStr}%`)
      : query.or(`designation.ilike.%${qStr}%,circulaire.ilike.%${qStr}%`)

    const { data, error, count } = await query.order('created_at', { ascending: false }).limit(20)
    if (error) throw error

    return res.status(200).json({ data: data ?? [], count: count ?? (data?.length ?? 0) })
  } catch (err) {
    console.error('[API decisions/search]', err)
    return res.status(500).json({ error: 'Erreur base de données' })
  }
}
