// pages/modules/conseil.tsx — le Conseil personnalisé est intégré à la page Expertise (#conseil).
// Ancienne adresse conservée : redirection, en gardant l'onglet demandé (?onglet=…).
import type { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const o = typeof query.onglet === 'string' ? `?onglet=${encodeURIComponent(query.onglet)}` : ''
  return { redirect: { destination: `/expertise${o}#conseil`, permanent: false } }
}

export default function ConseilRedirection() { return null }
