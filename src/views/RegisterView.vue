<template>
  <div>
    <div class="eyebrow">ADMINISTRATION / SEMESTER CHECKLIST</div>
    <h1 class="page-masthead">Ready for the semester.</h1>
    <div class="split-page">
      <aside class="side-note">
        <span :class="['chip', registrationStatusClass(store.student.registrationStatus)]">{{
          store.student.registrationStatus
        }}</span>
        <h2 class="registration-heading">Your next chapter<br />starts here.</h2>
        <p>
          {{ store.student.programmeName }}<br />Part {{ store.student.part }} · Semester
          {{ store.student.semester }}
        </p>
        <p>
          Tick the courses you want to take, then submit. An admin reviews your request and
          enrols you.
        </p>
      </aside>
      <section>
        <div class="registration-actions">
          <h2>Choose your courses</h2>
          <p v-if="error" class="alert alert--danger">{{ error }}</p>
          <p v-if="message" class="alert alert--info" role="status">{{ message }}</p>
          <label v-for="course in offerings" :key="course.offering_id" class="course-choice">
            <input v-model="course.selected" type="checkbox" :disabled="busy" @change="toggleCourse(course)" />
            <span><strong>{{ course.course_code }} · {{ course.course_name }}</strong><small>{{ course.term_label }} · {{ course.credits }} credits</small></span>
          </label>
          <button class="btn btn--primary" :disabled="busy || !selectedCount" @click="submit">
            Submit registration ({{ selectedCount }} selected)
          </button>
        </div>
        <article v-for="(step, index) in steps" :key="step.title" class="course-row">
          <span class="row-number">0{{ index + 1 }}</span>
          <div>
            <h3>{{ step.title }}</h3>
            <p class="registration-description">{{ step.text }}</p>
            <RouterLink v-if="step.to" :to="step.to" class="registration-review"
              >Review details ↗</RouterLink
            >
          </div>
        </article>
      </section>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { getSupabaseClient } from '@/lib/supabase'
import { useStudentPortalStore } from '@/stores/studentPortalStore'
const store = useStudentPortalStore()

// Picks the colour of the status badge (e.g. green for REGISTERED). Display only.
function registrationStatusClass(status: string): string {
  switch (status.trim().toUpperCase()) {
    case 'REGISTERED':
      return 'chip--success'
    case 'PENDING':
      return 'chip--warning'
    case 'NOT REGISTERED':
    case 'UNREGISTERED':
      return 'chip--danger'
    default:
      return 'chip--neutral'
  }
}
const offerings = ref<{ offering_id: string; course_code: string; course_name: string; term_label: string; credits: number; selected: boolean }[]>([])
const busy = ref(false)
const error = ref('')
const message = ref('')
const selectedCount = computed(() => offerings.value.filter((course) => course.selected).length)
onMounted(async () => {
  try {
    const result = await getSupabaseClient().rpc('registration_offerings')
    if (result.error) error.value = 'Registration options could not be loaded.'
    else offerings.value = result.data ?? []
  } catch {
    error.value = 'Registration options could not be loaded.'
  }
})
async function toggleCourse(course: (typeof offerings.value)[number]) {
  const result = await getSupabaseClient().rpc('set_registration_choice', {
    target_offering: course.offering_id,
    selected: course.selected,
  })
  if (result.error) {
    course.selected = !course.selected
    error.value = result.error.message.includes('REGISTRY_CONFIGURATION_REQUIRED')
      ? 'Registration is not open yet.'
      : 'The course selection could not be saved.'
  }
}
async function submit() {
  busy.value = true
  message.value = ''
  const result = await getSupabaseClient().rpc('submit_registration')
  error.value = result.error ? 'Registration could not be submitted.' : ''
  if (!result.error) {
    message.value = 'Registration submitted. An admin will review it.'
    await store.loadData() // refresh the status badge
  }
  busy.value = false
}
const steps = [
  {
    title: 'Review your account',
    text: 'Review the transactions recorded on your account.',
    to: '/payments',
  },
  {
    title: 'Check your fees',
    text: 'Make sure your fees are up to date before registering.',
    to: '/payments',
  },
  {
    title: 'Verify your student record',
    text: 'Check your personal and academic information.',
    to: '/',
  },
  {
    title: 'Review your course list',
    text: 'Make sure the listed courses match your programme.',
    to: '/courses',
  },
  {
    title: 'Confirm registration',
    text: 'Submit your course choices above. An admin approves them.',
    to: '',
  },
]
</script>

<style scoped>
.registration-heading {
  margin-top: 22px;
}
.registration-description {
  font-size: 13px;
  color: var(--clr-text-muted);
  margin-top: 6px;
}
.registration-review {
  font-size: 12px;
  color: var(--clr-primary);
}
.registration-actions {
  display: grid;
  gap: 12px;
  padding: 18px;
  margin-bottom: 24px;
  border: 1px solid var(--clr-border);
}
.course-choice {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-top: 1px solid var(--clr-border-light);
}
.course-choice span {
  display: grid;
}
.course-choice small {
  color: var(--clr-text-muted);
}
</style>
