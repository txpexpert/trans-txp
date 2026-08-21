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

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée' })

  const { q = '' } = req.query
  const qStr = String(q).trim()

  try {
    const supabase = getSupabase()
    let query = supabase.from('decisions_classement').select('designation, circulaire, code_sh, resume', { count: 'exact' })

    if (qStr) {
      query = query.or(`designation.ilike.%${qStr}%,circulaire.ilike.%${qStr}%,code_sh.ilike.%${qStr}%`)
    }

    const { data, error, count } = await query.order('created_at', { ascending: false }).limit(500)
    if (error) throw error

    return res.status(200).json({ data: data ?? [], count: count ?? (data?.length ?? 0) })
  } catch (err) {
    console.error('[API decisions/search]', err)
    return res.status(500).json({ error: 'Erreur base de données' })
  }
}
