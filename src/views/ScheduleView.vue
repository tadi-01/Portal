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
      <section v-else class="planner-layout">
        <article class="calendar-card">
          <header class="calendar-head">
            <button class="month-nav" @click="previousMonth" type="button" aria-label="Previous month">
              ←
            </button>
            <h2>{{ monthLabel }}</h2>
            <button class="month-nav" @click="nextMonth" type="button" aria-label="Next month">
              →
            </button>
          </header>
          <div class="calendar-grid calendar-grid--labels">
            <span v-for="label in dayLabels" :key="label">{{ label }}</span>
          </div>
          <div class="calendar-grid">
            <article
              v-for="day in calendarDays"
              :key="day.isoDate"
              :class="['calendar-day', { 'calendar-day--muted': !day.isCurrentMonth }]"
            >
              <header>
                <strong>{{ day.date.getDate() }}</strong>
              </header>
              <ul v-if="day.exams.length" class="day-exams">
                <li v-for="exam in day.exams" :key="exam.id">
                  <small>{{ timeLabel(exam.starts_at) }}</small>
                  <p>{{ examTitle(exam.offering_id) }}</p>
                </li>
              </ul>
            </article>
          </div>
        </article>
        <div class="exam-list">
          <article v-for="exam in visibleExams" :key="exam.id" class="course-row">
            <div>
              <h2>{{ examTitle(exam.offering_id) }}</h2>
              <p>
                {{ new Date(exam.starts_at).toLocaleString() }} –
                {{ new Date(exam.ends_at).toLocaleString() }} (your local time)
              </p>
              <p>{{ exam.venue ?? 'Venue not published' }}</p>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStudentPortalStore } from '@/stores/studentPortalStore'
const store = useStudentPortalStore()
type ExamSession = (typeof store.exams)[number]

const today = new Date()
const displayedMonth = ref(
  new Date(
    store.exams[0] ? new Date(store.exams[0].starts_at).getFullYear() : today.getFullYear(),
    store.exams[0] ? new Date(store.exams[0].starts_at).getMonth() : today.getMonth(),
    1,
  ),
)

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const monthLabel = computed(() =>
  displayedMonth.value.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
)
const monthStart = computed(
  () => new Date(displayedMonth.value.getFullYear(), displayedMonth.value.getMonth(), 1),
)
const monthEnd = computed(
  () => new Date(displayedMonth.value.getFullYear(), displayedMonth.value.getMonth() + 1, 0),
)
const visibleExams = computed(() =>
  store.exams.filter((exam) => {
    const starts = new Date(exam.starts_at)
    return starts >= monthStart.value && starts <= monthEnd.value
  }),
)

const calendarDays = computed(() => {
  const firstDay = monthStart.value
  const lastDay = monthEnd.value
  const startWeekday = (firstDay.getDay() + 6) % 7
  const gridStart = new Date(firstDay)
  gridStart.setDate(firstDay.getDate() - startWeekday)
  const cells: { isoDate: string; date: Date; isCurrentMonth: boolean; exams: ExamSession[] }[] = []
  for (let index = 0; index < 42; index++) {
    const day = new Date(gridStart)
    day.setDate(gridStart.getDate() + index)
    const isoDate = day.toISOString().slice(0, 10)
    const dayExams = store.exams.filter((exam) => exam.starts_at.slice(0, 10) === isoDate)
    cells.push({
      isoDate,
      date: day,
      isCurrentMonth: day.getMonth() === displayedMonth.value.getMonth(),
      exams: dayExams,
    })
    if (index > 27 && day > lastDay && day.getDay() === 0) break
  }
  return cells
})

function examTitle(offeringId: string) {
  const course = store.courses.find((entry) => entry.id === offeringId)
  return course?.name ?? course?.code ?? 'Examination'
}

function timeLabel(dateText: string) {
  return new Date(dateText).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function previousMonth() {
  displayedMonth.value = new Date(
    displayedMonth.value.getFullYear(),
    displayedMonth.value.getMonth() - 1,
    1,
  )
}

function nextMonth() {
  displayedMonth.value = new Date(
    displayedMonth.value.getFullYear(),
    displayedMonth.value.getMonth() + 1,
    1,
  )
}
</script>

<style scoped>
.planner-layout {
  display: grid;
  gap: 1rem;
}

.calendar-card {
  border: 1px solid var(--clr-border);
  border-radius: 20px;
  padding: 1rem;
  background: var(--clr-surface);
}

.calendar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.8rem;
}

.calendar-head h2 {
  margin: 0;
  font-size: 1.05rem;
}

.month-nav {
  border: 1px solid var(--clr-border);
  background: var(--clr-surface-2);
  border-radius: 999px;
  width: 2rem;
  height: 2rem;
  cursor: pointer;
  color: var(--clr-text);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.45rem;
}

.calendar-grid--labels span {
  font-size: 0.75rem;
  color: var(--clr-text-muted);
  text-align: center;
  margin-bottom: 0.25rem;
}

.calendar-day {
  min-height: 5.5rem;
  border: 1px solid var(--clr-border-light);
  border-radius: 14px;
  padding: 0.4rem;
  background: var(--clr-surface);
}

.calendar-day--muted {
  opacity: 0.48;
}

.day-exams {
  list-style: none;
  margin: 0.35rem 0 0;
  padding: 0;
  display: grid;
  gap: 0.3rem;
}

.day-exams li {
  padding: 0.35rem;
  border-radius: 8px;
  background: var(--clr-primary-xlight);
}

.day-exams small {
  display: block;
  color: var(--clr-text-muted);
}

.day-exams p {
  margin: 0.1rem 0 0;
  font-size: 0.78rem;
  line-height: 1.15;
}

.exam-list {
  display: grid;
  gap: 0.75rem;
}
</style>
