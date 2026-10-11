<template>
  <div class="app-shell">
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="masthead">
      <RouterLink to="/" class="wordmark"><span class="brand-mark">f.</span> fieldnotes<span class="brand-caption">STUDENT WORKSPACE</span></RouterLink>
      <div v-if="store.isAuthenticated" class="account"><span>{{ store.student.studentNumber }} <small> / {{ store.student.academicYear }}</small></span><button class="btn btn--ghost btn--sm" @click="logout">Sign out</button></div>
    </header>
    <nav v-if="store.isAuthenticated && route.path !== '/login'" class="main-nav" aria-label="Main navigation">
      <RouterLink v-for="(link, index) in navLinks" :key="link.to" :to="link.to" :class="{ active: route.path === link.to }"><span>{{ String(index + 1).padStart(2, '0') }}</span>{{ link.label }}</RouterLink>
    </nav>
    <main id="main" class="page-content" tabindex="-1"><RouterView /></main>
    <footer class="site-footer"><span>fieldnotes / A place for your academic life.</span><span>Academic year {{ store.student.academicYear }} · Student portal prototype</span></footer>
  </div>
</template>
<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useStudentPortalStore } from '@/stores/studentPortalStore'
const route = useRoute()
const router = useRouter()
const store = useStudentPortalStore()
const navLinks = [
  { to: '/', label: 'Overview' }, { to: '/courses', label: 'My courses' },
  { to: '/grades', label: 'Results' }, { to: '/assessment', label: 'Coursework' },
  { to: '/schedule', label: 'Exam planner' }, { to: '/payments', label: 'Account' },
  { to: '/register', label: 'Registration' }, { to: '/resources', label: 'Study room' },
]
function logout() { store.logout(); router.push('/login') }
</script>
