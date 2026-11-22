// pages/api/tarifs/connexes.ts — « Informations connexes » du module Classement tarifaire SH
//   GET ?code=8703234400
// Rassemble, pour un code du tarif, tout ce que les textes de la base disent du produit :
//   1. références explicites au code (champ nc8_concerne et mentions dans le texte : 8703, 87.03, 8703.23…) ;
//   2. recherche par le sens sur le libellé complet de la position (bases Import-eXPert et LeRef) ;
//   3. décisions de classement portant sur la même position ;
// puis une synthèse courte, classée par rubrique (fiscalité, formalités, normes, origine, change…),
// rédigée uniquement à partir de ces textes, chaque point renvoyant à sa source.
// Accès : comme /api/tarifs/search (module « classement »). Résultat gardé 6 h en mémoire par code.
// Règle du site : la page publique parle de « textes », jamais du fonctionnement de la recherche.
import type { NextApiRequest, NextApiResponse } from 'next'
import { checkAnyModuleAccess } from '../../../lib/apiAuth'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { ajouterLibellesComplets } from '../../../lib/tarifLibelle'
import { rechercher, versSources, contexteDe, claude, type Passage } from '../../../lib/rechercheExperte'

export const config = { maxDuration: 60 }

type Rubrique = { titre: string; points: string[] }
type Reponse = {
  code: string; libelle: string; taux: string | null
  rubriques: Rubrique[]; synthese: string
  sources: { titre: string; extrait: string; base: 'ixp' | 'leref' }[]
  decisions: { code_sh: string; designation: string; circulaire: string | null; date: string | null }[]
  error?: string
}

const CACHE = new Map<string, { t: number; r: Reponse }>()
const DUREE = 6 * 3600e3
const appels = new Map<string, number[]>()
function tropDAppels(cle: string, max = 60) {
  const now = Date.now()
  const l = (appels.get(cle) || []).filter(t => now - t < 3600e3)
  if (l.length >= max) return true
  l.push(now); appels.set(cle, l)
  if (appels.size > 5000) appels.clear()
  return false
}

const RUBRIQUES = [
  'Droits et taxes à l’importation',
  'Formalités, autorisations et contrôles',
  'Normes, étiquetage et sécurité',
  'Origine et accords préférentiels',
  'Change, paiement et commerce extérieur',
  'Classement et points de vigilance',
]

const SYSTEME = `Tu es l'assistant documentaire d'Import-eXPert (importation au Maroc dans toutes ses dimensions : fiscalité à l'import, commerce extérieur, change, normes et contrôles, logistique, douane).
On te donne une position du tarif (code SH et libellé) et des textes entre balises <passage>. Rassemble TOUTES les informations utiles que ces textes donnent sur l'importation de ce produit ou de cette position.
Règles :
- Uniquement à partir des passages fournis ; n'invente ni article, ni circulaire, ni taux, ni montant, ni délai. Ignore un passage qui ne concerne manifestement pas ce produit ou cette position.
- Chaque point est une phrase courte et précise, suivie du numéro de sa source entre crochets : [1] ou [2][4].
- Classe les points dans ces rubriques, dans cet ordre, en n'utilisant que celles pour lesquelles les textes apportent quelque chose : ${RUBRIQUES.map(r => `« ${r} »`).join(', ')}.
- Ne mentionne jamais « passages », « RAG », « IA » ni ton fonctionnement : parle des « textes ».
- Si aucun texte ne concerne ce produit, renvoie une liste de rubriques vide.
Réponds uniquement en JSON, sans commentaire : {"rubriques":[{"titre":"…","points":["… [1]"]}]}`

const chiffres = (s: string) => s.replace(/[^0-9]/g, '')
const fmt = (c: string) => [c.slice(0, 4), c.slice(4, 6), c.slice(6, 8), c.slice(8, 10)].filter(Boolean).join('.')
const sansJoker = (s: string) => s.replace(/[%_,()]/g, ' ')

