<template>
  <div>
    <header class="page-head">
      <h1>Mis Huertos</h1>
      <p class="sub">Gestiona tus huertos, cultivos y sensores.</p>
    </header>

    <form class="add-bar" @submit.prevent="add">
      <input v-model="nombre" placeholder="Nombre del huerto" />
      <input v-model="descripcion" placeholder="Descripción (opcional)" />
      <button type="submit" :disabled="saving || !nombre.trim()">+ Añadir huerto</button>
    </form>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="loading" class="muted">Cargando…</p>

    <div v-else-if="!huertos.length" class="empty">
      <div class="empty-emoji">🌱</div>
      <p>Todavía no tienes huertos.</p>
      <p class="muted small">Crea el primero con el formulario de arriba.</p>
    </div>

    <div v-else class="cards">
      <div v-for="h in huertos" :key="h.id" class="card">
        <router-link class="card-link" :to="`/orchard/${h.id}`">
          <div class="card-icon">🌱</div>
          <h3>{{ h.nombre }}</h3>
          <p class="desc">{{ h.descripcion || 'Sin descripción' }}</p>
          <span class="card-cta">Abrir →</span>
        </router-link>
        <button class="del" title="Eliminar" @click="remove(h.id)">✕</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import {
  getHuertos,
  createHuerto,
  deleteHuerto,
} from '../services/firestoreService'

const { user } = useAuth()
const huertos = ref([])
const nombre = ref('')
const descripcion = ref('')
const loading = ref(true)
const saving = ref(false)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    huertos.value = await getHuertos(user.value.uid)
  } catch (e) {
    error.value = 'No se pudieron cargar los huertos.'
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function add() {
  if (!nombre.value.trim()) return
  saving.value = true
  error.value = ''
  try {
    await createHuerto(user.value.uid, {
      nombre: nombre.value.trim(),
      descripcion: descripcion.value.trim(),
    })
    nombre.value = ''
    descripcion.value = ''
    await load()
  } catch (e) {
    error.value = 'No se pudo crear el huerto.'
    console.error(e)
  } finally {
    saving.value = false
  }
}

async function remove(id) {
  if (!confirm('¿Eliminar este huerto?')) return
  try {
    await deleteHuerto(id)
    huertos.value = huertos.value.filter((h) => h.id !== id)
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
.add-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 28px;
  flex-wrap: wrap;
  max-width: 680px;
}
.add-bar input {
  flex: 1;
  min-width: 160px;
  padding: 11px 13px;
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
}
.add-bar button {
  padding: 11px 20px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.add-bar button:hover:not(:disabled) {
  background: var(--color-primary-dark);
}
.add-bar button:disabled {
  opacity: 0.6;
  cursor: default;
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 20px;
}
.card {
  position: relative;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  transition: transform 0.15s, box-shadow 0.15s;
}
.card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-elevated);
}
.card-link {
  display: block;
  padding: 24px;
  text-decoration: none;
  color: inherit;
}
.card-icon {
  font-size: 2rem;
  margin-bottom: 8px;
}
.card h3 {
  margin: 0 0 6px;
}
.desc {
  color: var(--color-text-soft);
  margin: 0 0 14px;
  font-size: 0.9rem;
  min-height: 1.2em;
}
.card-cta {
  color: var(--color-primary);
  font-weight: 600;
  font-size: 0.88rem;
}
.del {
  position: absolute;
  top: 10px;
  right: 10px;
  background: transparent;
  border: none;
  color: #cbd5e1;
  cursor: pointer;
  font-size: 1rem;
}
.del:hover {
  color: var(--color-danger);
}
.muted {
  color: var(--color-text-soft);
}
.small {
  font-size: 0.85rem;
}
.empty {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 40px;
  text-align: center;
  max-width: 420px;
}
.empty-emoji {
  font-size: 2.6rem;
  margin-bottom: 6px;
}
.empty p {
  margin: 4px 0;
}
.error {
  color: var(--color-danger);
}
</style>
