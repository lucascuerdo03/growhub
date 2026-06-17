<template>
  <div class="app">
    <header class="navbar">
      <div class="nav-content">
        <router-link to="/dashboard" class="brand">GrowHub 🌱</router-link>

        <nav class="nav-links" :class="{ open }" @click="open = false">
          <router-link to="/dashboard"><span class="ic">🌱</span> Mis Huertos</router-link>
          <router-link to="/tasks"><span class="ic">✅</span> Tareas</router-link>
          <router-link to="/sensors"><span class="ic">📡</span> Sensores</router-link>
          <router-link to="/settings"><span class="ic">⚙️</span> Ajustes</router-link>
        </nav>

        <div class="nav-right">
          <router-link to="/profile" class="nav-avatar" title="Mi perfil">
            <img v-if="user?.photoURL" :src="user.photoURL" alt="" />
            <span v-else>{{ initial }}</span>
          </router-link>
          <button class="logout" @click="logout" title="Cerrar sesión">Salir</button>
          <button class="burger" @click="open = !open" aria-label="Menú">☰</button>
        </div>
      </div>
    </header>

    <main class="content">
      <div class="container">
        <router-view />
      </div>
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
.app {
  min-height: 100vh;
}
.navbar {
  background: var(--color-navbar);
  box-shadow: var(--shadow-card);
  border-bottom: 1px solid var(--color-border-soft);
  padding: 0.85rem 1.5rem;
  position: sticky;
  top: 0;
  z-index: 100;
}
.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  max-width: 1200px;
  margin: 0 auto;
}
.brand {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
  text-decoration: none;
  white-space: nowrap;
}
.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  margin-left: 12px;
}
.nav-links a {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--color-text-soft);
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.92rem;
  transition: background 0.15s, color 0.15s;
}
.nav-links a:hover {
  color: var(--color-text);
  background: var(--color-border-soft);
}
.nav-links a.router-link-active {
  color: var(--color-primary);
  background: var(--color-primary-soft);
}
.nav-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.nav-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  overflow: hidden;
  text-decoration: none;
  flex-shrink: 0;
}
.nav-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.logout {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-soft);
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
}
.logout:hover {
  background: var(--color-border-soft);
  color: var(--color-text);
}
.burger {
  display: none;
  background: transparent;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  color: var(--color-text);
}
.content {
  padding: 32px 24px 48px;
}
.container {
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 760px) {
  .burger {
    display: block;
  }
  .nav-links {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    flex-direction: column;
    align-items: stretch;
    gap: 2px;
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border-soft);
    padding: 10px 14px;
    margin: 0;
    box-shadow: var(--shadow-elevated);
    display: none;
  }
  .nav-links.open {
    display: flex;
  }
  .content {
    padding: 22px 16px 40px;
  }
}
</style>
