/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = nextConfig

// Note : la règle de réécriture /modules/reference-logistique -> /api/ref-log
// présente dans l'ancien next.config.js a été retirée — aucune page gardée
// n'y renvoie (probablement supersédée par /modules/logistique2, conservé).
// pages/api/ref-log.ts existe toujours dans le dépôt source si besoin de
// la restaurer, mais n'a pas été copié dans ce build.
