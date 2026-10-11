import { createRouter, createWebHistory } from 'vue-router'

import { useStudentPortalStore } from '@/stores/studentPortalStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login',      component: () => import('../views/LoginView.vue'),      meta: { title: 'Student Login' } },
    { path: '/',           component: () => import('../views/DashboardView.vue'),  meta: { title: 'My Portal Dashboard' } },
    { path: '/courses',    component: () => import('../views/CoursesView.vue'),    meta: { title: 'Registered Courses' } },
    { path: '/grades',     component: () => import('../views/GradesView.vue'),     meta: { title: 'Examination Results' } },
    { path: '/payments',   component: () => import('../views/PaymentsView.vue'),   meta: { title: 'Payments History' } },
    { path: '/schedule',   component: () => import('../views/ScheduleView.vue'),   meta: { title: 'Exams Timetable' } },
    { path: '/resources',  component: () => import('../views/ResourcesView.vue'),  meta: { title: 'Study Room' } },
    { path: '/assessment', component: () => import('../views/AssessmentView.vue'), meta: { title: 'Continuous Assessment' } },
    { path: '/register',   component: () => import('../views/RegisterView.vue'),   meta: { title: 'New Registration' } },
  ]
})

router.beforeEach((to) => {
  const store = useStudentPortalStore()
  if (!store.isAuthenticated && to.path !== '/login') return '/login'
  if (store.isAuthenticated && to.path === '/login') return '/'
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} | Fieldnotes` : 'Fieldnotes'
})

export default router
