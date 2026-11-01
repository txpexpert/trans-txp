// pages/gestion-abonnements/connexion.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Connexion au tableau de bord « Gestion des abonnements » — administrateurs
// de type 2 (email + mot de passe personnel). Le super-administrateur passe
// par le backoffice, d'où ce tableau de bord est aussi accessible.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { AdminAuthCard, Field, Notice, SubmitButton } from '../../components/AdminAuthCard'

export default function GestionConnexion() {
  const router = useRouter()
  const [forgot, setForgot] = useState(false)
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState(router.query.ok === 'mdp' ? 'Mot de passe enregistré. Vous pouvez vous connecter.' : '')
  const [toBackoffice, setToBackoffice] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setInfo(''); setToBackoffice(false); setBusy(true)
    try {
      const r = await fetch(forgot ? '/api/admin/forgot' : '/api/admin/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(forgot ? { email } : { email, password: pwd, scope: 'gestion' }),
      })
      const d = await r.json().catch(() => ({}))
      if (forgot) { if (r.ok) { setInfo(d.message); setForgot(false) } else setError(d.error || 'Envoi impossible.'); return }
      if (r.ok) { router.push('/gestion-abonnements'); return }
      if (d.code === 'USE_BACKOFFICE') setToBackoffice(true)
      setError(d.error || 'Connexion impossible.')
    } catch { setError('Erreur réseau — réessayez.') } finally { setBusy(false) }
  }

  return (
    <AdminAuthCard
      kicker="GESTION DES ABONNEMENTS"
      title={forgot ? 'Mot de passe oublié' : 'Connexion'}
      footer={
        <button type="button" onClick={() => { setForgot(!forgot); setError(''); setInfo('') }}
          style={{ background: 'none', border: 'none', color: '#C9A84C', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, padding: 0 }}>
          {forgot ? '← Retour à la connexion' : 'Mot de passe oublié'}
        </button>
      }
    >
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="EMAIL"><input id="ga-email" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.com" /></Field>
        {!forgot && <Field label="MOT DE PASSE"><input id="ga-pwd" type="password" autoComplete="current-password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="••••••••••" /></Field>}
        {info && <Notice tone="ok">{info}</Notice>}
        {error && <Notice tone="error">{error}{toBackoffice && <> <Link href="/backoffice">Ouvrir le backoffice →</Link></>}</Notice>}
        <SubmitButton busy={busy} disabled={!email || (!forgot && !pwd)}>{forgot ? 'RECEVOIR UN LIEN' : 'SE CONNECTER'}</SubmitButton>
      </form>
    </AdminAuthCard>
  )
}
