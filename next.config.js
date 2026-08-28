/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: ({ request }) => request.mode === 'navigate',
      handler: 'NetworkOnly',
    },
  ],
})

const nextConfig = {
  async redirects() {
    return [
      // Ancien outil combiné "Classificateur HS · DUM · Screening", remplacé
      // par deux pages séparées : /modules/classement et /modules/decisions-classement.
      // Redirection conservée au cas où l'ancienne URL serait encore en favori
      // ou indexée par un moteur de recherche.
      {
        source: '/tools/modules-classement-clf.html',
        destination: '/modules/classement',
        permanent: true,
      },
      {
        source: '/modules/classificateur',
        destination: '/modules/classement',
        permanent: true,
      },
    ]
  },
}

module.exports = withPWA(nextConfig)

// Note : la règle de réécriture /modules/reference-logistique -> /api/ref-log
// présente dans l'ancien next.config.js a été retirée — aucune page gardée
// n'y renvoie (probablement supersédée par /modules/logistique2, conservé).
// pages/api/ref-log.ts existe toujours dans le dépôt source si besoin de
// la restaurer, mais n'a pas été copié dans ce build.

