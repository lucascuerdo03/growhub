import { createRouter, createWebHistory } from 'vue-router'

import LandingView from '../views/LandingView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import DashboardView from '../views/DashboardView.vue'
import ProfileView from '../views/ProfileView.vue'
import SettingsView from '../views/SettingsView.vue'
import BibliotecaView from '../views/BibliotecaView.vue'
import MainLayout from '../layouts/MainLayout.vue'
import { waitForAuth } from '../composables/useAuth'

// Vistas pesadas (usan Leaflet / Chart.js): se cargan bajo demanda
// para aligerar la carga inicial de la app.
const OrchardDetailView = () => import('../views/OrchardDetailView.vue')
const OrchardSettingsView = () => import('../views/OrchardSettingsView.vue')
const OrchardSensorsView = () => import('../views/OrchardSensorsView.vue')
const OrchardTasksView = () => import('../views/OrchardTasksView.vue')
const GlobalTasksView = () => import('../views/GlobalTasksView.vue')
const GlobalSensorsView = () => import('../views/GlobalSensorsView.vue')
const CropDetailView = () => import('../views/CropDetailView.vue')

const routes = [
  // Página pública de entrada (si hay sesión, el guard redirige al dashboard).
  { path: '/', component: LandingView },

  { path: '/login', component: LoginView, meta: { requiresGuest: true } },
  { path: '/register', component: RegisterView, meta: { requiresGuest: true } },
  {
    path: '/forgot-password',
    component: ForgotPasswordView,
    meta: { requiresGuest: true },
  },

  // App autenticada (comparte el prefijo '/', pero sin hijo índice, de modo
  // que '/' resuelve a la landing y '/dashboard', etc. a esta rama).
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      { path: 'dashboard', component: DashboardView },
      { path: 'tasks', component: GlobalTasksView },
      { path: 'sensors', component: GlobalSensorsView },
      { path: 'biblioteca', component: BibliotecaView },
      { path: 'settings', component: SettingsView },
      { path: 'profile', component: ProfileView },
      { path: 'orchard/:id', component: OrchardDetailView },
      { path: 'orchard/:id/crop/:cropId', component: CropDetailView },
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
  // Un usuario con sesión no ve la landing: directo al dashboard.
  if (to.path === '/' && user) return '/dashboard'
  return true
})

export default router
