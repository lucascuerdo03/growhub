import { createRouter, createWebHistory } from 'vue-router'

import LandingView from '../views/LandingView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import DashboardView from '../views/DashboardView.vue'
import ProfileView from '../views/ProfileView.vue'
import SettingsView from '../views/SettingsView.vue'
import BibliotecaView from '../views/BibliotecaView.vue'
import VerifyEmailView from '../views/VerifyEmailView.vue'
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
const OrchardMembersView = () => import('../views/OrchardMembersView.vue')
const InvitationsView = () => import('../views/InvitationsView.vue')

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
  { path: '/verify-email', component: VerifyEmailView },

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
      { path: 'invitations', component: InvitationsView },
      { path: 'orchard/:id', component: OrchardDetailView },
      { path: 'orchard/:id/crop/:cropId', component: CropDetailView },
      { path: 'orchard/:id/settings', component: OrchardSettingsView },
      { path: 'orchard/:id/sensors', component: OrchardSensorsView },
      { path: 'orchard/:id/tasks', component: OrchardTasksView },
      { path: 'orchard/:id/members', component: OrchardMembersView },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Guard global: controla sesión y verificación de email.
router.beforeEach(async (to) => {
  const user = await waitForAuth()
  const verificado = !!user?.emailVerified

  // Pantalla de verificación: requiere sesión; si ya está verificado, al panel.
  if (to.path === '/verify-email') {
    if (!user) return '/login'
    if (verificado) return '/dashboard'
    return true
  }

  // Rutas protegidas: hace falta sesión y email verificado.
  if (to.meta.requiresAuth) {
    if (!user) return '/login'
    if (!verificado) return '/verify-email'
    return true
  }

  // Páginas de invitado (login/registro/recuperar): solo si no hay sesión válida.
  if (to.meta.requiresGuest && user && verificado) return '/dashboard'
  if (to.path === '/' && user && verificado) return '/dashboard'
  return true
})

export default router
