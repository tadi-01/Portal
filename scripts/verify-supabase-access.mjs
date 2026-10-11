// Explicit opt-in: creates and then removes two synthetic development identities.
// No email is sent. No secret key/password/session is written or printed.
import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'
import { spawnSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'

assert.ok(
  process.argv.includes('--development'),
  'Run only against the approved development project with --development',
)
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
const keys = Array.isArray(keyResponse) ? keyResponse : (keyResponse.keys ?? keyResponse.api_keys)
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
const anonymous = createClient(endpoint.href, publishableKey, options)
const users = []
const students = []
const run = randomUUID()
let failed = false
let stage = 'Auth settings'
let diagnostic
function requireSuccess(result, operation) {
  stage = operation
  if (result.error) {
    diagnostic = {
      code: /^[a-z0-9_]+$/i.test(result.error.code ?? '') ? result.error.code : 'unavailable',
      status: result.error.status,
    }
  }
  assert.equal(result.error, null, `${operation} failed (code ${result.error?.code ?? 'unknown'})`)
  return result.data
}
try {
  const settings = await fetch(new URL('/auth/v1/settings', endpoint), {
    headers: { apikey: publishableKey },
    signal: AbortSignal.timeout(10000),
  })
  assert.equal(settings.status, 200)
  const authSettings = await settings.json()
  assert.equal(authSettings.disable_signup, true, 'Public self-signup must be disabled')
  assert.equal(authSettings.external?.email, true, 'Password authentication must remain enabled')

  const sessions = []
  for (const label of ['a', 'b']) {
    const email = `fieldnotes-test-${label}-${run}@example.invalid`
    const password = randomBytes(32).toString('base64url')
    const created = requireSuccess(
      await admin.auth.admin.createUser({ email, password, email_confirm: true }),
      'Create synthetic identity',
    )
    users.push(created.user.id)
    const student = requireSuccess(
      await admin
        .from('students')
        .insert({
          auth_user_id: created.user.id,
          student_number: `TEST-${label}-${run}`,
          display_name: `Synthetic ${label}`,
          programme_code: 'TEST',
        })
        .select('id')
        .single(),
      'Insert synthetic student',
    )
    students.push(student.id)
    requireSuccess(
      await admin.from('account_transactions').insert({
        student_id: student.id,
        occurred_on: '2000-01-01',
        description: 'Temporary isolation test',
        transaction_type: 'TEST',
        currency: 'USD',
        amount: 1,
        balance: 1,
        source_reference: `TEST-${label}-${run}`,
      }),
      'Insert synthetic transaction',
    )
    const client = createClient(endpoint.href, publishableKey, options)
    requireSuccess(
      await client.auth.signInWithPassword({ email, password }),
      'Authenticate synthetic student',
    )
    sessions.push(client)
  }
  for (const [index, client] of sessions.entries()) {
    const own = requireSuccess(
      await client.from('students').select('id'),
      'Read own student record',
    )
    assert.deepEqual(
      own.map((row) => row.id),
      [students[index]],
    )
    const otherId = students[1 - index]
    assert.deepEqual(
      requireSuccess(
        await client.from('students').select('id').eq('id', otherId),
        'Query other student',
      ),
      [],
    )
    const ledger = requireSuccess(
      await client.from('account_transactions').select('student_id'),
      'Read own ledger',
    )
    assert.deepEqual(
      ledger.map((row) => row.student_id),
      [students[index]],
    )
    for (const operation of [
      () => client.from('students').update({ display_name: 'Tampered' }).eq('id', otherId),
      () => client.from('students').delete().eq('id', otherId),
      () =>
        client.from('account_transactions').insert({
          student_id: otherId,
          occurred_on: '2000-01-01',
          description: 'Tampered',
          transaction_type: 'TEST',
          currency: 'USD',
          amount: 0,
          balance: 0,
          source_reference: `DENIED-${index}-${run}`,
        }),
    ]) {
      const result = await operation()
      assert.equal(
        result.error?.code,
        '42501',
        'Cross-student write must be denied by database permissions',
      )
    }
    assert.equal(
      (await client.rpc('submit_registration')).error?.message,
      'REGISTRY_CONFIGURATION_REQUIRED',
    )
    assert.equal(
      (await client.rpc('publish_results')).error?.message,
      'REGISTRY_CONFIGURATION_REQUIRED',
    )
  }
  assert.equal(
    (await anonymous.from('students').select('id')).error?.code,
    '42501',
    'Anonymous student query must be denied',
  )
  console.log(
    'PASS: real student JWTs enforce own-record reads, cross-student read/write denial, anonymous denial and configuration gates; public signup disabled.',
  )
} catch {
  // Avoid printing SDK errors that could contain request details or credentials.
  failed = true
  console.error(`Live isolation verification failed at: ${stage}. No credentials were printed.`)
  if (diagnostic) console.error(JSON.stringify(diagnostic))
} finally {
  const cleanupErrors = []
  if (students.length) {
    for (const table of ['account_transactions', 'students']) {
      const result = await admin
        .from(table)
        .delete()
        .in(table === 'students' ? 'id' : 'student_id', students)
      if (result.error) cleanupErrors.push(table)
    }
  }
  for (const user of users) {
    const { error } = await admin.auth.admin.deleteUser(user)
    if (error) cleanupErrors.push(`auth identity ${user}`)
  }
  if (cleanupErrors.length) {
    failed = true
    console.error(`Cleanup requires attention: ${cleanupErrors.join(', ')}. Test run: ${run}`)
  } else console.log('Cleanup complete: temporary test accounts and records removed.')
}
if (failed) process.exitCode = 1
