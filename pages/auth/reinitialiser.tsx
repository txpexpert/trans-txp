// pages/auth/reinitialiser.tsx — choix d'un nouveau mot de passe depuis le lien reçu par email (2026-11-14)
import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import AuthCarte from '../../components/AuthCarte'

const MIN = 12

export default function Reinitialiser() {
  const router = useRouter()
  const token = typeof router.query.token === 'string' ? router.query.token : ''
  const [etat, setEtat]   = useState<'verif' | 'form' | 'invalide' | 'fait'>('verif')
  const [mdp, setMdp]     = useState('')
  const [mdp2, setMdp2]   = useState('')
  const [busy, setBusy]   = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!router.isReady) return
    if (!token) { setEtat('invalide'); return }
    fetch(`/api/auth/reinitialiser?token=${encodeURIComponent(token)}`)
      .then(r => setEtat(r.ok ? 'form' : 'invalide'))
      .catch(() => setEtat('invalide'))
  }, [router.isReady, token])

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError('')
    if (mdp !== mdp2) { setError('Les deux mots de passe ne correspondent pas.'); return }
    setBusy(true)
    try {
      const r = await fetch('/api/auth/reinitialiser', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, nouveau: mdp }) })
      const d = await r.json().catch(() => ({}))
      if (r.ok) setEtat('fait')
      else if (r.status === 404) setEtat('invalide')
      else setError(d.error || 'Enregistrement impossible.')
    } catch { setError('Erreur réseau — réessayez.') } finally { setBusy(false) }
  }

  return (
    <AuthCarte titre="Nouveau mot de passe" sousTitre="Compte Import-eXPert">
      {etat === 'verif' && <p style={{ fontSize: 13, color: 'var(--ink3)' }}>Vérification du lien…</p>}
      {etat === 'invalide' && (
        <>
          <div className="err">⚠ Ce lien est invalide, déjà utilisé ou expiré (validité : 1 heure).</div>
          <div className="lien"><Link href="/auth/mot-de-passe-oublie">Demander un nouveau lien</Link></div>
        </>
      )}
      {etat === 'fait' && (
        <>
          <div className="ok">Votre mot de passe a été modifié. Toutes les sessions ouvertes ont été fermées : connectez-vous avec votre nouveau mot de passe.</div>
          <Link href="/auth/login"><button type="button" className="btn">SE CONNECTER →</button></Link>
        </>
      )}
      {etat === 'form' && (
        <form onSubmit={submit}>
          {error && <div className="err">⚠ {error}</div>}
          <div className="field">
            <label className="label" htmlFor="mdp">NOUVEAU MOT DE PASSE</label>
            <input id="mdp" className="inp" type="password" value={mdp} onChange={e => setMdp(e.target.value)} autoComplete="new-password" minLength={MIN} required />
          </div>
          <p className="aide">{MIN} caractères minimum, avec au moins une lettre et un chiffre. Une phrase de plusieurs mots est idéale.</p>
          <div className="field">
            <label className="label" htmlFor="mdp2">CONFIRMER</label>
            <input id="mdp2" className="inp" type="password" value={mdp2} onChange={e => setMdp2(e.target.value)} autoComplete="new-password" minLength={MIN} required />
          </div>
          <button type="submit" className="btn" disabled={busy}>{busy ? 'ENREGISTREMENT…' : 'ENREGISTRER →'}</button>
        </form>
      )}
    </AuthCarte>
  )
}
