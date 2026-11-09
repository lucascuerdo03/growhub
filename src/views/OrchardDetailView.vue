<template>
  <div>
    <router-link to="/dashboard" class="back">← Mis Huertos</router-link>

    <!-- Banner hero -->
    <section class="hero">
      <StoredImage v-if="huerto?.fotoId || huerto?.imagen" class="hero-img" :orchard-id="orchardId" :foto-id="huerto.fotoId" :url="huerto.imagen" />
      <div class="hero-overlay">
        <span v-if="permisos.rol" class="hero-badge">{{ nombreRol(permisos.rol) }}</span>
        <h1>{{ huerto?.nombre || 'Huerto' }}</h1>
        <p v-if="huerto?.descripcion" class="hero-loc">{{ huerto.descripcion }}</p>
        <div class="hero-actions">
          <router-link v-if="huerto" :to="`/orchard/${orchardId}/sensors`" class="hero-btn">Sensores</router-link>
          <router-link v-if="huerto" :to="`/orchard/${orchardId}/members`" class="hero-btn">Miembros</router-link>
          <router-link v-if="permisos.admin" :to="`/orchard/${orchardId}/settings`" class="hero-btn">Ajustes</router-link>
        </div>
      </div>
    </section>

    <TiempoHuerto v-if="huerto" class="tiempo-huerto" :huerto="huerto" :enlace-ajustes="permisos.admin" />

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="!listo" class="muted">Cargando…</p>
    <p v-else-if="!huerto" class="error">
      No tienes acceso a este huerto o ya no existe.
      <router-link to="/dashboard">Volver a Mis Huertos</router-link>
    </p>

    <div v-if="huerto" class="columns">
      <!-- CULTIVOS -->
      <section class="panel">
        <h2 class="section-title">Cultivos</h2>

        <input v-model="search" class="search" placeholder="Buscar por nombre o especie…" />

        <template v-if="permisos.manageCrops">
          <BuscadorCultivo v-if="!nuevo" @elegir="elegirEntrada" @personalizado="elegirPersonalizado" />
          <div v-else class="nuevo-cultivo">
            <h3>{{ nuevo.entrada ? nuevo.entrada.nombre : `Cultivo personalizado` }}</h3>
            <FormularioCultivo
              :entrada="nuevo.entrada"
              :nombre-inicial="nuevo.nombre"
              :huertos="[huerto]"
              @guardado="nuevo = null"
              @cancelar="nuevo = null"
            />
          </div>
        </template>

        <div v-if="!cultivos.length && !nuevo" class="vacio">
          <Ilustracion tipo="huerto" />
          <p>Este huerto aún no tiene cultivos. Busca uno arriba para añadirlo.</p>
        </div>
        <p v-else-if="search.trim() && !cultivosFiltrados.length" class="muted small">Ningún cultivo coincide con la búsqueda.</p>

        <div class="rejilla-cultivos">
          <CropCard
            v-for="c in cultivosFiltrados"
            :key="c.id"
            :cultivo="c"
            :orchard-id="orchardId"
            :puede-borrar="permisos.manageCrops"
            @remove="removeCrop"
          />
        </div>
      </section>

      <!-- TAREAS -->
      <section class="panel">
        <h2 class="section-title">Tareas</h2>

        <form v-if="permisos.manageTasks" class="inline-add task-add" @submit.prevent="addTask">
          <input v-model="taskTitulo" placeholder="Nueva tarea" />
          <select v-model="taskFrec" aria-label="Se repite">
            <option v-for="f in FRECUENCIAS" :key="f.valor" :value="f.valor">{{ f.texto }}</option>
          </select>
          <input v-model="taskFecha" type="date" aria-label="Fecha de la tarea" />
          <select v-model="taskCrop" aria-label="Planta de la tarea">
            <option value="">General</option>
            <option v-for="c in cultivos" :key="c.id" :value="c.id">{{ c.nombre }}</option>
          </select>
          <button type="submit" class="anadir-tarea" :disabled="!taskTitulo.trim()"><Plus :size="16" /> Añadir tarea</button>
        </form>

        <select v-if="cultivos.length" v-model="filtroPlanta" class="task-filter" aria-label="Filtrar por planta">
          <option value="">Todas las plantas</option>
          <option value="general">General</option>
          <option v-for="c in cultivos" :key="c.id" :value="c.id">{{ c.nombre }}</option>
        </select>

        <p v-if="avisoTarea" class="aviso-tarea" role="status">{{ avisoTarea }}</p>
        <ListaTareas
          :tareas="tareasFiltradas"
          :planta-de="plantaDe"
          :permisos-de="() => permisos"
          @toggle="alternar"
          @remove="borrar"
          @frecuencia="cambiarFrecuencia"
        >
          <template #vacio>
            <div class="vacio compacto">
              <Ilustracion tipo="tareas" />
              <p>No hay tareas pendientes.</p>
            </div>
          </template>
        </ListaTareas>
      </section>
    </div>

    <!-- CUADERNO DE CAMPO -->
    <section v-if="huerto" class="panel notebook">
      <h2 class="section-title">Cuaderno de campo</h2>

      <form v-if="permisos.publishPosts" class="composer" @submit.prevent="publicar">
        <UserAvatar :uid="user?.uid" :nombre="user?.displayName || user?.email" :url="user?.photoURL || ''" :size="40" />
        <div class="composer-body">
          <textarea v-model="nuevoPost" rows="2" placeholder="¿Qué está pasando en el huerto?"></textarea>
          <ImageUpload v-model="postFoto" class="post-foto-input" />
          <div class="composer-foot">
            <button type="submit" class="publish" :disabled="publicando || !nuevoPost.trim()">
              Publicar
            </button>
          </div>
        </div>
      </form>

      <p v-if="errorPosts" class="muted small">El cuaderno no está disponible ahora mismo.</p>
      <div v-else-if="!posts.length" class="vacio">
        <Ilustracion tipo="cuaderno" />
        <p>El cuaderno está en blanco. Anota aquí lo que pasa en el huerto o sube una foto.</p>
      </div>

      <article v-for="p in posts" :key="p.id" class="post">
        <header class="post-head">
          <UserAvatar :uid="p.autorId" :nombre="p.autorNombre" :size="36" />
          <div>
            <strong>{{ p.autorNombre || 'Usuario' }}</strong>
            <span class="post-time">{{ fecha(p.createdAt) }}</span>
          </div>
          <button v-if="puedeBorrarPost(p)" class="del" @click="removePost(p)"><X :size="15" /></button>
        </header>
        <p class="post-text">{{ p.texto }}</p>
        <StoredImage v-if="p.fotoId || p.foto" class="post-img" :orchard-id="orchardId" :foto-id="p.fotoId" :url="p.foto" />
      </article>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { X, Plus } from 'lucide-vue-next'
