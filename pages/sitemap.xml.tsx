// pages/sitemap.xml.tsx — plan du site pour les moteurs de recherche (pages publiques et pages produits).
import type { GetServerSideProps } from 'next'
import { POSITIONS_TOP } from '../lib/produitsTop'

const PAGES = ['/', '/plateforme', '/tarifs', '/expertise', '/diagnostic', '/barometre', '/calculateur-dum', '/produits', '/cas-types',
  '/espaces/qualifier', '/espaces/optimiser', '/espaces/chiffrer', '/espaces/executer', '/espaces/securiser', '/espaces/bibliotheque', '/espaces/piloter',
  '/demo/fiche-produit', '/a-propos', '/contact',
  '/profils/pme', '/profils/transitaire', '/profils/industriel', '/profils/daf', '/profils/prescripteurs', '/ar', '/ar/tarifs', '/tools/diagnostic-conformite-ar.html', '/ar/contact', '/ar/echange-expert']

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const base = `https://${req.headers.host}`
  const jour = new Date().toISOString().slice(0, 10)
  const urls = [...PAGES, ...POSITIONS_TOP.map(c => `/produits/${c}`)]
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => `  <url><loc>${base}${u}</loc><lastmod>${jour}</lastmod><changefreq>${u.startsWith('/produits/') || u === '/barometre' ? 'daily' : 'weekly'}</changefreq></url>`).join('\n') +
    `\n</urlset>\n`
  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=86400')
  res.write(xml); res.end()
  return { props: {} }
}
export default function Sitemap() { return null }
