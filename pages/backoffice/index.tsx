// pages/backoffice/index.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Connexion au backoffice — super-administrateur uniquement (2026-11-01).
// Email + mot de passe personnel (plus de mot de passe partagé).
//
// Première connexion du compte maître : l'écran « Créer mon mot de passe »
// demande une seule fois l'ancien mot de passe partagé ADMIN_PASSWORD comme
// preuve, puis ne sert plus (voir /api/admin/setup-master).
// Les administrateurs de type 2 sont renvoyés vers « Gestion des abonnements ».
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { AdminAuthCard, Field, Notice, SubmitButton, safeRedirect } from '../../components/AdminAuthCard'

type Step = 'login' | 'setup' | 'forgot'

export default function BackofficeLogin() {
  const router = useRouter()
  const [step, setStep]       = useState<Step>('login')
  const [email, setEmail]     = useState('')
  const [pwd, setPwd]         = useState('')
  const [shared, setShared]   = useState('')
  const [pwd2, setPwd2]       = useState('')
  const [error, setError]     = useState('')
  const [info, setInfo]       = useState('')
  const [wrongSpace, setWrongSpace] = useState(false)
  const [busy, setBusy]       = useState(false)

  const goIn = () => router.push(safeRedirect(router.query.redirect, '/backoffice/dashboard'))

  const post = async (url: string, body: object) => {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    return { ok: r.ok, status: r.status, data: await r.json().catch(() => ({})) }
  }

  const onLogin = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setInfo(''); setWrongSpace(false); setBusy(true)
    try {
      const r = await post('/api/admin/login', { email, password: pwd, scope: 'backoffice' })
      if (r.ok) return goIn()
      if (r.data.code === 'SETUP_REQUIRED') { setStep('setup'); setPwd(''); setInfo(r.data.error); return }
      if (r.data.code === 'WRONG_SPACE') setWrongSpace(true)
      setError(r.data.error || 'Connexion impossible.')
    } catch { setError('Erreur réseau — réessayez.') } finally { setBusy(false) }
  }

  const onSetup = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setBusy(true)
    try {
      if (pwd !== pwd2) { setError('Les deux mots de passe ne correspondent pas.'); return }
      const r = await post('/api/admin/setup-master', { email, adminPassword: shared, newPassword: pwd })
      if (r.ok) return goIn()
      setError(r.data.error || 'Création impossible.')
    } catch { setError('Erreur réseau — réessayez.') } finally { setBusy(false) }
  }

  const onForgot = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setBusy(true)
    try {
      const r = await post('/api/admin/forgot', { email })
      if (r.ok) { setInfo(r.data.message); setStep('login') } else setError(r.data.error || 'Envoi impossible.')
    } catch { setError('Erreur réseau — réessayez.') } finally { setBusy(false) }
  }

  const form = { display: 'flex', flexDirection: 'column' as const, gap: 12 }

  return (
    <AdminAuthCard
      kicker="BACKOFFICE · SUPER-ADMINISTRATEUR"
      title={step === 'setup' ? 'Créer mon mot de passe' : step === 'forgot' ? 'Mot de passe oublié' : 'Connexion'}
      footer={
        step === 'login' ? (
          <>
            <button type="button" onClick={() => { setStep('forgot'); setError(''); setInfo('') }}
              style={{ background: 'none', border: 'none', color: '#C9A84C', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, padding: 0 }}>
              Mot de passe oublié
            </button>
            <br />Administrateur des abonnements ? <Link href="/gestion-abonnements/connexion">Gestion des abonnements</Link>
          </>
        ) : (
          <button type="button" onClick={() => { setStep('login'); setError('') }}
            style={{ background: 'none', border: 'none', color: '#C9A84C', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, padding: 0 }}>
            ← Retour à la connexion
          </button>
        )
      }
    >
      {step === 'login' && (
        <form onSubmit={onLogin} style={form}>
          <Field label="EMAIL"><input id="bo-email" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.com" /></Field>
          <Field label="MOT DE PASSE"><input id="bo-pwd" type="password" autoComplete="current-password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="••••••••••" /></Field>
          {info && <Notice tone="info">{info}</Notice>}
          {error && <Notice tone="error">{error}{wrongSpace && <> <Link href="/gestion-abonnements/connexion">Ouvrir la Gestion des abonnements →</Link></>}</Notice>}
          <SubmitButton busy={busy} disabled={!email || !pwd}>ACCÉDER AU BACKOFFICE</SubmitButton>
        </form>
      )}

      {step === 'setup' && (
        <form onSubmit={onSetup} style={form}>
          <Notice tone="info">
            Étape unique pour le compte maître. Saisissez l’ancien mot de passe partagé du backoffice, puis choisissez votre mot de passe personnel
            (10 caractères minimum). Ensuite, l’ancien mot de passe n’ouvrira plus rien.
          </Notice>
          <Field label="EMAIL DU COMPTE MAÎTRE"><input id="su-email" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} /></Field>
          <Field label="ANCIEN MOT DE PASSE PARTAGÉ"><input id="su-shared" type="password" autoComplete="off" value={shared} onChange={e => setShared(e.target.value)} /></Field>
          <Field label="NOUVEAU MOT DE PASSE PERSONNEL"><input id="su-pwd" type="password" autoComplete="new-password" value={pwd} onChange={e => setPwd(e.target.value)} /></Field>
          <Field label="CONFIRMER LE NOUVEAU MOT DE PASSE"><input id="su-pwd2" type="password" autoComplete="new-password" value={pwd2} onChange={e => setPwd2(e.target.value)} /></Field>
          {error && <Notice tone="error">{error}</Notice>}
          <SubmitButton busy={busy} disabled={!email || !shared || pwd.length < 10 || !pwd2}>CRÉER MON MOT DE PASSE</SubmitButton>
        </form>
      )}

      {step === 'forgot' && (
        <form onSubmit={onForgot} style={form}>
          <Field label="EMAIL"><input id="fg-email" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} /></Field>
          {error && <Notice tone="error">{error}</Notice>}
          <SubmitButton busy={busy} disabled={!email}>RECEVOIR UN LIEN</SubmitButton>
        </form>
      )}
    </AdminAuthCard>
  )
}
