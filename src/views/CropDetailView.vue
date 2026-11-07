<template>
  <div>
    <router-link :to="`/orchard/${orchardId}`" class="back">← Volver al huerto</router-link>

    <p v-if="loading" class="muted">Cargando…</p>
    <p v-else-if="!cultivo" class="error">No se encontró el cultivo.</p>

    <template v-else>
      <!-- Ficha -->
      <section class="card ficha">
        <StoredImage class="thumb" :orchard-id="orchardId" :foto-id="cultivo.fotoId" :url="cultivo.foto" :alt="cultivo.nombre">
          <Leaf :size="46" />
        </StoredImage>
        <div class="ficha-body">
          <div class="ficha-head">
            <h1>{{ cultivo.nombre }}</h1>
            <button v-if="permisos.manageCrops" class="edit-btn" @click="editing = !editing">{{ editing ? 'Cancelar' : 'Editar' }}</button>
          </div>
          <div class="pills">
            <span v-if="cultivo.especie" class="pill type">{{ cultivo.especie }}</span>
            <span v-if="cultivo.familia" class="pill">{{ cultivo.familia }}</span>
            <span v-if="cultivo.fechaSiembra" class="pill">Siembra: {{ cultivo.fechaSiembra }}</span>
          </div>
          <p v-if="cultivo.descripcion" class="desc">{{ cultivo.descripcion }}</p>

          <dl class="datos">
            <div v-if="cultivo.epocaSiembra"><dt>Época de siembra</dt><dd>{{ cultivo.epocaSiembra }}</dd></div>
            <div v-if="cultivo.riego"><dt>Riego</dt><dd>{{ cultivo.riego }}</dd></div>
            <div v-if="cultivo.tempIdeal"><dt>Temperatura ideal</dt><dd>{{ cultivo.tempIdeal }}</dd></div>
            <div v-if="cultivo.plagas"><dt>Plagas comunes</dt><dd>{{ cultivo.plagas }}</dd></div>
            <div v-if="cultivo.tiempoCosecha"><dt>Tiempo hasta cosecha</dt><dd>{{ cultivo.tiempoCosecha }}</dd></div>
          </dl>
        </div>
      </section>

      <!-- Edición -->
      <section v-if="editing && permisos.manageCrops" class="card">
        <h2 class="section-title">Editar cultivo</h2>
        <form class="form" @submit.prevent="guardar">
          <label>Nombre</label>
          <input v-model="fNombre" />
          <label>Especie</label>
          <input v-model="fEspecie" />
          <label>Fecha de siembra</label>
          <input v-model="fFecha" type="date" />
          <label>Foto</label>
          <ImageUpload
            v-model="fFoto"
            v-model:removed="fFotoQuitada"
            :orchard-id="orchardId"
            :foto-id="cultivo.fotoId"
            :url="cultivo.foto"
          />
          <label>Descripción</label>
          <textarea v-model="fDesc" rows="3"></textarea>
          <p v-if="savedMsg" class="success">{{ savedMsg }}</p>
          <button type="submit" class="primary" :disabled="saving">
            {{ saving ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </form>
      </section>

      <!-- Sensores vinculados -->
      <section class="card">
        <h2 class="section-title">Sensores del cultivo</h2>

        <div v-if="permisos.manageSensors" class="link-row">
          <select v-model="sensorAVincular">
            <option :value="null">— Vincular un sensor —</option>
            <option v-for="s in sensoresDisponibles" :key="s.id" :value="s.id">
              {{ s.nombre }} ({{ SENSOR_TYPES[s.tipo]?.label }})
            </option>
          </select>
          <button class="primary" :disabled="!sensorAVincular" @click="vincular">Vincular</button>
        </div>

        <p v-if="!sensoresCultivo.length" class="muted small">
          Este cultivo aún no tiene sensores vinculados.
        </p>

        <div class="metric-grid">
          <div v-for="s in sensoresCultivo" :key="s.id" class="metric">
            <header>
              <span class="icon-box" :style="{ background: SENSOR_TYPES[s.tipo]?.tint, color: SENSOR_TYPES[s.tipo]?.color }">
                <component :is="SENSOR_TYPES[s.tipo]?.icon" :size="20" />
              </span>
              <div class="meta">
                <span class="label">{{ SENSOR_TYPES[s.tipo]?.label }}</span>
                <strong>{{ s.nombre }}</strong>
              </div>
              <button v-if="permisos.manageSensors" class="unlink" title="Desvincular" @click="desvincular(s)">✕</button>
            </header>
            <div class="value" :style="{ color: SENSOR_TYPES[s.tipo]?.color }">
              <template v-if="s.lecturas?.length">{{ s.lecturas.at(-1).valor }}<small>{{ s.unidad }}</small></template>
              <small v-else class="muted">Sin lecturas</small>
            </div>
            <SensorChart v-if="s.lecturas?.length" :lecturas="s.lecturas"
                         :label="s.nombre" :color="SENSOR_TYPES[s.tipo]?.color" />
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Leaf } from 'lucide-vue-next'
import SensorChart from '../components/SensorChart.vue'
import ImageUpload from '../components/ImageUpload.vue'
import StoredImage from '../components/StoredImage.vue'
import { SENSOR_TYPES } from '../utils/sensorTypes'
import { useAuth } from '../composables/useAuth'
import { permisosEn, mensajeError } from '../utils/permissions'
import {
  getHuerto,
  getCultivo,
  updateCultivo,
  getSensores,
  updateSensor,
  getLecturas,
  resolverFoto,
  limpiarFoto,
} from '../services/firestoreService'

const route = useRoute()
const orchardId = route.params.id
const cropId = route.params.cropId
const { user } = useAuth()

const huerto = ref(null)
const permisos = computed(() => permisosEn(huerto.value, user.value?.uid))
const cultivo = ref(null)
const sensores = ref([])
const loading = ref(true)
const editing = ref(false)
const saving = ref(false)
const savedMsg = ref('')
const sensorAVincular = ref(null)

const fNombre = ref('')
const fEspecie = ref('')
const fFecha = ref('')
const fFoto = ref('')
const fFotoQuitada = ref(false)
const fDesc = ref('')

const sensoresCultivo = computed(() => sensores.value.filter((s) => s.cropId === cropId))
const sensoresDisponibles = computed(() => sensores.value.filter((s) => !s.cropId))

async function cargarSensores() {
  const lista = await getSensores(orchardId)
  sensores.value = await Promise.all(
    lista.map(async (s) => ({ ...s, lecturas: await getLecturas(orchardId, s.id) })),
  )
}

async function load() {
  loading.value = true
  try {
    ;[huerto.value, cultivo.value] = await Promise.all([
      getHuerto(orchardId),
      getCultivo(orchardId, cropId),
    ])
    if (cultivo.value) {
      fNombre.value = cultivo.value.nombre || ''
      fEspecie.value = cultivo.value.especie || ''
      fFecha.value = cultivo.value.fechaSiembra || ''
      fDesc.value = cultivo.value.descripcion || ''
    }
    await cargarSensores()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function guardar() {
  saving.value = true
  savedMsg.value = ''
  try {
    const anterior = cultivo.value.fotoId || ''
    const fotoId = await resolverFoto(orchardId, anterior, fFoto.value, fFotoQuitada.value)
    const data = {
      nombre: fNombre.value.trim(),
      especie: fEspecie.value.trim(),
      fechaSiembra: fFecha.value,
      fotoId,
      // Una foto nueva o quitada sustituye también a la URL antigua, si la había.
      foto: fFoto.value || fFotoQuitada.value ? '' : cultivo.value.foto || '',
      descripcion: fDesc.value.trim(),
    }
    await updateCultivo(orchardId, cropId, data)
    cultivo.value = { ...cultivo.value, ...data }
    fFoto.value = ''
    fFotoQuitada.value = false
    await limpiarFoto(orchardId, anterior, fotoId)
    savedMsg.value = 'Cambios guardados.'
  } catch (e) {
    savedMsg.value = mensajeError(e, 'No se pudo guardar.')
    console.error(e)
  } finally {
    saving.value = false
  }
}

async function vincular() {
  if (!sensorAVincular.value) return
  try {
    await updateSensor(orchardId, sensorAVincular.value, { cropId })
    sensorAVincular.value = null
    await cargarSensores()
  } catch (e) {
    console.error(e)
  }
}

async function desvincular(s) {
  try {
    await updateSensor(orchardId, s.id, { cropId: null })
    await cargarSensores()
  } catch (e) {
    console.error(e)
  }
}

onMounted(load)
</script>

<style scoped>
.back {
  display: inline-block;
  margin-bottom: 14px;
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
}
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 24px;
  margin-bottom: 22px;
}
.ficha {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}
.thumb {
  width: 150px;
  height: 150px;
  border-radius: var(--radius-md);
  background: #e8f3ea;
  flex-shrink: 0;
}
.ficha-body {
  flex: 1;
  min-width: 240px;
}
.ficha-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}
.ficha-head h1 {
  margin: 0;
  color: var(--color-heading);
}
.edit-btn {
  background: var(--color-primary-soft);
  color: var(--color-primary-dark);
  border: 1px solid var(--color-primary-border);
  padding: 7px 14px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 10px 0;
}
.pill {
  background: #eef2f7;
  color: #475569;
  font-size: 0.78rem;
  padding: 3px 10px;
  border-radius: 999px;
}
.pill.type {
  background: #ede9fe;
  color: #6d28d9;
}
.desc {
  color: var(--color-text-soft);
  margin: 8px 0 14px;
}
.datos > div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 0;
  border-bottom: 1px solid var(--color-border-soft);
}
.datos dt {
  color: var(--color-text-soft);
  font-size: 0.88rem;
}
.datos dd {
  margin: 0;
  font-weight: 600;
  text-align: right;
}
.section-title {
  margin: 0 0 16px;
  font-size: 1.15rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}
