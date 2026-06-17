<template>
  <div>
    <header class="page-head">
      <h1>Ajustes</h1>
      <p class="sub">Tu cuenta y la configuración de tus huertos.</p>
    </header>

    <section class="card">
      <h2>Cuenta</h2>
      <div class="account">
        <span class="avatar">
          <img v-if="user?.photoURL" :src="user.photoURL" alt="" />
          <span v-else>{{ initial }}</span>
        </span>
        <div class="account-info">
          <strong>{{ user?.displayName || 'Usuario' }}</strong>
          <span class="muted">{{ user?.email }}</span>
        </div>
        <router-link to="/profile" class="btn-soft">Editar perfil</router-link>
      </div>
    </section>

    <section class="card">
      <h2>Mis huertos</h2>
      <p v-if="loading" class="muted">Cargando…</p>
      <p v-else-if="!huertos.length" class="muted">
        Aún no tienes huertos.
        <router-link to="/dashboard" class="link">Crear uno →</router-link>
      </p>
      <ul v-else class="orchard-list">
        <li v-for="h in huertos" :key="h.id">
          <div class="o-info">
            <strong>🌱 {{ h.nombre }}</strong>
            <span v-if="h.lat != null" class="muted small">📍 Ubicación definida</span>
            <span v-else class="muted small">Sin ubicación</span>
          </div>
          <div class="o-actions">
            <router-link :to="`/orchard/${h.id}/settings`" class="btn-soft">⚙️ Ajustes</router-link>
            <button class="btn-danger" @click="remove(h)">Eliminar</button>
          </div>
        </li>
      </ul>
    </section>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import { getHuertos, deleteHuerto } from '../services/firestoreService'

const { user } = useAuth()
const huertos = ref([])
const loading = ref(true)
const error = ref('')

const initial = computed(() =>
  (user.value?.displayName || user.value?.email || '?').charAt(0).toUpperCase(),
)

async function load() {
  loading.value = true
  try {
    huertos.value = await getHuertos(user.value.uid)
  } catch (e) {
    error.value = 'No se pudieron cargar los huertos.'
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function remove(h) {
  if (!confirm(`¿Eliminar el huerto "${h.nombre}"? Esta acción no se puede deshacer.`)) return
  try {
    await deleteHuerto(h.id)
    huertos.value = huertos.value.filter((x) => x.id !== h.id)
  } catch (e) {
    error.value = 'No se pudo eliminar el huerto.'
    console.error(e)
  }
}

onMounted(load)
</script>

<style scoped>
.page-head {
  margin-bottom: 22px;
}
.page-head h1 {
  margin: 0;
}
.sub {
  color: var(--color-text-soft);
  margin: 4px 0 0;
}
.card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 24px;
  margin-bottom: 20px;
  max-width: 720px;
}
.card h2 {
  margin: 0 0 16px;
  font-size: 1.1rem;
}
.account {
  display: flex;
  align-items: center;
  gap: 14px;
}
.avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  font-weight: 700;
  overflow: hidden;
  flex-shrink: 0;
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.account-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.orchard-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.orchard-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border-top: 1px solid var(--color-border);
  flex-wrap: wrap;
}
.orchard-list li:first-child {
  border-top: none;
}
.o-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.o-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.btn-soft {
  background: var(--color-primary-soft);
  color: #2f6fb0;
  border: 1px solid var(--color-primary-border);
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.85rem;
  text-decoration: none;
  cursor: pointer;
}
.btn-soft:hover {
  background: #e0ecf8;
}
.btn-danger {
  background: #fdf2f2;
  color: var(--color-danger);
  border: 1px solid #f3c2c2;
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}
.btn-danger:hover {
  background: #fbe5e5;
}
.muted {
  color: var(--color-text-soft);
}
.small {
  font-size: 0.82rem;
}
.link {
  font-weight: 600;
  text-decoration: none;
}
.error {
  color: var(--color-danger);
}
</style>
