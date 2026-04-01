import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import HuertosView from '../views/HuertosView.vue'
import PlantasView from '../views/PlantasView.vue'
import SensoresView from '../views/SensoresView.vue'
import MainLayout from '../layouts/MainLayout.vue'

const routes = [
  { path: '/', component: LoginView },

  {
    path: '/',
    component: MainLayout,
    children: [
      { path: 'dashboard', component: DashboardView },
      { path: 'huertos', component: HuertosView },
      { path: 'plantas', component: PlantasView },
      { path: 'sensores', component: SensoresView }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router