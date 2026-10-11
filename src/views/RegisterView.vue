<template><div><div class="eyebrow">ADMINISTRATION / SEMESTER CHECKLIST</div><h1 class="page-masthead">Ready for the semester.</h1><div class="split-page"><aside class="side-note"><span class="chip chip--success">{{ store.student.registrationStatus }}</span><h2 style="margin-top:22px">Your next chapter<br>starts here.</h2><p>{{ store.student.programmeName }}<br>Part {{ store.student.part }} · Semester {{ store.student.semester }}</p><p>This prototype displays registration guidance. Submission and course selection require a connected registration service.</p></aside><section><article v-for="(step, index) in steps" :key="step.title" class="course-row"><span class="row-number">0{{ index + 1 }}</span><div><h3>{{ step.title }}</h3><p style="font-size:13px;color:var(--clr-text-muted);margin-top:6px">{{ step.text }}</p><RouterLink v-if="step.to" :to="step.to" style="font-size:12px;color:var(--clr-primary)">Review details ↗</RouterLink></div></article></section></div></div></template>
<script setup lang="ts">
import { useStudentPortalStore } from '@/stores/studentPortalStore'
const store = useStudentPortalStore()
const steps = [
{ title: 'Review your account', text: 'Clear outstanding fees from previous semesters.', to: '/payments' },
{ title: 'Check the semester deposit', text: 'Confirm the required minimum deposit with your institution.', to: '/payments' },
{ title: 'Verify your student record', text: 'Check your personal and academic information.', to: '/' },
{ title: 'Review your course list', text: 'Make sure the listed courses match your programme.', to: '/courses' },
{ title: 'Confirm registration', text: 'Final submission is not connected in this demonstration.', to: '' }]
</script>
