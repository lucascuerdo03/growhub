<template>
  <div>
    <header class="page-head">
      <h1>Sensores</h1>
      <p class="sub">Lecturas de todos los sensores de tus huertos.</p>
    </header>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="!listos" class="muted">Cargando…</p>

    <template v-else-if="!huertos.length">
      <div class="empty">
        <p>Aún no tienes huertos.</p>
        <router-link to="/dashboard" class="link">Crea tu primer huerto →</router-link>
      </div>
    </template>

    <template v-else-if="!sensores.length">
      <div class="empty">
        <Ilustracion tipo="sensores" />
        <p>No hay sensores todavía. Entra en un huerto para añadirlos.</p>
        <router-link to="/dashboard" class="link">Ir a Mis Huertos →</router-link>
      </div>
    </template>

    <div v-else class="sensor-grid">
      <div v-for="s in sensores" :key="s.orchardId + s.id" class="sensor-card">
        <header>
          <span class="icon-box" :style="{ background: SENSOR_TYPES[s.tipo]?.tint, color: SENSOR_TYPES[s.tipo]?.color }">
            <component :is="SENSOR_TYPES[s.tipo]?.icon" :size="22" />
          </span>
          <div class="meta">
            <span class="label">{{ SENSOR_TYPES[s.tipo]?.label }}</span>
            <h3>{{ s.nombre }}</h3>
            <router-link :to="`/orchard/${s.orchardId}`" class="orchard-link">
              {{ s.orchardNombre }}
            </router-link>
            <router-link v-if="plantaDe(s)" :to="`/orchard/${s.orchardId}/crop/${s.cropId}`" class="plant">
              · {{ plantaDe(s) }}
            </router-link>
            <span v-if="s.deviceId" class="device">Nodo: {{ s.deviceId }}</span>
          </div>
        </header>

        <div class="value" :style="{ color: SENSOR_TYPES[s.tipo]?.color }">
          <template v-if="lastValue(s)">
            {{ lastValue(s) }}<small>{{ s.unidad }}</small>
          </template>
          <small v-else class="muted">Sin lecturas</small>
        </div>

        <SensorChart
          v-if="s.lecturas.length"
          :lecturas="s.lecturas"
          :label="`${s.nombre} (${s.unidad})`"
          :color="SENSOR_TYPES[s.tipo]?.color"
        />
        <p v-else class="muted small">Aún no hay histórico.</p>

        <button v-if="puedeSimular(s)" class="sim" :disabled="busy[s.orchardId + s.id]" @click="simular(s)">
          {{ busy[s.orchardId + s.id] ? 'Registrando…' : '+ Simular lectura' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useHuertos, usePorHuerto } from '../composables/useHuertos'
import { useVivoMuchos } from '../composables/useVivo'
import { permisosEn, mensajeError } from '../utils/permissions'
import SensorChart from '../components/SensorChart.vue'
import Ilustracion from '../components/Ilustracion.vue'
import { SENSOR_TYPES, simularValor } from '../utils/sensorTypes'
import {
  fuenteSensores,
  fuenteLecturas,
  fuenteCultivos,
  addLectura,
} from '../services/firestoreService'

const { user } = useAuth()
const { huertos, listos } = useHuertos()
const { porHuerto: sensoresPorHuerto } = usePorHuerto(fuenteSensores)
const { porHuerto: cultivos } = usePorHuerto(fuenteCultivos)

const base = computed(() =>
  huertos.value.flatMap((h) =>
    (sensoresPorHuerto.value[h.id] || []).map((s) => ({ ...s, orchardId: h.id, orchardNombre: h.nombre })),
  ),
)
const { porClave } = useVivoMuchos(() => base.value.map((s) => fuenteLecturas(s.orchardId, s.id)))
const sensores = computed(() =>
  base.value.map((s) => ({
    ...s,
    lecturas: porClave.value[fuenteLecturas(s.orchardId, s.id).clave] || [],
  })),
)

const busy = reactive({})
const error = ref('')

const plantaDe = (s) => cultivos.value[s.orchardId]?.find((c) => c.id === s.cropId)?.nombre

const puedeSimular = (s) =>
  permisosEn(huertos.value.find((h) => h.id === s.orchardId), user.value.uid).manageSensors

function lastValue(s) {
  return s.lecturas.length ? s.lecturas[s.lecturas.length - 1].valor : null
}

async function simular(s) {
  const key = s.orchardId + s.id
  busy[key] = true
  try {
    await addLectura(s.orchardId, s.id, simularValor(s.tipo))
  } catch (e) {
    error.value = mensajeError(e, 'No se pudo registrar la lectura.')
    console.error(e)
  } finally {
    busy[key] = false
  }
}
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
  margin: 2px 0;
}
.orchard-link {
  font-size: 0.8rem;
  text-decoration: none;
  color: var(--color-accent-green);
}
.plant {
  font-size: 0.8rem;
  text-decoration: none;
  color: var(--color-text-soft);
}
.device {
  display: block;
  font-size: 0.78rem;
  color: var(--color-text-soft);
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
  background: var(--color-primary-soft);
  color: var(--color-primary-dark);
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
