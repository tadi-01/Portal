<template>
  <div>
    <div class="eyebrow">ACADEMICS / EXAM PLANNER</div>
    <h1 class="page-masthead">A little space to prepare.</h1>
    <div class="split-page">
      <aside class="side-note">
        <h2>Know the date.<br />Make a plan.</h2>
        <p>
          Published examination dates, times, course details and venues will be collected here.
        </p>
      </aside>
      <section v-if="!store.exams.length" class="empty-panel">
        <span class="chip chip--primary">TIMETABLE NOT PUBLISHED</span>
        <h2>No exams scheduled.</h2>
        <p>
          There are no examination dates in the current dataset. Check back when your timetable
          has been released.
        </p>
        <RouterLink class="btn btn--ghost" to="/resources">Visit the study room ↗</RouterLink>
      </section>
      <section v-else class="exam-list">
        <article v-for="exam in store.exams" :key="exam.id" class="course-row">
          <div>
            <h2>{{ examTitle(exam.offering_id) }}</h2>
            <p>
              {{ new Date(exam.starts_at).toLocaleString() }} –
              {{ new Date(exam.ends_at).toLocaleString() }} (your local time)
            </p>
            <p>{{ exam.venue ?? 'Venue not published' }}</p>
          </div>
        </article>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStudentPortalStore } from '@/stores/studentPortalStore'
const store = useStudentPortalStore()

function examTitle(offeringId: string) {
  const course = store.courses.find((entry) => entry.id === offeringId)
  return course?.name ?? course?.code ?? 'Examination'
}

</script>

<style scoped>
.exam-list {
  display: grid;
  gap: 0.75rem;
}
</style>
