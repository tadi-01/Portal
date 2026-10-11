<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { getSupabaseClient } from '@/lib/supabase'
import { readTable, type Row } from '@/services/portal'
import { useStudentPortalStore } from '@/stores/studentPortalStore'

const store = useStudentPortalStore()
const offerings = ref<Row<'course_offerings'>[]>([])
const courses = ref<Row<'courses'>[]>([])
const assessments = ref<Row<'assessments'>[]>([])
const marks = ref<Row<'marks'>[]>([])
const resources = ref<Row<'resources'>[]>([])
const exams = ref<Row<'exam_sessions'>[]>([])
const terms = ref<Row<'academic_terms'>[]>([])
const roster = ref<{ enrollment_id: string; student_number: string; display_name: string }[]>(
  [],
)
const offering = ref('')
const enrollment = ref('')
const assessment = ref('')
const score = ref<number | ''>('')
const title = ref('')
const url = ref('')
const published = ref(false)
const grade = ref('')
const courseCode = ref('')
const courseTitle = ref('')
const termLabel = ref('')
const targetCourse = ref('')
const targetTerm = ref('')
const programme = ref('GENERAL')
const credits = ref(3)
const assessmentLabel = ref('')
const assessmentKind = ref<'coursework' | 'exam'>('coursework')
const maximum = ref(100)
const examStarts = ref('')
const examEnds = ref('')
const examVenue = ref('')
const examPublished = ref(false)
const activeTab = ref<'catalogue' | 'assessments' | 'marks' | 'resources' | 'registry' | 'registrations'>('catalogue')
const staffTabs = [
  { id: 'catalogue', label: 'Courses & terms', icon: '01' },
  { id: 'assessments', label: 'Assessments & exams', icon: '02' },
  { id: 'marks', label: 'Marks & results', icon: '03' },
  { id: 'resources', label: 'Resources', icon: '04' },
  { id: 'registry', label: 'Registry settings', icon: '05' },
  { id: 'registrations', label: 'Registered students', icon: '06' },
] as const
const gradeCalculationEnabled = ref(false)
const resultPublicationEnabled = ref(false)
const registrationSubmissionEnabled = ref(false)
const registrationRequests = ref<{ request_id: string; student_number: string; student_name: string; course_code: string; course_name: string; term_label: string; credits: number; status: string }[]>([])
const loading = ref(false)
const busy = ref(false)
const error = ref('')
const notice = ref('')
let rosterRequest = 0
const roles = computed(() =>
  store.assignments.filter((a) => a.offering_id === offering.value).map((a) => a.role),
)
const canEnter = computed(() => roles.value.includes('admin'))
const canApprove = computed(() => roles.value.includes('admin'))
const courseName = (id: string) => {
  const row = offerings.value.find((o) => o.id === id)
  const course = courses.value.find((c) => c.id === row?.course_id)
  return course ? `${course.code} / ${course.name}` : 'Assigned course'
}
const visibleAssessments = computed(() =>
  assessments.value.filter((a) => a.offering_id === offering.value),
)
const visibleMarks = computed(() => marks.value.filter((m) => m.offering_id === offering.value))
const visibleResources = computed(() =>
  resources.value.filter((r) => r.offering_id === offering.value),
)
const selectedAssessment = computed(() =>
  assessments.value.find((a) => a.id === assessment.value),
)
async function loadRoster() {
  const request = ++rosterRequest
  roster.value = []
  enrollment.value = ''
  assessment.value = ''
  score.value = ''
  if (!offering.value) return
  const result = await getSupabaseClient().rpc('staff_roster', {
    target_offering: offering.value,
  })
  if (request !== rosterRequest) return
  if (result.error)
    error.value = 'The roster could not be loaded. Check your course assignment and retry.'
  else roster.value = result.data
}
async function refresh() {
  loading.value = true
  error.value = ''
  try {
    const data = await Promise.all([
      readTable('course_offerings'),
      readTable('courses'),
      readTable('assessments'),
      readTable('marks'),
      readTable('resources'),
      readTable('exam_sessions'),
      readTable('academic_terms'),
    ])
    ;[
      offerings.value,
      courses.value,
      assessments.value,
      marks.value,
      resources.value,
      exams.value,
      terms.value,
    ] = data
    const registrations = await getSupabaseClient().rpc('admin_registration_requests')
    registrationRequests.value = registrations.data ?? []
    if (!offerings.value.some((o) => o.id === offering.value))
      offering.value = offerings.value[0]?.id ?? ''
    await loadRoster()
  } catch {
    offerings.value = []
    courses.value = []
    assessments.value = []
    marks.value = []
    resources.value = []
    roster.value = []
    error.value = 'Staff records could not be loaded. Retry or sign in again.'
  } finally {
    loading.value = false
  }
}
watch(offering, () => {
  error.value = ''
  notice.value = ''
  void loadRoster()
})
onMounted(refresh)

