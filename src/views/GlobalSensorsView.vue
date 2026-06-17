<template>
  <div>
    <header class="page-head">
      <h1>Sensores</h1>
      <p class="sub">Lecturas de todos los sensores de tus huertos.</p>
    </header>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="loading" class="muted">Cargando…</p>

    <template v-else-if="!huertos.length">
      <div class="empty">
        <p>Aún no tienes huertos.</p>
        <router-link to="/dashboard" class="link">Crea tu primer huerto →</router-link>
      </div>
    </template>

    <template v-else-if="!sensores.length">
      <div class="empty">
        <p>No hay sensores todavía. Entra en un huerto para añadirlos.</p>
        <router-link to="/dashboard" class="link">Ir a Mis Huertos →</router-link>
      </div>
    </template>

    <div v-else class="sensor-grid">
      <div v-for="s in sensores" :key="s.orchardId + s.id" class="sensor-card">
        <header>
          <div>
            <h3>{{ s.nombre }}</h3>
            <router-link :to="`/orchard/${s.orchardId}`" class="orchard-link">
              🌱 {{ s.orchardNombre }}
            </router-link>
          </div>
          <span class="tipo">{{ SENSOR_TYPES[s.tipo]?.label }}</span>
        </header>

        <div class="value">
          <template v-if="lastValue(s)">
            {{ lastValue(s) }}<small>{{ s.unidad }}</small>
          </template>
          <small v-else class="muted">Sin lecturas</small>
        </div>

        <SensorChart
          v-if="s.lecturas && s.lecturas.length"
          :lecturas="s.lecturas"
          :label="`${s.nombre} (${s.unidad})`"
          :color="SENSOR_TYPES[s.tipo]?.color"
        />
        <p v-else class="muted small">Aún no hay histórico.</p>

        <button class="sim" :disabled="busy[s.orchardId + s.id]" @click="simular(s)">
          {{ busy[s.orchardId + s.id] ? 'Registrando…' : '+ Simular lectura' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import SensorChart from '../components/SensorChart.vue'
import { SENSOR_TYPES, simularValor } from '../utils/sensorTypes'
import {
  getHuertos,
  getAllSensores,
  addLectura,
  getLecturas,
} from '../services/firestoreService'

const { user } = useAuth()
const huertos = ref([])
const sensores = ref([])
const busy = reactive({})
const loading = ref(true)
const error = ref('')

function lastValue(s) {
  return s.lecturas && s.lecturas.length ? s.lecturas[s.lecturas.length - 1].valor : null
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    huertos.value = await getHuertos(user.value.uid)
    sensores.value = await getAllSensores(user.value.uid)
  } catch (e) {
    error.value = 'No se pudieron cargar los sensores.'
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function simular(s) {
  const key = s.orchardId + s.id
  busy[key] = true
  try {
    await addLectura(s.orchardId, s.id, simularValor(s.tipo))
    s.lecturas = await getLecturas(s.orchardId, s.id)
  } catch (e) {
    error.value = 'No se pudo registrar la lectura.'
    console.error(e)
  } finally {
    busy[key] = false
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
.sensor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}
.sensor-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-card);
}
.sensor-card header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}
.sensor-card h3 {
  margin: 0 0 2px;
}
.orchard-link {
  font-size: 0.8rem;
  text-decoration: none;
  color: var(--color-accent-green);
}
.tipo {
  font-size: 0.78rem;
  color: var(--color-text-soft);
  white-space: nowrap;
}
.value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 10px 0 12px;
}
.value small {
  font-size: 1rem;
  color: var(--color-text-soft);
  margin-left: 4px;
}
.sim {
  margin-top: 12px;
  width: 100%;
  padding: 9px;
  background: var(--color-primary-soft);
  color: #2f6fb0;
  border: 1px solid var(--color-primary-border);
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
}
.sim:disabled {
  opacity: 0.6;
  cursor: default;
}
.muted {
  color: var(--color-text-soft);
}
.small {
  font-size: 0.85rem;
}
.error {
  color: var(--color-danger);
}
.empty {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  padding: 30px;
  max-width: 460px;
}
.empty .link {
  font-weight: 600;
  text-decoration: none;
}
</style>
