// pages/api/mon-espace.ts — synthèse du compte pour la page « Mon espace ».
import type { NextApiRequest, NextApiResponse } from 'next'
import { compteAbonne } from '../../lib/compteAbonne'
import { supabaseAdmin } from '../../lib/supabaseAdmin'
import { veilleCompte } from '../../lib/veille'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée' })
  const c = await compteAbonne(req)
  if (!c) return res.status(401).json({ error: 'Non connecté' })
  const db = supabaseAdmin()
  const [{ data: u }, { data: diag }, fiches, dossiers, partages] = await Promise.all([
    db.from('users').select('prenom, nom, societe, raison_sociale, plan, statut, trial_ends_at, plan_ends_at').eq('id', c.id).single(),
    db.from('diagnostics').select('created_at, exposition_basse, exposition_haute, estimee, indice').eq('user_id', c.id).order('created_at', { ascending: false }).limit(2),
    db.from('fiches_produits').select('id, verifie_le, statut').eq('user_id', c.id),
    db.from('dossiers_defendables').select('id', { count: 'exact', head: true }).eq('user_id', c.id).eq('statut', 'emis'),
    db.from('partages').select('id, statut, pieces').eq('user_id', c.id),
  ])
  let veille = { total: 0, aExaminer: 0 }
  if ((c.abonne || c.decouverte) && fiches.data?.length) {
    try {
      const a = await veilleCompte(c.id)
      const verif = new Map(fiches.data.map(f => [f.id, f.verifie_le]))
      veille = { total: a.length, aExaminer: a.filter(x => x.date_texte && verif.get(x.fiche_id) && x.date_texte > (verif.get(x.fiche_id) as string)).length }
    } catch {}
  }
  const pl = partages.data ?? []
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json({
    abonne: c.abonne, decouverte: c.decouverte, compte: u,
    score: diag ?? [],
    fiches: { total: fiches.data?.length ?? 0, completes: (fiches.data ?? []).filter(f => f.statut === 'complete').length },
    dossiers: dossiers.count ?? 0,
    veille,
    partages: { total: pl.length, ouverts: pl.filter(p => p.statut !== 'clos').length,
      piecesFournies: pl.reduce((s, p) => s + (Array.isArray(p.pieces) ? p.pieces.filter((x: any) => x.etat === 'fournie').length : 0), 0) },
  })
}
