// pages/ar/diagnostic.tsx — ouvre le diagnostic de conformité en arabe (outil autonome, utilisable hors ligne).
import type { GetServerSideProps } from 'next'

export default function DiagnosticAr() { return null }
export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: { destination: '/tools/diagnostic-conformite-ar.html', permanent: false },
})
