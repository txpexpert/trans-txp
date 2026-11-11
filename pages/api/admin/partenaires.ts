// pages/api/admin/partenaires.ts — programme partenaires (back-office) : création, activation.
import type { NextApiRequest, NextApiResponse } from 'next'
import { COOKIE_NAME, verifyToken } from '../../../lib/adminAuth'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

const TYPES = ['transitaire', 'expert_comptable', 'banque', 'cci', 'federation', 'autre']
const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!verifyToken(req.cookies[COOKIE_NAME])) return res.status(401).json({ error: 'Non autorisé' })
  const db = supabaseAdmin()
  if (req.method === 'POST') {
    const nom = String(req.body?.nom || '').trim().slice(0, 120)
    if (!nom) return res.status(400).json({ error: 'Nom du partenaire requis' })
    const code = slug(String(req.body?.code || nom))
    if (code.length < 3) return res.status(400).json({ error: 'Code trop court (3 caractères minimum)' })
    const type = TYPES.includes(req.body?.type) ? req.body.type : 'autre'
    let user_id: string | null = null
    if (req.body?.email) {
      const { data: u } = await db.from('users').select('id').eq('email', String(req.body.email).toLowerCase().trim()).maybeSingle()
      user_id = u?.id ?? null
    }
    const { data, error } = await db.from('partenaires').insert({ code, nom, type, user_id }).select('*').single()
    if (error) return res.status(400).json({ error: error.code === '23505' ? 'Ce code est déjà utilisé' : error.message })
    return res.status(201).json({ partenaire: data })
  }
  if (req.method === 'PATCH') {
    const { error } = await db.from('partenaires').update({ actif: !!req.body?.actif }).eq('id', String(req.body?.id || ''))
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }
  res.setHeader('Allow', 'POST, PATCH')
  return res.status(405).json({ error: 'Méthode non autorisée' })
}
