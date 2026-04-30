import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import HuertosView from '../views/HuertosView.vue'

// (aunque no estén aún perfectas, las dejamos)
import PlantasView from '../views/PlantasView.vue'
import SensoresView from '../views/SensoresView.vue'

const routes = [
  { path: '/', component: LoginView },
  { path: '/dashboard', component: DashboardView },
  { path: '/huertos', component: HuertosView },
  { path: '/plantas', component: PlantasView },
  { path: '/sensores', component: SensoresView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router