export default async function handler(req: NextApiRequest, res: NextApiResponse<Reponse | { error: string }>) {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Méthode non autorisée' }) }
  const access = await checkAnyModuleAccess(req, 'classement')
  if (!access.ok) return res.status(access.status).json({ error: access.error })

  const code = chiffres(String(req.query.code || '')).slice(0, 10)
  if (code.length < 4) return res.status(400).json({ error: 'Code SH invalide' })
  const c10 = code.padEnd(10, '0')
  res.setHeader('Cache-Control', 'private, max-age=600')

  const cache = CACHE.get(c10)
  if (cache && Date.now() - cache.t < DUREE) return res.status(200).json(cache.r)
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim()
  if (tropDAppels(ip || 'inconnu')) return res.status(429).json({ error: 'Trop de demandes en peu de temps, réessayez dans quelques minutes.' })

  const db = supabaseAdmin()
  try {
    // ── Position du tarif et libellé complet ──────────────────────────────
    const { data: ligne } = await db.from('tarifs').select('code_sh, designation_clean, taux_raw').eq('code_sh', c10).maybeSingle()
    const [avecLib] = ligne ? await ajouterLibellesComplets(db, [ligne]) : [null]
    const libelle = (avecLib as any)?.libelle_complet || ligne?.designation_clean || ''
    const h4 = c10.slice(0, 4), h6 = c10.slice(0, 6)
    const d4 = `${h4.slice(0, 2)}.${h4.slice(2)}`, d6 = `${h4}.${h6.slice(4)}`
    const chap = Number(h4.slice(0, 2))

    // ── 1. Références explicites au code dans les textes ──────────────────
    const motifs = [
      `nc8_concerne.ilike.%${h4}%`, `nc8_concerne.ilike.%${d4}%`,
      ...(chap >= 10 ? [`nc8_concerne.ilike.%chapitre ${chap}%`] : []),
      `contenu.ilike.%${d6}%`, `contenu.ilike.%${d4}%`, `contenu.ilike.%${h6}%`,
    ]
    const { data: refs } = await db.from('knowledge_chunks')
      .select('titre, type_document, numero, date_document, contenu, nc8_concerne')
      .or(motifs.join(',')).not('contenu', 'is', null).limit(40)
    const precis = (r: any) => {
      const t = `${r.nc8_concerne || ''} ${r.contenu || ''}`
      return t.includes(d6) || t.includes(h6) ? 3 : chiffres(r.nc8_concerne || '').includes(h4) || t.includes(d4) ? 2 : 1
    }
    const explicites: Passage[] = (refs ?? [])
      .map((r: any) => ({ r, p: precis(r) })).sort((a: { p: number }, b: { p: number }) => b.p - a.p).slice(0, 8)
      .map(({ r, p }: { r: any; p: number }) => {
        const ref = [r.type_document, r.numero].filter(Boolean).join(' n° ')
        const t = r.titre || 'Texte'
        return {
          texte: String(r.contenu), lien: '', base: 'ixp' as const, score: 1 + p / 10,
          titre: ref && !t.includes(r.numero || '§§') ? `${ref} — ${t}${r.date_document ? ` (${r.date_document})` : ''}` : t,
        }
      })

    // ── 2. Recherche par le sens sur le libellé ──────────────────────────
    const requete = `${libelle || `position ${fmt(c10)}`} (code SH ${fmt(c10)}) — importation au Maroc : droits et taxes, formalités, autorisations, normes, origine`
    const proches = libelle ? await rechercher(requete, 8).catch(() => [] as Passage[]) : []

    const vus = new Set<string>()
    const passages = [...explicites, ...proches].filter(p => {
      const k = p.texte.slice(0, 200)
      if (vus.has(k)) return false
      vus.add(k); return true
    }).slice(0, 12)

    // ── 3. Décisions de classement sur la même position ───────────────────
    const { data: dec } = await db.from('decisions_classement')
      .select('code_sh, designation, circulaire, date_circulaire')
      .like('code_sh', `${sansJoker(h4)}%`).order('code_sh').limit(40)
    const decisions = (dec ?? [])
      .sort((a: any, b: any) => Number(String(b.code_sh).startsWith(h6)) - Number(String(a.code_sh).startsWith(h6)))
      .slice(0, 12)
      .map((d: any) => ({ code_sh: d.code_sh, designation: d.designation, circulaire: d.circulaire, date: d.date_circulaire }))

    // ── Synthèse par rubrique ─────────────────────────────────────────────
    let rubriques: Rubrique[] = [], synthese = ''
    if (passages.length) {
      const texte = await claude(SYSTEME,
        `${contexteDe(passages, 2500)}\n\nPosition : ${fmt(c10)} — ${libelle || 'libellé non disponible'}${ligne?.taux_raw ? ` (droit d'importation au tarif : ${ligne.taux_raw} %)` : ''}`,
        1800, process.env.RECHERCHE_MODEL_RAPIDE?.trim() || 'claude-haiku-4-5')
      try {
        const j = JSON.parse((texte.match(/\{[\s\S]*\}/) || ['{}'])[0])
        rubriques = (Array.isArray(j.rubriques) ? j.rubriques : [])
          .map((r: any) => ({ titre: String(r.titre || '').trim(), points: (Array.isArray(r.points) ? r.points : []).map((x: any) => String(x).trim()).filter(Boolean) }))
          .filter((r: Rubrique) => r.titre && r.points.length)
      } catch { synthese = texte }
    }

    const r: Reponse = {
      code: c10, libelle, taux: ligne?.taux_raw ?? null, rubriques, synthese,
      sources: versSources(passages).map((s, i) => ({ titre: s.titre, extrait: s.extrait, base: passages[i].base })),
      decisions,
    }
    CACHE.set(c10, { t: Date.now(), r })
    if (CACHE.size > 500) CACHE.delete(CACHE.keys().next().value as string)
    return res.status(200).json(r)
  } catch (e: any) {
    console.error('[API tarifs/connexes]', c10, e?.message)
    return res.status(500).json({ error: 'Informations connexes indisponibles pour le moment.' })
  }
}
