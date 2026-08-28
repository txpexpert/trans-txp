// pages/app/index.tsx
// Menu d'accueil de l'espace mobile — visible sans connexion (chaque tuile
// vérifie l'accès individuellement en la ouvrant). Remplace pages/mobile/index.tsx.

import Link from 'next/link'

const modules = [
  { label: 'Classement tarifaire',       href: '/app/classement' },
  { label: 'Décisions de classement',    href: '/app/decisions-classement' },
  { label: 'FAQ — Espace Expert',        href: '/app/faq' },
  { label: 'Glossaire douanier',         href: '/api/app-content/glossaire' },
  { label: 'Substances dangereuses',     href: '/api/app-content/substances-dangereuses' },
  { label: 'Marquage & warnings',        href: '/api/app-content/marquage-warnings' },
  { label: 'Calculateur conteneurs',     href: '/api/app-content/calc-conteneurs' },
  { label: 'Calculateur colis SRE',      href: '/api/app-content/calc-colis-sre' },
]

export default function AppHome() {
  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif', minHeight: '100vh', background: '#F5F7FA' }}>
      <h1 style={{ color: '#153E82', fontSize: 22, marginBottom: 4, fontWeight: 700 }}>
        Transit-eXPert
      </h1>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 20 }}>
        Outils douaniers — accès mobile
      </p>
      <div style={{ display: 'grid', gap: 12 }}>
        {modules.map(m => (
          <Link key={m.href} href={m.href} style={{
            display: 'block', padding: 16, borderRadius: 10,
            background: '#fff', color: '#1C1C1C', textDecoration: 'none',
            fontWeight: 600, border: '1px solid #153E8222',
            boxShadow: '0 1px 4px rgba(0,0,0,.04)',
          }}>
            {m.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
