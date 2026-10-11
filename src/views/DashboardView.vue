<template>
  <div>
    <div class="eyebrow">YOUR SEMESTER, AT A GLANCE</div>
    <div class="overview-heading">
      <div>
        <h1>
          Good to see you,<br /><em>{{ store.student.name.split(' ')[0] }}.</em>
        </h1>
        <p>{{ store.student.programmeName }}</p>
      </div>
      <div class="semester-stamp">
        <strong>{{ store.student.academicYear }}</strong
        ><span>PART {{ store.student.part }} / SEMESTER {{ store.student.semester }}</span>
      </div>
    </div>
    <div class="stat-strip">
      <div>
        <span>Registration</span
        ><strong class="status-text">{{
          store.student.registrationStatus.toLowerCase()
        }}</strong>
      </div>
      <div>
        <span>Enrolled courses</span
        ><strong>{{ String(store.courses.length).padStart(2, '0') }}</strong>
      </div>
      <div>
        <span>Overall GPA</span><strong>{{ store.gpa }}</strong>
      </div>
      <div><span>Account balance · USD</span><strong>Not provided</strong></div>
    </div>
    <div class="overview-grid">
      <section>
        <div class="section-heading">
          <h2>On your reading desk</h2>
          <RouterLink to="/courses">All courses ↗</RouterLink>
        </div>
        <RouterLink
          v-for="(course, index) in store.courses"
          :key="course.id"
          to="/courses"
          class="course-row"
          ><span class="row-number">{{ String(index + 1).padStart(2, '0') }}</span>
          <div>
            <small>{{ course.code }}</small>
            <h3>{{ course.name }}</h3>
          </div>
          <span class="row-arrow">↗</span></RouterLink
        >
      </section>
      <aside class="semester-note">
        <div class="eyebrow">SEMESTER NOTES / 01</div>
        <h2>Make room<br />for what’s next.</h2>
        <p>Check your registered courses and keep your academic details up to date.</p>
        <RouterLink to="/register" class="btn btn--primary">Review registration ↗</RouterLink>
        <div class="note-links">
          <RouterLink to="/schedule">Exam planner <span>↗</span></RouterLink
          ><RouterLink to="/assessment">Coursework marks <span>↗</span></RouterLink
          ><RouterLink to="/payments">Your account statement <span>↗</span></RouterLink>
        </div>
        <p class="small-note">Exam dates and coursework marks appear here when published.</p>
      </aside>
    </div>
    <details class="personal-record">
      <summary>Your student record <span>View personal & academic details</span></summary>
      <div class="record-grid">
        <div>
          <small>Full name</small>
          <p>{{ store.student.name }}</p>
        </div>
        <div>
          <small>Programme</small>
          <p>
            {{ store.student.programme }} · Part {{ store.student.part }}, semester
            {{ store.student.semester }}
          </p>
        </div>
      </div>
    </details>
  </div>
</template>
<script setup lang="ts">
import { useStudentPortalStore } from '@/stores/studentPortalStore'
const store = useStudentPortalStore()
</script>
