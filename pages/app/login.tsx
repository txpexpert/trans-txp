// pages/app/login.tsx
// Connexion dédiée à l'espace mobile /app — indépendante de pages/auth/login.tsx.
// Le paramètre "redirect" est résolu côté serveur (getServerSideProps), pas
// via useRouter().query, pour éviter le bug d'hydratation identifié sur
// l'espace historique (lien correct dans le HTML brut, mais parfois "vide"
// tant que React n'a pas fini de s'hydrater sur mobile).

import { useState } from 'react'
import type { GetServerSideProps } from 'next'

interface Props {
  redirect: string
}

export default function AppLogin({ redirect }: Props) {
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

      // Navigation complète (pas router.push) — nécessaire pour les pages
      // légères servies via /api/app-content/* et pour garantir que le
      // cookie fraîchement posé est bien relu dès la prochaine requête.
      window.location.href = redirect
    } catch {
      setError('Erreur réseau — réessayez')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F5F7FA', padding: 20, fontFamily: 'sans-serif',
    }}>
      <div style={{
        width: '100%', maxWidth: 380, background: '#fff', borderRadius: 12,
        padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,.08)',
      }}>
        <h1 style={{ fontSize: 20, marginBottom: 4, color: '#153E82', fontWeight: 700 }}>
          Transit-eXPert
        </h1>
        <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>
          Connexion à l'espace mobile
        </p>

        <form onSubmit={submit}>
          {error && (
            <div style={{
              background: '#FEE2E2', border: '1px solid #FECACA', color: '#C0392B',
              padding: '8px 12px', fontSize: 13, borderRadius: 6, marginBottom: 12,
            }}>
              ⚠ {error}
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 11, color: '#888', marginBottom: 4, letterSpacing: '.05em' }}>
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 11, color: '#888', marginBottom: 4, letterSpacing: '.05em' }}>
              MOT DE PASSE
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: 12, background: loading ? '#8A8078' : '#153E82',
              color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const raw = context.query.redirect
  const redirect = typeof raw === 'string' && raw.startsWith('/') ? raw : '/app'
  return { props: { redirect } }
}
