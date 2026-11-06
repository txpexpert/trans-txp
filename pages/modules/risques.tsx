import type { GetServerSideProps } from 'next'

// Contrôle et maîtrise des risques : signaux d'alerte, liste négative,
// dispositifs de contrôle, contrôles internes, sanctions et situations pratiques.
// Page servie par /tools/risques.html (accès contrôlé par le middleware,
// module « risques »).

export default function Page() { return null }
export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.writeHead(302, { Location: '/tools/risques.html' })
  res.end()
  return { props: {} }
}
