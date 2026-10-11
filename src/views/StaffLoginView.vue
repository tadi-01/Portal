<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStudentPortalStore } from '@/stores/studentPortalStore'
const store = useStudentPortalStore()
const router = useRouter()
const email = ref('')
const password = ref('')
const busy = ref(false)
const error = ref('')
async function signIn() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  if (await store.login(email.value, password.value, true)) {
    password.value = ''
    await router.replace('/staff')
  } else error.value = store.errorMessage
  busy.value = false
}
</script>
<template>
  <div class="split-page">
    <aside class="side-note">
      <div class="eyebrow">FIELDNOTES / STAFF ACCESS</div>
      <h1>Behind the record.</h1>
      <p>Teaching and approval work, kept separate from the student workspace.</p>
    </aside>
    <section class="section-card">
      <div class="section-header-bar">STAFF SIGN IN</div>
      <form class="section-body staff-form" @submit.prevent="signIn">
        <h2>Your assigned workspace.</h2>
        <p>
          Use an admin account. Admins can manage teaching, review and approval work across the
          portal.
        </p>
        <label for="staff-email">Staff email</label>
        <input
          id="staff-email"
          v-model.trim="email"
          type="email"
          autocomplete="username"
          required
        />
        <label for="staff-password">Password</label>
        <input
          id="staff-password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
        />
        <p v-if="error" role="alert" class="alert alert--danger">{{ error }}</p>
        <button class="btn btn--primary" :disabled="busy">
          {{ busy ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
    </section>
  </div>
</template>
