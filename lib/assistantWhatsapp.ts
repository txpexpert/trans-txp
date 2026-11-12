// lib/assistantWhatsapp.ts — réponse d'IXP-Assistant à une question reçue sur WhatsApp.
// Même base documentaire, même consigne et même contrôle de longueur que le chat du site
// (pages/api/chat-homepage.ts). Seul le texte de la question est transmis au modèle :
// ni le numéro ni le nom du contact, et rien n'est conservé de la question ou de la réponse.
import { supabase } from './supabase'
import { embedText } from './ingestion'
import { buildAssistantSystemPrompt, buildRespondTool, RESPOND_TOOL_NAME } from './assistantPrompt'
import { enforceLength, limitsForPlan } from './responseLength'
import { pagesForUser, findPage, contactAction, linkAction } from './sitePages'
import type { Plan, Statut } from './moduleAccess'

export async function repondreWhatsapp(question: string, plan: Plan, statut: Statut, trialEnds: number | undefined, site: string) {
  const vecteur = await embedText(question)
  const { data: chunks } = await supabase.rpc('match_knowledge_chunks', { query_embedding: vecteur, match_threshold: 0.35, match_count: 6 })
  const contexte = (chunks ?? []).map((c: any, i: number) =>
    `[Source ${i + 1} - ${c.type_document?.toLowerCase().includes('circulaire') ? 'circulaire' : 'note'}] ${c.titre}${c.numero ? ' (n° ' + c.numero + ')' : ''}\n${c.contenu}`).join('\n\n---\n\n')
  const pages = pagesForUser(plan, statut, trialEnds)
  const systeme = buildAssistantSystemPrompt(plan, contexte, pages) +
    '\n\nCanal : WhatsApp. Écris en texte simple, sans titres ni tableaux ; *gras* WhatsApp autorisé avec parcimonie. Réponds dans la langue de la question (français ou arabe).'
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6', max_tokens: 900, system: systeme,
      tools: [buildRespondTool(pages)], tool_choice: { type: 'tool', name: RESPOND_TOOL_NAME },
      messages: [{ role: 'user', content: question }],
    }),
  })
  if (!r.ok) throw new Error('Anthropic ' + r.status)
  const d = await r.json()
  const out: { reponse?: string; action?: string; page_slug?: string } = d?.content?.find((b: any) => b.type === 'tool_use')?.input ?? {}
  const brut = (out.reponse || d?.content?.find((b: any) => b.type === 'text')?.text || '').replace(/https?:\/\/\S+/g, '').trim()
  const texte = enforceLength(brut || 'Je n’ai pas trouvé de réponse fiable à cette question.', limitsForPlan(plan)).text
  const page = out.action === 'lien' ? findPage(out.page_slug, pages) : null
  const action = page ? linkAction(page) : contactAction(plan, statut, trialEnds)
  return `${texte}\n\n→ ${action.label.replace(/^Voir la page : /, '')} : ${site}${action.url}`
}
