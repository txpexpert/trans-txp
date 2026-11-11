// lib/whatsappBot.ts — IXP-Assistant sur WhatsApp. Même base documentaire, même prompt,
// même règle de longueur et même action de fin de réponse que le chat du site
// (pages/api/chat-homepage.ts), sans la mémoire client. Seul le texte de la
// question est envoyé aux modèles : jamais le numéro ni le nom du contact.
import { supabase } from './supabase'
import { embedText } from './ingestion'
import { buildAssistantSystemPrompt, buildRespondTool, RESPOND_TOOL_NAME } from './assistantPrompt'
import { enforceLength, limitsForPlan } from './responseLength'
import { pagesForUser, findPage, contactAction, linkAction, type ChatAction } from './sitePages'
import type { Plan, Statut } from './moduleAccess'

const SITE = () => (process.env.NEXT_PUBLIC_SITE_URL || 'https://import-expert.ma').replace(/\/$/, '')

/** Données identifiantes repérables : email, téléphone, ICE (15 chiffres), RIB (24), CIN. */
export function contientDonneesPersonnelles(t: string): boolean {
  return /[\w.+-]+@[\w-]+\.[\w.]+/.test(t)
    || /(?:\+|00)?212[\s.-]?[5-7](?:[\s.-]?\d){8}\b|\b0[5-7](?:[\s.-]?\d){8}\b/.test(t)
    || /\b\d{15}\b|\b(?:\d[\s]?){24}\b/.test(t)
    || /\b[A-Z]{1,2}\d{5,6}\b/.test(t)
}

// WhatsApp : *gras*, _italique_ ; le modèle peut produire du Markdown.
const versWhatsApp = (t: string) => t.replace(/\*\*(.+?)\*\*/g, '*$1*').replace(/^#{1,6}\s*/gm, '').replace(/^\s*[-•]\s+/gm, '• ')

export async function repondreQuestion(question: string, user: { plan: Plan; statut: Statut; trialEnds?: number }): Promise<string> {
  const embedding = await embedText(question)
  const { data: chunks, error } = await supabase.rpc('match_knowledge_chunks', { query_embedding: embedding, match_threshold: 0.35, match_count: 6 })
  if (error) throw new Error('recherche documentaire : ' + error.message)

  const contexte = (chunks ?? []).map((c: any, i: number) => {
    const type = c.type_document?.toLowerCase().includes('circulaire') ? 'circulaire' : 'note'
    return `[Source ${i + 1} - ${type}] ${c.titre}${c.numero ? ' (n° ' + c.numero + ')' : ''}\n${c.contenu}`
  }).join('\n\n---\n\n')

  const pages = pagesForUser(user.plan, user.statut, user.trialEnds)
  const system = buildAssistantSystemPrompt(user.plan, contexte, pages) +
    `\n\nCANAL : la réponse est lue sur WhatsApp, sur un téléphone. Phrases courtes, pas de tableau, pas de titre.`

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6', max_tokens: 900, system,
      tools: [buildRespondTool(pages)], tool_choice: { type: 'tool', name: RESPOND_TOOL_NAME },
      messages: [{ role: 'user', content: question }],
    }),
  })
  if (!r.ok) throw new Error('Anthropic : ' + (await r.text()).slice(0, 300))
  const data: any = await r.json()
  const out = data?.content?.find((b: any) => b.type === 'tool_use' && b.name === RESPOND_TOOL_NAME)?.input ?? {}
  const brut: string = (typeof out.reponse === 'string' && out.reponse.trim()) || data?.content?.find((b: any) => b.type === 'text')?.text || ''
  if (!brut) return 'Je n’ai pas pu formuler de réponse. Écrivez CONSEILLER pour être mis en relation avec un expert.'

  const texte = enforceLength(brut.replace(/https?:\/\/\S+/g, '').trim(), limitsForPlan(user.plan)).text
  const page = out.action === 'lien' ? findPage(out.page_slug, pages) : null
  const action: ChatAction = page ? linkAction(page) : contactAction(user.plan, user.statut, user.trialEnds)
  return `${versWhatsApp(texte)}\n\n👉 ${action.label} : ${SITE()}${action.url}\n\n_Réponse informative d’IXP-Assistant, qui ne remplace ni une décision de l’ADII ni l’avis d’un professionnel. Écrivez CONSEILLER pour parler à un expert._`
}