import { useAuth } from '../composables/useAuth'
import { useHuerto } from '../composables/useHuertos'
import { useVivo } from '../composables/useVivo'
import ImageUpload from '../components/ImageUpload.vue'
import StoredImage from '../components/StoredImage.vue'
import UserAvatar from '../components/UserAvatar.vue'
import BuscadorCultivo from '../components/BuscadorCultivo.vue'
import CropCard from '../components/CropCard.vue'
import Ilustracion from '../components/Ilustracion.vue'
import ListaTareas from '../components/ListaTareas.vue'
import TiempoHuerto from '../components/TiempoHuerto.vue'
import { hoyISO } from '../utils/fechas'
import { FRECUENCIAS } from '../utils/tareas'
import { useAccionesTarea } from '../composables/useAccionesTarea'
import FormularioCultivo from '../components/FormularioCultivo.vue'
import { nombreRol, mensajeError } from '../utils/permissions'
import {
  fuenteCultivos,
  fuenteTareas,
  fuentePosts,
  deleteCultivo,
  createTarea,
  createPost,
  deletePost,
  createFoto,
  limpiarFoto,
} from '../services/firestoreService'


const route = useRoute()
const orchardId = route.params.id
const { user } = useAuth()
const { huerto, permisos, listo } = useHuerto(orchardId)

const siHay = (fuente) => () => (huerto.value ? fuente(orchardId) : null)
const { datos: cultivos } = useVivo(siHay(fuenteCultivos))
const { datos: tareas } = useVivo(siHay(fuenteTareas))
const { datos: posts, error: errorPosts } = useVivo(siHay(fuentePosts))
const error = ref('')

