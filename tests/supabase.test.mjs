import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/lib/supabase.ts', import.meta.url), 'utf8')
const code = ts.transpileModule(source.replaceAll('import.meta.env', 'environment'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

function setup(environment, fetcher = async () => ({ ok: true })) {
  const exports = {}
  const calls = []
  const require = () => ({ createClient: (...args) => { calls.push(args); return {} } })
  new Function('exports', 'require', 'environment', 'fetch', code)(exports, require, environment, fetcher)
  return { ...exports, calls }
}
const configured = {
  VITE_SUPABASE_URL: 'https://example.supabase.co/',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
}

test('missing or partial configuration gives actionable errors', () => {
  assert.throws(() => setup({}).getSupabaseClient(), /Set VITE_SUPABASE_URL/)
  assert.throws(() => setup({ VITE_SUPABASE_URL: configured.VITE_SUPABASE_URL }).getSupabaseClient(), /Set VITE_SUPABASE_URL/)
})
test('rejects invalid URLs, insecure remote URLs and secret keys', () => {
  for (const url of ['invalid', 'http://remote.example', 'ftp://example.com']) {
    assert.throws(() => setup({ ...configured, VITE_SUPABASE_URL: url }).getSupabaseClient())
  }
  assert.throws(() => setup({ ...configured, VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_test' }).getSupabaseClient(), /publishable key/)
})
test('reuses the client and allows local development', () => {
  const api = setup({ ...configured, VITE_SUPABASE_URL: 'http://localhost:54321' })
  assert.equal(api.getSupabaseClient(), api.getSupabaseClient())
  assert.equal(api.calls.length, 1)
})
test('connection probe uses Auth settings and reports HTTP failure', async () => {
  let requested
  const api = setup(configured, async (url, options) => {
    requested = url
    assert.equal(options.headers.apikey, configured.VITE_SUPABASE_PUBLISHABLE_KEY)
    assert.ok(options.signal instanceof AbortSignal)
    return { ok: true }
  })
  await api.checkSupabaseConnection()
  assert.equal(requested, 'https://example.supabase.co/auth/v1/settings')
  await assert.rejects(setup(configured, async () => ({ ok: false, status: 401 })).checkSupabaseConnection(), /HTTP 401/)
  await assert.rejects(setup(configured, async () => { throw new Error('Network unavailable') }).checkSupabaseConnection(), /Network unavailable/)
})
