import { GetServerSideProps } from 'next'
export default function Page() { return null }
export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.writeHead(302, { Location: '/tools/m36-intelligence-import.html' })
  res.end()
  return { props: {} }
}
