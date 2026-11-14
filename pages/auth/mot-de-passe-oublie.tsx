// pages/auth/mot-de-passe-oublie.tsx — demande d'un lien de réinitialisation du mot de passe (2026-11-14)
import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import AuthCarte from '../../components/AuthCarte'

export default function MotDePasseOublie() {
  const [email, setEmail] = useState('')
  const [busy, setBusy]   = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo]   = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setBusy(true)
    try {
      const r = await fetch('/api/auth/mot-de-passe-oublie', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const d = await r.json().catch(() => ({}))
      if (r.ok) setInfo(d.message || 'Email envoyé.')
      else setError(d.error || 'Demande impossible.')
    } catch { setError('Erreur réseau — réessayez.') } finally { setBusy(false) }
  }

  return (
    <AuthCarte titre="Mot de passe oublié" sousTitre="Recevez un lien pour choisir un nouveau mot de passe">
      {info ? <div className="ok">{info}</div> : (
        <form onSubmit={submit}>
          {error && <div className="err">⚠ {error}</div>}
          <div className="field">
            <label className="label" htmlFor="email">EMAIL DU COMPTE</label>
            <input id="email" className="inp" type="email" placeholder="vous@entreprise.ma" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
          </div>
          <button type="submit" className="btn" disabled={busy}>{busy ? 'ENVOI…' : 'RECEVOIR LE LIEN →'}</button>
        </form>
      )}
      <div className="lien"><Link href="/auth/login">Retour à la connexion</Link></div>
    </AuthCarte>
  )
}
