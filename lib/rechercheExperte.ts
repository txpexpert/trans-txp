// lib/rechercheExperte.ts
// ─────────────────────────────────────────────────────────────────────────────
// Assistant de recherche (Conseil personnalisé › Consultation express), repris de LeRef :
//   • Réponse rapide : synthèse courte et sourcée, rédigée à partir des seuls textes de la base.
//   • Recherche et dissertation : la demande est enregistrée (table recherches_expertes) ;
//     un brouillon est rédigé à partir des textes (recherche élargie), un expert le relit
//     et le publie dans le backoffice (/backoffice/recherches) ; le client le lit dans
//     « Mon espace » 1 h à 2 h après sa demande et en est avisé par e-mail.
//
// Bases interrogées :
//   1. base Import-eXPert (knowledge_chunks, fonction match_knowledge_chunks) ;
//   2. base LeRef (facultative) si LEREF_RAG_URL et LEREF_RAG_KEY sont définies
//      (fonction match_documents, réglementation générale : fiscalité, changes, investissement…).
//
// Variables facultatives : RECHERCHE_MODEL (claude-sonnet-4-6), RECHERCHE_MODEL_RAPIDE (claude-haiku-4-5),
//   RECHERCHES_PAR_JOUR (5), RECHERCHE_MAX_TOKENS (16000).
// Règle du site : les pages publiques ne parlent que de « textes » et de « guides ».
// ─────────────────────────────────────────────────────────────────────────────
import { supabaseAdmin } from './supabaseAdmin'
import { embedText } from './ingestion'
import { sendEmail } from './email'

export type Passage = { texte: string; titre: string; lien: string; score: number; base: 'ixp' | 'leref' }
export type Source = { titre: string; lien: string; extrait: string }

const env = (k: string, d = '') => (process.env[k] ?? '').trim() || d
export const esc = (s: string) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))

// ── Recherche documentaire ──────────────────────────────────────────────────
function titreIxp(r: any): string {
  const ref = [r.type_document, r.numero].filter(Boolean).join(' n° ')
  const t = r.titre || 'Texte'
  return ref && !t.includes(r.numero || '§§') ? `${ref} — ${t}${r.date_document ? ` (${r.date_document})` : ''}` : t
}

async function rechercherIxp(emb: number[], n: number): Promise<Passage[]> {
  const { data, error } = await supabaseAdmin().rpc('match_knowledge_chunks', { query_embedding: emb, match_threshold: 0.3, match_count: n })
  if (error) throw new Error('recherche : ' + error.message)
  return (data ?? []).filter((r: any) => r.contenu).map((r: any) => ({
    texte: String(r.contenu), titre: titreIxp(r), lien: '', score: Number(r.similarity || 0), base: 'ixp' as const,
  }))
}

async function rechercherLeref(emb: number[], n: number): Promise<Passage[]> {
  const url = env('LEREF_RAG_URL').replace(/\/+$/, ''), cle = env('LEREF_RAG_KEY')
  if (!url || !cle) return []
  const entetes: Record<string, string> = { 'Content-Type': 'application/json', apikey: cle }
  if (cle.startsWith('eyJ')) entetes.Authorization = `Bearer ${cle}`
  try {
    const r = await fetch(`${url}/rest/v1/rpc/match_documents`, {
      method: 'POST', headers: entetes, signal: AbortSignal.timeout(15000),
      body: JSON.stringify({ query_embedding: emb, match_count: n, match_threshold: 0.3 }),
    })
    if (!r.ok) { console.error('[recherche] LeRef', r.status); return [] }
    const l = await r.json()
    return (Array.isArray(l) ? l : []).filter((x: any) => x.contenu).map((x: any) => {
      const m = x.metadata || {}
      const ref = m.paragraphe || m.numero || ''
      const t = x.titre || m.titre || 'Guide LeRef'
      return { texte: String(x.contenu), titre: ref && !t.includes(ref) ? `n° ${ref} — ${t}` : t, lien: '', score: Number(x.similarity || 0), base: 'leref' as const }
    })
  } catch (e: any) { console.error('[recherche] LeRef', e?.message); return [] }
}

