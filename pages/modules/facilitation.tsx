import type { GetServerSideProps } from 'next'

// Facilitation douanière : mesures en vigueur, nouveautés 2024-2026, statuts
// de confiance, obligations et outils numériques.
// Page servie par /tools/facilitation.html (accès contrôlé par le middleware,
// module « facilitation »).

export default function Page() { return null }
export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.writeHead(302, { Location: '/tools/facilitation.html' })
  res.end()
  return { props: {} }
}
