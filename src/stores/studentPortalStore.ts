import { defineStore } from 'pinia'
import { ref, onScopeDispose } from 'vue'
import { getSupabaseClient } from '@/lib/supabase'
import { readIdentity, readStudentData, studentSignIn, type Row } from '@/services/portal'

export interface Course {
  id: string
  code: string
  name: string
  type: string
}
export interface Payment {
  id: string
  date: string
  type: string
  description: string
  currency: string
  amount: number
  balance: number
}
export interface Result {
  id: string
  code: string
  name: string
  credits: number
  grade: string
  score: number | null
}
const emptyStudent = () => ({
  name: '',
  studentNumber: '',
  programme: 'Not provided',
  programmeName: 'Not provided',
  academicYear: 'Not provided',
  part: null as number | null,
  semester: null as number | null,
  registrationStatus: 'Not registered',
  feesBalance: null as number | null,
})

export const useStudentPortalStore = defineStore('studentPortal', () => {
  const isAuthenticated = ref(false)
  const isStaff = ref(false)
  const student = ref(emptyStudent())
  const assignments = ref<{ role: string; offering_id: string | null }[]>([])
  const courses = ref<Course[]>([])
  const zigPayments = ref<Payment[]>([])
  const usdPayments = ref<Payment[]>([])
  const examResults = ref<Result[]>([])
  const resources = ref<Row<'resources'>[]>([])
  const exams = ref<Row<'exam_sessions'>[]>([])
  const loading = ref(false)
  const errorMessage = ref('')
  let initialized: Promise<void> | undefined
  let unsubscribe: (() => void) | undefined
  let epoch = 0
  let activeUserId: string | undefined
  let expiryTimer: ReturnType<typeof setTimeout> | undefined

  function clearData() {
    student.value = emptyStudent()
    courses.value = []
    zigPayments.value = []
    usdPayments.value = []
    examResults.value = []
    resources.value = []
    exams.value = []
  }
  function clearSession() {
    epoch++
    activeUserId = undefined
    clearTimeout(expiryTimer)
    clearData()
    isAuthenticated.value = false
    isStaff.value = false
    assignments.value = []
    loading.value = false
  }

  async function loadData() {
    const request = ++epoch
    clearData()
    loading.value = true
    errorMessage.value = ''
    try {
      const identity = await readIdentity()
      if (request !== epoch) return false
      if (!identity.student && !identity.assignments.length)
        throw new Error('Account not linked.')
      activeUserId = identity.user.id
      assignments.value = identity.assignments
      isStaff.value = identity.assignments.length > 0
      isAuthenticated.value = true
      if (isStaff.value) return true
      const s = identity.student!
      const data = await readStudentData()
      if (request !== epoch) return false
      student.value = {
        ...emptyStudent(),
        name: s.display_name,
        studentNumber: s.student_number,
        programme: s.programme_code,
        programmeName: s.programme_name ?? s.programme_code,
        academicYear: s.academic_year ?? 'Not provided',
        part: s.part,
        semester: s.semester,
        registrationStatus: s.registration_status ?? 'Not provided',
      }
      const courseFor = (offeringId: string) => {
        const offering = data.offerings.find((o) => o.id === offeringId)
        const course = data.courses.find((c) => c.id === offering?.course_id)
        return {
          id: offeringId,
          code: course?.code ?? 'Unavailable',
          name: course?.name ?? 'Course unavailable',
          credits: offering?.credits ?? 0,
        }
      }
      courses.value = data.enrollments.map((e) => ({
        ...courseFor(e.offering_id),
        type: 'ENROLLED',
      }))
      examResults.value = data.results.map((r) => {
        const enrollment = data.enrollments.find((e) => e.id === r.enrollment_id)
        return {
          ...courseFor(enrollment?.offering_id ?? ''),
          id: r.id,
          grade: r.grade,
          score: r.score,
        }
      })
      const transactions = data.transactions
        .sort((a, b) => b.occurred_on.localeCompare(a.occurred_on) || b.id.localeCompare(a.id))
        .map((t) => ({
          id: t.id,
          date: t.occurred_on,
          type: t.transaction_type,
          description: t.description,
          currency: t.currency,
          amount: t.amount,
          balance: t.balance,
        }))
      zigPayments.value = transactions.filter((t) => t.currency === 'ZIG')
      usdPayments.value = transactions.filter((t) => t.currency === 'USD')
      // Same-day transactions have no authoritative sequence; don't infer a total balance.
      resources.value = data.resources.filter((r) => r.published)
      exams.value = data.exams
        .filter((e) => e.published)
        .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
      return true
    } catch (error) {
      if (request !== epoch) return false
      clearData()
      if (error instanceof Error && error.message.includes('session has expired')) {
        clearSession()
        errorMessage.value = error.message
      } else
        errorMessage.value =
          'Portal records could not be loaded. Retry, or sign out and contact the registry.'
      return false
    } finally {
      if (request === epoch) loading.value = false
    }
  }

  async function initialize() {
    if (initialized) return initialized
    initialized = (async () => {
      try {
        const client = getSupabaseClient()
        const { data, error } = await client.auth.getSession()
        if (error) throw error
        const listener = client.auth.onAuthStateChange((event, session) => {
          // Synchronous: Supabase holds its auth lock in this callback.
          if (session && activeUserId && session.user.id !== activeUserId) {
            clearSession()
            errorMessage.value = 'The signed-in account changed. Please sign in again.'
          }
          if (session?.expires_at) {
            clearTimeout(expiryTimer)
            expiryTimer = setTimeout(
              () => {
                clearSession()
                errorMessage.value = 'Your session has expired. Please sign in again.'
              },
              Math.max(0, session.expires_at * 1000 - Date.now()),
            )
          }
          if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
            clearSession()
            errorMessage.value = 'Your session ended. Please sign in again.'
          }
        })
        unsubscribe = () => listener.data.subscription.unsubscribe()
        if (data.session) await loadData()
      } catch {
        clearSession()
        errorMessage.value =
          'Unable to restore your session. Check the connection and sign in again.'
      }
    })()
    return initialized
  }

  async function login(number: string, password: string, staff = false) {
    await initialize()
    clearSession()
    errorMessage.value = ''
    try {
      if (staff) {
        const { error } = await getSupabaseClient().auth.signInWithPassword({
          email: number,
          password,
        })
        if (error) throw error
      } else await studentSignIn(number, password)
      if (!(await loadData()) || isStaff.value !== staff) {
        await logout()
        errorMessage.value =
          'This account cannot access this workspace. Contact the registry or ICT.'
        return false
      }
      return true
    } catch {
      await logout()
      errorMessage.value =
        'Unable to sign in. Check your credentials and connection, or try again later.'
      return false
    }
  }

  async function logout() {
    clearSession()
    try {
      const { error } = await getSupabaseClient().auth.signOut({ scope: 'local' })
      if (error)
        errorMessage.value =
          'Local data cleared. Sign-out could not be confirmed; retry when connected.'
      else errorMessage.value = ''
    } catch {
      errorMessage.value = 'Local data cleared. Check your connection before signing in again.'
    }
  }
  onScopeDispose(() => {
    unsubscribe?.()
    clearTimeout(expiryTimer)
  })
  return {
    student,
    courses,
    zigPayments,
    usdPayments,
    examResults,
    resources,
    exams,
    isAuthenticated,
    isStaff,
    assignments,
    loading,
    errorMessage,
    initialize,
    loadData,
    login,
    logout,
  }
})