/** Recherche dans les deux bases, fusion sans doublon, meilleurs passages d'abord. */
export async function rechercher(question: string, n = 6): Promise<Passage[]> {
  const emb = await embedText(question)
  const [a, b] = await Promise.all([rechercherIxp(emb, n), rechercherLeref(emb, Math.ceil(n / 2))])
  return fusionner([a, b], n)
}

function fusionner(lots: Passage[][], max: number): Passage[] {
  const vus = new Map<string, Passage & { poids: number }>()
  lots.forEach((lot, rang) => lot.forEach((p, i) => {
    const k = p.texte.slice(0, 200)
    const poids = p.score + (rang === 0 ? 0.03 : 0) - i * 0.001
    if (!vus.has(k) || vus.get(k)!.poids < poids) vus.set(k, { ...p, poids })
  }))
  return Array.from(vus.values()).sort((x, y) => y.poids - x.poids).slice(0, max)
}

export const versSources = (ps: Passage[]): Source[] => ps.map(p => ({
  titre: p.titre, lien: p.lien,
  extrait: p.texte.replace(/\s+/g, ' ').slice(0, 160) + (p.texte.length > 160 ? '…' : ''),
}))

export const contexteDe = (ps: Passage[], max = 4000) =>
  ps.map((p, i) => `<passage n="${i + 1}" titre="${p.titre.replace(/"/g, "'")}">\n${p.texte.slice(0, max)}\n</passage>`).join('\n')

// ── Modèle ──────────────────────────────────────────────────────────────────
export async function claude(system: string, content: string, max_tokens: number, modele = env('RECHERCHE_MODEL', 'claude-sonnet-4-6')): Promise<string> {
  const key = env('ANTHROPIC_API_KEY')
  if (!key) throw new Error('ANTHROPIC_API_KEY manquante')
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: modele, max_tokens, system, messages: [{ role: 'user', content }] }),
  })
  const t = await r.text()
  if (!r.ok) throw new Error(`Modèle : ${r.status} ${t.slice(0, 300)}`)
  const j = JSON.parse(t)
  return (j.content || []).filter((c: any) => c.type === 'text').map((c: any) => c.text).join('\n').trim()
}

// ── Réponse rapide ──────────────────────────────────────────────────────────
const SYSTEME_RAPIDE = `Tu es l'assistant de recherche d'Import-eXPert, plateforme consacrée à l'importation au Maroc (douane, commerce extérieur, fiscalité à l'import, change, logistique, normes et contrôles).
Règles :
- Réponds uniquement à partir des passages fournis entre balises <passage>. S'ils ne permettent pas de répondre, dis-le clairement et indique ce qu'il faudrait consulter ; n'invente ni article, ni circulaire, ni taux, ni montant, ni délai.
- Cite tes sources en fin de phrase par leur numéro entre crochets, par exemple [1] ou [2][3].
- Réponds dans la langue de la question (français par défaut), de façon précise et professionnelle.
- Texte brut uniquement : paragraphes séparés par un retour à la ligne, listes avec « - » en début de ligne. Pas de titres, pas de gras, pas de tableau.
- 400 mots au maximum ; appuie la réponse sur 3 à 4 sources parmi les passages fournis.
- Ne mentionne jamais « passages », « RAG », « IA » ni ton fonctionnement : parle des « textes ».
- Termine, si utile, par un rappel que la réponse ne remplace pas la lecture des textes officiels ni l'avis d'un expert sur un cas particulier.`

export async function reponseRapide(question: string) {
  const passages = await rechercher(question, 5)
  const reponse = await claude(SYSTEME_RAPIDE, `${contexteDe(passages) || '(aucun texte trouvé)'}\n\nQuestion : ${question}`, 1200)
  return { reponse, sources: versSources(passages) }
}

// ── Recherche et dissertation ───────────────────────────────────────────────
const SYSTEME_PLAN = `Tu prépares une recherche documentaire en réglementation marocaine de l'importation.
À partir de la question, propose 3 à 5 requêtes de recherche courtes et complémentaires (notions juridiques, régimes, procédures, textes probablement applicables, exceptions et contentieux).
Réponds uniquement en JSON, sans commentaire : {"requetes": ["…", "…"]}`

