// pages/api/conversations/[id]/messages.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { verifyUserToken, USER_COOKIE } from '../../../../lib/userAuth'

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

  const { id } = req.query // conversationId

  // Filtre explicite par user_id : le service_role bypass le RLS, donc
  // c'est CE filtre — pas une policy Postgres — qui empêche un utilisateur
  // de lire les messages d'une conversation qui n'est pas la sienne.
  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('id, role, content, sources, created_at')
    .eq('conversation_id', id)
    .eq('user_id', session.userId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Erreur chargement messages:', error)
    return res.status(500).json({ error: 'Échec du chargement' })
  }

  return res.status(200).json({ messages: data })
}
