<template>
  <div>
    <router-link :to="`/orchard/${orchardId}`" class="back">← Volver al huerto</router-link>
    <h1>Sensores</h1>

    <form v-if="permisos.manageSensors" class="add-bar" @submit.prevent="add">
      <input v-model="nombre" placeholder="Nombre del sensor" />
      <select v-model="tipo" aria-label="Tipo de sensor">
        <option v-for="(t, key) in SENSOR_TYPES" :key="key" :value="key">
          {{ t.label }} ({{ t.unidad }})
        </option>
      </select>
      <select v-model="cropId" aria-label="Planta del sensor">
        <option value="">Sin planta</option>
        <option v-for="c in cultivos" :key="c.id" :value="c.id">{{ c.nombre }}</option>
      </select>
      <input v-model="deviceId" placeholder="Id. del nodo (ej: growhub-nodo-01)" aria-label="Identificador del nodo físico" />
      <button type="submit" :disabled="saving || !nombre.trim()">Añadir sensor</button>
    </form>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="loading" class="muted">Cargando…</p>
    <p v-else-if="!sensores.length" class="muted">No hay sensores en este huerto.</p>

    <section v-for="g in grupos" v-else :key="g.id" class="group">
      <h2 class="group-title">
        <router-link v-if="g.id" :to="`/orchard/${orchardId}/crop/${g.id}`">{{ g.titulo }}</router-link>
        <template v-else>{{ g.titulo }}</template>
        <span class="group-count">{{ g.sensores.length }} {{ g.sensores.length === 1 ? 'sensor' : 'sensores' }}</span>
      </h2>
      <div class="sensor-grid">
      <div v-for="s in g.sensores" :key="s.id" class="sensor-card">
        <header>
          <span class="icon-box" :style="{ background: SENSOR_TYPES[s.tipo]?.tint, color: SENSOR_TYPES[s.tipo]?.color }">
            <component :is="SENSOR_TYPES[s.tipo]?.icon" :size="22" />
          </span>
          <div class="meta">
            <span class="label">{{ SENSOR_TYPES[s.tipo]?.label }}</span>
            <h3>{{ s.nombre }}</h3>
            <span v-if="s.deviceId" class="device">Nodo: {{ s.deviceId }}</span>
          </div>
          <button v-if="permisos.manageSensors" class="edit" @click="empezarEdicion(s)">Editar</button>
          <button v-if="permisos.manageSensors" class="del" title="Eliminar" @click="remove(s.id)">✕</button>
        </header>

        <form v-if="edicion?.id === s.id" class="edit-form" @submit.prevent="guardarEdicion(s)">
          <label>Nombre</label>
          <input v-model="edicion.nombre" />
          <label>Planta</label>
          <select v-model="edicion.cropId">
            <option value="">Sin planta</option>
            <option v-for="c in cultivos" :key="c.id" :value="c.id">{{ c.nombre }}</option>
          </select>
          <label>Identificador del nodo</label>
          <input v-model="edicion.deviceId" placeholder="growhub-nodo-01" />
          <div class="edit-actions">
            <button type="button" class="ghost" @click="edicion = null">Cancelar</button>
            <button type="submit" class="save" :disabled="!edicion.nombre.trim()">Guardar</button>
          </div>
        </form>

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

        <button v-if="permisos.manageSensors" class="sim" :disabled="busy[s.id]" @click="simular(s)">
          {{ busy[s.id] ? 'Registrando…' : '+ Simular lectura' }}
        </button>
      </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { permisosEn, mensajeError } from '../utils/permissions'
import SensorChart from '../components/SensorChart.vue'
import { SENSOR_TYPES, simularValor } from '../utils/sensorTypes'
import {
  getHuerto,
  getSensores,
  createSensor,
  updateSensor,
  deleteSensor,
  getCultivos,
  getLecturas,
  addLectura,
} from '../services/firestoreService'

const route = useRoute()
const orchardId = route.params.id
const { user } = useAuth()

