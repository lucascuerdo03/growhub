<template>
  <div class="layout">
    <button class="menu-toggle" @click="open = !open" aria-label="Menú">☰</button>

    <aside class="sidebar" :class="{ open }">
      <div class="brand">GrowHub 🌱</div>

      <nav @click="open = false">
        <router-link to="/dashboard"><span class="ic">🌱</span> Mis Huertos</router-link>
        <router-link to="/tasks"><span class="ic">✅</span> Tareas</router-link>
        <router-link to="/sensors"><span class="ic">📡</span> Sensores</router-link>
        <router-link to="/settings"><span class="ic">⚙️</span> Ajustes</router-link>
      </nav>

      <div class="sidebar-foot">
        <router-link to="/profile" class="user-chip" @click="open = false">
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

    <div v-if="open" class="overlay" @click="open = false"></div>

    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { logoutUser } from '../services/authService'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { user } = useAuth()
const open = ref(false)

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
  width: 240px;
  background: var(--color-sidebar);
  color: #e2e8f0;
  padding: 22px 16px;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
}
.brand {
  font-size: 1.3rem;
  font-weight: 700;
  color: #fff;
  padding: 0 8px 22px;
}
nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}
nav a {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #cbd5e1;
  padding: 11px 12px;
  border-radius: var(--radius-sm);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
  transition: background 0.15s, color 0.15s;
}
nav a .ic {
  font-size: 1.05rem;
}
nav a:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.07);
}
nav a.router-link-active {
  color: #fff;
  background: var(--color-primary);
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
  border-radius: var(--radius-sm);
  text-decoration: none;
}
.user-chip:hover {
  background: rgba(255, 255, 255, 0.08);
}
.user-chip .avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-primary);
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
  padding: 9px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
}
.logout:hover {
  background: rgba(255, 255, 255, 0.08);
}
.content {
  flex: 1;
  padding: 32px 36px;
  max-width: 1200px;
}
.menu-toggle {
  display: none;
  position: fixed;
  top: 14px;
  left: 14px;
  z-index: 30;
  width: 42px;
  height: 42px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--color-sidebar);
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
}
.overlay {
  display: none;
}

@media (max-width: 760px) {
  .menu-toggle {
    display: block;
  }
  .sidebar {
    position: fixed;
    z-index: 40;
    left: -260px;
    transition: left 0.25s ease;
  }
  .sidebar.open {
    left: 0;
  }
  .overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 35;
  }
  .content {
    padding: 70px 18px 24px;
  }
}
</style>
