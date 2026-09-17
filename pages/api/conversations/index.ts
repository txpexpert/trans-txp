// pages/api/conversations/index.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { verifyUserToken, USER_COOKIE } from '../../../lib/userAuth'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const session = verifyUserToken(req.cookies[USER_COOKIE])
  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  const { dossierId } = req.query

  let query = supabaseAdmin
    .from('conversations')
    .select('id, title, dossier_id, created_at, updated_at')
    .eq('user_id', session.userId)
    .order('updated_at', { ascending: false })

  if (dossierId) {
    query = query.eq('dossier_id', dossierId as string)
  }

  const { data, error } = await query
  if (error) {
    console.error('Erreur liste conversations:', error)
    return res.status(500).json({ error: 'Échec du chargement' })
  }

  return res.status(200).json({ conversations: data })
}
