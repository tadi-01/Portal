<template>
  <div>
    <div class="eyebrow">ACADEMICS / COURSE DIRECTORY</div>
    <h1 class="page-masthead">Your semester reading list.</h1>
    <p class="page-intro">
      Your registered courses, together in one place. Search by title or course code.
    </p>

    <section class="section-card">
      <header class="section-header-bar">CURRENTLY REGISTERED COURSES</header>
      <div class="courses-body section-body">
        <div class="course-toolbar">
          <label for="course-search">Search by course code or name</label>
          <input
            id="course-search"
            v-model.trim="searchText"
            class="course-search"
            type="search"
            placeholder="Try “web” or “SCS2114”"
          />
        </div>
        <p class="filter-count" role="status" aria-live="polite" aria-atomic="true">
          {{ filteredCourses.length }} of {{ store.courses.length }} courses shown.
        </p>
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
              <tr v-for="course in filteredCourses" :key="course.id">
                <td>{{ course.code }}</td>
                <td>{{ course.name }}</td>
                <td>{{ course.type }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="filteredCourses.length === 0" class="empty-state">No courses match your search.</p>
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
import { computed, ref } from 'vue'

const store = useStudentPortalStore()
const searchText = ref('')

const filteredCourses = computed(() => {
  const query = searchText.value.toLowerCase()
  return store.courses.filter((course) =>
    `${course.code} ${course.name}`.toLowerCase().includes(query),
  )
})
</script>

<style scoped>
.course-toolbar {
  display: grid;
  gap: 6px;
  padding: 16px;
  border-bottom: 1px solid var(--clr-border-light);
}

.course-toolbar label {
  color: var(--clr-text-muted);
  font-size: 0.8rem;
  font-weight: 700;
}

.course-search {
  max-width: 420px;
}

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
