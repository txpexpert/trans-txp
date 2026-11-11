// pages/api/cabinet.ts — licence Cabinet : lien d'invitation d'un transitaire (offre Premium ou Entreprise).
// Ses clients qui créent leur compte par ce lien obtiennent l'offre Découverte étendue (10 fiches), à son nom.
import type { NextApiRequest, NextApiResponse } from 'next'
import { compteAbonne } from '../../lib/compteAbonne'
import { supabaseAdmin } from '../../lib/supabaseAdmin'
import { siteUrl } from '../../lib/adminAuth'

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 22)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const c = await compteAbonne(req)
  if (!c) return res.status(401).json({ error: 'Non connecté' })
  const admin = c.role === 'admin' || c.role === 'generaladmin'
  const eligible = admin || (['premium', 'enterprise'].includes(c.plan) && c.statut === 'active')
  if (!eligible) return res.status(200).json({ eligible: false })
  const db = supabaseAdmin()
  let { data: p } = await db.from('partenaires').select('code, nom, actif').eq('user_id', c.id).maybeSingle()
  if (!p) {
    const { data: u } = await db.from('users').select('raison_sociale, societe, nom, prenom').eq('id', c.id).single()
    const nom = u?.raison_sociale || u?.societe || [u?.prenom, u?.nom].filter(Boolean).join(' ') || 'Votre transitaire'
    const base = slug(nom) || 'cabinet'
    for (let i = 0; i < 5 && !p; i++) {
      const code = i ? `${base}-${Math.floor(100 + Math.random() * 900)}` : base
      const r = await db.from('partenaires').insert({ code: code.length < 3 ? `cab-${code}` : code, nom, type: 'transitaire', user_id: c.id }).select('code, nom, actif').single()
      if (!r.error) p = r.data
    }
  }
  if (!p) return res.status(500).json({ error: 'Lien indisponible' })
  const { count } = await db.from('users').select('id', { count: 'exact', head: true }).eq('parrain_code', p.code)
  return res.status(200).json({ eligible: true, code: p.code, nom: p.nom, lien: `${siteUrl(req)}/p/${p.code}`, invites: count ?? 0 })
}
