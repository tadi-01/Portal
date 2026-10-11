// Server-side CLI helper. Never import this module into the web application.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'
import { spawnSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'
const env = parseEnv(readFileSync(new URL('../.env.local', import.meta.url), 'utf8'))
const endpoint = new URL(env.VITE_SUPABASE_URL.trim())
assert.equal(endpoint.protocol, 'https:')
assert.match(endpoint.hostname, /^[a-z]{20}\.supabase\.co$/)
const reference = endpoint.hostname.split('.')[0]
const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY.trim()
assert.ok(publishableKey.startsWith('sb_publishable_'))
const cli =
  process.platform === 'win32'
    ? spawnSync(
        'cmd.exe',
        [
          '/d',
          '/s',
          '/c',
          `npx.cmd --yes supabase projects api-keys --project-ref ${reference} --output json --reveal`,
        ],
        { encoding: 'utf8', windowsHide: true, timeout: 30000 },
      )
    : spawnSync(
        'npx',
        [
          '--yes',
          'supabase',
          'projects',
          'api-keys',
          '--project-ref',
          reference,
          '--output',
          'json',
          '--reveal',
        ],
        { encoding: 'utf8', timeout: 30000 },
      )
assert.equal(cli.status, 0, 'CLI key lookup failed; verify local CLI login and project access')
let keyResponse
try {
  keyResponse = JSON.parse(cli.stdout)
} catch {
  throw new Error('Unexpected CLI key response')
}
const keys = Array.isArray(keyResponse)
  ? keyResponse
  : (keyResponse.keys ?? keyResponse.api_keys)
assert.ok(Array.isArray(keys), 'Unexpected CLI key response')
const secretEntry =
  keys.find((entry) => (entry.api_key ?? entry.key ?? '').startsWith('sb_secret_')) ??
  keys.find((entry) => entry.name === 'service_role')
const secretKey = secretEntry?.api_key ?? secretEntry?.key
assert.ok(secretKey, 'No server key available through the authenticated CLI')
const options = {
  db: { schema: 'fieldnotes' },
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
}
const admin = createClient(endpoint.href, secretKey, options)

export { admin, endpoint, publishableKey, options }
