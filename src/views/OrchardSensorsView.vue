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
          <div>
            <h3>{{ s.nombre }}</h3>
            <span class="tipo">{{ SENSOR_TYPES[s.tipo]?.label }} ({{ s.unidad }})</span>
          </div>
          <button class="del" title="Eliminar" @click="remove(s.id)">✕</button>
        </header>

        <div class="value">
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
  color: #4a90d9;
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
  justify-content: space-between;
  align-items: flex-start;
}
.sensor-card h3 {
  margin: 0;
}
.tipo {
  font-size: 0.8rem;
  color: #6b7280;
}
.value {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 8px 0 12px;
}
.value small {
  font-size: 1rem;
  color: #6b7280;
  margin-left: 4px;
}
.sim {
  margin-top: 12px;
  width: 100%;
  padding: 9px;
  background: #eef4fb;
  color: #2f6fb0;
  border: 1px solid #cfe0f2;
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
