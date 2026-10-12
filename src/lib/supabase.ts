import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type PortalClient = SupabaseClient<Database, 'fieldnotes'>
let client: PortalClient | undefined

/** Required live connection. Missing configuration never enables demo access. */
export function getSupabaseClient(): PortalClient {
  if (client) return client

  const url = import.meta.env.VITE_SUPABASE_URL?.trim()
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
  if (!url || !key) {
    throw new Error(
      'Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local, then restart Vite.',
    )
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
    throw new Error(
      'Use a Supabase publishable key (sb_publishable_...), never a secret or service_role key.',
    )
  }

  client = createClient<Database, 'fieldnotes'>(url, key, { db: { schema: 'fieldnotes' } })
  return client
}