async function decomposer(question: string): Promise<string[]> {
  try {
    const t = await claude(SYSTEME_PLAN, question, 400, env('RECHERCHE_MODEL_RAPIDE', 'claude-haiku-4-5'))
    const j = JSON.parse((t.match(/\{[\s\S]*\}/) || ['{}'])[0])
    const r = (Array.isArray(j.requetes) ? j.requetes : []).map((x: any) => String(x).trim()).filter(Boolean).slice(0, 5)
    return [question, ...r.filter((x: string) => x.toLowerCase() !== question.toLowerCase())]
  } catch (e: any) {
    console.error('[recherche] décomposition', e?.message)
    return [question]
  }
}

const SYSTEME_DISSERTATION = `Tu es l'assistant de recherche d'Import-eXPert (réglementation marocaine de l'importation : douane, commerce extérieur, fiscalité à l'import, change, logistique, normes et contrôles).
On te demande une ÉTUDE répondant à la question posée, rédigée UNIQUEMENT à partir des textes fournis entre balises <passage>. Ton texte est un brouillon qu'un expert relira avant de l'envoyer au client.

Structure obligatoire (respecte exactement ces marqueurs en début de ligne) :
# <titre de l'étude>
## Introduction
Contexte et intérêt du sujet, notions clés, textes applicables.
Problématique : <une seule question qui structure la réflexion>
Annonce du plan : <une phrase>
## I. <titre de la première partie>
### A. <titre>
### B. <titre>
## II. <titre de la deuxième partie>
(… autant de parties et de sous-parties que le sujet l'exige ; numérotation I, II, III… et A, B, C…)
## Avis et solutions proposées
Avis argumenté, points de vigilance, solutions pratiques et démarches recommandées, chacun rattaché aux textes qui le justifient.
## Sources
Une ligne par source utilisée : - [n] <intitulé et référence exacte du texte (code, article, circulaire, date) telle qu'elle figure dans les textes fournis>

Règles :
- Traite complètement chaque aspect couvert par les textes fournis, sans délayer.
- Chaque affirmation de fond (règle, taux, délai, seuil, autorité, sanction, article) est suivie de sa source entre crochets : [1], [2][5].
- N'utilise AUCUNE connaissance extérieure aux textes fournis. N'invente aucun article, circulaire, taux, montant ni délai. Si un aspect n'est pas couvert, écris-le (« les textes consultés ne précisent pas… »).
- Dans « Sources », ne liste que les textes réellement cités.
- Si les textes fournis sont manifestement insuffisants, rédige une introduction courte expliquant ce qui manque, puis « Sources », et arrête-toi.
- Langue de la question (français par défaut), style juridique clair, paragraphes séparés par une ligne vide ; pas de gras, pas de tableau.
- Ne mentionne jamais « passages », « RAG », « IA » ni ton fonctionnement : parle des « textes ».
- Termine par : « Cette étude ne remplace ni la lecture des textes officiels ni un conseil adapté à une situation particulière. »`

async function dissertation(question: string) {
  const requetes = await decomposer(question)
  const lots = await Promise.all(requetes.map(q => rechercher(q, 8).catch(() => [] as Passage[])))
  const passages = fusionner(lots, 16)
  const reponse = await claude(SYSTEME_DISSERTATION, `${contexteDe(passages, 3500) || '(aucun texte trouvé)'}\n\nSujet : ${question}`, Number(env('RECHERCHE_MAX_TOKENS', '16000')))
  return { reponse, passages, requetes }
}

