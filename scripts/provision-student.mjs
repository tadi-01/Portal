// One registry-provided development identity per invocation. Credentials stay local.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { admin } from './supabase-admin.mjs'

assert.ok(process.argv.includes('--development'), 'Development opt-in required')
const file = process.argv[process.argv.indexOf('--input') + 1]
assert.ok(
  process.argv.includes('--input') && file,
  'Provide --input path to a private JSON file',
)
const record = JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''))
assert.ok(
  typeof record.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email),
  'Valid recovery email required',
)
assert.ok(
  typeof record.password === 'string' && record.password.length >= 8,
  'Password must have at least 8 characters',
)
assert.ok(
  typeof record.studentNumber === 'string' &&
    record.studentNumber.trim().length <= 80 &&
    record.studentNumber.trim(),
  'Student number required',
)
assert.ok(
  record.name &&
    record.programmeCode &&
    record.programmeName &&
    Number.isInteger(record.part) &&
    record.part > 0 &&
    Number.isInteger(record.semester) &&
    record.semester > 0 &&
    Number.isFinite(record.accountBalance),
  'Name, programme code, programme name, part, semester and account balance are required',
)
let createdId
let linked = false
try {
  const existing = await admin
    .from('students')
    .select('auth_user_id')
    .eq('student_number', record.studentNumber.trim())
    .maybeSingle()
  if (existing.error) throw new Error('Student lookup failed')
  if (existing.data) {
    const identity = await admin.auth.admin.getUserById(existing.data.auth_user_id)
    if (
      identity.error ||
      identity.data.user.email?.toLowerCase() !== record.email.toLowerCase()
    )
      throw new Error('Existing identity differs; manual review required')
    const updated = await admin
      .from('students')
      .update({
        display_name: record.name,
        programme_code: record.programmeCode,
        programme_name: record.programmeName,
        academic_year: record.academicYear ?? null,
        part: record.part,
        semester: record.semester,
        account_balance: record.accountBalance,
      })
      .eq('student_number', record.studentNumber.trim())
    if (updated.error) throw new Error('Student details update failed')
    console.log('Student already provisioned. Password and existing records left unchanged.')
  } else {
    // This development-only import sends no email. Production must use verified activation.
    const created = await admin.auth.admin.createUser({
      email: record.email,
      password: record.password,
      email_confirm: true,
    })
    if (created.error)
      throw new Error(
        'Auth account creation failed; check whether that email already has an account',
      )
    createdId = created.data.user.id
    const inserted = await admin.from('students').insert({
      auth_user_id: createdId,
      student_number: record.studentNumber.trim(),
      display_name: record.name,
      programme_code: record.programmeCode,
      programme_name: record.programmeName,
      academic_year: record.academicYear ?? null,
      part: record.part,
      semester: record.semester,
      account_balance: record.accountBalance,
      // No registration status, marks, fees or eligibility is inferred from the old demo.
    })
    if (inserted.error) throw new Error('Student linking failed')
    linked = true
    console.log(
      'Created and linked one student account. No staff permissions, academic fixtures or email messages were added.',
    )
  }
} catch (error) {
  if (createdId && !linked) {
    const cleanup = await admin.auth.admin.deleteUser(createdId)
    if (cleanup.error)
      console.error(
        'Auth cleanup failed: inspect the most recently created unlinked development identity.',
      )
  }
  console.error(error instanceof Error ? error.message : 'Provisioning failed')
  process.exitCode = 1
}
