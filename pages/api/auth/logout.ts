import type { NextApiRequest, NextApiResponse } from 'next'
import { clearUserCookie } from '../../../lib/userAuth'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Set-Cookie', clearUserCookie())
  res.status(200).json({ success: true })
}
