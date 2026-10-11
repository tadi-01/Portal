<template>
  <div class="app-shell">
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="masthead">
      <RouterLink :to="route.meta.staff ? '/staff' : '/'" class="wordmark"
        ><span class="brand-mark">f.</span> fieldnotes<span class="brand-caption">{{
          route.meta.staff ? 'STAFF WORKSPACE' : 'STUDENT WORKSPACE'
        }}</span></RouterLink
      >
      <div v-if="store.isAuthenticated" class="account">
        <span>{{ store.isStaff ? 'Admin access' : store.student.studentNumber }}</span
        ><button class="btn btn--ghost btn--sm" @click="logout">Sign out</button>
      </div>
    </header>
    <nav
      v-if="store.isAuthenticated && !store.isStaff && route.path !== '/login'"
      class="main-nav"
      aria-label="Main navigation"
    >
      <RouterLink
        v-for="(link, index) in navLinks"
        :key="link.to"
        :to="link.to"
        :class="{ active: route.path === link.to }"
        ><span>{{ String(index + 1).padStart(2, '0') }}</span
        >{{ link.label }}</RouterLink
      >
    </nav>
    <main id="main" class="page-content" tabindex="-1">
      <p v-if="store.loading" role="status">Loading your records…</p>
      <div
        v-if="store.isAuthenticated && store.errorMessage"
        class="alert alert--danger"
        role="alert"
      >
        {{ store.errorMessage }}
        <button class="btn btn--ghost" :disabled="store.loading" @click="store.loadData()">
          Retry
        </button>
      </div>
      <RouterView v-if="!store.loading && !(store.isAuthenticated && store.errorMessage)" />
    </main>
    <footer class="site-footer">
      <span>fieldnotes / A place for your academic life.</span
      ><span>Development portal · Test environment</span>
    </footer>
  </div>
</template>
<script setup lang="ts">
import { nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStudentPortalStore } from '@/stores/studentPortalStore'
const route = useRoute()
const router = useRouter()
const store = useStudentPortalStore()
watch(
  () => store.isAuthenticated,
  (signedIn, wasSignedIn) => {
    if (wasSignedIn && !signedIn) router.replace(route.meta.staff ? '/staff/login' : '/login')
  },
)
watch(
  () => route.fullPath,
  async () => {
    await nextTick()
    const heading = document.querySelector<HTMLElement>('#main h1')
    if (heading) {
      heading.tabIndex = -1
      heading.focus({ preventScroll: true })
    }
  },
  { flush: 'post' },
)
const navLinks = [
  { to: '/', label: 'Overview' },
  { to: '/courses', label: 'My courses' },
  { to: '/grades', label: 'Results' },
  { to: '/assessment', label: 'Coursework' },
  { to: '/schedule', label: 'Exam planner' },
  { to: '/payments', label: 'Account' },
  { to: '/register', label: 'Registration' },
  { to: '/resources', label: 'Study room' },
]
async function logout() {
  const destination = route.meta.staff ? '/staff/login' : '/login'
  await store.logout()
  router.replace(destination)
}
</script>
