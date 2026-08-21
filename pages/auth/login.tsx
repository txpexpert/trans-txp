import { useState } from 'react'
import { useRouter } from 'next/router'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Mock login - juste pour Phase 0
    setTimeout(() => {
      alert(`Connecté comme: ${email}`)
      router.push('/dashboard')
    }, 500)
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Connexion Transit-IA</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <label>
          Email:
          <input 
            type="email" 
            placeholder="vous@example.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: '8px', marginTop: '5px', width: '100%', boxSizing: 'border-box' }} 
          />
        </label>
        <label>
          Mot de passe:
          <input 
            type="password" 
            placeholder="••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: '8px', marginTop: '5px', width: '100%', boxSizing: 'border-box' }} 
          />
        </label>
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            padding: '10px', 
            background: loading ? '#ccc' : '#007bff', 
            color: 'white', 
            border: 'none', 
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
      <p style={{ marginTop: '20px' }}>
        <a href="/">← Retour à l'accueil</a>
      </p>
    </div>
  )
}
