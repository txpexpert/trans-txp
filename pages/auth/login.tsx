import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Login() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [needsVerification, setNeedsVerification] = useState(false)
  const [resendSent, setResendSent] = useState(false)

  const resendVerification = async () => {
    setResendSent(false)
    await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setResendSent(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setNeedsVerification(false)
    if (!email || !password) { setError('Email et mot de passe requis'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erreur lors de la connexion')
        if (data.code === 'EMAIL_NOT_VERIFIED') setNeedsVerification(true)
        setLoading(false)
        return
      }

      // ✅ FIX — navigation complète (pas router.push) : nécessaire pour une
      // redirection fiable vers des fichiers .html statiques (public/tools/*)
      // et pour garantir que le middleware relit bien le cookie de session
      // fraîchement posé par /api/auth/login, plutôt qu'une transition
      // purement côté client qui pouvait ignorer la valeur de "redirect".
      //
      // 🔒 SÉCURITÉ — redirection ouverte corrigée : "redirect" vient de
      // l'URL, donc non fiable. On n'accepte qu'un chemin interne commençant
      // par un seul "/" — on rejette "//" et "/\" (URL protocol-relative
      // vers un domaine externe, contournement classique de ce filtre).
      const raw = router.query.redirect
      const isSafeInternalPath =
        typeof raw === 'string' &&
        raw.startsWith('/') &&
        !raw.startsWith('//') &&
        !raw.startsWith('/\\')
      const redirect = isSafeInternalPath ? raw : '/'
      window.location.href = redirect
    } catch {
      setError('Erreur réseau — réessayez')

      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Connexion — IXP-Import-eXPert</title>
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>
      <style dangerouslySetInnerHTML={{ __html: `
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{--gold:#C9A84C;--gold2:#E8C97A;--gold3:#F5E4B0;--gold4:#FBF5E6;
          --ink:#0A0A0A;--ink2:#3A3530;--ink3:#8A8078;--white:#FDFCF8;
          --border:#E8DFC8;--border2:#D4C8A8;--red:#C0392B}
        body{font-family:'DM Sans',sans-serif;background:var(--white);color:var(--ink);min-height:100vh}
        a{text-decoration:none;color:inherit}
        input{font-family:'DM Sans',sans-serif}
        .field{margin-bottom:.875rem}
        .label{display:block;font-size:11px;letter-spacing:.08em;color:var(--ink3);margin-bottom:.35rem}
        .inp{width:100%;padding:.7rem 1rem;border:1px solid var(--border2);background:var(--white);font-size:13px;color:var(--ink);outline:none;transition:border-color .15s}
        .inp:focus{border-color:var(--gold)}
      ` }} />



      <main style={{ display: 'flex', justifyContent: 'center', padding: '3rem 1rem' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ border: '1px solid var(--border)', background: 'var(--white)' }}>

            <div style={{ padding: '1.5rem 2rem 1rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 26, fontWeight: 400, color: 'var(--ink)', marginBottom: '.2rem' }}>
                Se connecter à <span style={{ color: 'var(--gold)' }}>Import-eXPert</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink3)' }}>Plateforme d'intelligence douanière marocaine</div>
            </div>

            <form onSubmit={submit} style={{ padding: '1.5rem 2rem' }}>
              {error && (
                <div style={{ padding: '.75rem 1rem', background: '#FEE2E2', border: '1px solid #FECACA', color: 'var(--red)', fontSize: 13, marginBottom: '1rem' }}>
                  ⚠ {error}
                  {needsVerification && (
                    <div style={{ marginTop: '.5rem' }}>
                      {resendSent ? (
                        <span style={{ color: 'var(--ink2)' }}>Email renvoyé — vérifiez votre boîte mail.</span>
                      ) : (
                        <button type="button" onClick={resendVerification} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: 13, textDecoration: 'underline' }}>
                          Renvoyer l'email de confirmation
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="field">
                <label className="label">EMAIL</label>
                <input
                  className="inp"
                  type="email"
                  placeholder="vous@entreprise.ma"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="field">

                <label className="label">MOT DE PASSE</label>
                <input
                  className="inp"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '13px', background: loading ? 'var(--ink3)' : 'var(--ink)', color: 'var(--gold2)', border: 'none', fontSize: 12, letterSpacing: '.1em', cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'CONNEXION...' : 'SE CONNECTER →'}
              </button>

              <div style={{ marginTop: '.875rem', textAlign: 'center', fontSize: 12, color: 'var(--ink3)' }}>
                Pas encore de compte ?{' '}
                <Link href="/auth/register" style={{ color: 'var(--gold)', fontWeight: 500 }}>Créer un compte</Link>
              </div>
            </form>
          </div>
        </div>
      </main>

    </>
  )
}