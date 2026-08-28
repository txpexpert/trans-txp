// pages/api/app-content/substances-dangereuses.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { getAppSessionFromReq, canAccessAppModule } from '../../../lib/appAccess'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getAppSessionFromReq(req)
  const allowed = session
    ? canAccessAppModule(session.plan, session.statut, 'substances-dangereuses', session.trialEnds)
    : false

  if (!allowed) {
    res.writeHead(302, { Location: '/app/login?redirect=' + encodeURIComponent('/api/app-content/substances-dangereuses') })
    res.end()
    return
  }

  const filePath = path.join(process.cwd(), 'content', 'app-tools', 'Substances-dangereuses.html')
  const html = fs.readFileSync(filePath, 'utf-8')
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.status(200).send(html)
}
