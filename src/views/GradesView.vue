<template>
  <div>
    <div class="eyebrow">ACADEMICS / YOUR RECORD</div>
    <h1 class="page-masthead">Progress, on paper.</h1>
    <p class="page-intro">
      Only released results appear here.
    </p>

    <section class="section-card">
      <header class="section-header-bar">EXAMINATIONS RESULTS</header>
      <div class="grades-body section-body">
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
              <tr v-for="res in store.examResults" :key="res.id">
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
        <p v-if="store.examResults.length === 0" class="empty-state">No results have been released.</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useStudentPortalStore } from '@/stores/studentPortalStore'

const store = useStudentPortalStore()

function getGradeChip(grade: string) {
  if (grade.startsWith('A')) return 'chip--success'
  if (grade.startsWith('B')) return 'chip--info'
  if (grade.startsWith('C')) return 'chip--warning'
  return 'chip--danger'
}
</script>

<style scoped>
.empty-state {
  padding: 20px 16px;
  color: var(--clr-text-muted);
  text-align: center;
}
.grades-body {
  padding: 0;
}
</style>