const search = ref('')
// Cultivo que se está añadiendo: { entrada, nombre }.
const nuevo = ref(null)
const taskTitulo = ref('')
const taskFrec = ref('')
const taskCrop = ref('')
const taskFecha = ref(hoyISO())
const filtroPlanta = ref('')
const avisoTarea = ref('')
const nuevoPost = ref('')
const postFoto = ref('')
const publicando = ref(false)

const puedeBorrarPost = (p) =>
  permisos.value.admin || (permisos.value.publishPosts && p.autorId === user.value?.uid)

const cultivosFiltrados = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return cultivos.value
  return cultivos.value.filter(
    (c) => c.nombre.toLowerCase().includes(q) || (c.especie || '').toLowerCase().includes(q),
  )
})
const cultivoDe = (t) => cultivos.value.find((c) => c.id === t.cropId)
const plantaDe = (t) => cultivoDe(t)?.nombre || 'General'
const tareasFiltradas = computed(() => {
  if (!filtroPlanta.value) return tareas.value
  if (filtroPlanta.value === 'general') return tareas.value.filter((t) => !cultivoDe(t))
  return tareas.value.filter((t) => t.cropId === filtroPlanta.value)
})
const { alternar, cambiarFrecuencia, borrar } = useAccionesTarea({
  orchardIdDe: () => orchardId,
  permisosDe: () => permisos.value,
  error,
  aviso: avisoTarea,
})

// Al filtrar por una planta, las tareas nuevas se proponen para esa planta.
watch(filtroPlanta, (f) => {
  taskCrop.value = f && f !== 'general' ? f : ''
})

