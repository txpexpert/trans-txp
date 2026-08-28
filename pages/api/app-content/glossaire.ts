// pages/api/app-content/glossaire.ts
// Sert le fichier HTML du glossaire pour l'espace mobile /app, après
// vérification d'accès. Route API (pas une page React) afin que le
// JavaScript intégré (recherche interactive) s'exécute normalement —
// impossible avec dangerouslySetInnerHTML dans une page React classique.
import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { getAppSessionFromReq, canAccessAppModule } from '../../../lib/appAccess'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getAppSessionFromReq(req)
  const allowed = session
    ? canAccessAppModule(session.plan, session.statut, 'glossaire-douanier', session.trialEnds)
    : false

  if (!allowed) {
    res.writeHead(302, { Location: '/app/login?redirect=' + encodeURIComponent('/api/app-content/glossaire') })
    res.end()
    return
  }

  const filePath = path.join(process.cwd(), 'content', 'app-tools', 'glossaire-douanier.html')
  const html = fs.readFileSync(filePath, 'utf-8')
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.status(200).send(html)
}
