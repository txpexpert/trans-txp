import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

// Corrigé — l'ancienne version comparait email/mot de passe en clair
// directement dans ce fichier, envoyé tel quel au navigateur (visible en
// affichant le code source). Passe maintenant par /api/admin/login, qui
// vérifie le mot de passe côté serveur (comparaison timing-safe, limitation
// de tentatives) et pose un cookie HttpOnly — jamais de secret côté client.
//
// ⚠️ Le mot de passe qui était exposé en clair ici doit être changé dans
// ADMIN_PASSWORD (variable d'environnement) avant mise en service — il
// doit être considéré comme compromis.

export default function BackofficeLogin() {
  const router = useRouter()
  const [pwd, setPwd]         = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Identifiants incorrects.'); return }

      const redirect = typeof router.query.redirect === 'string' ? router.query.redirect : '/backoffice/dashboard'
      router.push(redirect)
    } catch {
      setError('Erreur réseau — réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head><title>Backoffice — Transit-IA</title></Head>
      <style suppressHydrationWarning>{`
        *{box-sizing:border-box;margin:0;padding:0;font-family:'DM Sans',system-ui,sans-serif}
        body{background:#0A0A0A;min-height:100vh;display:flex;align-items:center;justify-content:center}
        input{width:100%;padding:10px 14px;border:1px solid #2A2A2A;background:#111;color:#E8C97A;font-family:inherit;font-size:13px;outline:none;transition:border-color .15s}
        input:focus{border-color:#C9A84C}
        input::placeholder{color:#3A3A3A}
      `}</style>

      <div style={{ width:'100%', maxWidth:360, padding:'0 20px' }}>

        <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:30, fontWeight:600, color:'#E8C97A' }}>
            Douane<span style={{ color:'#C9A84C' }}>.</span>ia
          </div>
          <div style={{ fontSize:9, letterSpacing:'.18em', color:'#3A3A3A', marginTop:6 }}>
            BACKOFFICE ADMINISTRATION
          </div>
        </div>

        <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <div style={{ fontSize:9, letterSpacing:'.12em', color:'#5F5E5A', marginBottom:6 }}>MOT DE PASSE</div>
            <input
              type="password" placeholder="••••••••••"
              value={pwd} onChange={e => { setPwd(e.target.value); setError('') }}
              autoComplete="off"
            />
          </div>

          {error && (
            <div style={{ padding:'8px 12px', background:'rgba(232,93,93,.1)', border:'1px solid rgba(232,93,93,.3)', fontSize:12, color:'#E85D5D' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !pwd}
            style={{
              marginTop:8, padding:'12px',
              background: loading || !pwd ? '#1A1A1A' : '#C9A84C',
              color:       loading || !pwd ? '#3A3A3A' : '#0A0A0A',
              fontSize:11, letterSpacing:'.1em', border:'none',
              cursor: loading || !pwd ? 'not-allowed' : 'pointer',
              fontFamily:'inherit', fontWeight:500, transition:'all .15s',
            }}
          >
            {loading ? 'VÉRIFICATION...' : 'ACCÉDER AU BACKOFFICE'}
          </button>
        </form>

        <div style={{ marginTop:'2rem', textAlign:'center', fontSize:10, color:'#1A1A1A' }}>
          Accès restreint · Transit-IA · 2026
        </div>
      </div>
    </>
  )
}
