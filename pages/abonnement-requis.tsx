import type { GetServerSideProps } from 'next'
import Link from 'next/link'

interface Props {
  from: string | null
}

export default function AbonnementRequis({ from }: Props) {
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
          ? `L'accès à "${from}" nécessite un compte actif ou un abonnement Transit.ia.`
          : `L'accès à cette page nécessite un compte actif ou un abonnement Transit.ia.`}
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <Link href="/abonnements" style={{
          background: '#1A5C2A', color: '#fff', padding: '10px 20px',
          borderRadius: 6, textDecoration: 'none', fontWeight: 500,
        }}>
          Voir les abonnements
        </Link>
        <Link href={from ? `/auth/login?redirect=${encodeURIComponent(from)}` : "/auth/login"} style={{
          border: '1px solid #ccc', padding: '10px 20px',
          borderRadius: 6, textDecoration: 'none', color: '#333',
        }}>
          Se connecter
        </Link>
      </div>
    </div>
  )
}

// ✅ FIX — getServerSideProps au lieu de useRouter().query : le paramètre
// "from" est désormais résolu côté serveur, donc le lien "Se connecter"
// contient déjà ?redirect=... dans le tout premier HTML envoyé au
// navigateur. Avant ce correctif, le lien était rendu sans "from" tant que
// React n'avait pas terminé l'hydratation côté client (router.query vide
// au premier rendu) — un clic rapide sur mobile utilisait ce lien "vide"
// et renvoyait ensuite vers la page d'accueil après connexion.
export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const raw = context.query.from
  const from = typeof raw === 'string' ? raw : null
  return { props: { from } }
}
