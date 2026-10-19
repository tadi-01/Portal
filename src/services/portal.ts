import { getSupabaseClient } from '@/lib/supabase'
import type { Database } from '@/types/database'

export type Row<T extends keyof Database['fieldnotes']['Tables']> =
  Database['fieldnotes']['Tables'][T]['Row']


/** Fail closed; RLS is the authority. Explicit pages avoid the API's row cap. */
export async function readTable<T extends keyof Database['fieldnotes']['Tables']>(
  table: T,
): Promise<Row<T>[]> {
  const client = getSupabaseClient()
  const result: Row<T>[] = []
  for (let start = 0; ; start += 500) {
    const { data, error } = await client
      .from(table)
      .select('*')
      .order('id')
      .range(start, start + 499)
    if (error) throw error
    const page = data as unknown as Row<T>[]
    result.push(...page)
    if (page.length < 500) return result
  }
}

export async function readIdentity() {
  const client = getSupabaseClient()
  const {
    data: { user },
    error,
  } = await client.auth.getUser()
  if (error || !user) throw new Error('Your session has expired. Please sign in again.')
  const [students, assignments] = await Promise.all([
    client.from('students').select('*').eq('auth_user_id', user.id).maybeSingle(),
    client.rpc('my_staff_assignments'),
  ])
  if (students.error) throw students.error
  if (assignments.error) throw assignments.error
  return { user, student: students.data, assignments: assignments.data ?? [] }
}

export async function studentSignIn(studentNumber: string, password: string) {
  const client = getSupabaseClient()
  const { data, error } = await client.functions.invoke('student-login', {
    body: { studentNumber, password },
  })
  if (error || !data?.access_token || !data?.refresh_token)
    throw new Error('Unable to sign in.')
  const session = await client.auth.setSession(data)
  if (session.error) throw session.error
}

export async function readStudentData() {
  const [courses, offerings, enrollments, results, transactions, resources, exams] =
    await Promise.all([
      readTable('courses'),
      readTable('course_offerings'),
      readTable('enrollments'),
      readTable('released_results'),
      readTable('account_transactions'),
      readTable('resources'),
      readTable('exam_sessions'),
    ])
  return { courses, offerings, enrollments, results, transactions, resources, exams }
}
