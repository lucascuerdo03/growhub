<template>
  <div>
    <router-link :to="`/orchard/${orchardId}`" class="back">← Volver al huerto</router-link>

    <p v-if="!listo || (huerto && cargandoCultivos)" class="muted">Cargando…</p>
    <p v-else-if="!huerto" class="error">No tienes acceso a este huerto o ya no existe.</p>
    <p v-else-if="!cultivo" class="error">Este cultivo ya no existe.</p>

    <template v-else>
      <AvisosSensores
        :avisos="avisos"
        :puede-crear-tareas="() => permisos.manageTasks"
        :tareas-de="() => todasTareas"
      />

      <!-- Ficha -->
      <section class="card ficha">
        <StoredImage class="thumb" :orchard-id="orchardId" :foto-id="cultivo.fotoId" :url="cultivo.foto" :alt="cultivo.nombre">
          <Leaf :size="46" />
        </StoredImage>
        <div class="ficha-body">
          <div class="ficha-head">
            <div>
              <h1>{{ cultivo.nombre }}</h1>
              <p class="etapa" :class="estado.etapa">{{ ETAPAS[estado.etapa] }}</p>
            </div>
            <button v-if="permisos.manageCrops" class="edit-btn" @click="editing = !editing">{{ editing ? 'Cancelar' : 'Editar' }}</button>
          </div>
          <div class="pills">
            <span v-if="cultivo.especie" class="pill type">{{ cultivo.especie }}</span>
            <span v-if="cultivo.familia" class="pill">{{ cultivo.familia }}</span>
            <span v-if="cultivo.fechaSiembra" class="pill">Sembrado el {{ fechaCorta(cultivo.fechaSiembra) }}</span>
          </div>
          <p v-if="cultivo.descripcion" class="desc">{{ cultivo.descripcion }}</p>

          <div v-if="estado.pct !== null" class="progreso">
            <div class="barra" role="progressbar" :aria-valuenow="estado.pct" aria-valuemin="0" aria-valuemax="100" aria-label="Progreso hasta la cosecha">
              <i :class="estado.etapa" :style="{ width: `${estado.pct}%` }"></i>
            </div>
            <span>{{ estado.texto }}</span>
          </div>
          <p v-else-if="estado.etapa === 'sin-fecha' && permisos.manageCrops" class="pista">
            Indica la fecha de siembra para ver cuánto le falta a la cosecha.
          </p>
          <dl v-if="entrada" class="datos">
            <div><dt>Riego</dt><dd>{{ entrada.riego }}</dd></div>
            <div><dt>Exposición</dt><dd>{{ entrada.sol }}</dd></div>
            <div><dt>Temperatura ideal</dt><dd>{{ entrada.tempIdeal }}</dd></div>
            <div><dt>Marco de plantación</dt><dd>{{ entrada.marco }}</dd></div>
            <div><dt>Hasta la cosecha</dt><dd>{{ textoCosecha(entrada) }}</dd></div>
            <div><dt>Dificultad</dt><dd>{{ entrada.dificultad }}</dd></div>
          </dl>
          <!-- Cultivos añadidos antes de enlazarse con la biblioteca. -->
          <dl v-else class="datos">
            <div v-if="cultivo.epocaSiembra"><dt>Época de siembra</dt><dd>{{ cultivo.epocaSiembra }}</dd></div>
            <div v-if="cultivo.riego"><dt>Riego</dt><dd>{{ cultivo.riego }}</dd></div>
            <div v-if="cultivo.tempIdeal"><dt>Temperatura ideal</dt><dd>{{ cultivo.tempIdeal }}</dd></div>
            <div v-if="cultivo.plagas"><dt>Plagas comunes</dt><dd>{{ cultivo.plagas }}</dd></div>
            <div v-if="cultivo.tiempoCosecha"><dt>Tiempo hasta cosecha</dt><dd>{{ cultivo.tiempoCosecha }}</dd></div>
          </dl>
          <router-link v-if="entrada" :to="`/biblioteca/${entrada.id}`" class="ver-biblioteca">
            Ver la ficha completa en la biblioteca
          </router-link>
        </div>
      </section>

      <section v-if="entrada" class="card">
        <h2 class="section-title">Calendario</h2>
        <CalendarioCultivo :entrada="entrada" />
      </section>

      <section v-if="entrada" class="card">
        <h2 class="section-title">Plagas y enfermedades</h2>
        <ul class="plagas">
          <li v-for="p in entrada.plagas" :key="p.nombre">
            <strong>{{ p.nombre }}</strong>
            <span>{{ p.tratamiento }}</span>
          </li>
        </ul>
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
          <template v-if="!entrada">
            <label>Días hasta la cosecha</label>
            <input v-model.number="fDias" type="number" min="1" placeholder="Opcional" />
          </template>
          <label>Descripción</label>
          <textarea v-model="fDesc" rows="3"></textarea>
          <p v-if="savedMsg" class="success">{{ savedMsg }}</p>
          <button type="submit" class="primary" :disabled="saving">
            {{ saving ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </form>
      </section>

      <!-- Tareas de la planta -->
      <section class="card">
        <h2 class="section-title">Tareas del cultivo</h2>

        <form v-if="permisos.manageTasks" class="link-row" @submit.prevent="addTask">
          <input v-model="taskTitulo" class="task-input" placeholder="Nueva tarea para esta planta" />
          <input v-model="taskFecha" class="task-date" type="date" aria-label="Fecha de la tarea" />
          <select v-model="taskFrec" aria-label="Se repite">
            <option v-for="f in FRECUENCIAS" :key="f.valor" :value="f.valor">{{ f.texto }}</option>
          </select>
          <button type="submit" class="primary" :disabled="!taskTitulo.trim()">Añadir tarea</button>
        </form>

        <p v-if="taskError" class="error">{{ taskError }}</p>
        <p v-if="avisoTarea" class="aviso-tarea" role="status">{{ avisoTarea }}</p>
        <div v-if="!tareas.length" class="vacio">
          <Ilustracion tipo="tareas" />
          <p>Este cultivo aún no tiene tareas.</p>
        </div>
        <ListaTareas
          v-else
          :tareas="tareas"
          :permisos-de="() => permisos"
          @toggle="alternar"
          @remove="borrar"
          @frecuencia="cambiarFrecuencia"
        />
      </section>

      <!-- Sensores vinculados -->
      <section class="card">
        <h2 class="section-title">Sensores del cultivo</h2>
        <RangosCultivo :orchard-id="orchardId" :cultivo="cultivo" :puede-editar="permisos.manageCrops" />

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
          <router-link v-if="permisos.manageSensors" :to="`/orchard/${orchardId}/sensors`">Crear un sensor</router-link>
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
                <span v-if="s.deviceId" class="device">Nodo: {{ s.deviceId }}</span>
              </div>
              <button v-if="permisos.manageSensors" class="unlink" title="Desvincular" @click="desvincular(s)">✕</button>
            </header>
            <div class="value" :style="{ color: SENSOR_TYPES[s.tipo]?.color }">
              <template v-if="s.lecturas?.length">{{ valorLectura(s, s.lecturas.at(-1)) }}<small>{{ s.unidad }}</small></template>
              <small v-else class="muted">Sin lecturas</small>
            </div>
            <EstadoLectura v-if="s.lecturas?.length" :lectura="s.lecturas.at(-1)" class="estado-lectura-metric" />
            <SensorChart v-if="s.lecturas?.length" :lecturas="conValores(s, s.lecturas)"
                         :label="s.nombre" :color="SENSOR_TYPES[s.tipo]?.color" />
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Leaf } from 'lucide-vue-next'
import SensorChart from '../components/SensorChart.vue'
import ImageUpload from '../components/ImageUpload.vue'
import StoredImage from '../components/StoredImage.vue'
import CalendarioCultivo from '../components/CalendarioCultivo.vue'
import ListaTareas from '../components/ListaTareas.vue'
import { FRECUENCIAS } from '../utils/tareas'
import { useAccionesTarea } from '../composables/useAccionesTarea'
import Ilustracion from '../components/Ilustracion.vue'
import { entradaDeCultivo, textoCosecha } from '../data/cropsLibrary'
import { ETAPAS, estadoCultivo } from '../utils/cultivos'
import { fechaCorta, hoyISO } from '../utils/fechas'
import { SENSOR_TYPES } from '../utils/sensorTypes'
import { conValores, valorLectura } from '../utils/lecturas'
import EstadoLectura from '../components/EstadoLectura.vue'
import AvisosSensores from '../components/AvisosSensores.vue'
import RangosCultivo from '../components/RangosCultivo.vue'
import { avisosDe } from '../utils/avisos'
import { useAhora } from '../composables/useAhora'
import { useHuerto } from '../composables/useHuertos'
import { useVivo, useVivoMuchos } from '../composables/useVivo'
import { mensajeError } from '../utils/permissions'
import {
  fuenteCultivos,
  fuenteTareas,
  fuenteSensores,
  fuenteLecturas,
  updateCultivo,
  createTarea,
  updateSensor,
  resolverFoto,
  limpiarFoto,
} from '../services/firestoreService'


const route = useRoute()
const orchardId = route.params.id
const cropId = route.params.cropId
const { huerto, permisos, listo } = useHuerto(orchardId)

// Sin consultas where + orderBy (pedirían un índice compuesto): se escucha la
// colección y se filtra aquí. Estas listas ya se comparten con la vista del huerto.
const siHay = (fuente) => () => (huerto.value ? fuente(orchardId) : null)
const { datos: cultivos, cargando: cargandoCultivos } = useVivo(siHay(fuenteCultivos))
const { datos: todasTareas } = useVivo(siHay(fuenteTareas))
const { datos: todosSensores } = useVivo(siHay(fuenteSensores))
const { porClave: lecturasPorClave } = useVivoMuchos(() =>
  huerto.value ? todosSensores.value.map((s) => fuenteLecturas(orchardId, s.id)) : [],
)

const cultivo = computed(() => cultivos.value.find((c) => c.id === cropId) || null)
const entrada = computed(() => entradaDeCultivo(cultivo.value))
const estado = computed(() => estadoCultivo(cultivo.value))
const tareas = computed(() => todasTareas.value.filter((t) => t.cropId === cropId))
const sensores = computed(() =>
  todosSensores.value.map((s) => ({
    ...s,
    lecturas: lecturasPorClave.value[fuenteLecturas(orchardId, s.id).clave] || [],
  })),
)
const sensoresCultivo = computed(() => sensores.value.filter((s) => s.cropId === cropId))
const ahora = useAhora()
const avisos = computed(() =>
  cultivo.value
    ? avisosDe({
        orchardId,
        cultivos: [cultivo.value],
        sensores: sensoresCultivo.value,
        lecturasDe: (s) => s.lecturas,
        ahora: ahora.value,
      })
    : [],
)
// Sin planta, o de un cultivo que ya se ha borrado.
const sensoresDisponibles = computed(() =>
  sensores.value.filter((s) => !cultivos.value.some((c) => c.id === s.cropId)),
)

const editing = ref(false)
const saving = ref(false)
const savedMsg = ref('')
const sensorAVincular = ref(null)
const taskTitulo = ref('')
const taskFrec = ref('')
const taskFecha = ref(hoyISO())
const taskError = ref('')
const avisoTarea = ref('')
const { alternar, cambiarFrecuencia, borrar } = useAccionesTarea({
  orchardIdDe: () => orchardId,
  permisosDe: () => permisos.value,
  error: taskError,
  aviso: avisoTarea,
})

const fNombre = ref('')
const fEspecie = ref('')
const fFecha = ref('')
const fFoto = ref('')
const fFotoQuitada = ref(false)
const fDias = ref('')
const fDesc = ref('')

// El formulario se rellena al abrirlo: así un cambio de otro miembro no pisa lo
// que se está escribiendo.
watch(editing, (abierto) => {
  if (!abierto || !cultivo.value) return
  fNombre.value = cultivo.value.nombre || ''
  fEspecie.value = cultivo.value.especie || ''
  fFecha.value = cultivo.value.fechaSiembra || ''
  fDias.value = cultivo.value.diasCosecha || ''
  fDesc.value = cultivo.value.descripcion || ''
  fFoto.value = ''
  fFotoQuitada.value = false
  savedMsg.value = ''
})

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
      diasCosecha: fDias.value || null,
      fotoId,
      // Una foto nueva o quitada sustituye también a la URL antigua, si la había.
      foto: fFoto.value || fFotoQuitada.value ? '' : cultivo.value.foto || '',
      descripcion: fDesc.value.trim(),
    }
    await updateCultivo(orchardId, cropId, data)
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

