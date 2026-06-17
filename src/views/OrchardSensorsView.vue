<template>
  <div>
    <router-link :to="`/orchard/${orchardId}`" class="back">← Volver al huerto</router-link>
    <h1>Sensores</h1>

    <form class="add-bar" @submit.prevent="add">
      <input v-model="nombre" placeholder="Nombre del sensor" />
      <select v-model="tipo">
        <option v-for="(t, key) in SENSOR_TYPES" :key="key" :value="key">
          {{ t.label }} ({{ t.unidad }})
        </option>
      </select>
      <button type="submit" :disabled="saving || !nombre.trim()">Añadir sensor</button>
    </form>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="loading" class="muted">Cargando…</p>
    <p v-else-if="!sensores.length" class="muted">No hay sensores en este huerto.</p>

    <div v-else class="sensor-grid">
      <div v-for="s in sensores" :key="s.id" class="sensor-card">
        <header>
          <span class="icon-box" :style="{ background: SENSOR_TYPES[s.tipo]?.tint }">
            {{ SENSOR_TYPES[s.tipo]?.icon }}
          </span>
          <div class="meta">
            <span class="label">{{ SENSOR_TYPES[s.tipo]?.label }}</span>
            <h3>{{ s.nombre }}</h3>
          </div>
          <button class="del" title="Eliminar" @click="remove(s.id)">✕</button>
        </header>

        <div class="value" :style="{ color: SENSOR_TYPES[s.tipo]?.color }">
          <template v-if="lastValue(s)">
            {{ lastValue(s) }}<small>{{ s.unidad }}</small>
          </template>
          <small v-else class="muted">Sin lecturas</small>
        </div>

        <SensorChart
          v-if="(readings[s.id] || []).length"
          :lecturas="readings[s.id]"
          :label="`${s.nombre} (${s.unidad})`"
          :color="SENSOR_TYPES[s.tipo]?.color"
        />
        <p v-else class="muted small">Añade una lectura para ver el histórico.</p>

        <button class="sim" :disabled="busy[s.id]" @click="simular(s)">
          {{ busy[s.id] ? 'Registrando…' : '+ Simular lectura' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import SensorChart from '../components/SensorChart.vue'
import { SENSOR_TYPES, simularValor } from '../utils/sensorTypes'
import {
  getSensores,
  createSensor,
  deleteSensor,
  getLecturas,
  addLectura,
} from '../services/firestoreService'

const route = useRoute()
const orchardId = route.params.id

const sensores = ref([])
const readings = reactive({}) // sensorId -> [lecturas]
const busy = reactive({}) // sensorId -> bool
const nombre = ref('')
const tipo = ref('temperatura')
const loading = ref(true)
const saving = ref(false)
const error = ref('')

function lastValue(s) {
  const arr = readings[s.id]
  return arr && arr.length ? arr[arr.length - 1].valor : null
}

async function loadReadings(sensorId) {
  readings[sensorId] = await getLecturas(orchardId, sensorId)
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    sensores.value = await getSensores(orchardId)
    await Promise.all(sensores.value.map((s) => loadReadings(s.id)))
  } catch (e) {
    error.value = 'No se pudieron cargar los sensores.'
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
    await createSensor(orchardId, {
      nombre: nombre.value.trim(),
      tipo: tipo.value,
      unidad: SENSOR_TYPES[tipo.value].unidad,
    })
    nombre.value = ''
    await load()
  } catch (e) {
    error.value = 'No se pudo crear el sensor.'
    console.error(e)
  } finally {
    saving.value = false
  }
}

async function remove(id) {
  if (!confirm('¿Eliminar este sensor?')) return
  try {
    await deleteSensor(orchardId, id)
    sensores.value = sensores.value.filter((s) => s.id !== id)
    delete readings[id]
  } catch (e) {
    error.value = 'No se pudo eliminar el sensor.'
    console.error(e)
  }
}

async function simular(s) {
  busy[s.id] = true
  try {
    await addLectura(orchardId, s.id, simularValor(s.tipo))
    await loadReadings(s.id)
  } catch (e) {
    error.value = 'No se pudo registrar la lectura.'
    console.error(e)
  } finally {
    busy[s.id] = false
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
h1 {
  margin: 0 0 20px;
}
.add-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.add-bar input,
.add-bar select {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
}
.add-bar input {
  flex: 1;
  min-width: 160px;
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
.sensor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}
.sensor-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}
.sensor-card header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}
.icon-box {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  flex-shrink: 0;
}
.meta {
  flex: 1;
  min-width: 0;
}
.label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-text-soft);
}
.sensor-card h3 {
  margin: 2px 0 0;
}
.value {
  font-size: 2.1rem;
  font-weight: 800;
  margin: 12px 0;
}
.value small {
  font-size: 1rem;
  color: var(--color-text-soft);
  margin-left: 4px;
  font-weight: 600;
}
.sim {
  margin-top: 12px;
  width: 100%;
  padding: 9px;
  background: #e0f2fe;
  color: #0369a1;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.sim:disabled {
  opacity: 0.6;
  cursor: default;
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
.small {
  font-size: 0.85rem;
}
.error {
  color: #dc2626;
}
</style>
