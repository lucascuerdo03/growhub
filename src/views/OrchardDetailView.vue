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

        <form v-if="permisos.manageCrops" class="inline-add" @submit.prevent="addCrop">
          <input v-model="cropNombre" placeholder="Nuevo cultivo" />
          <input v-model="cropEspecie" placeholder="Especie (opcional)" />
          <button type="submit" :disabled="!cropNombre.trim() || guardandoCultivo">+</button>
          <ImageUpload v-model="cropFoto" class="inline-photo" />
        </form>

        <p v-if="!cultivosFiltrados.length" class="muted small">
          {{ cultivos.length ? 'Sin resultados.' : 'Este huerto aún no tiene cultivos.' }}
        </p>

        <div v-for="c in cultivosFiltrados" :key="c.id" class="crop-card">
          <StoredImage class="crop-thumb" :orchard-id="orchardId" :foto-id="c.fotoId" :url="c.foto" :alt="c.nombre">
            <Leaf :size="20" />
          </StoredImage>
          <router-link :to="`/orchard/${orchardId}/crop/${c.id}`" class="crop-info">
            <strong>{{ c.nombre }}</strong>
            <span v-if="c.especie" class="pill type">{{ c.especie }}</span>
            <div v-if="c.epocaSiembra || c.riego" class="crop-meta">
              <span v-if="c.epocaSiembra">Siembra: {{ c.epocaSiembra }}</span>
              <span v-if="c.riego">Riego: {{ c.riego }}</span>
            </div>
          </router-link>
          <router-link :to="`/orchard/${orchardId}/crop/${c.id}`" class="chevron" title="Ver ficha">
            <ChevronRight :size="20" />
          </router-link>
          <button v-if="permisos.manageCrops" class="del" title="Eliminar" @click="removeCrop(c)"><X :size="15" /></button>
        </div>
      </section>

      <!-- TAREAS -->
      <section class="panel">
        <h2 class="section-title">Tareas</h2>

        <form v-if="permisos.manageTasks" class="inline-add task-add" @submit.prevent="addTask">
          <input v-model="taskTitulo" placeholder="Nueva tarea" />
          <select v-model="taskFrec" aria-label="Frecuencia de riego">
            <option v-for="f in FRECUENCIAS" :key="f" :value="f">{{ f }}</option>
          </select>
          <select v-model="taskCrop" aria-label="Planta de la tarea">
            <option value="">General</option>
            <option v-for="c in cultivos" :key="c.id" :value="c.id">{{ c.nombre }}</option>
          </select>
          <button type="submit" :disabled="!taskTitulo.trim()"><Plus :size="18" /></button>
        </form>

        <select v-if="cultivos.length" v-model="filtroPlanta" class="task-filter" aria-label="Filtrar por planta">
          <option value="">Todas las plantas</option>
          <option value="general">General</option>
          <option v-for="c in cultivos" :key="c.id" :value="c.id">{{ c.nombre }}</option>
        </select>

        <p class="group-label">Pendientes</p>
        <p v-if="!pendientes.length" class="muted small">No hay tareas pendientes.</p>
        <div v-for="t in pendientes" :key="t.id" class="task-card">
          <input type="checkbox" :checked="t.completada" :disabled="!permisos.completeTasks" @change="toggleTask(t)" />
          <div class="task-info">
            <strong>{{ t.titulo }}</strong>
            <div class="tags">
              <span class="pill plant">{{ plantaDe(t) }}</span>
              <span v-if="t.frecuenciaRiego" class="pill water">Riego: {{ t.frecuenciaRiego }}</span>
            </div>
          </div>
          <button v-if="permisos.manageTasks" class="del" title="Eliminar" @click="removeTask(t)"><X :size="15" /></button>
        </div>

        <button v-if="completadas.length" class="collapse" @click="showDone = !showDone">
          Completadas ({{ completadas.length }})
        </button>
        <template v-if="showDone">
          <div v-for="t in completadas" :key="t.id" class="task-card done">
            <input type="checkbox" checked :disabled="!permisos.completeTasks" @change="toggleTask(t)" />
            <div class="task-info">
              <strong>{{ t.titulo }}</strong>
              <div class="tags"><span class="pill plant">{{ plantaDe(t) }}</span></div>
            </div>
            <button v-if="permisos.manageTasks" class="del" title="Eliminar" @click="removeTask(t)"><X :size="15" /></button>
          </div>
        </template>
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
      <div v-else-if="!posts.length" class="empty-feed">
        <MessageSquare :size="34" class="empty-ic" />
        <p class="empty-title">Aún no hay publicaciones</p>
        <p class="muted small">Comparte actualizaciones, notas o fotos de este huerto.</p>
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
import { X, ChevronRight, Leaf, Plus, MessageSquare } from 'lucide-vue-next'
import { useAuth } from '../composables/useAuth'
import { useHuerto } from '../composables/useHuertos'
import { useVivo } from '../composables/useVivo'
import ImageUpload from '../components/ImageUpload.vue'
import StoredImage from '../components/StoredImage.vue'
import UserAvatar from '../components/UserAvatar.vue'
import { nombreRol, mensajeError } from '../utils/permissions'
import {
  fuenteCultivos,
  fuenteTareas,
  fuentePosts,
  createCultivo,
  deleteCultivo,
  createTarea,
  updateTarea,
  deleteTarea,
  createPost,
  deletePost,
  autopublicarTarea,
  createFoto,
  limpiarFoto,
} from '../services/firestoreService'

