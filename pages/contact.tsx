// pages/contact.tsx — formulaire de contact ; le sujet (?sujet=…) préremplit le message et accompagne la demande.
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import SiteShell from '../components/SiteShell'
import { SUJETS } from '../lib/sujetsContact'

export default function Contact() {
  const { query } = useRouter()
  const sujet = typeof query.sujet === 'string' && SUJETS[query.sujet] ? query.sujet : null
  const [form, setForm] = useState({ nom: '', email: '', societe: '', telephone: '', msg: '' })
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { if (sujet) setForm(f => (f.msg ? f : { ...f, msg: SUJETS[sujet].message })) }, [sujet])
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'same-origin' }).then(r => (r.ok ? r.json() : null)).then(u => {
      if (u) setForm(f => ({ ...f, nom: f.nom || [u.prenom, u.nom].filter(Boolean).join(' '), email: f.email || u.email || '', societe: f.societe || u.societe || '' }))
    }).catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: form.nom, email: form.email, societe: form.societe, msg: form.telephone ? `${form.msg}\n\nTéléphone : ${form.telephone}` : form.msg,
          service: sujet ? SUJETS[sujet].titre : null, source: sujet || 'contact' }),
      })
      if (!res.ok) { const data = await res.json(); setError(data.error || 'Erreur lors de l’envoi'); return }
      setSent(true)
    } catch { setError('Erreur réseau, veuillez réessayer') }
  }

  return (
    <SiteShell title="Nous contacter | IXP-Import-eXPert">
      <section className="x-hero">
        <div className="x-wrap" style={{ maxWidth: 720 }}>
          <div className="x-eyebrow">{sujet ? SUJETS[sujet].titre : 'Contact'}</div>
          <h1 className="x-h1 x-h1-sm">{sent ? 'Merci, votre demande est envoyée.' : 'Nous contacter'}</h1>
          {sent ? <p className="x-lead">Un expert vous répond sous un jour ouvré{sujet === 'echange-expert' ? ' pour fixer le créneau de votre échange' : ''}.</p> : (
            <form onSubmit={handleSubmit} className="x-ff" style={{ marginTop: 18 }}>
              <div className="x-ff-grid">
                <label>Nom *<input required value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} /></label>
                <label>Email *<input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
                <label>Société<input value={form.societe} onChange={e => setForm({ ...form, societe: e.target.value })} /></label>
                <label>Téléphone{sujet === 'echange-expert' ? ' (pour l’échange)' : ''}<input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} /></label>
                <label className="wide">Message *<textarea required rows={5} value={form.msg} onChange={e => setForm({ ...form, msg: e.target.value })} /></label>
              </div>
              {error && <p className="x-ff-err" style={{ marginTop: 12 }}>{error}</p>}
              <div className="x-ff-nav"><button type="submit" className="x-btn x-btn-dark">Envoyer</button></div>
              <p className="x-ff-note">Vos coordonnées servent uniquement à répondre à cette demande.</p>
            </form>)}
        </div>
      </section>
    </SiteShell>
  )
}
