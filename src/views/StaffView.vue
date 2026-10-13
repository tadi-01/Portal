<script setup lang="ts">
// ADMIN PAGE - three jobs only:
//   1. Registrations: approve or reject a student's course choices
//   2. Marks:         enter a mark, then move it through submit -> approve -> publish
//   3. Resources:     add or delete a study link for a course
// Every button calls a function that lives INSIDE the database (supabase.rpc).
// The database checks the user is an admin, so hiding buttons here is only for looks.
import { onMounted, ref, watch, computed } from 'vue'
import { getSupabaseClient } from '@/lib/supabase'
import { readTable, type Row } from '@/services/portal'

type Tab = 'registrations' | 'marks' | 'resources'
const tabs: { id: Tab; label: string }[] = [
  { id: 'registrations', label: 'Registrations' },
  { id: 'marks', label: 'Marks & results' },
  { id: 'resources', label: 'Resources' },
]
const activeTab = ref<Tab>('registrations')

// Data copied from the database. It is re-read after every change (see refresh()).
const offerings = ref<Row<'course_offerings'>[]>([])
const courses = ref<Row<'courses'>[]>([])
const assessments = ref<Row<'assessments'>[]>([])
const marks = ref<Row<'marks'>[]>([])
const resources = ref<Row<'resources'>[]>([])
const roster = ref<{ enrollment_id: string; student_number: string; display_name: string }[]>([])
const registrationRequests = ref<
  {
    request_id: string
    student_number: string
    student_name: string
    course_code: string
    course_name: string
    term_label: string
    status: string
  }[]
>([])

// What the admin has typed or selected
const offering = ref('')
const enrollment = ref('')
const assessment = ref('')
const score = ref<number | ''>('')
const grades = ref<Record<string, string>>({}) // grade typed for each mark before publishing
const title = ref('')
const url = ref('')
const published = ref(false)

// Page status
const loading = ref(false)
const busy = ref(false)
const error = ref('')
const notice = ref('')

