// lib/supabaseAdmin.ts
// ─────────────────────────────────────────────────────────────────────────────
// Client Supabase avec la clé SERVICE — à n'utiliser QUE côté serveur
// (API routes, getServerSideProps). Ne jamais importer depuis un composant
// React ou depuis middleware.ts.
// ─────────────────────────────────────────────────────────────────────────────
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

export function supabaseAdmin(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_KEY
    if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_KEY manquants')
    client = createClient(url, key, { auth: { persistSession: false } })
  }
  return client
}
