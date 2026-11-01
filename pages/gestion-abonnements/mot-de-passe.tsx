// pages/gestion-abonnements/mot-de-passe.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Création ou réinitialisation d'un mot de passe administrateur à partir du
// lien reçu par email (invitation ou « mot de passe oublié »). Le lien est à
// usage unique et valable 48 h.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { AdminAuthCard, Field, Notice, SubmitButton } from '../../components/AdminAuthCard'

export default function AdminMotDePasse() {
  const router = useRouter()
  const token = typeof router.query.token === 'string' ? router.query.token : ''
  const [check, setCheck] = useState<{ state: 'loading' | 'ok' | 'bad'; email?: string; purpose?: string; niveau?: string }>({ state: 'loading' })
  const [pwd, setPwd] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!router.isReady) return
    if (!token) { setCheck({ state: 'bad' }); return }
    fetch(`/api/admin/password?token=${encodeURIComponent(token)}`)
      .then(async r => { const d = await r.json(); setCheck(r.ok ? { state: 'ok', email: d.email, purpose: d.purpose, niveau: d.niveau } : { state: 'bad' }) })
      .catch(() => setCheck({ state: 'bad' }))
  }, [router.isReady, token])

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError('')
    if (pwd !== pwd2) { setError('Les deux mots de passe ne correspondent pas.'); return }
    setBusy(true)
    try {
      const r = await fetch('/api/admin/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, newPassword: pwd }) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) { setError(d.error || 'Enregistrement impossible.'); return }
      router.push(d.niveau === 'super' ? '/backoffice' : '/gestion-abonnements/connexion?ok=mdp')
    } catch { setError('Erreur réseau — réessayez.') } finally { setBusy(false) }
  }

  return (
    <AdminAuthCard kicker="ACCÈS ADMINISTRATEUR" title={check.purpose === 'reinitialisation' ? 'Nouveau mot de passe' : 'Créer mon mot de passe'}>
      {check.state === 'loading' && <Notice tone="info">Vérification du lien…</Notice>}
      {check.state === 'bad' && (
        <Notice tone="error">
          Ce lien est invalide ou a expiré. Demandez un nouveau lien depuis <Link href="/gestion-abonnements/connexion">« Mot de passe oublié »</Link>,
          ou au super-administrateur.
        </Notice>
      )}
      {check.state === 'ok' && (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Notice tone="info">Compte : <b>{check.email}</b>. Mot de passe de 10 caractères minimum.</Notice>
          <Field label="MOT DE PASSE"><input id="mp-pwd" type="password" autoComplete="new-password" value={pwd} onChange={e => setPwd(e.target.value)} /></Field>
          <Field label="CONFIRMER"><input id="mp-pwd2" type="password" autoComplete="new-password" value={pwd2} onChange={e => setPwd2(e.target.value)} /></Field>
          {error && <Notice tone="error">{error}</Notice>}
          <SubmitButton busy={busy} disabled={pwd.length < 10 || !pwd2}>ENREGISTRER</SubmitButton>
        </form>
      )}
    </AdminAuthCard>
  )
}
