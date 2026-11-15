// components/ChangerMotDePasse.tsx — formulaire « Changer mon mot de passe » de l'espace « Mon compte » (2026-11-14)
import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import VoirMotDePasse from './VoirMotDePasse'

const MIN = 12
const inp = { width: '100%', padding: '9px 12px', border: '.5px solid var(--rule)', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' as const, marginBottom: 10 }
const lab = { display: 'block', fontSize: 11, color: 'var(--inkm)', marginBottom: 4, letterSpacing: '.05em' }

export default function ChangerMotDePasse() {
  const [ouvert, setOuvert]   = useState(false)
  const [actuel, setActuel]   = useState('')
  const [nouveau, setNouveau] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy]       = useState(false)
  const [error, setError]     = useState('')
  const [ok, setOk]           = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError('')
    if (nouveau !== confirm) { setError('Les deux nouveaux mots de passe ne correspondent pas.'); return }
    setBusy(true)
    try {
      const r = await fetch('/api/auth/mot-de-passe', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actuel, nouveau }) })
      const d = await r.json().catch(() => ({}))
      if (r.ok) { setOk(true); setActuel(''); setNouveau(''); setConfirm('') }
      else setError(d.error || 'Modification impossible.')
    } catch { setError('Erreur réseau — réessayez.') } finally { setBusy(false) }
  }

  return (
    <div style={{ background: 'var(--white)', border: '.5px solid var(--rule)', padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--bd)' }}>Mot de passe</div>
          <div style={{ fontSize: 12, color: 'var(--inkm)' }}>Changez-le à tout moment ; les autres appareils connectés seront déconnectés.</div>
        </div>
        {!ouvert && (
          <button type="button" onClick={() => { setOuvert(true); setOk(false) }}
            style={{ padding: '8px 16px', background: 'transparent', border: '.5px solid var(--bd)', color: 'var(--bd)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
            Changer mon mot de passe
          </button>
        )}
      </div>

      {ok && <div style={{ marginTop: 12, padding: '10px 12px', background: '#E8F5EC', color: '#1A7A40', fontSize: 12 }}>Mot de passe modifié. Vous restez connecté sur cet appareil ; les autres sessions ont été fermées.</div>}

      {ouvert && !ok && (
        <form onSubmit={submit} style={{ marginTop: 14 }}>
          {error && <div style={{ marginBottom: 10, padding: '10px 12px', background: '#FEE2E2', color: '#C0392B', fontSize: 12 }}>⚠ {error}</div>}
          <label style={lab} htmlFor="mdp-actuel">MOT DE PASSE ACTUEL</label>
          <input id="mdp-actuel" style={inp} type="password" value={actuel} onChange={e => setActuel(e.target.value)} autoComplete="current-password" required />
          <label style={lab} htmlFor="mdp-nouveau">NOUVEAU MOT DE PASSE</label>
          <input id="mdp-nouveau" style={inp} type="password" value={nouveau} onChange={e => setNouveau(e.target.value)} autoComplete="new-password" minLength={MIN} required />
          <label style={lab} htmlFor="mdp-confirm">CONFIRMER LE NOUVEAU MOT DE PASSE</label>
          <input id="mdp-confirm" style={inp} type="password" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" minLength={MIN} required />
          <VoirMotDePasse style={{ margin: '0 0 10px' }} />
          <p style={{ fontSize: 11.5, color: 'var(--inkm)', margin: '0 0 12px', lineHeight: 1.5 }}>
            {MIN} caractères minimum, avec au moins une lettre et un chiffre. Mot de passe actuel oublié ? <Link href="/auth/mot-de-passe-oublie" style={{ color: 'var(--bd)', textDecoration: 'underline' }}>Recevoir un lien par email</Link>.
          </p>
          <button type="submit" disabled={busy}
            style={{ padding: '9px 20px', background: 'var(--bd)', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginRight: 8 }}>
            {busy ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <button type="button" onClick={() => { setOuvert(false); setError('') }}
            style={{ padding: '9px 16px', background: 'transparent', border: '.5px solid var(--rule)', color: 'var(--inkm)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
            Annuler
          </button>
        </form>
      )}
    </div>
  )
}
