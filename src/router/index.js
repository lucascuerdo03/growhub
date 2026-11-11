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
import { guardarDestino, tomarDestino } from '../utils/destino'

// Vistas pesadas (usan Leaflet / Chart.js): se cargan bajo demanda
// para aligerar la carga inicial de la app.
const OrchardDetailView = () => import('../views/OrchardDetailView.vue')
const OrchardSettingsView = () => import('../views/OrchardSettingsView.vue')
const OrchardSensorsView = () => import('../views/OrchardSensorsView.vue')
const OrchardTasksView = () => import('../views/OrchardTasksView.vue')
const GlobalTasksView = () => import('../views/GlobalTasksView.vue')
const GlobalSensorsView = () => import('../views/GlobalSensorsView.vue')
const CropDetailView = () => import('../views/CropDetailView.vue')
const BibliotecaEntradaView = () => import('../views/BibliotecaEntradaView.vue')
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
      { path: 'biblioteca/:id', component: BibliotecaEntradaView },
      { path: 'settings', component: SettingsView },
      { path: 'profile', component: ProfileView },
      { path: 'invitations', component: InvitationsView },
      // Enlace que se comparte: lleva el huerto, no el email, y por sí solo no da
      // acceso: la invitación tiene que ser para el email con el que se entra.
      { path: 'invitacion/:orchardId', component: InvitationsView },
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
router.beforeEach(async (to, from) => {
  const user = await waitForAuth()
  const verificado = !!user?.emailVerified

  // Pantalla de verificación: requiere sesión; si ya está verificado, al panel.
  if (to.path === '/verify-email') {
    if (!user) return '/login'
    if (verificado) return tomarDestino()
    return true
  }

  // Rutas protegidas: hace falta sesión y email verificado.
  if (to.meta.requiresAuth) {
    // Sin sesión lista, el enlace de invitación se retoma después de entrar.
    if (!user || !verificado) guardarDestino(to.path)
    if (!user) return '/login'
    if (!verificado) return '/verify-email'
    return true
  }

  // Entrar o registrarse con la sesión ya iniciada: a su panel, o a confirmar el
  // email si aún no lo ha hecho.
  if (to.meta.requiresGuest && user) {
    if (verificado) return { path: tomarDestino(), replace: true }
    if (to.path !== '/forgot-password') return { path: '/verify-email', replace: true }
  }
  // La página principal con sesión: al abrir la web se va directo al panel; si se
  // llega con "atrás" desde la app, se muestra (con un acceso al panel).
  if (to.path === '/' && user && verificado && !from.matched.length) return { path: '/dashboard', replace: true }
  return true
})

export default router
