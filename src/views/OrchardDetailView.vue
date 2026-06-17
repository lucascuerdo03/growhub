<template>
  <div>
    <router-link to="/dashboard" class="back">← Mis Huertos</router-link>

    <div class="head-row">
      <h1>{{ huerto?.nombre || 'Huerto' }}</h1>
      <div class="actions">
        <router-link :to="`/orchard/${orchardId}/sensors`" class="ghost-btn">
          📡 Sensores
        </router-link>
        <router-link :to="`/orchard/${orchardId}/tasks`" class="ghost-btn">
          ✅ Tareas
        </router-link>
        <router-link :to="`/orchard/${orchardId}/settings`" class="ghost-btn">
          ⚙️ Ajustes
        </router-link>
      </div>
    </div>

    <p v-if="huerto?.descripcion" class="orchard-desc">{{ huerto.descripcion }}</p>

    <LocationMap
      v-if="huerto && huerto.lat != null"
      :lat="huerto.lat"
      :lng="huerto.lng"
      class="detail-map"
    />

    <h2 class="section">Cultivos</h2>
    <form class="add-bar" @submit.prevent="add">
      <input v-model="nombre" placeholder="Nombre del cultivo" />
      <input v-model="especie" placeholder="Especie / nombre científico (opcional)" />
      <button type="submit" :disabled="saving || !nombre.trim()">Añadir</button>
    </form>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="loading" class="muted">Cargando…</p>
    <p v-else-if="!cultivos.length" class="muted">Este huerto aún no tiene cultivos.</p>

    <ul v-else class="list">
      <li v-for="c in cultivos" :key="c.id">
        <span>
          🌿 <strong>{{ c.nombre }}</strong>
          <em v-if="c.especie"> — {{ c.especie }}</em>
        </span>
        <button class="del" @click="remove(c.id)">✕</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import LocationMap from '../components/LocationMap.vue'
import {
  getHuerto,
  getCultivos,
  createCultivo,
  deleteCultivo,
} from '../services/firestoreService'

const route = useRoute()
const orchardId = route.params.id

const huerto = ref(null)
const cultivos = ref([])
const nombre = ref('')
const especie = ref('')
const loading = ref(true)
const saving = ref(false)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    ;[huerto.value, cultivos.value] = await Promise.all([
      getHuerto(orchardId),
      getCultivos(orchardId),
    ])
  } catch (e) {
    error.value = 'No se pudieron cargar los cultivos.'
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
    await createCultivo(orchardId, {
      nombre: nombre.value.trim(),
      especie: especie.value.trim(),
    })
    nombre.value = ''
    especie.value = ''
    await load()
  } catch (e) {
    error.value = 'No se pudo crear el cultivo.'
    console.error(e)
  } finally {
    saving.value = false
  }
}

async function remove(id) {
  if (!confirm('¿Eliminar este cultivo?')) return
  try {
    await deleteCultivo(orchardId, id)
    cultivos.value = cultivos.value.filter((c) => c.id !== id)
  } catch (e) {
    error.value = 'No se pudo eliminar el cultivo.'
    console.error(e)
  }
}

onMounted(load)
</script>

<style scoped>
.back {
  display: inline-block;
  margin-bottom: 12px;
  color: #0284c7;
  text-decoration: none;
  font-size: 0.9rem;
}
.head-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}
.head-row h1 {
  margin: 0;
}
.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.ghost-btn {
  background: #e0f2fe;
  color: #0369a1;
  border: 1px solid #bae6fd;
  padding: 9px 16px;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  font-size: 0.9rem;
}
.ghost-btn:hover {
  background: #bae6fd;
}
.orchard-desc {
  color: #6b7280;
  margin: 0 0 16px;
}
.detail-map {
  margin-bottom: 24px;
}
.section {
  margin: 8px 0 16px;
  font-size: 1.15rem;
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
  background: #0284c7;
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
.list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-width: 600px;
}
.list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 14px 18px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 10px;
}
.del {
  background: transparent;
  border: none;
  color: #9ca3af;
  cursor: pointer;
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
