// pages/diagnostic.tsx — ouvre le diagnostic de conformité (outil autonome, utilisable hors ligne).
import type { GetServerSideProps } from 'next'

export default function Diagnostic() { return null }
export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: { destination: '/tools/diagnostic-conformite.html', permanent: false },
})
