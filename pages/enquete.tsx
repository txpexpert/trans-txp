// pages/enquete.tsx — ouvre l'enquête Baromètre 2026 (outil autonome, utilisable hors ligne).
import type { GetServerSideProps } from 'next'

export default function Enquete() { return null }
export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: { destination: '/tools/enquete-barometre.html', permanent: false },
})
