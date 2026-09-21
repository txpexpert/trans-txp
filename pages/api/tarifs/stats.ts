// pages/api/tarifs/stats.ts
// Reconstruit sur Supabase — voir search.ts pour le contexte de migration.

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { checkAnyModuleAccess } from '../../../lib/apiAuth'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

interface StatsResponse {
  total: number
  withTaux: number
  chapitres: number
  annee: number
  error?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<StatsResponse>) {
  // ✅ Contrôle d'accès — module 'classement' (Premium+, desktop
  // /modules/classement.tsx et mobile /app/classement.tsx), absent
  // jusqu'ici : cette route répondait à quiconque l'appelait directement.
  const access = await checkAnyModuleAccess(req, 'classement')
  if (!access.ok) {
    return res.status(access.status).json({ total: 0, withTaux: 0, chapitres: 0, annee: new Date().getFullYear(), error: access.error })
  }

  try {
    const supabase = getSupabase()

    const { count: total } = await supabase.from('tarifs').select('*', { count: 'exact', head: true })
    const { count: withTaux } = await supabase.from('tarifs').select('*', { count: 'exact', head: true }).not('taux_droit', 'is', null)
    const { data: chapData } = await supabase.from('tarifs').select('chapitre')
    const chapitres = new Set((chapData ?? []).map(r => r.chapitre)).size
    const { data: anneeData } = await supabase.from('tarifs').select('annee_tarif').order('annee_tarif', { ascending: false }).limit(1)

    return res.status(200).json({
      total: total ?? 0,
      withTaux: withTaux ?? 0,
      chapitres,
      annee: anneeData?.[0]?.annee_tarif ?? new Date().getFullYear(),
    })
  } catch (err) {
    console.error('[API tarifs/stats]', err)
    return res.status(500).json({ total: 0, withTaux: 0, chapitres: 0, annee: new Date().getFullYear(), error: 'Erreur base de données' })
  }
}
