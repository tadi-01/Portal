<script setup lang="ts">
import { useStudentPortalStore } from '@/stores/studentPortalStore'
import { safeResourceUrl } from '@/lib/resourceUrl'
const store = useStudentPortalStore()
</script>
<template>
  <div>
    <div class="eyebrow">RESOURCES / YOUR STUDY ROOM</div>
    <h1 class="page-masthead">Follow your curiosity.</h1>
    <p class="page-intro">Published materials for your enrolled courses.</p>
    <p v-if="!store.resources.length" class="empty-panel">
      No course resources have been published yet.
    </p>
    <article v-for="resource in store.resources" :key="resource.id" class="course-row">
      <div>
        <small>{{ store.courses.find((c) => c.id === resource.offering_id)?.code }}</small>
        <h2>{{ resource.title }}</h2>
        <a
          v-if="safeResourceUrl(resource.url)"
          :href="safeResourceUrl(resource.url)"
          target="_blank"
          rel="noopener noreferrer"
          >Open resource (new tab) ?</a
        >
        <p v-else>Resource address unavailable. Contact your lecturer.</p>
      </div>
    </article>
    <RouterLink to="/courses" class="btn btn--ghost">Browse your courses ?</RouterLink>
  </div>
</template>
