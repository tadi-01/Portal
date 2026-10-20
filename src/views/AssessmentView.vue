<template>
  <div>
    <div class="eyebrow">ACADEMICS / COURSEWORK</div>
    <h1 class="page-masthead">Work in progress.</h1>
    <p class="page-intro">
      Approved coursework marks appear here. Only marks confirmed by staff are shown.
    </p>

    <section class="section-card">
      <header class="section-header-bar">CONTINUOUS ASSESSMENT</header>
      <div class="assessment-body section-body">
        <div class="table-scroll" tabindex="0" role="region" aria-labelledby="assessment-caption">
          <table class="data-table">
            <caption id="assessment-caption">
              Coursework marks for your enrolled courses
            </caption>
            <thead>
              <tr>
                <th scope="col">Course Code</th>
                <th scope="col">Course Name</th>
                <th scope="col">Assessment</th>
                <th scope="col">Score</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="mark in store.courseworkMarks" :key="mark.id">
                <td>{{ mark.courseCode }}</td>
                <td>{{ mark.courseName }}</td>
                <td>{{ mark.assessmentLabel }}</td>
                <td>{{ mark.score }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="store.courseworkMarks.length === 0" class="empty-state">
          No coursework marks have been released yet.
        </p>
      </div>
    </section>

    <div class="split-page" v-if="store.courseworkMarks.length">
      <aside class="side-note">
        <h2>Every assignment<br />counts.</h2>
        <p>
          Continuous assessment brings your coursework marks together before final examinations.
        </p>
      </aside>
      <section class="personal-record">
        <RouterLink class="btn btn--ghost" to="/grades">View examination results ↗</RouterLink>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStudentPortalStore } from '@/stores/studentPortalStore'

const store = useStudentPortalStore()
</script>

<style scoped>
.empty-state {
  padding: 20px 16px;
  color: var(--clr-text-muted);
  text-align: center;
}
.assessment-body {
  padding: 0;
}
</style>
