/**
 * lib/edgeAuth.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Vérification du token de session dia_session, compatible Edge Runtime.
 * middleware.ts tourne sur Edge Runtime, où le module Node 'crypto' n'existe
 * pas — on utilise donc l'API Web Crypto native (disponible en Edge).
 * Doit rester rigoureusement compatible avec createUserToken() dans
 * lib/userAuth.ts : même secret, même format, même encodage base64url.
 */

import type { Plan, Statut } from './moduleAccess'

export interface SessionPayload {
  userId:     string
  email:      string
  plan:       Plan
  statut:     Statut
  trialEnds?: number
  exp:        number
}

function base64urlToBytes(b64url: string): Uint8Array {
  const pad = (4 - (b64url.length % 4)) % 4
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad)
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function bytesToBase64url(buf: ArrayBuffer): string {
  let binary = ''

  const arr = new Uint8Array(buf)
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function verifyUserTokenEdge(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [encoded, sig] = parts

  const secret = process.env.USER_SECRET || process.env.ADMIN_SECRET || 'dev-secret'

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const sigBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(encoded))
    const expectedSig = bytesToBase64url(sigBuffer)

    if (expectedSig !== sig) return null

    const jsonBytes = base64urlToBytes(encoded)
    const json = new TextDecoder().decode(jsonBytes)
    const payload: SessionPayload = JSON.parse(json)
    if (Date.now() > payload.exp) return null
    return payload
  } catch {

    return null
  }
}