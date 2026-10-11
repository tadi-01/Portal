<template>
  <div>
    <div class="eyebrow">FIELDNOTES / PAGE NOT FOUND</div>
    <h1 class="page-masthead">This page is missing.</h1>
    <section class="empty-panel">
      <span class="chip chip--primary">404</span>
      <h2>Let’s find your way back.</h2>
      <p>The address may be incorrect, or the page may have moved.</p>
      <RouterLink :to="store.isAuthenticated ? '/' : '/login'" class="btn btn--primary">
        {{ store.isAuthenticated ? 'Back to overview' : 'Go to student login' }}
      </RouterLink>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useStudentPortalStore } from '@/stores/studentPortalStore'

const store = useStudentPortalStore()
</script>