async function perform(
  action: () => PromiseLike<{ error: { message: string } | null }>,
  success: string,
) {
  if (busy.value) return
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    const result = await action()
    if (result.error) throw new Error(result.error.message)
    await refresh()
    if (!error.value) notice.value = success
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : ''
    error.value = message.includes('NOT_AUTHORIZED')
      ? 'Your admin session is not authorized for this action.'
      : message.includes('INVALID_')
        ? `The database rejected these values: ${message}.`
        : message || 'The change could not be completed. Please review the details and try again.'
  } finally {
    busy.value = false
  }
}
async function saveMark() {
  if (score.value === '' || !Number.isFinite(score.value)) return
  const rawScore = score.value
  await perform(
    () =>
      getSupabaseClient().rpc('save_mark', {
        target_enrollment: enrollment.value,
        target_assessment: assessment.value,
        raw_score: rawScore,
      }),
    'Draft saved. Students cannot see unpublished marks.',
  )
}
async function transition(mark: Row<'marks'>, action: 'submit_mark' | 'approve_mark') {
  await perform(
    () => getSupabaseClient().rpc(action, { target_mark: mark.id }),
    action === 'submit_mark'
      ? 'Submitted for approval.'
      : 'Approved. This does not publish the mark.',
  )
}
async function saveResource() {
  try {
    if (new URL(url.value).protocol !== 'https:') throw new Error()
  } catch {
    error.value = 'Enter a valid HTTPS resource address.'
    return
  }
  await perform(
    () =>
      getSupabaseClient().rpc('save_resource', {
        target_offering: offering.value,
        resource_title: title.value,
        resource_url: url.value,
        is_published: published.value,
      }),
    'Resource saved.',
  )
  if (!error.value) {
    title.value = ''
    url.value = ''
    published.value = false
  }
}
async function createCourse() {
  await perform(
    () =>
      getSupabaseClient().rpc('admin_upsert_course', {
        target_id: null,
        course_code: courseCode.value,
        course_name: courseTitle.value,
      }),
    'Course created.',
  )
  courseCode.value = ''
  courseTitle.value = ''
}
async function createTerm() {
  await perform(
    () =>
      getSupabaseClient().rpc('admin_upsert_term', {
        target_id: null,
        term_label: termLabel.value,
        start_date: null,
        end_date: null,
      }),
    'Term created.',
  )
  termLabel.value = ''
}
async function createOffering() {
  await perform(
    () =>
      getSupabaseClient().rpc('admin_upsert_offering', {
        target_id: null,
        target_course: targetCourse.value,
        target_term: targetTerm.value,
        target_programme: programme.value,
        target_credits: credits.value,
      }),
    'Course offering created.',
  )
}
async function createAssessment() {
  await perform(
    () =>
      getSupabaseClient().rpc('admin_upsert_assessment', {
        target_id: null,
        target_offering: offering.value,
        assessment_label: assessmentLabel.value,
        assessment_kind: assessmentKind.value,
        maximum: maximum.value,
      }),
    'Assessment created.',
  )
  assessmentLabel.value = ''
}
async function createExam() {
  await perform(
    () =>
      getSupabaseClient().rpc('admin_upsert_exam', {
        target_id: null,
        target_offering: offering.value,
        start_time: examStarts.value,
        end_time: examEnds.value,
        exam_venue: examVenue.value,
        is_published: examPublished.value,
      }),
    'Exam session saved.',
  )
  examVenue.value = ''
}
async function publishMark(mark: Row<'marks'>) {
  await perform(
    () =>
      getSupabaseClient().rpc('admin_publish_mark', {
        target_mark: mark.id,
        result_grade: grade.value || 'PENDING',
      }),
    'Mark published to the student portal.',
  )
  grade.value = ''
}
async function deleteResource(resource: Row<'resources'>) {
  await perform(
    () => getSupabaseClient().rpc('admin_delete_resource', { target_resource: resource.id }),
    'Resource deleted.',
  )
}
async function saveRegistryConfiguration() {
  await perform(
    () =>
      getSupabaseClient().rpc('admin_save_registry_configuration', {
        enable_grade_calculation: gradeCalculationEnabled.value,
        enable_result_publication: resultPublicationEnabled.value,
        enable_registration_submission: registrationSubmissionEnabled.value,
      }),
    'Registry configuration saved.',
  )
}
async function reviewRegistration(requestId: string, decision: 'approved' | 'rejected') {
  await perform(
    () => getSupabaseClient().rpc('admin_review_registration', { target_request: requestId, decision }),
    `Registration ${decision}.`,
  )
}
</script>

