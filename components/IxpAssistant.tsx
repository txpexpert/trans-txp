// components/IxpAssistant.tsx — espace de requêtes IXP-Assistant (LLM + RAG), avec dictée et lecture vocale.
// Reprend la logique de l'ancien accueil :
//   - session : GET /api/auth/me (le verrou réel reste côté serveur, dans chat-homepage.ts)
//   - question : POST /api/chat-homepage { message } -> { answer, sources, action }
//   - voix : dictée Web Speech API (fr-FR) ; lecture POST /api/voice/synthesize { text } -> audio
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

type Source = { titre: string; numero?: string }
type Action = { type: 'page' | 'contact'; label: string; url: string } | null

export default function IxpAssistant() {
  const [question, setQuestion] = useState('')
  const [authorized, setAuthorized] = useState<boolean | undefined>(undefined)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [answer, setAnswer] = useState('')
  const [sources, setSources] = useState<Source[]>([])
  const [action, setAction] = useState<Action>(null)
  const [locked, setLocked] = useState(false)
  const [listening, setListening] = useState(false)
  const [micOk, setMicOk] = useState(true)
  const [audioState, setAudioState] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle')
  const recRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => (r.ok ? r.json() : null)).then(d => setAuthorized(!!(d && d.email))).catch(() => setAuthorized(undefined))
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!Ctor) { setMicOk(false); return }
    const rec = new Ctor()
    rec.lang = 'fr-FR'; rec.interimResults = false; rec.maxAlternatives = 1
    rec.onresult = (e: any) => { const t = e.results[0][0].transcript; setQuestion(t); setStatus(`Question captée : « ${t} »`) }
    rec.onend = () => setListening(false)
    rec.onerror = () => { setListening(false); setStatus('Micro non disponible : vérifiez les autorisations du navigateur.') }
    recRef.current = rec
    return () => { try { rec.abort() } catch { /* déjà arrêté */ } }
  }, [])

  const stopAudio = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    setAudioState('idle')
  }

  const toggleMic = () => {
    const rec = recRef.current
    if (!rec) return
    if (listening) { rec.stop(); return }
    setListening(true); setStatus('Je vous écoute…'); rec.start()
  }

  const showLocked = () => {
    setLocked(true); setAnswer(''); setSources([]); setAction(null)
    setStatus('Cette fonctionnalité est réservée aux abonnés.')
  }

  const submit = async () => {
    const q = question.trim()
    if (!q) { inputRef.current?.focus(); return }
    if (authorized === false) { showLocked(); return }
    stopAudio(); setLoading(true); setStatus(''); setLocked(false); setAnswer(''); setAction(null)
    try {
      const res = await fetch('/api/chat-homepage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: q }) })
      if (res.status === 401 || res.status === 403) { showLocked(); return }
      if (!res.ok) throw new Error('indisponible')
      const data = await res.json()
      setAnswer(data.answer || 'Réponse indisponible pour le moment.')
      setSources(Array.isArray(data.sources) ? data.sources : [])
      const a = data.action
      setAction(a && typeof a.url === 'string' && a.url.charAt(0) === '/' ? a : null)
    } catch {
      setAnswer('IXP-Assistant n’a pas pu répondre pour le moment. Réessayez dans un instant.')
    } finally {
      setLoading(false)
    }
  }

  const listen = async () => {
    const text = [answer, sources.length ? 'Sources : ' + sources.map(s => s.titre).join(', ') : ''].join('. ').trim()
    if (!text) return
    stopAudio(); setAudioState('loading')
    try {
      const res = await fetch('/api/voice/synthesize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
      if (!res.ok) throw new Error('tts')
      const audio = new Audio(URL.createObjectURL(await res.blob()))
      audio.addEventListener('ended', () => setAudioState('idle'))
      audioRef.current = audio
      await audio.play(); setAudioState('playing')
    } catch {
      setAudioState('error'); setTimeout(() => setAudioState('idle'), 2500)
    }
  }

  const reset = () => { stopAudio(); setQuestion(''); setAnswer(''); setSources([]); setAction(null); setStatus(''); setLocked(false); inputRef.current?.focus() }

  return (
    <section className="x-assist" id="assistant" aria-labelledby="assist-title" data-assistant>
      <div className="x-assist-intro">
        <div className="x-eyebrow x-eyebrow-strong">IXP-Assistant · Votre IA experte</div>
        <h2 id="assist-title" className="x-assist-title">Une question précise ?</h2>
        <p>IXP-Assistant, l’assistant IA d’Import-eXPert, répond en citant la circulaire, l’article ou l’accord exact, pour ceux qui savent déjà ce qu’ils cherchent.</p>
      </div>
      <div className="x-assist-box">
        <div className="x-assist-row">
          <input ref={inputRef} className="x-assist-input" data-assist-input value={question} onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit() }} placeholder="Ex. : quels documents pour une admission temporaire ?"
            aria-label="Votre question à IXP-Assistant" autoComplete="off" />
          {micOk && (
            <button type="button" data-assist-mic className={`x-assist-mic ${listening ? 'on' : ''}`} onClick={toggleMic}
              aria-label={listening ? 'Arrêter la dictée' : 'Poser la question à la voix'} title="Poser la question à la voix">🎤</button>
          )}
          <button type="button" data-assist-submit className="x-btn x-btn-dark x-assist-go" onClick={submit} disabled={loading}>
            {loading ? 'Recherche…' : 'Soumettre →'}
          </button>
        </div>
        {authorized !== true && !answer && (
          <div className="x-assist-hint" data-assist-hint>🔒 <Link href="/auth/login">Connectez-vous</Link> pour interroger IXP-Assistant · <Link href="/auth/register">essai gratuit de 14 jours</Link></div>
        )}
        <div className="x-assist-status" data-assist-status aria-live="polite">{loading ? 'Recherche dans la base documentaire…' : status}</div>
        {locked && (
          <div className="x-assist-answer">
            <p>Connectez-vous ou démarrez votre essai gratuit pour interroger IXP-Assistant.</p>
            <div className="x-assist-acts"><Link href="/auth/login" className="x-btn x-btn-dark">Se connecter</Link><Link href="/auth/register" className="x-btn x-btn-line">Essai gratuit</Link></div>
          </div>
        )}
        {answer && (
          <div className="x-assist-answer">
            <div className="x-mono" style={{ marginBottom: 8 }}>IXP-ASSISTANT</div>
            <p style={{ whiteSpace: 'pre-wrap' }}>{answer}</p>
            {sources.length > 0 && <p className="x-assist-src">Sources : {sources.map(s => s.titre + (s.numero ? ` (n° ${s.numero})` : '')).join(' · ')}</p>}
            {action && <p><Link href={action.url} className="x-assist-link">{action.type === 'contact' ? '✉ ' : '→ '}{action.label}</Link></p>}
            <div className="x-assist-acts">
              {audioState === 'playing'
                ? <button type="button" className="x-btn x-btn-line" onClick={stopAudio}>⏹ Arrêter</button>
                : <button type="button" className="x-btn x-btn-line" onClick={listen} disabled={audioState === 'loading'}>
                    {audioState === 'loading' ? '⏳ Synthèse…' : audioState === 'error' ? 'Audio indisponible' : '🔊 Écouter la réponse'}
                  </button>}
              <button type="button" className="x-btn x-btn-ghost" onClick={reset}>↻ Nouvelle question</button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
