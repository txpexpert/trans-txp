// pages/dashboard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Espace personnel client (distinct du backoffice admin sous /backoffice).
// Version minimale : infos du compte + bouton upgrade + déconnexion.
// ─────────────────────────────────────────────────────────────────────────────
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useEffect } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'

const PLAN_LABELS: Record<string, string> = {
  trial:      'Essai gratuit',
  pro:        'Professionnel',
  cabinet:    'Cabinet',
  enterprise: 'Entreprise',
}

const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  trial:     { label: 'En période d\'essai', color: '#1A3A9A' },
  active:    { label: 'Actif',               color: '#1A7A40' },
  expired:   { label: 'Expiré',              color: '#C0392B' },
  suspended: { label: 'Suspendu',            color: '#C0392B' },
}

export default function Dashboard() {
  const router = useRouter()
  const { user, loading, logout } = useAuth()

  // Redirection si non connecté (une fois la vérification de session terminée)
  useEffect(() => {
    if (!loading && !user) {
      router.push('/abonnement-requis?from=/dashboard')
    }
  }, [loading, user, router])

  if (loading || !user) {
    return (
      <Layout>
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--inkm)' }}>
          Chargement de votre espace…
        </div>
      </Layout>
    )
  }

  const statut = STATUT_LABELS[user.statut] || { label: user.statut, color: '#888' }
  const needsUpgrade = user.plan === 'trial' || user.statut === 'expired'

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  return (
    <Layout>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1rem' }}>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color: 'var(--bd)', marginBottom: 6 }}>
          Mon compte
        </h1>
        <p style={{ fontSize: 13, color: 'var(--inkm)', marginBottom: '2rem' }}>
          Gérez vos informations et votre abonnement Transit-IA.
        </p>

        <div style={{ background: 'var(--white)', border: '.5px solid var(--rule)', padding: '1.5rem', marginBottom: '1.5rem' }}>
          {[
            ['Email', user.email],
            ['Plan actuel', PLAN_LABELS[user.plan] || user.plan],
            ...(user.trialEnds
              ? [[user.plan === 'trial' ? 'Fin de la période d\'essai' : 'Prochain renouvellement',
                  new Date(user.trialEnds).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })]]
              : []),
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '.5px solid var(--rule)', fontSize: 13 }}>
              <span style={{ color: 'var(--inkm)' }}>{k}</span>
              <span style={{ color: 'var(--bd)', fontWeight: 600 }}>{v}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', fontSize: 13 }}>
            <span style={{ color: 'var(--inkm)' }}>Statut</span>
            <span style={{ fontSize: 11, padding: '3px 10px', background: `${statut.color}18`, color: statut.color, fontWeight: 600 }}>
              {statut.label}
            </span>
          </div>
        </div>

        {needsUpgrade && (
          <div style={{ background: '#FEF5E4', border: '.5px solid #E8C97A88', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#8A5A10', marginBottom: 6 }}>
              Passez à un plan supérieur
            </div>
            <p style={{ fontSize: 12, color: 'var(--inkm)', marginBottom: 12, lineHeight: 1.6 }}>
              Débloquez l'ensemble des modules Transit-IA (classement tarifaire, tracking, générateur de documents) avec un plan Professionnel ou Cabinet.
            </p>
            <Link href="/abonnements">
              <button style={{ padding: '9px 20px', background: '#C9A84C', color: '#0A0A0A', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Voir les plans
              </button>
            </Link>
          </div>
        )}

        <button
          onClick={handleLogout}
          style={{ padding: '9px 20px', background: 'transparent', border: '.5px solid var(--rule)', color: 'var(--inkm)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Se déconnecter
        </button>
      </div>
    </Layout>
  )
}