const huerto = ref(null)
const permisos = computed(() => permisosEn(huerto.value, user.value?.uid))
const sensores = ref([])
const readings = reactive({}) // sensorId -> [lecturas]
const busy = reactive({}) // sensorId -> bool
const cultivos = ref([])
const nombre = ref('')
const tipo = ref('temperatura')
const cropId = ref('')
const deviceId = ref('')
const edicion = ref(null)
const loading = ref(true)
const saving = ref(false)
const error = ref('')

// Un grupo por planta y, al final, los sensores sin planta (o de un cultivo ya
// borrado). id vacío = sin planta.
const grupos = computed(() => {
  const conPlanta = cultivos.value
    .map((c) => ({
      id: c.id,
      titulo: c.nombre,
      sensores: sensores.value.filter((s) => s.cropId === c.id),
    }))
    .filter((g) => g.sensores.length)
  const sinPlanta = sensores.value.filter(
    (s) => !cultivos.value.some((c) => c.id === s.cropId),
  )
  return sinPlanta.length
    ? [...conPlanta, { id: '', titulo: 'Sin planta', sensores: sinPlanta }]
    : conPlanta
})

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
    ;[huerto.value, sensores.value, cultivos.value] = await Promise.all([
      getHuerto(orchardId),
      getSensores(orchardId),
      getCultivos(orchardId),
    ])
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
      cropId: cropId.value || null,
      deviceId: deviceId.value.trim(),
    })
    nombre.value = ''
    deviceId.value = ''
    await load()
  } catch (e) {
    error.value = mensajeError(e, 'No se pudo crear el sensor.')
    console.error(e)
  } finally {
    saving.value = false
  }
}

function empezarEdicion(s) {
  edicion.value = {
    id: s.id,
    nombre: s.nombre,
    cropId: cultivos.value.some((c) => c.id === s.cropId) ? s.cropId : '',
    deviceId: s.deviceId || '',
  }
}

async function guardarEdicion(s) {
  const cambios = {
    nombre: edicion.value.nombre.trim(),
    cropId: edicion.value.cropId || null,
    deviceId: edicion.value.deviceId.trim(),
  }
  error.value = ''
  try {
    await updateSensor(orchardId, s.id, cambios)
    Object.assign(s, cambios)
    edicion.value = null
  } catch (e) {
    error.value = mensajeError(e, 'No se pudo guardar el sensor.')
    console.error(e)
  }
}

async function remove(id) {
  if (!confirm('¿Eliminar este sensor?')) return
  try {
    await deleteSensor(orchardId, id)
    sensores.value = sensores.value.filter((s) => s.id !== id)
    delete readings[id]
  } catch (e) {
    error.value = mensajeError(e, 'No se pudo eliminar el sensor.')
    console.error(e)
  }
}

async function simular(s) {
  busy[s.id] = true
  try {
    await addLectura(orchardId, s.id, simularValor(s.tipo))
    await loadReadings(s.id)
  } catch (e) {
    error.value = mensajeError(e, 'No se pudo registrar la lectura.')
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
.group {
  margin-bottom: 30px;
}
.group-title {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin: 0 0 14px;
  font-size: 1.2rem;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border-soft);
}
.group-title a {
  color: inherit;
  text-decoration: none;
}
.group-title a:hover {
  color: var(--color-primary);
}
.group-count {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text-soft);
}
.device {
  display: block;
  margin-top: 2px;
  font-size: 0.78rem;
  color: var(--color-text-soft);
}
.edit {
  background: transparent;
  border: none;
  color: var(--color-primary-dark);
  font-weight: 600;
  font-size: 0.82rem;
  cursor: pointer;
}
.edit-form {
  display: flex;
  flex-direction: column;
  margin-top: 12px;
  padding: 12px;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-sm);
}
.edit-form label {
  font-size: 0.82rem;
  font-weight: 600;
  margin: 8px 0 4px;
}
.edit-form label:first-child {
  margin-top: 0;
}
.edit-form input,
.edit-form select {
  padding: 8px 10px;
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-sm);
}
.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}
.ghost {
  background: transparent;
  border: none;
  color: var(--color-text-soft);
  font-weight: 600;
  cursor: pointer;
}
.save {
  background: var(--color-primary);
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
}
.save:disabled {
  opacity: 0.55;
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
