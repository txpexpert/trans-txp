// pages/api/ia/classify.ts
// ============================================================
// Proxy serveur — remplace l'appel direct à api.anthropic.com
// depuis modules-classement-clf.html (clé API absente/exposée
// dans le fichier statique original, corrigé ici).
// Corrige aussi le taux TVA obsolète (7%) présent dans le prompt
// d'origine — CGI 2026 : seulement 20% et 10%.
// ============================================================

import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Méthode non autorisée' })

  const { description, paysOrigine } = req.body

  if (!description || typeof description !== 'string') {
    return res.status(400).json({ ok: false, error: 'Description produit requise' })
  }

  const prompt = `Tu es un expert en classification douanière marocaine. Analyse la description de produit suivante et propose les 3 codes SH (Système Harmonisé) les plus probables selon la nomenclature tarifaire marocaine à 10 chiffres.

Description du produit : "${description}"
${paysOrigine ? `Pays d'origine déclaré : ${paysOrigine}` : ''}

Réponds UNIQUEMENT avec un objet JSON valide (pas de markdown, pas de texte autour) avec ce format exact :
{
  "resultats": [
    {
      "code": "XXXX.XX.XX.XX",
      "description": "Description officielle de la position",
      "di": "X%",
      "tva": "20%",
      "tic": "0%",
      "documents": ["doc1", "doc2"],
      "regimes": ["Mise à la consommation", "Admission temporaire"],
      "note_section": "Note ou règle de classement CDII applicable (1-2 phrases)",
      "confiance": 85,
      "justification": "Pourquoi ce code est applicable (1-2 phrases)"
    }
  ]
}

Utilise les taux DI réels de la nomenclature tarifaire marocaine 2026. TVA : seulement 20% (normal) ou 10% (liste fermée Art.99-B CGI 2026) — jamais 14% ni 7%, taux abrogés depuis la réforme. TIC applicable aux produits pétroliers, tabac, boissons, sucre.`

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
        system: 'Tu es un classificateur douanier expert. Réponds UNIQUEMENT en JSON valide sans markdown ni texte autour.',
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await resp.json()
    const raw = (data.content?.[0]?.text || '').replace(/```json?/g, '').replace(/```/g, '').trim()
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')
    if (start === -1) throw new Error('Réponse IA invalide')

    const parsed = JSON.parse(raw.slice(start, end + 1))
    return res.status(200).json({ ok: true, resultats: parsed.resultats || [] })
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Erreur lors de la classification' })
  }
}
