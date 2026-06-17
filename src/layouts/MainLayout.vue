<template>
  <div class="layout">
    <aside class="sidebar">
      <h2>GrowHub 🌱</h2>

      <nav>
        <router-link to="/dashboard">Mis Huertos</router-link>
        <router-link to="/profile">Mi perfil</router-link>
      </nav>

      <div class="sidebar-foot">
        <router-link to="/profile" class="user-chip">
          <span class="avatar">
            <img v-if="user?.photoURL" :src="user.photoURL" alt="" />
            <span v-else>{{ initial }}</span>
          </span>
          <span class="user-meta">
            <span class="user-name">{{ user?.displayName || 'Usuario' }}</span>
            <span class="user-email">{{ user?.email }}</span>
          </span>
        </router-link>
        <button class="logout" @click="logout">Cerrar sesión</button>
      </div>
    </aside>

    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { logoutUser } from '../services/authService'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { user } = useAuth()

const initial = computed(() =>
  (user.value?.displayName || user.value?.email || '?').charAt(0).toUpperCase(),
)

async function logout() {
  await logoutUser()
  router.push('/login')
}
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}
.sidebar {
  width: 230px;
  background: #2f3e46;
  color: white;
  padding: 20px;
  display: flex;
  flex-direction: column;
}
.sidebar h2 {
  margin: 0 0 24px;
}
.sidebar nav {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.sidebar a {
  color: #cbd5e1;
  margin: 6px 0;
  padding: 8px 10px;
  border-radius: 6px;
  text-decoration: none;
}
.sidebar a:hover {
  color: white;
  background: rgba(255, 255, 255, 0.08);
}
.sidebar a.router-link-active {
  color: white;
  background: rgba(74, 144, 217, 0.35);
}
.sidebar-foot {
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  padding-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.user-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px;
  border-radius: 8px;
  text-decoration: none;
}
.user-chip:hover {
  background: rgba(255, 255, 255, 0.08);
}
.user-chip .avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #4a90d9;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  overflow: hidden;
  flex-shrink: 0;
}
.user-chip .avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.user-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.user-name {
  color: #e2e8f0;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.user-email {
  font-size: 0.72rem;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.logout {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #e2e8f0;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
}
.logout:hover {
  background: rgba(255, 255, 255, 0.08);
}
.content {
  flex: 1;
  padding: 30px;
  background: #f5f7fa;
}
</style>
