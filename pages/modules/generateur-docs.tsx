import type { GetServerSideProps } from 'next'

// ⚠️ CORRECTIF PROVISOIRE — /tools/generateur-docs.html n'a jamais existé
// (lien mort confirmé, 404 en prod). Redirigé vers l'outil le plus proche
// déjà fonctionnel (transit-doc-generator.html, module TDG) plutôt que de
// laisser une page cassée.
//
// Ce n'est PAS un vrai contenu distinct — si "Générateur Documents" (GEN)
// doit couvrir autre chose que "Générateur Doc Transit" (TDG) — factures,
// certificats, DUM types par exemple — un vrai outil reste à construire.
// À trancher avec Ysf avant de considérer ce module comme complet.

export default function Page() { return null }
export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.writeHead(302, { Location: '/tools/transit-doc-generator.html' })
  res.end()
  return { props: {} }
}
