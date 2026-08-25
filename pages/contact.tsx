import { useState } from 'react'

export default function Contact() {
  const [form, setForm] = useState({ nom: '', email: '', societe: '', msg: '' })
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: 'contact' }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Erreur lors de l\'envoi')
        return
      }
      setSent(true)
    } catch {
      setError('Erreur réseau — veuillez réessayer')
    }
  }

  if (sent) {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center' }}>
        <h1>Merci — votre message a bien été envoyé.</h1>
        <p>Notre équipe reviendra vers vous rapidement.</p>

      </div>
    )
  }

  return (
    <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 20px' }}>
      <h1 style={{ marginBottom: 20 }}>Nous contacter</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input required placeholder="Nom" value={form.nom}
          onChange={e => setForm({ ...form, nom: e.target.value })} />
        <input required type="email" placeholder="Email" value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Société (optionnel)" value={form.societe}
          onChange={e => setForm({ ...form, societe: e.target.value })} />
        <textarea required placeholder="Votre message" rows={5} value={form.msg}
          onChange={e => setForm({ ...form, msg: e.target.value })} />
        {error && <p style={{ color: '#c0392b' }}>{error}</p>}
        <button type="submit" style={{
          background: '#1A5C2A', color: '#fff', padding: '10px 20px',
          borderRadius: 6, border: 'none', fontWeight: 500, cursor: 'pointer',
        }}>
          Envoyer
        </button>
      </form>
    </div>
  )
}
