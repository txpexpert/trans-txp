// pages/robots.txt.tsx — consignes aux moteurs de recherche. La démo (demo.*) et les préversions
// Vercel ne sont pas indexées ; le site public l'est, avec son plan du site.
import type { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const host = String(req.headers.host || '')
  const prive = host.startsWith('demo.') || host.endsWith('.vercel.app') || process.env.VERCEL_ENV !== 'production'
  const txt = prive
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /backoffice\nDisallow: /partage/\nDisallow: /dossiers\nDisallow: /fiches\nDisallow: /portail\nDisallow: /mon-espace\n\nSitemap: https://${host}/sitemap.xml\n`
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  if (prive) res.setHeader('X-Robots-Tag', 'noindex, nofollow')
  res.write(txt); res.end()
  return { props: {} }
}
export default function Robots() { return null }
