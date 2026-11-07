import type { GetServerSideProps } from 'next'

// Simulateur unique « Coût de revient à l'import » (fusion du simulateur de
// droits et taxes et du simulateur fiscal douanier, nov. 2026).
// Page servie par /tools/simulateur.html ; calculs côté serveur dans
// /api/calculs/cout-revient (accès contrôlé, module « simulateur »).

export default function Page() { return null }
export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.writeHead(302, { Location: '/tools/simulateur.html' })
  res.end()
  return { props: {} }
}
