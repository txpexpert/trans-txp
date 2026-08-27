// context/AuthContext.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Source unique de vérité pour l'état de session côté client.
// Remplace les fetch('/api/auth/...') dupliqués dans les 3 formulaires
// (page dédiée, popup accueil, popup sidebar). Chaque formulaire n'appelle
// plus que useAuth() — plus aucun appel réseau direct dans les composants UI.
// ─────────────────────────────────────────────────────────────────────────────
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'

type Plan   = 'trial' | 'pro' | 'cabinet' | 'enterprise'
type Statut = 'trial' | 'active' | 'expired' | 'suspended'

interface SessionUser {
  email:      string
  role:       'admin' | 'user'
  plan:       Plan
  statut:     Statut
  trialEnds:  number | null   // timestamp ms — fin d'essai / prochain renouvellement
}

interface RegisterInput {
  email: string
  password: string
  nom?: string
  prenom?: string
  societe?: string
  profil?: string
}

interface AuthContextValue {
  user:            SessionUser | null
  loading:         boolean          // true pendant la vérification initiale de session
  login:           (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  register:        (input: RegisterInput) => Promise<{ ok: boolean; error?: string }>
  logout:          () => Promise<void>
  refreshSession:  () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (!res.ok) {
        setUser(null)
        return
      }
      const data = await res.json()
      setUser({ email: data.email, role: data.role, plan: data.plan, statut: data.statut, trialEnds: data.trialEnds ?? null })
    } catch {
      setUser(null)
    }
  }, [])

  // Vérification de session au chargement initial de l'app (dans _app.tsx)
  useEffect(() => {
    (async () => {
      setLoading(true)
      await refreshSession()
      setLoading(false)
    })()
  }, [refreshSession])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error || 'Connexion impossible' }
      await refreshSession()
      return { ok: true }
    } catch {
      return { ok: false, error: 'Erreur réseau' }
    }
  }, [refreshSession])

  const register = useCallback(async (input: RegisterInput) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(input),
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error || 'Inscription impossible' }
      await refreshSession()
      return { ok: true }
    } catch {
      return { ok: false, error: 'Erreur réseau' }
    }
  }, [refreshSession])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } finally {
      setUser(null)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth() doit être utilisé à l\'intérieur de <AuthProvider>')
  return ctx
}