const FRECUENCIAS = ['Sin riego', 'Diario', 'Cada 2-3 días', 'Semanal', 'Solo en sequía']

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
const cropNombre = ref('')
const cropEspecie = ref('')
const cropFoto = ref('')
const guardandoCultivo = ref(false)
const taskTitulo = ref('')
const taskFrec = ref('Cada 2-3 días')
const taskCrop = ref('')
const filtroPlanta = ref('')
const showDone = ref(false)
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
const pendientes = computed(() => tareasFiltradas.value.filter((t) => !t.completada))
const completadas = computed(() => tareasFiltradas.value.filter((t) => t.completada))

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

async function addCrop() {
  if (!cropNombre.value.trim()) return
  guardandoCultivo.value = true
  error.value = ''
  let fotoId = ''
  try {
    if (cropFoto.value) fotoId = await createFoto(orchardId, cropFoto.value)
    const datos = { nombre: cropNombre.value.trim(), especie: cropEspecie.value.trim(), fotoId }
    cropNombre.value = ''
    cropEspecie.value = ''
    cropFoto.value = ''
    await createCultivo(orchardId, datos)
  } catch (e) {
    await limpiarFoto(orchardId, fotoId, '')
    error.value = mensajeError(e, 'No se pudo crear el cultivo.')
    console.error(e)
  } finally {
    guardandoCultivo.value = false
  }
}

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
  const datos = { titulo, frecuenciaRiego: taskFrec.value, cropId: taskCrop.value || null }
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

async function toggleTask(t) {
  const nuevo = !t.completada
  error.value = ''
  try {
    await updateTarea(orchardId, t.id, { completada: nuevo })
  } catch (e) {
    error.value = mensajeError(e, 'No se pudo actualizar la tarea.')
    console.error(e)
    return
  }
  if (nuevo && permisos.value.publishPosts) {
    await autopublicarTarea(orchardId, t.titulo, user.value)
  }
}

async function removeTask(t) {
  if (!confirm('¿Eliminar esta tarea?')) return
  error.value = ''
  try {
    await deleteTarea(orchardId, t.id)
  } catch (e) {
    error.value = mensajeError(e, 'No se pudo eliminar la tarea.')
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
  background: #0f2740;
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
  padding: 40px 32px 34px;
  background: linear-gradient(0deg, rgba(15, 23, 42, 0.78), rgba(15, 23, 42, 0.35));
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
.columns {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 24px;
  align-items: start;
}
.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 24px;
}
.section-title {
  margin: 0 0 16px;
  font-size: 1.2rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  border-bottom: 2px solid var(--color-border-soft);
  padding-bottom: 12px;
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
.task-add input {
  flex: 1 1 100%;
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
.crop-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  margin-bottom: 10px;
}
.crop-thumb {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  background: #e8f3ea;
  flex-shrink: 0;
}
.inline-photo {
  width: 100%;
}
.crop-meta {
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin-top: 4px;
  font-size: 0.76rem;
  color: var(--color-text-soft);
}
.crop-info {
  flex: 1;
  min-width: 0;
  text-decoration: none;
}
.crop-info strong {
  display: block;
  color: var(--color-primary);
}
.chevron {
  color: var(--color-text-soft);
  font-size: 1.6rem;
  text-decoration: none;
  line-height: 1;
  padding: 0 4px;
}
.chevron:hover {
  color: var(--color-primary);
}
.pill {
  display: inline-block;
  font-size: 0.74rem;
  padding: 2px 8px;
  border-radius: 999px;
  margin-top: 4px;
}
.pill.type {
  background: #ede9fe;
  color: #6d28d9;
}
.pill.plant {
  background: #eef2f7;
  color: #475569;
}
.task-filter {
  width: 100%;
  padding: 9px 11px;
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  margin-bottom: 8px;
}
.pill.water {
  background: var(--color-primary-soft);
  color: #0369a1;
}
.pill.resp {
  background: #dcfce7;
  color: #166534;
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
.group-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-soft);
  margin: 8px 0 10px;
}
.task-card {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  background: #f0f7ff;
  border: 1px solid #dbeafe;
  padding: 13px 15px;
  border-radius: var(--radius-md);
  margin-bottom: 10px;
}
.task-card.done {
  background: #fff;
  border-color: var(--color-border-soft);
}
.task-card.done .task-info strong {
  text-decoration: line-through;
  color: #9ca3af;
}
.task-card input[type='checkbox'] {
  margin-top: 3px;
  width: 18px;
  height: 18px;
  cursor: pointer;
}
.task-info {
  flex: 1;
  min-width: 0;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}
.tags .pill {
  margin-top: 0;
}
.collapse {
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  border-top: 1px solid var(--color-border-soft);
  padding: 12px 0 0;
  margin-top: 6px;
  color: var(--color-text-soft);
  font-weight: 700;
  font-size: 0.82rem;
  text-transform: uppercase;
  cursor: pointer;
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
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}
.avatar.sm {
  width: 36px;
  height: 36px;
  font-size: 0.9rem;
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
.empty-feed {
  text-align: center;
  padding: 36px;
  color: var(--color-text-soft);
}
.empty-ic {
  color: var(--color-text-soft);
  opacity: 0.6;
}
.empty-title {
  font-weight: 700;
  color: var(--color-text);
  margin: 6px 0 2px;
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
.chevron {
  display: flex;
  align-items: center;
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
