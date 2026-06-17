<template>
  <div>
    <header class="page-head">
      <h1>Mis Huertos</h1>
    </header>

    <form class="add-bar" @submit.prevent="add">
      <input v-model="nombre" placeholder="Nombre del huerto" />
      <input v-model="descripcion" placeholder="Descripción (opcional)" />
      <button type="submit" :disabled="saving || !nombre.trim()">Añadir</button>
    </form>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="loading" class="muted">Cargando…</p>
    <p v-else-if="!huertos.length" class="muted">No hay huertos creados aún.</p>

    <div v-else class="cards">
      <div v-for="h in huertos" :key="h.id" class="card">
        <router-link class="card-link" :to="`/orchard/${h.id}`">
          <h3>🌱 {{ h.nombre }}</h3>
          <p class="desc">{{ h.descripcion || 'Sin descripción' }}</p>
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
  margin-bottom: 20px;
}
.page-head h1 {
  margin: 0;
}
.add-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.add-bar input {
  flex: 1;
  min-width: 160px;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
}
.add-bar button {
  padding: 10px 20px;
  background: #4a90d9;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.add-bar button:disabled {
  opacity: 0.6;
  cursor: default;
}
.cards {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}
.card {
  position: relative;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  width: 240px;
}
.card-link {
  display: block;
  padding: 24px;
  text-decoration: none;
  color: inherit;
}
.card h3 {
  margin: 0 0 8px;
}
.desc {
  color: #6b7280;
  margin: 0;
  font-size: 0.9rem;
}
.del {
  position: absolute;
  top: 10px;
  right: 10px;
  background: transparent;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: 1rem;
}
.del:hover {
  color: #dc2626;
}
.muted {
  color: #6b7280;
}
.error {
  color: #dc2626;
}
</style>
