<template>
  <div class="app">
    <header class="navbar">
      <div class="nav-content">
        <router-link to="/dashboard" class="brand">GrowHub</router-link>

        <nav class="nav-links" :class="{ open }" @click="open = false">
          <router-link to="/dashboard">Hoy</router-link>
          <router-link to="/tasks">Tareas</router-link>
          <router-link to="/sensors">Sensores</router-link>
          <router-link to="/biblioteca">Biblioteca</router-link>
          <router-link to="/settings">Ajustes</router-link>
          <router-link to="/invitations" class="nav-invitations">
            Invitaciones
            <span v-if="invitaciones.length" class="badge" :aria-label="`${invitaciones.length} pendientes`">
              {{ invitaciones.length }}
            </span>
          </router-link>
        </nav>

        <div class="nav-right">
          <router-link to="/profile" class="nav-avatar" title="Mi perfil">
            <UserAvatar :uid="user?.uid" :nombre="nombreVisible" :url="user?.photoURL || ''" :size="36" />
          </router-link>
          <button class="logout" @click="logout" title="Cerrar sesión">
            <LogOut :size="18" />
          </button>
          <button class="burger" @click="open = !open" aria-label="Menú">
            <Menu :size="22" />
          </button>
        </div>
      </div>
    </header>

    <main class="content">
      <div class="container">
        <router-view :key="$route.path" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { LogOut, Menu } from 'lucide-vue-next'
import UserAvatar from '../components/UserAvatar.vue'
import { logoutUser } from '../services/authService'
import { useAuth } from '../composables/useAuth'
import { useInvitaciones } from '../composables/useInvitaciones'
import { escucharMisHuertos, pararHuertos } from '../composables/useHuertos'
import { asegurarUsuario } from '../services/firestoreService'

const router = useRouter()
const { user } = useAuth()
const { invitaciones } = useInvitaciones()
const open = ref(false)

// Antes de montar las vistas hijas, que leen de esta lista.
escucharMisHuertos(user.value.uid)
onBeforeUnmount(pararHuertos)

onMounted(() => {
  // Cuentas creadas antes de existir users/{uid}.
  asegurarUsuario(user.value).catch((e) => console.warn('No se pudo guardar el perfil:', e))
})

const nombreVisible = computed(() => user.value?.displayName || user.value?.email || '')

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
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
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
  max-width: 1160px;
  margin: 0 auto;
}
.brand {
  font-family: var(--font-titulos);
  font-size: 1.45rem;
  font-weight: 700;
  color: var(--color-verde-oscuro);
  text-decoration: none;
  white-space: nowrap;
  letter-spacing: -0.01em;
}
.nav-links {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 1;
  margin-left: 20px;
}
.nav-links a {
  color: var(--color-text-soft);
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  text-decoration: none;
  font-weight: 500;
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
.nav-invitations {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--color-primary);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
}
.nav-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.nav-avatar {
  display: flex;
  border-radius: 50%;
  text-decoration: none;
}
.logout {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-soft);
  padding: 7px;
  border-radius: var(--radius-sm);
  cursor: pointer;
}
.logout:hover {
  background: var(--color-border-soft);
  color: var(--color-text);
}
.burger {
  display: none;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-text);
  padding: 4px;
}
.content {
  padding: 32px 24px 48px;
}
.container {
  max-width: 1160px;
  margin: 0 auto;
}

@media (max-width: 760px) {
  .burger {
    display: flex;
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
    border-bottom: 1px solid var(--color-border);
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