/** Génère le brouillon d'une demande puis prévient l'équipe pour validation. */
export async function genererBrouillon(id: string, base: string) {
  const db = supabaseAdmin()
  const { data: d } = await db.from('recherches_expertes').select('id, question').eq('id', id).maybeSingle()
  if (!d) return
  try {
    const r = await dissertation(d.question)
    await db.from('recherches_expertes').update({
      statut: 'a_valider', brouillon: r.reponse, sources: versSources(r.passages), recherches: r.requetes,
      erreur: null, genere_at: new Date().toISOString(),
    }).eq('id', id)
    const alerte = env('BILLING_ADMIN_EMAIL')
    if (alerte) await sendEmail({
      to: alerte, subject: 'Import-eXPert — étude à valider',
      html: `<p>Le brouillon d'une demande « Recherche et dissertation » est prêt. Relisez-le, corrigez-le si nécessaire, puis publiez-le pour le client.</p>
        <p style="color:#6b7280">Sujet : ${esc(d.question.slice(0, 300))}</p>
        <p><a href="${base}/backoffice/recherches?id=${id}">Relire et publier</a></p>`,
    })
  } catch (e: any) {
    console.error('[recherche] génération', id, e?.message)
    await db.from('recherches_expertes').update({ statut: 'erreur', erreur: String(e?.message || e).slice(0, 500) }).eq('id', id)
  }
}

/** Poursuit un traitement après l'envoi de la réponse HTTP (waitUntil de Vercel). */
export function enArrierePlan(p: Promise<unknown>): boolean {
  const ctx = (globalThis as any)[Symbol.for('@vercel/request-context')]
  const w = ctx && typeof ctx.get === 'function' && ctx.get() && ctx.get().waitUntil
  if (typeof w === 'function') { w(p); return true }
  return false
}

// ── Vue client et avis ──────────────────────────────────────────────────────
export const visible = (d: any) => ['publiee', 'rejetee'].includes(d.statut) && new Date(d.visible_apres) <= new Date()
export const vueClient = (d: any) => ({
  id: d.id, question: d.question, cree: d.created_at, publiee: visible(d) ? d.publie_at : null, lue: d.lue_at,
  etat: !visible(d) ? 'en_preparation' : d.statut === 'publiee' ? 'disponible' : 'non_traitee',
  note: visible(d) ? d.note_client || null : null,
})

/** E-mail au client dès que la réponse devient visible (sinon, la tâche planifiée s'en charge). */
export async function avisSiVisible(d: any, base: string) {
  if (!d || d.email_envoye_at || new Date(d.visible_apres) > new Date()) return
  const db = supabaseAdmin()
  const { data: u } = await db.from('users').select('email, prenom').eq('id', d.user_id).maybeSingle()
  if (u?.email) {
    const publiee = d.statut === 'publiee'
    await sendEmail({
      to: u.email,
      subject: publiee ? 'Import-eXPert : votre réponse est prête' : 'Import-eXPert : votre demande de recherche',
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;color:#0A0A0A">
        <p>Bonjour${u.prenom ? ' ' + esc(u.prenom) : ''},</p>
        <p>${publiee
          ? 'La réponse à votre requête « Recherche et dissertation », préparée par nos consultants, est prête. Vous pouvez la consulter dans votre tableau de bord, rubrique « Mon espace ».'
          : 'Nos consultants ont examiné votre requête « Recherche et dissertation ». Leur message est disponible dans votre tableau de bord, rubrique « Mon espace ».'}</p>
        <p style="color:#6b7280">Votre demande : ${esc(String(d.question).slice(0, 300))}</p>
        <p><a href="${base}/mon-espace#recherches" style="background:#0A0A0A;color:#E8C97A;padding:10px 18px;text-decoration:none;display:inline-block">Ouvrir Mon espace</a></p></div>`,
    })
  }
  await db.from('recherches_expertes').update({ email_envoye_at: new Date().toISOString() }).eq('id', d.id)
}

/** Tâche planifiée : avis des réponses devenues visibles, demandes bloquées en génération. */
export async function runAvisRecherches(base: string) {
  const db = supabaseAdmin()
  const limite = new Date(Date.now() - 20 * 60e3).toISOString()
  await db.from('recherches_expertes').update({ statut: 'erreur', erreur: 'Génération interrompue' }).eq('statut', 'generation').lt('created_at', limite)
  const { data } = await db.from('recherches_expertes').select('*').in('statut', ['publiee', 'rejetee'])
    .is('email_envoye_at', null).lte('visible_apres', new Date().toISOString()).order('visible_apres').limit(50)
  for (const d of data ?? []) await avisSiVisible(d, base)
  return (data ?? []).length
}
