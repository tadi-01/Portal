import { createRouter, createWebHistory } from 'vue-router'

import { useStudentPortalStore } from '@/stores/studentPortalStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? { left: 0, top: 0 }
  },
  routes: [
    {
      path: '/staff/login',
      component: () => import('../views/StaffLoginView.vue'),
      meta: { title: 'Staff Login', staff: true, public: true },
    },
    {
      path: '/staff',
      component: () => import('../views/StaffView.vue'),
      meta: { title: 'Staff Workspace', staff: true },
    },
    {
      path: '/login',
      component: () => import('../views/LoginView.vue'),
      meta: { title: 'Student Login' },
    },
    {
      path: '/',
      component: () => import('../views/DashboardView.vue'),
      meta: { title: 'My Portal Dashboard' },
    },
    {
      path: '/courses',
      component: () => import('../views/CoursesView.vue'),
      meta: { title: 'Registered Courses' },
    },
    {
      path: '/grades',
      component: () => import('../views/GradesView.vue'),
      meta: { title: 'Examination Results' },
    },
    {
      path: '/payments',
      component: () => import('../views/PaymentsView.vue'),
      meta: { title: 'Payments History' },
    },
    {
      path: '/schedule',
      component: () => import('../views/ScheduleView.vue'),
      meta: { title: 'Exams Timetable' },
    },
    {
      path: '/resources',
      component: () => import('../views/ResourcesView.vue'),
      meta: { title: 'Study Room' },
    },
    {
      path: '/assessment',
      component: () => import('../views/AssessmentView.vue'),
      meta: { title: 'Continuous Assessment' },
    },
    {
      path: '/register',
      component: () => import('../views/RegisterView.vue'),
      meta: { title: 'New Registration' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
      meta: { title: 'Page Not Found', public: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const store = useStudentPortalStore()
  await store.initialize()
  if (to.meta.staff) {
    if (to.path === '/staff/login')
      return store.isAuthenticated ? (store.isStaff ? '/staff' : '/') : true
    if (!store.isAuthenticated) return '/staff/login'
    return store.isStaff ? true : '/'
  }
  if (store.isAuthenticated && store.isStaff && !to.meta.public) return '/staff'
  if (!store.isAuthenticated && to.path !== '/login' && !to.meta.public) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (store.isAuthenticated && to.path === '/login') return '/'
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} | Fieldnotes` : 'Fieldnotes'
})

export default router