<template>
  <div>
    <div class="eyebrow">STAFF / TEACHING & REVIEW</div>
    <h1 class="page-masthead">Care for the record.</h1>
    <p class="page-intro">
      Raw marks stay private through entry and approval. Students see only released results.
    </p>
    <p class="alert alert--info">
      Registry configuration controls grade calculation, result publication and registration
      submission. Configure these capabilities from the Registry tab.
    </p>
    <p v-if="loading" role="status">Loading assigned work…</p>
    <div v-if="error" role="alert" class="alert alert--danger">
      {{ error }}
      <button class="btn btn--ghost" :disabled="loading || busy" @click="refresh">Retry</button>
    </div>
    <p v-if="notice" role="status">{{ notice }}</p>
    <nav class="main-nav staff-tabs" aria-label="Admin content management">
      <button v-for="tab in staffTabs" :key="tab.id" class="staff-tab" :class="{ 'staff-tab--active': activeTab === tab.id }" @click="activeTab = tab.id">
        <span>{{ tab.icon }}</span>{{ tab.label }}
      </button>
    </nav>
    <section v-if="activeTab === 'catalogue'" class="personal-record">
      <h2>Admin content management</h2>
      <p>Create and publish the records shown in student workspaces.</p>
      <div class="staff-form">
        <form @submit.prevent="createCourse">
          <label for="course-code">Course code</label><input id="course-code" v-model.trim="courseCode" required />
          <label for="course-title">Course name</label><input id="course-title" v-model.trim="courseTitle" required />
          <button class="btn btn--primary" :disabled="busy">Create course</button>
        </form>
        <form @submit.prevent="createTerm">
          <label for="term-label">Academic term</label><input id="term-label" v-model.trim="termLabel" required />
          <button class="btn btn--primary" :disabled="busy">Create term</button>
        </form>
        <form @submit.prevent="createOffering">
          <label for="target-course">Course</label>
          <select id="target-course" v-model="targetCourse" required>
            <option value="">Choose course</option>
            <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.code }} / {{ c.name }}</option>
          </select>
          <label for="target-term">Term</label>
          <select id="target-term" v-model="targetTerm" required>
            <option value="">Choose term</option>
            <option v-for="t in terms" :key="t.id" :value="t.id">{{ t.label }}</option>
          </select>
          <label for="programme">Programme</label><input id="programme" v-model.trim="programme" required />
          <label for="credits">Credits</label><input id="credits" v-model.number="credits" type="number" min="1" required />
          <button class="btn btn--primary" :disabled="busy">Create offering</button>
        </form>
      </div>
    </section>
    <div class="staff-form staff-selector">
      <label for="offering">Assigned course</label>
      <select id="offering" v-model="offering" :disabled="loading || busy">
        <option value="">Select a course</option>
        <option v-for="o in offerings" :key="o.id" :value="o.id">
          {{ courseName(o.id) }} / {{ o.programme_code }}
        </option>
      </select>
    </div>
    <p v-if="!loading && !offerings.length" class="empty-panel">
      No courses are available. An admin account can enter and approve marks for any configured
      course.
    </p>
    <template v-if="offering && !loading">
      <section v-if="canEnter && activeTab === 'marks'" class="personal-record">
        <h2>Enter a raw mark</h2>
        <p v-if="!visibleAssessments.length">
          No assessment definitions have been configured for this course.
        </p>
        <form v-else class="staff-form" @submit.prevent="saveMark">
          <label for="enrollment">Student</label>
          <select id="enrollment" v-model="enrollment" required>
            <option value="">Choose an enrolled student</option>
            <option v-for="s in roster" :key="s.enrollment_id" :value="s.enrollment_id">
              {{ s.student_number }} / {{ s.display_name }}
            </option>
          </select>
          <label for="assessment">Assessment</label>
          <select id="assessment" v-model="assessment" required>
            <option value="">Choose an assessment</option>
            <option v-for="a in visibleAssessments" :key="a.id" :value="a.id">
              {{ a.label }} / {{ a.kind }} / out of {{ a.max_score }}
            </option>
          </select>
          <label for="raw-score">Raw score</label>
          <input
            id="raw-score"
            v-model.number="score"
            type="number"
            min="0"
            :max="selectedAssessment?.max_score"
            step="any"
            required
          />
          <button class="btn btn--primary" :disabled="busy">Save draft</button>
        </form>
      </section>
      <section v-if="activeTab === 'assessments'" class="personal-record">
        <h2>Assessment setup</h2>
        <form class="staff-form" @submit.prevent="createAssessment">
          <label for="assessment-label">Assessment name</label><input id="assessment-label" v-model.trim="assessmentLabel" required />
          <label for="assessment-kind">Type</label><select id="assessment-kind" v-model="assessmentKind"><option value="coursework">Coursework</option><option value="exam">Exam</option></select>
          <label for="maximum">Maximum score</label><input id="maximum" v-model.number="maximum" type="number" min="1" required />
          <button class="btn btn--primary" :disabled="busy || !offering">Create assessment</button>
        </form>
      </section>
      <section v-if="activeTab === 'assessments'" class="personal-record">
        <h2>Exam schedule</h2>
        <form class="staff-form" @submit.prevent="createExam">
          <label for="exam-starts">Starts</label><input id="exam-starts" v-model="examStarts" type="datetime-local" required />
          <label for="exam-ends">Ends</label><input id="exam-ends" v-model="examEnds" type="datetime-local" required />
          <label for="exam-venue">Venue</label><input id="exam-venue" v-model.trim="examVenue" required />
          <label class="staff-checkbox"><input v-model="examPublished" type="checkbox" /> Publish to students</label>
          <button class="btn btn--primary" :disabled="busy || !offering">Save exam session</button>
        </form>
        <p v-if="!exams.filter((e) => e.offering_id === offering).length">No exam sessions configured.</p>
      </section>
      <section v-if="activeTab === 'marks'" class="personal-record">
        <h2>Marks awaiting care</h2>
        <div class="table-scroll" tabindex="0" role="region" aria-label="Mark workflow">
          <table class="data-table">
            <caption>
              Coursework and exam raw marks · assigned course only
            </caption>
            <thead>
              <tr>
                <th scope="col">Student</th>
                <th scope="col">Assessment</th>
                <th scope="col">Score</th>
                <th scope="col">State</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in visibleMarks" :key="m.id">
                <td>
                  {{
                    roster.find((s) => s.enrollment_id === m.enrollment_id)?.student_number ??
                    'Unavailable'
                  }}
                </td>
                <td>{{ assessments.find((a) => a.id === m.assessment_id)?.label }}</td>
                <td>{{ m.score }}</td>
                <td>{{ m.state }}</td>
                <td>
                  <button
                    v-if="canEnter && m.state === 'draft'"
                    class="btn btn--ghost"
                    :disabled="busy"
                    @click="transition(m, 'submit_mark')"
                  >
                    Submit mark
                  </button>
                  <button
                    v-else-if="canApprove && m.state === 'submitted'"
                    class="btn btn--ghost"
                    :disabled="busy"
                    @click="transition(m, 'approve_mark')"
                  >
                    Approve
                  </button>
                  <button
                    v-if="canApprove && m.state === 'approved'"
                    class="btn btn--ghost"
                    :disabled="busy"
                    @click="publishMark(m)"
                  >
                    Publish result
                  </button>
                  <span v-else>—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="!visibleMarks.length">No marks have been entered.</p>
        <p>
          Admins can submit, approve and publish marks without a second approver.
        </p>
      </section>
      <section v-if="activeTab === 'resources'" class="personal-record">
        <h2>Course resources</h2>
        <ul v-if="visibleResources.length">
          <li v-for="r in visibleResources" :key="r.id">
            {{ r.title }} · {{ r.published ? 'Published' : 'Draft' }}
            <button class="btn btn--ghost btn--sm" :disabled="busy" @click="deleteResource(r)">Delete</button>
          </li>
        </ul>
        <p v-else>No resources have been added.</p>
        <form v-if="canEnter" class="staff-form" @submit.prevent="saveResource">
          <label for="resource-title">Title</label
          ><input id="resource-title" v-model.trim="title" maxlength="200" required />
          <label for="resource-url">HTTPS address</label
          ><input id="resource-url" v-model.trim="url" type="url" maxlength="2048" required />
          <label class="staff-checkbox"
            ><input v-model="published" type="checkbox" /> Make available to enrolled
            students</label
          >
          <button class="btn btn--primary" :disabled="busy">Add resource</button>
        </form>
      </section>
      <section v-if="activeTab === 'registry'" class="personal-record">
        <h2>Registry configuration</h2>
        <p>Enable these capabilities only after the institution has supplied its approved rules.</p>
        <form class="staff-form" @submit.prevent="saveRegistryConfiguration">
          <label class="staff-checkbox"><input v-model="gradeCalculationEnabled" type="checkbox" /> Enable grade calculation</label>
          <label class="staff-checkbox"><input v-model="resultPublicationEnabled" type="checkbox" /> Enable result publication</label>
          <label class="staff-checkbox"><input v-model="registrationSubmissionEnabled" type="checkbox" /> Enable registration submission</label>
          <button class="btn btn--primary" :disabled="busy">Save registry configuration</button>
        </form>
      </section>
      <section v-if="activeTab === 'registrations'" class="personal-record">
        <h2>Registered students</h2>
        <p>Review submitted course selections. Approval creates the student enrollment used by rosters.</p>
        <div class="table-scroll" tabindex="0" role="region" aria-label="Registration requests">
          <table class="data-table">
            <thead><tr><th>Student</th><th>Course</th><th>Term</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              <tr v-for="request in registrationRequests" :key="request.request_id">
                <td>{{ request.student_number }} / {{ request.student_name }}</td>
                <td>{{ request.course_code }} / {{ request.course_name }}</td>
                <td>{{ request.term_label }}</td>
                <td>{{ request.status }}</td>
                <td>
                  <button v-if="request.status === 'submitted'" class="btn btn--ghost btn--sm" @click="reviewRegistration(request.request_id, 'approved')">Approve</button>
                  <button v-if="request.status === 'submitted'" class="btn btn--ghost btn--sm" @click="reviewRegistration(request.request_id, 'rejected')">Reject</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="!registrationRequests.length">No registration requests have been submitted.</p>
      </section>
    </template>
  </div>
</template>

<style scoped>
.staff-tabs {
  margin: 30px 0 42px;
  padding-inline: 0;
  border-block: 1px solid var(--clr-border);
  background: transparent;
}
.staff-tab {
  white-space: nowrap;
  border: 0;
  border-bottom: 3px solid transparent;
  padding: 19px 0 16px;
  background: transparent;
  color: var(--clr-text);
  cursor: pointer;
  font-size: 13px;
  transition: border-color var(--t-fast), color var(--t-fast);
}
.staff-tab:hover {
  color: var(--clr-primary);
}
.staff-tab span {
  color: var(--clr-text-muted);
  font: 10px var(--font-mono);
  margin-right: 7px;
}
.staff-tab--active {
  border-bottom-color: var(--clr-primary);
  color: var(--clr-primary);
}
</style>
