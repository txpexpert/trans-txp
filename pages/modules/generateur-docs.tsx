import type { GetServerSideProps } from 'next'

// Générateur de documents commerciaux et douaniers (facture, pro forma,
// packing list, CMR, EUR.1, DV1, admission temporaire…).
// La page /modules/transit-doc-generator est désormais le « Dossier
// documentaire par procédure », distinct de ce générateur.

export default function Page() { return null }
export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.writeHead(302, { Location: '/tools/generateur-docs.html' })
  res.end()
  return { props: {} }
}
