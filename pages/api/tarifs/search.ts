// pages/api/tarifs/search.ts
// ============================================================
// Reconstruit sur Supabase — remplace la connexion PostgreSQL directe
// (lib/db.ts, DATABASE_URL vers "MTDS") qui n'est plus la cible retenue.
// Les codes SH seront réimportés depuis le fichier Excel consolidé vers
// la nouvelle base Supabase — cette route suppose une table `tarifs`
// avec les colonnes utilisées ci-dessous (voir migration SQL fournie).
//
// Reproduit la logique de l'ancienne fonction Postgres recherche_sh() :
// recherche sur désignation OU code SH, filtre chapitre/niveau, pagination.
// ============================================================

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

export interface TarifResult {
  code_sh: string
  chapitre: string
  designation_clean: string
  taux_droit: number | null
  taux_raw: string | null
  unite_norm: string | null
  est_feuille: boolean
  est_hierarchique: boolean
  niveau: number
}

interface SearchResponse {
  data: TarifResult[]
  count: number
  page: number
  totalPages: number
  error?: string
}

const PAGE_SIZE = 30

export default async function handler(req: NextApiRequest, res: NextApiResponse<SearchResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ data: [], count: 0, page: 0, totalPages: 0, error: 'Method not allowed' })
  }

  const { q = '', chapitre = '', niveau, page = '0' } = req.query
  const pageNum = Math.max(0, parseInt(String(page), 10) || 0)
  const qStr = String(q).trim()
  const chapStr = String(chapitre).trim()
  const niveauNum = niveau ? parseInt(String(niveau), 10) : null

  try {
    const supabase = getSupabase()
    let query = supabase.from('tarifs').select('*', { count: 'exact' })

    if (qStr) {
      // Recherche sur désignation OU code SH — équivalent du OR de recherche_sh()
      query = query.or(`designation_clean.ilike.%${qStr}%,code_sh.ilike.%${qStr}%`)
    }
    if (chapStr) query = query.eq('chapitre', chapStr)
    if (niveauNum !== null) query = query.eq('niveau', niveauNum)

    const from = pageNum * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    const { data, count, error } = await query.order('code_sh', { ascending: true }).range(from, to)

    if (error) throw error

    return res.status(200).json({
      data: (data ?? []) as TarifResult[],
      count: count ?? 0,
      page: pageNum,
      totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
    })
  } catch (err) {
    console.error('[API tarifs/search]', err)
    return res.status(500).json({ data: [], count: 0, page: 0, totalPages: 0, error: 'Erreur base de données' })
  }
}
