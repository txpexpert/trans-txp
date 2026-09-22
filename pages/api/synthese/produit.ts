// pages/api/synthese/produit.ts
// ============================================================
// Synthèse transversale sur un produit — par désignation ou code SH.
// Interroge les 3 sources de données pertinentes du projet :
//   1) knowledge_chunks (RAG réglementaire — recherche vectorielle,
//      même pipeline que chat-homepage.ts : embedText + match_knowledge_chunks)
//   2) tarifs (référentiel SH — recherche exacte/prefixe ou par désignation)
//   3) decisions_classement (décisions de classement ADII)
// puis demande au modèle une synthèse structurée en sections (jamais de
// texte libre) pour un rendu en liste déroulante côté page.
//
// Règles reprises telles quelles de lib/assistantPrompt.ts (règles 1, 2, 5
// et 6) pour rester cohérent avec l'assistant de la homepage : aucune
// invention, et surtout — référence visible pour une circulaire, jamais
// pour une note (remplacée par une formule neutre).
// ============================================================

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '../../../lib/supabase'
import { embedText } from '../../../lib/ingestion'
import { checkDesktopModuleAccess } from '../../../lib/apiAuth'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

interface Section {
  titre: string
  contenu: string
}

type SyntheseResponse = {
  ok: boolean
  sections?: Section[]
  meta?: { nbChunks: number; nbTarifs: number; nbDecisions: number }
  error?: string
}