function fecha(ts) {
  const d = ts?.toDate ? ts.toDate() : new Date()
  return d.toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function autorInfo() {
  return {
    autorId: user.value.uid,
    autorNombre: user.value.displayName || user.value.email,
    autorFoto: user.value.photoURL || '',
  }
}

const elegirEntrada = (entrada) => (nuevo.value = { entrada, nombre: entrada.nombre })
const elegirPersonalizado = (nombre) => (nuevo.value = { entrada: null, nombre })

async function removeCrop(c) {
  if (!confirm('¿Eliminar este cultivo?')) return
  error.value = ''
  try {
    await deleteCultivo(orchardId, c.id, c.fotoId)
  } catch (e) {
    error.value = mensajeError(e, 'No se pudo eliminar el cultivo.')
    console.error(e)
  }
}

async function addTask() {
  const titulo = taskTitulo.value.trim()
  if (!titulo) return
  const datos = {
    titulo,
    frecuencia: taskFrec.value,
    cropId: taskCrop.value || null,
    fecha: taskFecha.value,
  }
  error.value = ''
  taskTitulo.value = ''
  // Un filtro de otra planta ocultaría la tarea recién creada: parecería que no se
  // ha guardado hasta recargar.
  const f = filtroPlanta.value
  if (f && f !== (datos.cropId || 'general')) filtroPlanta.value = ''
  try {
    await createTarea(orchardId, datos)
  } catch (e) {
    taskTitulo.value = titulo
    error.value = mensajeError(e, 'No se pudo crear la tarea.')
    console.error(e)
  }
}


async function publicar() {
  if (!nuevoPost.value.trim()) return
  publicando.value = true
  error.value = ''
  let fotoId = ''
  try {
    if (postFoto.value) fotoId = await createFoto(orchardId, postFoto.value)
    const datos = { texto: nuevoPost.value.trim(), fotoId, ...autorInfo() }
    nuevoPost.value = ''
    postFoto.value = ''
    await createPost(orchardId, datos)
  } catch (e) {
    await limpiarFoto(orchardId, fotoId, '')
    error.value = mensajeError(e, 'No se pudo publicar.')
    console.error(e)
  } finally {
    publicando.value = false
  }
}

async function removePost(p) {
  if (!confirm('¿Eliminar esta publicación?')) return
  error.value = ''
  try {
    await deletePost(orchardId, p.id, p.fotoId)
  } catch (e) {
    error.value = mensajeError(e, 'No se pudo eliminar la publicación.')
    console.error(e)
  }
}
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
.hero {
  position: relative;
  border-radius: var(--radius-md);
  background: var(--color-verde-oscuro);
  margin-bottom: 28px;
  overflow: hidden;
  box-shadow: var(--shadow-card);
}
.hero-img {
  position: absolute;
  inset: 0;
}
.hero-overlay {
  position: relative;
  padding: 64px 28px 24px;
  background: linear-gradient(0deg, rgb(15 30 26 / 0.82), rgb(15 30 26 / 0.2));
}
.hero h1 {
  margin: 0;
  color: #fff;
  font-size: 2.3rem;
}
.hero-loc {
  color: #e2e8f0;
  margin: 8px 0 0;
  font-size: 1rem;
}
.hero-actions {
  display: flex;
  gap: 10px;
  margin-top: 18px;
  flex-wrap: wrap;
}
.hero-btn {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.35);
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.88rem;
}
.hero-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}
.tiempo-huerto {
  margin: -14px 0 22px;
}
.rejilla-cultivos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px 14px;
  margin-top: 12px;
}
.vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 18px 8px;
  text-align: center;
  color: var(--color-text-soft);
}
.vacio p {
  margin: 0;
  font-size: 0.9rem;
  max-width: 36ch;
}
.vacio.compacto {
  padding-block: 8px;
}
.columns {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}
.panel {
  min-width: 0;
}
.notebook {
  border-top: 1px solid var(--color-border);
  padding-top: 24px;
}
.section-title {
  margin: 0 0 14px;
  font-size: 1.35rem;
}
.search {
  width: 100%;
  padding: 11px 13px;
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-sm);
  margin-bottom: 14px;
  font-size: 0.92rem;
}
.inline-add {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.inline-add input,
.inline-add select {
  flex: 1;
  min-width: 90px;
  padding: 9px 11px;
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
}
.task-add input:first-child {
  flex: 1 1 100%;
}
.task-add input[type='date'],
.task-add select {
  flex: 1 1 125px;
}
.inline-add .anadir-tarea {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 8px;
  font-size: 0.9rem;
  font-weight: 600;
}
.inline-add button {
  width: 40px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
}
.inline-add button:disabled {
  opacity: 0.5;
  cursor: default;
}
.nuevo-cultivo {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 14px;
  margin-bottom: 14px;
}
.task-filter {
  width: 100%;
  padding: 9px 11px;
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  margin-bottom: 8px;
}
.hero-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.9);
  color: var(--color-primary-dark);
  font-size: 0.72rem;
  font-weight: 700;
  padding: 4px 11px;
  border-radius: 999px;
  margin-bottom: 10px;
}
.post-foto-input {
  margin: 8px 0 10px;
}
.post-img {
  width: 100%;
  height: 300px;
  border-radius: var(--radius-md);
  margin-top: 10px;
}
/* Cuaderno de campo */
.notebook {
  margin-top: 24px;
}
.composer {
  display: flex;
  gap: 12px;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  padding: 16px;
  margin-bottom: 20px;
}
.composer-body {
  flex: 1;
}
.composer textarea {
  width: 100%;
  border: none;
  resize: vertical;
  font-size: 0.95rem;
  padding: 6px 0;
}
.composer textarea:focus {
  outline: none;
}
.composer-foot {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--color-border-soft);
  padding-top: 10px;
}
.publish {
  background: var(--color-primary);
  color: #fff;
  border: none;
  padding: 9px 20px;
  border-radius: var(--radius-sm);
  font-weight: 700;
  cursor: pointer;
}
.publish:disabled {
  opacity: 0.5;
  cursor: default;
}
.nuevo-cultivo h3 {
  margin: 0 0 4px;
}
.post {
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  padding: 16px;
  margin-bottom: 12px;
}
.post-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.post-head > div {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.post-time {
  font-size: 0.78rem;
  color: var(--color-text-soft);
}
.post-text {
  margin: 0;
  white-space: pre-wrap;
}
.del {
  display: flex;
  align-items: center;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 2px;
}
.del:hover {
  color: var(--color-danger);
}
.muted {
  color: var(--color-text-soft);
}
.small {
  font-size: 0.88rem;
}
.error {
  color: var(--color-danger);
}

@media (max-width: 820px) {
  .columns {
    grid-template-columns: 1fr;
  }
}
</style>
