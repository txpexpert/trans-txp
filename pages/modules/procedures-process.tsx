import type { GetServerSideProps } from 'next'

// Régimes & Procédures à l'import (« Maîtriser le processus à l'import ») :
// codes de référence, procédures consolidées, parcours de dédouanement,
// procédures par flux et documents. Page servie par /tools/procedures-process.html
// (accès contrôlé par le middleware, module « procedures-process »).

export default function Page() { return null }
export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.writeHead(302, { Location: '/tools/procedures-process.html' })
  res.end()
  return { props: {} }
}
