import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import DashboardView from '../views/DashboardView.vue'
import ProfileView from '../views/ProfileView.vue'
import MainLayout from '../layouts/MainLayout.vue'
import { waitForAuth } from '../composables/useAuth'

// Vistas pesadas (usan Leaflet / Chart.js): se cargan bajo demanda
// para aligerar la carga inicial de la app.
const OrchardDetailView = () => import('../views/OrchardDetailView.vue')
const OrchardSettingsView = () => import('../views/OrchardSettingsView.vue')
const OrchardSensorsView = () => import('../views/OrchardSensorsView.vue')
const OrchardTasksView = () => import('../views/OrchardTasksView.vue')

const routes = [
  { path: '/login', component: LoginView, meta: { requiresGuest: true } },
  { path: '/register', component: RegisterView, meta: { requiresGuest: true } },
  {
    path: '/forgot-password',
    component: ForgotPasswordView,
    meta: { requiresGuest: true },
  },
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', component: DashboardView },
      { path: 'profile', component: ProfileView },
      { path: 'orchard/:id', component: OrchardDetailView },
      { path: 'orchard/:id/settings', component: OrchardSettingsView },
      { path: 'orchard/:id/sensors', component: OrchardSensorsView },
      { path: 'orchard/:id/tasks', component: OrchardTasksView },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Guard global: espera a conocer el estado de sesión antes de decidir.
router.beforeEach(async (to) => {
  const user = await waitForAuth()
  if (to.meta.requiresAuth && !user) return '/login'
  if (to.meta.requiresGuest && user) return '/dashboard'
  return true
})

export default router
