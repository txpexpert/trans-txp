import type { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async (context) => {
  const host = context.req.headers.host ?? ''
  const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1')

  // Accès réservé aux utilisateurs connectés.
  if (!isLocal) {
    const cookie = context.req.cookies['dia_session']
    if (!cookie) {
      return {
        redirect: {
          destination: `/auth/login?redirect=/modules/cgi-search&module=cgi-search`,
          permanent: false,
        },
      }
    }
  }

  return {
    redirect: {
      destination: '/tools/cgi-search.html',
      permanent: false,
    },
  }
}

export default function CGISearch() {
  return null
}
