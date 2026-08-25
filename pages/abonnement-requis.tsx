import { useRouter } from 'next/router'
import Link from 'next/link'

export default function AbonnementRequis() {
  const router = useRouter()
  const from = typeof router.query.from === 'string' ? router.query.from : null

  return (
    <div style={{
      minHeight: '70vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 20px',
    }}>
      <h1 style={{ fontSize: '24px', marginBottom: '12px' }}>
        Cette fonctionnalité est réservée aux abonnés
      </h1>
      <p style={{ color: '#555', maxWidth: 480, marginBottom: '24px' }}>
        {from
          ? `L'accès à "${from}" nécessite un compte actif ou un abonnement Douane.ia.`
          : `L'accès à cette page nécessite un compte actif ou un abonnement Douane.ia.`}
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <Link href="/abonnements" style={{
          background: '#1A5C2A', color: '#fff', padding: '10px 20px',
          borderRadius: 6, textDecoration: 'none', fontWeight: 500,
        }}>
          Voir les abonnements
        </Link>
        <Link href="/auth/login" style={{
          border: '1px solid #ccc', padding: '10px 20px',
          borderRadius: 6, textDecoration: 'none', color: '#333',
        }}>
          Se connecter

        </Link>
      </div>
    </div>
  )
}
