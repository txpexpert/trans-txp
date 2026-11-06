import type { GetServerSideProps } from 'next'

// Décisions de classement : recherche.
// Page servie par /tools/decisions-classement.html (accès contrôlé par le
// middleware, module « decisions-classement »). Les données viennent de
// Supabase via /api/decisions/suggest (liste déroulante) et
// /api/decisions/[id] (une fiche à la fois, avec quota).

export default function Page() { return null }
export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.writeHead(302, { Location: '/tools/decisions-classement.html' })
  res.end()
  return { props: {} }
}
