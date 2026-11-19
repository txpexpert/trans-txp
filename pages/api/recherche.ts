// pages/api/recherche.ts — Assistant de recherche (Conseil personnalisé › Consultation express)
//   POST { question, mode: 'rapide' | 'dissertation' }
//   GET  ?action=demandes            liste des demandes « Recherche et dissertation » du client
//   GET  ?action=demande&id=…        une demande (réponse publiée si visible ; marquée lue)
//   GET  ?action=notifications       réponses visibles non lues (bandeau de Mon espace)
// Accès : essai en cours, offre payante ou administrateur (lib/compteAbonne.ts).
import type { NextApiRequest, NextApiResponse } from 'next'
import { compteAbonne } from '../../lib/compteAbonne'
import { supabaseAdmin } from '../../lib/supabaseAdmin'
import { siteUrl } from '../../lib/adminAuth'
import { reponseRapide, genererBrouillon, enArrierePlan, vueClient, visible } from '../../lib/rechercheExperte'

export const config = { maxDuration: 300 }

const uuid = (v: any) => /^[0-9a-f-]{36}$/i.test(String(v || ''))
const compteurs = new Map<string, number[]>()
function tropDeQuestions(cle: string, max = 30) {
  const now = Date.now()
  const l = (compteurs.get(cle) || []).filter(t => now - t < 3600e3)
  if (l.length >= max) return true
  l.push(now); compteurs.set(cle, l)
  if (compteurs.size > 5000) compteurs.clear()
  return false
}
// Filtre d'entrée : pas de données personnelles dans les questions (CNDP)
const DONNEES_PERSO = /(?:\+212|00212)[\s.-]?[5-7](?:[\s.-]?\d{2}){4}\b|\b0[5-7](?:[\s.-]\d{2}){4}\b|[\w.+-]+@[\w-]+\.[a-z]{2,}|\b\d{24}\b/i

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store')
  const c = await compteAbonne(req)
  if (!c) return res.status(401).json({ error: 'Connectez-vous pour utiliser l’assistant de recherche.', acces: '/auth/login?redirect=/expertise' })
  const db = supabaseAdmin()

  if (req.method === 'GET') {
    const action = String(req.query.action || 'demandes')
    if (action === 'notifications') {
      const { data } = await db.from('recherches_expertes').select('id, question').eq('user_id', c.id).in('statut', ['publiee', 'rejetee'])
        .is('lue_at', null).lte('visible_apres', new Date().toISOString()).order('publie_at', { ascending: false }).limit(5)
      return res.status(200).json({ nombre: data?.length ?? 0, demandes: data ?? [] })
    }
    if (action === 'demande') {
      const id = String(req.query.id || '')
      if (!uuid(id)) return res.status(400).json({ error: 'Demande inconnue' })
      const { data: d } = await db.from('recherches_expertes').select('*').eq('id', id).eq('user_id', c.id).maybeSingle()
      if (!d) return res.status(404).json({ error: 'Demande introuvable' })
      const v = visible(d)
      if (v && !d.lue_at) await db.from('recherches_expertes').update({ lue_at: new Date().toISOString() }).eq('id', id)
      return res.status(200).json({ ...vueClient(d), reponse: v && d.statut === 'publiee' ? d.reponse : null, sources: v && d.statut === 'publiee' ? d.sources : [] })
    }
    const { data } = await db.from('recherches_expertes').select('id, question, statut, note_client, created_at, publie_at, lue_at, visible_apres')
      .eq('user_id', c.id).order('created_at', { ascending: false }).limit(50)
    return res.status(200).json({ demandes: (data ?? []).map(vueClient) })
  }

  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'Méthode non autorisée' }) }
  if (!c.abonne) return res.status(403).json({ error: 'L’assistant de recherche est inclus pendant l’essai gratuit et dans les offres payantes.', acces: '/tarifs' })

  const question = String(req.body?.question || '').trim()
  const mode = req.body?.mode === 'dissertation' ? 'dissertation' : 'rapide'
  if (question.length < 10) return res.status(400).json({ error: 'Formulez votre question en une phrase au moins.' })
  if (question.length > 2000) return res.status(400).json({ error: 'Question trop longue (2 000 caractères au maximum).' })
  if (DONNEES_PERSO.test(question)) return res.status(400).json({ error: 'Retirez de votre question les données personnelles (téléphone, e-mail, numéro de compte) : elles ne sont pas nécessaires à la recherche.' })
  if (tropDeQuestions(c.id)) return res.status(429).json({ error: 'Trop de questions en peu de temps, réessayez dans quelques minutes.' })

  try {
    if (mode === 'dissertation') {
      const depuis = new Date(Date.now() - 24 * 3600e3).toISOString()
      const { count } = await db.from('recherches_expertes').select('id', { count: 'exact', head: true }).eq('user_id', c.id).gte('created_at', depuis)
      if ((count ?? 0) >= Number(process.env.RECHERCHES_PAR_JOUR || 5))
        return res.status(429).json({ error: 'Vous avez atteint le nombre de demandes de recherche pour 24 heures ; réessayez demain.' })
      const { data: d, error } = await db.from('recherches_expertes').insert({ user_id: c.id, question, statut: 'generation' }).select('id').single()
      if (error || !d) throw new Error(error?.message || 'enregistrement impossible')
      const p = genererBrouillon(d.id, siteUrl(req))
      if (!enArrierePlan(p)) await p
      return res.status(202).json({ mode, demande: d.id,
        message: 'Votre requête sera traitée par nos consultants. La réponse vous sera affichée dans le tableau de bord de votre session, rubrique « Mon espace » ; un message vous en avisera.' })
    }
    const r = await reponseRapide(question)
    return res.status(200).json({ mode, ...r })
  } catch (e: any) {
    console.error('[recherche]', e?.message || e)
    return res.status(502).json({ error: 'Service momentanément indisponible, réessayez dans un instant.' })
  }
}
