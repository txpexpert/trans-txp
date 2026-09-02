// pages/app/copilote.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Copilote vocal — version mobile (/app).
// Réutilise EXACTEMENT les mêmes endpoints que le copilote de la page
// d'accueil desktop (pages/index.tsx) : aucune modification backend requise.
//   - /api/chat-homepage    : pipeline RAG (question texte -> réponse)
//   - /api/voice/synthesize : TTS cloud (ElevenLabs)
// STT (dictée de la question) via l'API Web Speech native du navigateur,
// comme sur desktop.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import AppModuleLayout from '../../components/AppModuleLayout'

type Source = { titre: string; numero: string | null; type_document: string | null }

export default function AppCopilote() {
  const [question, setQuestion] = useState('')
  const [listening, setListening] = useState(false)
  const [loading, setLoading] = useState(false)
  const [answer, setAnswer] = useState<string | null>(null)
  const [sources, setSources] = useState<Source[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [needsLogin, setNeedsLogin] = useState(false)
  const [synthesizing, setSynthesizing] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [micSupported, setMicSupported] = useState(true)

  const recognitionRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // --- STT : initialisation de la reconnaissance vocale (une seule fois) ---
  useEffect(() => {
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!Ctor) { setMicSupported(false); return }

    const recognition = new Ctor()
    recognition.lang = 'fr-FR'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setQuestion(transcript)
      setStatus(`Question captée : "${transcript}"`)
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => {
      setListening(false)
      setStatus('Micro non disponible — vérifiez les permissions du navigateur.')
    }

    recognitionRef.current = recognition
  }, [])

  function toggleMic() {
    if (!recognitionRef.current) return
    if (listening) {
      recognitionRef.current.stop()
      return
    }
    setListening(true)
    setStatus('Je vous écoute...')
    recognitionRef.current.start()
  }

  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    setIsPlaying(false)
  }

  function resetCopilot() {
    stopAudio()
    setAnswer(null)
    setSources([])
    setStatus(null)
    setNeedsLogin(false)
    setQuestion('')
  }

  async function submitQuestion() {
    const q = question.trim()
    if (!q) return

    stopAudio()
    setLoading(true)
    setStatus(null)
    setAnswer(null)
    setSources([])
    setNeedsLogin(false)

    try {
      const res = await fetch('/api/chat-homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q }),
      })

      if (res.status === 403) {
        setNeedsLogin(true)
        setStatus('Cette fonctionnalité est réservée aux abonnés.')
        return
      }
      if (!res.ok) throw new Error('Réponse copilote indisponible')

      const data = await res.json()
      setAnswer(data.answer || 'Réponse indisponible pour le moment.')
      setSources(data.sources || [])
    } catch (e) {
      setAnswer('Le copilote n\u2019a pas pu répondre pour le moment. Réessayez dans un instant.')
    } finally {
      setLoading(false)
    }
  }

  async function listenToAnswer() {
    if (!answer) return
    stopAudio()
    setSynthesizing(true)
    try {
      const res = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: answer }),
      })
      if (!res.ok) throw new Error('TTS indisponible')
      const blob = await res.blob()
      const audio = new Audio(URL.createObjectURL(blob))
      audio.addEventListener('ended', () => setIsPlaying(false))
      audioRef.current = audio
      await audio.play()
      setIsPlaying(true)
    } catch (e) {
      setStatus('Audio indisponible pour le moment.')
    } finally {
      setSynthesizing(false)
    }
  }

  // Sécurité : uniquement les sources de type "circulaire" sont affichées,
  // jamais les notes internes — même filtrage de défense en profondeur
  // que sur le copilote desktop (voir lib/assistantPrompt.ts, règle 6).
  const circulaireSources = sources.filter(
    (s) => s.type_document && s.type_document.toLowerCase().includes('circulaire')
  )

  return (
    <AppModuleLayout
      kicker="COPILOTE IA"
      title="Votre Copilote Transit-IA"
      sub="Posez une question à la voix ou au clavier — le copilote répond en citant la circulaire exacte."
    >
      <div className="form-group">
        <label className="form-label">Votre question</label>
        <textarea
          className="form-input"
          style={{ minHeight: 90, resize: 'vertical' }}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ex : Quels documents pour une admission temporaire ?"
        />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        {micSupported && (
          <button
            className="btn btn-outline"
            onClick={toggleMic}
            style={{ flex: '0 0 auto', background: listening ? '#FBE8D0' : undefined }}
          >
            {listening ? '⏹ Arrêter la dictée' : '🎤 Dicter'}
          </button>
        )}
        <button className="btn btn-primary" onClick={submitQuestion} disabled={loading} style={{ flex: 1 }}>
          {loading ? 'RECHERCHE EN COURS...' : 'SOUMETTRE →'}
        </button>
      </div>

      <p style={{ fontSize: 12, color: 'var(--inkm)', marginBottom: 6 }}>
        🔒 Connectez-vous pour interroger le copilote
      </p>

      {status && !needsLogin && (
        <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 10 }}>{status}</p>
      )}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted)', marginBottom: 10 }}>
          <span className="app-spinner" />
          Recherche dans la base documentaire…
        </div>
      )}

      {needsLogin && (
        <div className="alert alert-info">
          Connectez-vous ou démarrez votre essai gratuit pour interroger le copilote.
          <div style={{ marginTop: 10 }}>
            <Link href="/app/login" className="btn btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
              Se connecter
            </Link>
          </div>
        </div>
      )}

      {answer && !needsLogin && (
        <div className="alert alert-info" style={{ whiteSpace: 'pre-line' }}>
          {answer}

          {circulaireSources.length > 0 && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {circulaireSources.map((s, i) => (
                <span key={i} style={{ fontSize: 11, color: 'var(--muted)', border: '1px solid var(--border-mid)', padding: '3px 8px', background: 'var(--surface)' }}>
                  {s.titre}{s.numero ? ` (n° ${s.numero})` : ''}
                </span>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="btn btn-outline" onClick={listenToAnswer} disabled={synthesizing || isPlaying} style={{ opacity: synthesizing || isPlaying ? 0.5 : 1 }}>
              🔊 Écouter la réponse
            </button>
            {synthesizing && <span className="app-spinner" aria-label="Synthèse en cours" />}
            <button className="btn btn-outline" onClick={stopAudio} disabled={!isPlaying} style={{ opacity: !isPlaying ? 0.5 : 1 }}>
              ⏹ Arrêter
            </button>
            <button className="btn btn-outline" onClick={resetCopilot}>
              ↻ Nouvelle question
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .app-spinner {
          width: 14px; height: 14px; border-radius: 50%;
          border: 2px solid var(--border-mid); border-top-color: var(--gold);
          animation: appSpin .7s linear infinite; flex-shrink: 0;
        }
        @keyframes appSpin { to { transform: rotate(360deg); } }
      `}</style>
    </AppModuleLayout>
  )
}
