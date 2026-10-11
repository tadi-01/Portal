import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | undefined

/** Optional connection: the existing demo runs without Supabase credentials. */
export function getSupabaseClient(): SupabaseClient {
  if (client) return client

  const url = import.meta.env.VITE_SUPABASE_URL?.trim()
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
  if (!url || !key) {
    throw new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local, then restart Vite.')
  }
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('VITE_SUPABASE_URL must be a valid Supabase project URL.')
  }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)
  if (parsed.protocol !== 'https:' && !(local && parsed.protocol === 'http:')) {
    throw new Error('Supabase requires HTTPS, except for local development.')
  }
  if (!key.startsWith('sb_publishable_')) {
    throw new Error('Use a Supabase publishable key (sb_publishable_...), never a secret or service_role key.')
  }

  client = createClient(url, key)
  return client
}

/** Tests the Auth service without signing in or creating/modifying records. */
export async function checkSupabaseConnection(): Promise<void> {
  getSupabaseClient() // Validate configuration before making the request.
  const url = import.meta.env.VITE_SUPABASE_URL!.trim().replace(/\/$/, '')
  const response = await fetch(`${url}/auth/v1/settings`, {
    headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!.trim() },
    signal: AbortSignal.timeout(10000),
  })
  if (!response.ok) {
    throw new Error(`Supabase connection check failed (HTTP ${response.status}). Check the project URL and publishable key.`)
  }
}
