import type { NextApiRequest, NextApiResponse } from 'next'

// pages/api/voice/synthesize.ts
// Nécessite les variables d'env : ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID
// (déjà configurées sur Vercel — voir Settings > Environment Variables)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })

  const { text } = req.body
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Texte manquant' })
  }

  // Limite de sécurité simple pour éviter des coûts imprévus sur une réponse trop longue
  const safeText = text.slice(0, 2000)

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: safeText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error('Erreur ElevenLabs :', errText)
      return res.status(502).json({ error: 'Échec de la synthèse vocale' })
    }

    const audioBuffer = await response.arrayBuffer()
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Cache-Control', 'no-store')
    return res.send(Buffer.from(audioBuffer))
  } catch (err) {
    console.error('Erreur /api/voice/synthesize :', err)
    return res.status(500).json({ error: 'Erreur serveur TTS' })
  }
}
