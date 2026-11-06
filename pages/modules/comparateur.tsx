import type { GetServerSideProps } from 'next'

// Comparateur des régimes douaniers.
// Page servie par /tools/comparateur.html (accès contrôlé par le middleware,
// module « comparateur »). Calculs côté navigateur ; taux de change via
// /api/forex (repli sur des taux indicatifs si l'API ne répond pas).

export default function Page() { return null }
export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.writeHead(302, { Location: '/tools/comparateur.html' })
  res.end()
  return { props: {} }
}