async function addTask() {
  const titulo = taskTitulo.value.trim()
  if (!titulo) return
  taskError.value = ''
  taskTitulo.value = ''
  try {
    await createTarea(orchardId, { titulo, frecuencia: taskFrec.value, cropId, fecha: taskFecha.value })
  } catch (e) {
    taskTitulo.value = titulo
    taskError.value = mensajeError(e, 'No se pudo crear la tarea.')
    console.error(e)
  }
}


async function vincular() {
  if (!sensorAVincular.value) return
  const id = sensorAVincular.value
  sensorAVincular.value = null
  try {
    await updateSensor(orchardId, id, { cropId })
  } catch (e) {
    taskError.value = mensajeError(e, 'No se pudo vincular el sensor.')
    console.error(e)
  }
}

async function desvincular(s) {
  try {
    await updateSensor(orchardId, s.id, { cropId: null })
  } catch (e) {
    taskError.value = mensajeError(e, 'No se pudo desvincular el sensor.')
    console.error(e)
  }
}
</script>

<style scoped>
.estado-lectura-metric {
  display: block;
  margin: -4px 0 8px;
}
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
  border-radius: var(--radius-md);
  padding: 22px;
  margin-bottom: 18px;
}
.ficha {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}
.thumb {
  width: 260px;
  max-width: 100%;
  aspect-ratio: 4 / 3;
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
  background: var(--color-border-soft);
  color: var(--color-text-soft);
  font-size: 0.78rem;
  padding: 3px 10px;
  border-radius: 999px;
}
.pill.type {
  background: var(--color-tierra-suave);
  color: var(--color-tierra-oscuro);
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
.vacio {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  color: var(--color-text-soft);
}
.vacio p {
  margin: 0;
}
.ver-biblioteca {
  display: inline-block;
  margin-top: 12px;
  font-size: 0.88rem;
  font-weight: 600;
  text-decoration: none;
}
.plagas {
  list-style: none;
  margin: 0;
  padding: 0;
}
.plagas li {
  display: flex;
  flex-direction: column;
  padding: 9px 0;
  border-top: 1px solid var(--color-border-soft);
}
.plagas li:first-child {
  border-top: none;
  padding-top: 0;
}
.plagas span {
  font-size: 0.88rem;
  color: var(--color-text-soft);
}
.section-title {
  margin: 0 0 14px;
  font-size: 1.3rem;
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
.etapa {
  margin: 2px 0 0;
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--color-text-soft);
}
.etapa.sembrado {
  color: var(--color-tierra-oscuro);
}
.etapa.creciendo,
.etapa.listo {
  color: var(--color-verde-oscuro);
}
.progreso {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 10px 0 14px;
  font-size: 0.86rem;
  color: var(--color-text-soft);
}
.barra {
  flex: 1;
  height: 7px;
  border-radius: 4px;
  background: var(--color-tierra-suave);
  overflow: hidden;
}
.barra i {
  display: block;
  height: 100%;
  background: var(--color-verde);
}
.barra i.sembrado {
  background: var(--color-tierra);
}
.barra i.listo {
  background: var(--color-verde-oscuro);
}
.pista {
  font-size: 0.86rem;
  color: var(--color-text-soft);
}
.link-row .task-date {
  padding: 10px 12px;
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-sm);
}
.link-row .task-input {
  flex: 1;
  min-width: 180px;
  padding: 10px 12px;
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-sm);
}
.link-row select[aria-label='Frecuencia de riego'] {
  flex: 0 1 180px;
  min-width: 140px;
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
.device {
  display: block;
  font-size: 0.78rem;
  color: var(--color-text-soft);
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
