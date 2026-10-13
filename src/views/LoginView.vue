<template>
  <div class="login-view">
    <aside class="login-story">
      <div class="eyebrow">FIELDNOTES / STUDENT ACCESS</div>
      <h1>Your studies.<br />Your own rhythm.</h1>
      <p>
        Courses, results and the details in between.<br />Keep your academic life in one place.
      </p>
      <div class="login-rule">A new page starts here.</div>
    </aside>
    <section class="login-card section-card">
      <div class="section-header-bar">STUDENT LOGIN</div>

      <div class="section-body">
        <h2 class="page-masthead">Welcome back.</h2>
        <p class="login-intro">Sign in to view your student portal.</p>

        <form class="login-form" @submit.prevent="handleLogin">
          <div class="form-field">
            <label for="student-number">Student number</label>
            <input
              id="student-number"
              v-model.trim="studentNumber"
              type="text"
              placeholder="Enter your student number"
              autocomplete="username"
              required
            />
          </div>

          <div class="form-field">
            <label for="password">Password</label>
            <div class="password-field">
              <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Enter your password"
              autocomplete="current-password"
              required
              />
              <button class="password-toggle" type="button" @click="showPassword = !showPassword">
                {{ showPassword ? 'Hide' : 'Show' }}
              </button>
            </div>
          </div>

          <div v-if="errorMessage || store.errorMessage" class="alert alert--danger" role="alert">
            {{ errorMessage || store.errorMessage }}
          </div>

          <button class="btn btn--primary login-button" type="submit" :disabled="busy">
            {{ busy ? 'Signing in…' : 'Log in' }}
          </button>
        </form>

        <p class="small-note">
          Accounts are provided by the registry. Contact them if your account has not been
          activated.
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter, type Router } from 'vue-router'
import { useStudentPortalStore } from '@/stores/studentPortalStore'

// After login, send the student back to the page they wanted. We only accept
// real pages inside this app, so a crafted link can never redirect to another site.
function safeReturnPath(router: Router, value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return '/'
  if (
    [...value].some(
      (character) =>
        character === '\\' || character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127,
    )
  ) {
    return '/'
  }
  const resolved = router.resolve(value)
  if (
    !resolved.matched.length ||
    resolved.path === '/login' ||
    resolved.meta.staff ||
    resolved.name === 'not-found'
  ) {
    return '/'
  }
  return resolved.fullPath
}

const router = useRouter()
const route = useRoute()
const store = useStudentPortalStore()
const studentNumber = ref('')
const password = ref('')
const errorMessage = ref('')
const busy = ref(false)
const showPassword = ref(false)

async function handleLogin() {
  if (busy.value) return
  busy.value = true
  errorMessage.value = ''

  if (!(await store.login(studentNumber.value, password.value))) {
    errorMessage.value = store.errorMessage
    busy.value = false
    return
  }

  password.value = ''
  await router.replace(safeReturnPath(router, route.query.redirect))
  busy.value = false
}
</script>

<style scoped>
.login-view {
  min-height: 60vh;
  grid-template-columns: 1.2fr 1fr;
  gap: 50px;
  display: grid;
  place-items: center;
}

.login-card {
  width: min(100%, 440px);
}

.login-intro {
  color: var(--clr-text-muted);
  margin: -8px 0 20px;
}

.login-form {
  display: grid;
  gap: 16px;
}

.form-field {
  display: grid;
  gap: 6px;
}

.form-field label {
  color: var(--clr-text-mid);
  font-size: 0.82rem;
  font-weight: 700;
}

.form-field input,
.course-search,
.grade-filter {
  width: 100%;
  border: 1px solid var(--clr-control-border);
  border-radius: var(--r-md);
  padding: 9px 10px;
  color: var(--clr-text);
  background: var(--clr-surface);
  font: inherit;
}

.form-field input:focus,
.course-search:focus,
.grade-filter:focus {
  outline: 2px solid var(--clr-primary);
  outline-offset: 3px;
  border-color: var(--clr-primary);
}

.login-button {
  justify-content: center;
}

.login-story p {
  margin-top: 24px;
  color: var(--clr-text-muted);
}
.login-rule {
  margin-top: 55px;
  border-top: 1px solid var(--clr-border);
  padding-top: 18px;
  font: 12px var(--font-mono);
}
@media (max-width: 700px) {
  .login-view {
    grid-template-columns: 1fr;
    gap: 30px;
  }
  .login-story h1 {
    font-size: 42px;
  }
  .login-rule {
    display: none;
  }
}
</style>