.form {
  display: flex;
  flex-direction: column;
  max-width: 560px;
}
.form label {
  font-weight: 700;
  font-size: 0.88rem;
  margin: 12px 0 5px;
}
.form input,
.form textarea {
  padding: 10px 12px;
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.95rem;
}
.link-row {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.link-row select {
  flex: 1;
  min-width: 180px;
  padding: 10px 12px;
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-sm);
}
.primary {
  background: var(--color-primary);
  color: #fff;
  border: none;
  padding: 10px 18px;
  border-radius: var(--radius-sm);
  font-weight: 700;
  cursor: pointer;
}
.primary:disabled {
  opacity: 0.55;
  cursor: default;
}
.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 18px;
}
.metric {
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  padding: 18px;
}
.metric header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.icon-box {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  flex-shrink: 0;
}
.meta {
  flex: 1;
  min-width: 0;
}
.label {
  display: block;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-text-soft);
}
.value {
  font-size: 2rem;
  font-weight: 800;
  margin: 10px 0;
}
.value small {
  font-size: 1rem;
  color: var(--color-text-soft);
  margin-left: 4px;
}
.unlink {
  background: transparent;
  border: none;
  color: #cbd5e1;
  cursor: pointer;
}
.unlink:hover {
  color: var(--color-danger);
}
.muted {
  color: var(--color-text-soft);
}
.small {
  font-size: 0.88rem;
}
.success {
  color: var(--color-success);
}
.error {
  color: var(--color-danger);
}
</style>