const courseName = (offeringId: string) => {
  const row = offerings.value.find((o) => o.id === offeringId)
  const course = courses.value.find((c) => c.id === row?.course_id)
  return course ? `${course.code} / ${course.name}` : 'Course'
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

// Students enrolled in the selected course (database function: staff_roster)
async function loadRoster() {
  roster.value = []
  enrollment.value = ''
  assessment.value = ''
  score.value = ''
  if (!offering.value) return
  const result = await getSupabaseClient().rpc('staff_roster', { target_offering: offering.value })
  if (result.error) error.value = 'The class list could not be loaded. Please retry.'
  else roster.value = result.data
}

// Re-read everything from the database so the page always shows the true state
async function refresh() {
  loading.value = true
  error.value = ''
  try {
    ;[offerings.value, courses.value, assessments.value, marks.value, resources.value] =
      await Promise.all([
        readTable('course_offerings'),
        readTable('courses'),
        readTable('assessments'),
        readTable('marks'),
        readTable('resources'),
      ])
    const requests = await getSupabaseClient().rpc('admin_registration_requests')
    registrationRequests.value = requests.data ?? []
    if (!offerings.value.some((o) => o.id === offering.value))
      offering.value = offerings.value[0]?.id ?? ''
    await loadRoster()
  } catch {
    error.value = 'Admin records could not be loaded. Retry or sign in again.'
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

// Shared helper: run one database action, then refresh and show a message
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
      ? 'Your account is not allowed to do this.'
      : message || 'The change could not be completed. Please check the details and try again.'
  } finally {
    busy.value = false
  }
}

// 1. REGISTRATIONS - approving also creates the student's enrolment in the database
const reviewRegistration = (requestId: string, decision: 'approved' | 'rejected') =>
  perform(
    () =>
      getSupabaseClient().rpc('admin_review_registration', {
        target_request: requestId,
        decision,
      }),
    `Registration ${decision}.`,
  )

// 2. MARKS - a mark moves through four steps: draft -> submitted -> approved -> published
const saveMark = () => {
  if (score.value === '' || !Number.isFinite(score.value)) return
  return perform(
    () =>
      getSupabaseClient().rpc('save_mark', {
        target_enrollment: enrollment.value,
        target_assessment: assessment.value,
        raw_score: score.value as number,
      }),
    'Draft saved. Students cannot see it yet.',
  )
}
const advanceMark = (mark: Row<'marks'>) =>
  perform(
    () =>
      getSupabaseClient().rpc(mark.state === 'draft' ? 'submit_mark' : 'approve_mark', {
        target_mark: mark.id,
      }),
    mark.state === 'draft' ? 'Submitted.' : 'Approved. Enter a grade and publish it.',
  )
const publishMark = (mark: Row<'marks'>) =>
  perform(
    () =>
      getSupabaseClient().rpc('admin_publish_mark', {
        target_mark: mark.id,
        result_grade: grades.value[mark.id] ?? '',
      }),
    'Result published. The student can now see it.',
  )

// 3. RESOURCES - a study link students can open
const saveResource = async () => {
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
const deleteResource = (resource: Row<'resources'>) =>
  perform(
    () => getSupabaseClient().rpc('admin_delete_resource', { target_resource: resource.id }),
    'Resource deleted.',
  )
</script>

<template>
  <div>
    <div class="eyebrow">ADMIN</div>
    <h1 class="page-masthead">Manage the record.</h1>
    <p class="page-intro">
      Students only see marks after you publish them and resources you mark as published.
    </p>
    <p v-if="loading" role="status">Loading…</p>
    <div v-if="error" role="alert" class="alert alert--danger">
      {{ error }}
      <button class="btn btn--ghost" :disabled="loading || busy" @click="refresh">Retry</button>
    </div>
    <p v-if="notice" role="status">{{ notice }}</p>

    <nav class="main-nav staff-tabs" aria-label="Admin sections">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="staff-tab"
        :class="{ 'staff-tab--active': activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </nav>

    <!-- Registrations apply to every course, so no course needs to be selected -->
    <section v-if="activeTab === 'registrations'" class="personal-record">
      <h2>Registrations</h2>
      <p>Approving a request enrols the student in that course.</p>
      <div class="table-scroll" tabindex="0" role="region" aria-label="Registration requests">
        <table class="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Course</th>
              <th>Term</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="request in registrationRequests" :key="request.request_id">
              <td>{{ request.student_number }} / {{ request.student_name }}</td>
              <td>{{ request.course_code }} / {{ request.course_name }}</td>
              <td>{{ request.term_label }}</td>
              <td>{{ request.status }}</td>
              <td>
                <template v-if="request.status === 'submitted'">
                  <button
                    class="btn btn--ghost btn--sm"
                    :disabled="busy"
                    @click="reviewRegistration(request.request_id, 'approved')"
                  >
                    Approve
                  </button>
                  <button
                    class="btn btn--ghost btn--sm"
                    :disabled="busy"
                    @click="reviewRegistration(request.request_id, 'rejected')"
                  >
                    Reject
                  </button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="!registrationRequests.length">No registration requests yet.</p>
    </section>

    <!-- Marks and resources belong to one course, so choose the course first -->
    <template v-if="activeTab !== 'registrations'">
      <div class="staff-form staff-selector">
        <label for="offering">Course</label>
        <select id="offering" v-model="offering" :disabled="loading || busy">
          <option value="">Select a course</option>
          <option v-for="o in offerings" :key="o.id" :value="o.id">
            {{ courseName(o.id) }} / {{ o.programme_code }}
          </option>
        </select>
      </div>
      <p v-if="!loading && !offerings.length" class="empty-panel">
        No courses exist yet. Run supabase/seed.sql to add some (see the README).
      </p>
    </template>

    <template v-if="offering && !loading && activeTab === 'marks'">
      <section class="personal-record">
        <h2>Enter a mark</h2>
        <p v-if="!visibleAssessments.length">This course has no assessments yet.</p>
        <p v-else-if="!roster.length">No students are enrolled in this course yet.</p>
        <form v-else class="staff-form" @submit.prevent="saveMark">
          <label for="enrollment">Student</label>
          <select id="enrollment" v-model="enrollment" required>
            <option value="">Choose a student</option>
            <option v-for="s in roster" :key="s.enrollment_id" :value="s.enrollment_id">
              {{ s.student_number }} / {{ s.display_name }}
            </option>
          </select>
          <label for="assessment">Assessment</label>
          <select id="assessment" v-model="assessment" required>
            <option value="">Choose an assessment</option>
            <option v-for="a in visibleAssessments" :key="a.id" :value="a.id">
              {{ a.label }} / out of {{ a.max_score }}
            </option>
          </select>
          <label for="raw-score">Score</label>
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

      <section class="personal-record">
        <h2>Marks in progress</h2>
        <div class="table-scroll" tabindex="0" role="region" aria-label="Marks">
          <table class="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Assessment</th>
                <th>Score</th>
                <th>Step</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in visibleMarks" :key="m.id">
                <td>
                  {{ roster.find((s) => s.enrollment_id === m.enrollment_id)?.student_number }}
                </td>
                <td>{{ assessments.find((a) => a.id === m.assessment_id)?.label }}</td>
                <td>{{ m.score }}</td>
                <td>{{ m.state }}</td>
                <td>
                  <button
                    v-if="m.state === 'draft' || m.state === 'submitted'"
                    class="btn btn--ghost btn--sm"
                    :disabled="busy"
                    @click="advanceMark(m)"
                  >
                    {{ m.state === 'draft' ? 'Submit' : 'Approve' }}
                  </button>
                  <template v-else>
                    <input
                      v-model.trim="grades[m.id]"
                      maxlength="20"
                      size="4"
                      placeholder="Grade"
                      :aria-label="`Grade for ${m.id}`"
                    />
                    <button
                      class="btn btn--ghost btn--sm"
                      :disabled="busy || !grades[m.id]"
                      @click="publishMark(m)"
                    >
                      Publish
                    </button>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="!visibleMarks.length">No marks have been entered for this course.</p>
      </section>
    </template>

    <section v-if="offering && !loading && activeTab === 'resources'" class="personal-record">
      <h2>Course resources</h2>
      <ul v-if="visibleResources.length">
        <li v-for="r in visibleResources" :key="r.id">
          {{ r.title }} · {{ r.published ? 'Published' : 'Draft' }}
          <button class="btn btn--ghost btn--sm" :disabled="busy" @click="deleteResource(r)">
            Delete
          </button>
        </li>
      </ul>
      <p v-else>No resources have been added.</p>
      <form class="staff-form" @submit.prevent="saveResource">
        <label for="resource-title">Title</label>
        <input id="resource-title" v-model.trim="title" maxlength="200" required />
        <label for="resource-url">Link (https only)</label>
        <input id="resource-url" v-model.trim="url" type="url" maxlength="2048" required />
        <label class="staff-checkbox">
          <input v-model="published" type="checkbox" /> Show to enrolled students
        </label>
        <button class="btn btn--primary" :disabled="busy">Add resource</button>
      </form>
    </section>
  </div>
</template>

<style scoped>
.staff-tabs {
  margin: 30px 0 42px;
  padding-inline: 0;
  border-block: 1px solid var(--clr-border);
  background: transparent;
  display: flex;
  gap: 22px;
  overflow-x: auto;
  scrollbar-width: thin;
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
  transition:
    border-color var(--t-fast),
    color var(--t-fast);
}
.staff-tab:hover {
  color: var(--clr-primary);
}
.staff-tab--active {
  border-bottom-color: var(--clr-primary);
  color: var(--clr-primary);
}
</style>