function normaliserCodeSh(q: string): string | null {
  const digits = q.replace(/\D/g, '')
  // Une saisie très majoritairement numérique (ex: "8501.32", "0101210000")
  // est traitée comme un code SH plutôt qu'une désignation textuelle.
  return digits.length >= 2 && digits.length >= q.replace(/\s/g, '').length * 0.5 ? digits : null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<SyntheseResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Méthode non autorisée' })
  }

  // ✅ Contrôle d'accès — même module que le reste de la page simulateur-fiscal.
  const access = checkDesktopModuleAccess(req, 'simulateur-fiscal')
  if (!access.ok) return res.status(access.status).json({ ok: false, error: access.error })

  const { query } = req.body as { query?: string }
  const q = (query || '').trim()
  if (!q || q.length < 2) {
    return res.status(400).json({ ok: false, error: 'Désignation ou code SH requis (2 caractères minimum)' })
  }

  const codeSh = normaliserCodeSh(q)

  try {
    // ── 1) Tarifs (référentiel SH) ────────────────────────────────────────
    let tarifsQuery = supabaseAdmin
      .from('tarifs')
      .select('code_sh, chapitre, designation_clean, taux_droit, unite_norm, annee_tarif, est_feuille')
      .limit(10)

    tarifsQuery = codeSh
      ? tarifsQuery.like('code_sh', `${codeSh}%`)
      : tarifsQuery.ilike('designation_clean', `%${q}%`)

    const { data: tarifsRows, error: errTarifs } = await tarifsQuery
    if (errTarifs) console.error('[synthese/produit] tarifs:', errTarifs)
    const tarifs = (tarifsRows ?? []).filter(r => r.est_feuille && r.taux_droit !== null)

    // ── 2) Décisions de classement ADII ───────────────────────────────────
    let decisionsQuery = supabaseAdmin
      .from('decisions_classement')
      .select('designation, circulaire, code_sh, resume')
      .limit(10)

    decisionsQuery = codeSh
      ? decisionsQuery.ilike('code_sh', `%${codeSh}%`)
      : decisionsQuery.or(`designation.ilike.%${q}%,resume.ilike.%${q}%`)

    const { data: decisions, error: errDecisions } = await decisionsQuery
    if (errDecisions) console.error('[synthese/produit] decisions:', errDecisions)

    // ── 3) RAG réglementaire — recherche vectorielle ──────────────────────
    let chunks: Array<{
      contenu: string; titre: string; numero: string | null
      type_document: string | null; similarity: number
    }> = []
    try {
      const embedding = await embedText(q)
      const { data: chunkRows, error: errChunks } = await supabase.rpc('match_knowledge_chunks', {
        query_embedding: embedding,
        match_threshold: 0.3,
        match_count: 10,
      })
      if (errChunks) console.error('[synthese/produit] chunks:', errChunks)
      chunks = chunkRows ?? []
    } catch (embedErr) {
      // L'embedding (OpenAI) est un plus, jamais un point de blocage : si la
      // clé est absente ou l'appel échoue, on continue avec tarifs/décisions.
      console.error('[synthese/produit] embedding échoué (non bloquant):', embedErr)
    }

    const nbTarifs = tarifs.length
    const nbDecisions = (decisions ?? []).length
    const nbChunks = chunks.length

    if (nbTarifs === 0 && nbDecisions === 0 && nbChunks === 0) {
      return res.status(200).json({
        ok: true,
        sections: [{
          titre: 'Aucune information trouvée',
          contenu: `Aucun élément relatif à « ${q} » n'a été trouvé dans la base tarifaire, les décisions de classement ADII ou la base réglementaire du site. Essayez une désignation plus générale, ou vérifiez le code SH saisi.`,
        }],
        meta: { nbChunks, nbTarifs, nbDecisions },
      })
    }

    // ── Construction du contexte fourni au modèle ─────────────────────────
    const blocTarifs = tarifs.length
      ? tarifs.map(t => `- Code SH ${t.code_sh} (chap. ${t.chapitre}) — ${t.designation_clean} — Taux DI : ${t.taux_droit}%${t.annee_tarif ? ' (tarif ' + t.annee_tarif + ')' : ''}`).join('\n')
      : 'Aucune ligne tarifaire trouvée.'

    const blocDecisions = (decisions ?? []).length
      ? (decisions ?? []).map(d => `- [Circulaire ${d.circulaire}] Code SH ${d.code_sh ?? 'n/c'} — ${d.designation}${d.resume ? ' — ' + d.resume : ''}`).join('\n')
      : 'Aucune décision de classement trouvée.'

    const blocChunks = chunks.length
      ? chunks.map((c, i) => {
          const typeLabel = c.type_document?.toLowerCase().includes('circulaire') ? 'circulaire' : 'note'
          return `[Extrait ${i + 1} - ${typeLabel}] ${c.titre}${c.numero ? ' (n° ' + c.numero + ')' : ''}\n${c.contenu}`
        }).join('\n\n---\n\n')
      : 'Aucun extrait réglementaire trouvé.'

    const contexte = `TARIF DOUANIER (SH) :\n${blocTarifs}\n\nDÉCISIONS DE CLASSEMENT ADII :\n${blocDecisions}\n\nBASE RÉGLEMENTAIRE (RAG) :\n${blocChunks}`

    const systemPrompt = `RÔLE
Tu rédiges une synthèse documentaire transversale sur un produit ou un code SH, à partir UNIQUEMENT des extraits fournis ci-dessous (tarif douanier, décisions de classement ADII, base réglementaire). Tu ne réponds pas à une question conversationnelle — tu compiles tout ce qui est connu sur ce produit dans ces trois sources.

RÈGLES ABSOLUES

1. AUCUNE INVENTION : n'ajoute, ne déduis ni n'extrapole aucune donnée absente des extraits fournis. Si une catégorie d'information n'a rien dans les extraits, dis-le explicitement dans une section "Zones d'incertitude" plutôt que de deviner ou de l'omettre silencieusement.

2. AUCUNE SOURCE EXTERNE : base-toi exclusivement sur les extraits fournis, jamais sur des connaissances générales.

3. GESTION DES RÉFÉRENCES DE LA BASE RÉGLEMENTAIRE — règle différenciée :
   - Extrait identifié [circulaire] : affiche la référence exacte (numéro) dans le texte.
   - Extrait identifié [note] : NE JAMAIS afficher son numéro ni son identifiant. Remplace systématiquement la référence par la formule « Selon les procédures appliquées en la matière », sans rupture de style.

4. Les décisions de classement et lignes tarifaires n'ont pas cette restriction — cite leur code SH et circulaire normalement.

5. FORMAT DE SORTIE — réponds UNIQUEMENT avec un objet JSON valide (aucun texte, aucun markdown autour), de cette forme exacte :
{
  "sections": [
    { "titre": "Tarif douanier (SH)", "contenu": "..." },
    { "titre": "Régime(s) douanier(s) concernés", "contenu": "..." },
    { "titre": "Décisions de classement ADII", "contenu": "..." },
    { "titre": "Réglementation applicable", "contenu": "..." },
    { "titre": "Zones d'incertitude / informations non trouvées", "contenu": "..." }
  ]
}
N'inclue une section que si elle a un contenu réel à présenter (sauf "Zones d'incertitude", à inclure systématiquement, même brièvement). Texte brut uniquement dans "contenu" (pas de markdown, pas de puces "*", utilise des tirets simples "-" si besoin d'énumérer). 6 sections maximum.

EXTRAITS DISPONIBLES :
${contexte}`

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        temperature: 0.2,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Produit ou code SH demandé : "${q}"` }],
      }),
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      console.error('[synthese/produit] Erreur Anthropic:', errText)
      return res.status(502).json({ ok: false, error: 'Erreur lors de la génération de la synthèse' })
    }

    const anthropicData = await anthropicRes.json()
    const raw: string = anthropicData?.content?.find((b: { type: string }) => b.type === 'text')?.text ?? ''
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')
    if (start === -1 || end === -1) {
      return res.status(502).json({ ok: false, error: 'Réponse du modèle invalide' })
    }

    let sections: Section[]
    try {
      const parsed = JSON.parse(raw.slice(start, end + 1))
      sections = Array.isArray(parsed.sections) ? parsed.sections : []
    } catch (parseErr) {
      console.error('[synthese/produit] JSON invalide:', raw)
      return res.status(502).json({ ok: false, error: 'Réponse du modèle mal formée' })
    }

    if (sections.length === 0) {
      return res.status(502).json({ ok: false, error: 'Aucune section générée' })
    }

    return res.status(200).json({ ok: true, sections, meta: { nbChunks, nbTarifs, nbDecisions } })
  } catch (err) {
    console.error('[synthese/produit] Erreur serveur:', err)
    return res.status(500).json({ ok: false, error: 'Erreur serveur lors de la synthèse' })
  }
}
