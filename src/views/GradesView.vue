<template>
  <div>
    <div class="eyebrow">ACADEMICS / YOUR RECORD</div>
    <h1 class="page-masthead">Progress, on paper.</h1>
    <p class="page-intro">
      Only released results appear here. GPA calculation is unavailable until the registry
      supplies its grading scale and weights.
    </p>

    <section class="section-card">
      <header class="section-header-bar">EXAMINATIONS RESULTS</header>
      <div class="grades-body section-body">
        <div class="grades-toolbar">
          <label for="grade-filter">Show results</label>
          <select id="grade-filter" v-model="selectedGrade" class="grade-filter">
            <option value="ALL">All grades</option>
            <option value="A">A grades</option>
            <option value="B">B grades</option>
            <option value="C">C grades</option>
          </select>
        </div>
        <p class="filter-count" role="status" aria-live="polite" aria-atomic="true">
          {{ filteredResults.length }} of {{ store.examResults.length }} results shown.
        </p>
        <div class="table-scroll" tabindex="0" role="region" aria-labelledby="grades-caption">
          <table class="data-table">
            <caption id="grades-caption">
              Published examination results
            </caption>
            <thead>
              <tr>
                <th scope="col">Course Code</th>
                <th scope="col">Course Name</th>
                <th scope="col">Credits</th>
                <th scope="col">Grade</th>
                <th scope="col">Released score</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="res in filteredResults" :key="res.id">
                <td>{{ res.code }}</td>
                <td>{{ res.name }}</td>
                <td>{{ res.credits }}</td>
                <td>
                  <span class="chip" :class="getGradeChip(res.grade)">{{ res.grade }}</span>
                </td>
                <td>{{ res.score }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="filteredResults.length === 0" class="empty-state">
          No results match this filter.
        </p>
        <div class="gpa-summary">
          <span class="gpa-label">Overall GPA</span>
          <span class="gpa-value">{{ store.gpa }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useStudentPortalStore } from '@/stores/studentPortalStore'
import { computed, ref } from 'vue'

const store = useStudentPortalStore()
const selectedGrade = ref('ALL')

const filteredResults = computed(() => {
  if (selectedGrade.value === 'ALL') return store.examResults
  return store.examResults.filter((result) => result.grade.startsWith(selectedGrade.value))
})

function getGradeChip(grade: string) {
  if (grade.startsWith('A')) return 'chip--success'
  if (grade.startsWith('B')) return 'chip--info'
  if (grade.startsWith('C')) return 'chip--warning'
  return 'chip--danger'
}
</script>

<style scoped>
.grades-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 16px;
  border-bottom: 1px solid var(--clr-border-light);
}

.grades-toolbar label {
  color: var(--clr-text-muted);
  font-size: 0.8rem;
  font-weight: 700;
}

.grade-filter {
  width: auto;
  min-width: 150px;
}

.empty-state {
  padding: 20px 16px;
  color: var(--clr-text-muted);
  text-align: center;
}
.grades-body {
  padding: 0;
}
.gpa-summary {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--clr-surface-2);
  border-top: 1px solid var(--clr-border);
}
.gpa-label {
  font-weight: 700;
  font-size: 0.9rem;
}
.gpa-value {
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--clr-primary);
}
</style>
