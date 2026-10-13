<template>
  <div>
    <div class="eyebrow">ACADEMICS / COURSE DIRECTORY</div>
    <h1 class="page-masthead">Your semester reading list.</h1>
    <p class="page-intro">Your registered courses, together in one place.</p>

    <section class="section-card">
      <header class="section-header-bar">CURRENTLY REGISTERED COURSES</header>
      <div class="courses-body section-body">
        <div class="table-scroll" tabindex="0" role="region" aria-labelledby="courses-caption">
          <table class="data-table">
            <caption id="courses-caption">
              Courses linked to your enrolments
            </caption>
            <thead>
              <tr>
                <th scope="col">Course Code</th>
                <th scope="col">Course Name</th>
                <th scope="col">Type</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="course in store.courses" :key="course.id">
                <td>{{ course.code }}</td>
                <td>{{ course.name }}</td>
                <td>{{ course.type }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="store.courses.length === 0" class="empty-state">No registered courses yet.</p>
        <div class="course-advisory">
          <div class="alert alert--success">
            It is the responsibility of the student to make sure that the courses above are correct.
          </div>
        </div>
      </div>
    </section>
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
.courses-body {
  padding: 0;
}
.course-advisory {
  padding: 16px;
}
</style>
