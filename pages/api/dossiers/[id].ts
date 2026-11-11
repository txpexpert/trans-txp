// pages/api/dossiers/[id].ts — un dossier du compte (lecture) ; annulation (PATCH {statut:'annule'}).
import type { NextApiRequest, NextApiResponse } from 'next'
import { compteAbonne } from '../../../lib/compteAbonne'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const c = await compteAbonne(req)
  if (!c) return res.status(401).json({ error: 'Non connecté' })
  if (!c.abonne) return res.status(403).json({ error: 'Abonnement requis', code: 'ABONNEMENT' })
  const id = String(req.query.id || '')
  if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ error: 'Identifiant invalide' })
  const db = supabaseAdmin()
  const { data: d } = await db.from('dossiers_defendables').select('*').eq('id', id).eq('user_id', c.id).maybeSingle()
  if (!d) return res.status(404).json({ error: 'Dossier introuvable' })
  if (req.method === 'GET') return res.status(200).json({ dossier: d })
  if (req.method === 'PATCH' && req.body?.statut === 'annule') {
    // Un dossier émis n'est jamais modifié : on peut seulement l'annuler (la vérification publique l'indique).
    const { error } = await db.from('dossiers_defendables').update({ statut: 'annule' }).eq('id', id).eq('user_id', c.id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }
  res.setHeader('Allow', 'GET, PATCH')
  return res.status(405).json({ error: 'Méthode non autorisée' })
}
