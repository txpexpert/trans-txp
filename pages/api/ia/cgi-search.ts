// pages/api/ia/cgi-search.ts
// ============================================================
// Proxy serveur — remplace l'appel direct à api.anthropic.com
// depuis cgi-search.html (même faille que CLF : clé absente du
// fichier statique, appel non fonctionnel en l'état).
//
// La recherche locale dans CGI_DB (scoring des articles pertinents)
// reste côté client — c'est légitime, aucune donnée sensible. Seul
// l'appel final au modèle passe désormais par ce proxy.
// ============================================================

import type { NextApiRequest, NextApiResponse } from 'next'
import { checkDesktopModuleAccess } from '../../../lib/apiAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })

  // ✅ Contrôle d'accès — module 'cgi-search' (Premium+), absent jusqu'ici.
  // Particulièrement important ici : cette route consomme le budget
  // ANTHROPIC_API_KEY du site à chaque appel — un accès non authentifié
  // exposait ce coût à quiconque connaissait l'URL.
  const access = checkDesktopModuleAccess(req, 'cgi-search')
  if (!access.ok) return res.status(access.status).json({ error: access.error })

  const { systemPrompt, userMsg } = req.body
  if (!systemPrompt || !userMsg) {
    return res.status(400).json({ error: 'systemPrompt et userMsg requis' })
  }

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5', // à vérifier/actualiser au moment de l'intégration réelle
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMsg }],
      }),
    })
    const data = await resp.json()
    return res.status(200).json(data)
  } catch (err) {
    return res.status(500).json({ error: { message: 'Erreur lors de la requête au modèle' } })
  }
}
