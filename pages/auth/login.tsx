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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Email et mot de passe requis'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erreur lors de la connexion'); setLoading(false); return }

      // ✅ FIX — navigation complète (pas router.push) : nécessaire pour une
      // redirection fiable vers des fichiers .html statiques (public/tools/*)
      // et pour garantir que le middleware relit bien le cookie de session
      // fraîchement posé par /api/auth/login, plutôt qu'une transition
      // purement côté client qui pouvait ignorer la valeur de "redirect".
      const redirect = typeof router.query.redirect === 'string' ? router.query.redirect : '/'
      window.location.href = redirect
    } catch {
      setError('Erreur réseau — réessayez')

      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Connexion — Transit-IA</title>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
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

      {/* Header */}
      <header style={{ background: 'var(--ink)', borderBottom: '2px solid var(--gold)', padding: '0 2rem', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 600, color: 'var(--gold2)', letterSpacing: '-.02em' }}>
          Transit-eXPert
        </Link>
        <span style={{ fontSize: 11, letterSpacing: '.1em', color: 'var(--ink3)' }}>CONNEXION</span>
      </header>


      <main style={{ display: 'flex', justifyContent: 'center', padding: '3rem 1rem' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ border: '1px solid var(--border)', background: 'var(--white)' }}>

            <div style={{ padding: '1.5rem 2rem 1rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 400, color: 'var(--ink)', marginBottom: '.2rem' }}>
                Se connecter à <span style={{ color: 'var(--gold)' }}>Transit-IA</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink3)' }}>Plateforme d'intelligence douanière marocaine</div>
            </div>

            <form onSubmit={submit} style={{ padding: '1.5rem 2rem' }}>
              {error && (
                <div style={{ padding: '.75rem 1rem', background: '#FEE2E2', border: '1px solid #FECACA', color: 'var(--red)', fontSize: 13, marginBottom: '1rem' }}>
                  ⚠ {error}
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

      <footer style={{ borderTop: '1px solid var(--border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink3)' }}>
        <span>© 2026 Transit-IA</span>
        <div style={{ display: 'flex', gap: '1.5rem' }}>

          <Link href="#">Mentions légales</Link>
          <Link href="#">Confidentialité</Link>
        </div>
      </footer>
    </>
  )
}