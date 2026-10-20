<template>
  <div>
    <router-link to="/dashboard" class="back">← Mis Huertos</router-link>

    <!-- Banner hero -->
    <section class="hero">
      <div class="hero-overlay">
        <h1>{{ huerto?.nombre || 'Huerto' }}</h1>
        <p v-if="huerto?.descripcion" class="hero-loc">📍 {{ huerto.descripcion }}</p>
        <div class="hero-actions">
          <router-link :to="`/orchard/${orchardId}/sensors`" class="hero-btn">📡 Sensores</router-link>
          <router-link :to="`/orchard/${orchardId}/settings`" class="hero-btn">⚙️ Ajustes</router-link>
        </div>
      </div>
    </section>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="loading" class="muted">Cargando…</p>

    <div v-else class="columns">
      <!-- CULTIVOS -->
      <section class="panel">
        <h2 class="section-title">Cultivos</h2>

        <input v-model="search" class="search" placeholder="🔍  Buscar por nombre o especie…" />

        <form class="inline-add" @submit.prevent="addCrop">
          <input v-model="cropNombre" placeholder="Nuevo cultivo" />
          <input v-model="cropEspecie" placeholder="Especie (opcional)" />
          <button type="submit" :disabled="!cropNombre.trim()">+</button>
        </form>

        <p v-if="!cultivosFiltrados.length" class="muted small">
          {{ cultivos.length ? 'Sin resultados.' : 'Este huerto aún no tiene cultivos.' }}
        </p>

        <div v-for="c in cultivosFiltrados" :key="c.id" class="crop-card">
          <div class="crop-thumb">🌿</div>
          <div class="crop-info">
            <strong>{{ c.nombre }}</strong>
            <span v-if="c.especie" class="pill type">{{ c.especie }}</span>
          </div>
          <button class="del" title="Eliminar" @click="removeCrop(c.id)">✕</button>
        </div>
      </section>

      <!-- TAREAS -->
      <section class="panel">
        <h2 class="section-title">Tareas</h2>

        <form class="inline-add" @submit.prevent="addTask">
          <input v-model="taskTitulo" placeholder="Nueva tarea" />
          <select v-model="taskFrec">
            <option v-for="f in FRECUENCIAS" :key="f" :value="f">{{ f }}</option>
          </select>
          <button type="submit" :disabled="!taskTitulo.trim()">+</button>
        </form>

        <p class="group-label">Pendientes</p>
        <p v-if="!pendientes.length" class="muted small">No hay tareas pendientes.</p>
        <div v-for="t in pendientes" :key="t.id" class="task-card">
          <input type="checkbox" :checked="t.completada" @change="toggleTask(t)" />
          <div class="task-info">
            <strong>{{ t.titulo }}</strong>
            <div v-if="t.frecuenciaRiego" class="tags">
              <span class="pill water">💧 {{ t.frecuenciaRiego }}</span>
            </div>
          </div>
          <button class="del" @click="removeTask(t)">✕</button>
        </div>

        <button v-if="completadas.length" class="collapse" @click="showDone = !showDone">
          Completadas ({{ completadas.length }}) {{ showDone ? '▲' : '▼' }}
        </button>
        <template v-if="showDone">
          <div v-for="t in completadas" :key="t.id" class="task-card done">
            <input type="checkbox" checked @change="toggleTask(t)" />
            <div class="task-info"><strong>{{ t.titulo }}</strong></div>
            <button class="del" @click="removeTask(t)">✕</button>
          </div>
        </template>
      </section>
    </div>

    <!-- CUADERNO DE CAMPO -->
    <section v-if="!loading" class="panel notebook">
      <h2 class="section-title">📖 Cuaderno de Campo</h2>

      <form class="composer" @submit.prevent="publicar">
        <span class="avatar">{{ inicial }}</span>
        <div class="composer-body">
          <textarea v-model="nuevoPost" rows="2" placeholder="¿Qué está pasando en el huerto?"></textarea>
          <div class="composer-foot">
            <button type="submit" class="publish" :disabled="publicando || !nuevoPost.trim()">
              ➤ Publicar
            </button>
          </div>
        </div>
      </form>

      <div v-if="!posts.length" class="empty-feed">
        <div class="empty-emoji">💬</div>
        <p class="empty-title">Aún no hay publicaciones</p>
        <p class="muted small">Sé el primero en compartir actualizaciones, notas o fotos de este huerto.</p>
      </div>

      <article v-for="p in posts" :key="p.id" class="post">
        <header class="post-head">
          <span class="avatar sm">{{ (p.autorNombre || '?').charAt(0).toUpperCase() }}</span>
          <div>
            <strong>{{ p.autorNombre || 'Usuario' }}</strong>
            <span class="post-time">🕐 {{ fecha(p.createdAt) }}</span>
          </div>
          <button v-if="p.autorId === user?.uid" class="del" @click="removePost(p)">✕</button>
        </header>
        <p class="post-text">{{ p.texto }}</p>
      </article>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import {
  getHuerto,
  getCultivos,
  createCultivo,
  deleteCultivo,
  getTareas,
  createTarea,
  updateTarea,
  deleteTarea,
  getPosts,
  createPost,
  deletePost,
} from '../services/firestoreService'

const FRECUENCIAS = ['Sin riego', 'Diario', 'Cada 2-3 días', 'Semanal', 'Solo en sequía']

const route = useRoute()
const orchardId = route.params.id
const { user } = useAuth()

const huerto = ref(null)
const cultivos = ref([])
const tareas = ref([])
const posts = ref([])
const loading = ref(true)
const error = ref('')

const search = ref('')
const cropNombre = ref('')
const cropEspecie = ref('')
const taskTitulo = ref('')
const taskFrec = ref('Cada 2-3 días')
const showDone = ref(false)
const nuevoPost = ref('')
const publicando = ref(false)

const inicial = computed(() =>
  (user.value?.displayName || user.value?.email || '?').charAt(0).toUpperCase(),
)
const cultivosFiltrados = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return cultivos.value
  return cultivos.value.filter(
    (c) => c.nombre.toLowerCase().includes(q) || (c.especie || '').toLowerCase().includes(q),
  )
})
const pendientes = computed(() => tareas.value.filter((t) => !t.completada))
const completadas = computed(() => tareas.value.filter((t) => t.completada))

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

async function load() {
  loading.value = true
  error.value = ''
  try {
    ;[huerto.value, cultivos.value, tareas.value, posts.value] = await Promise.all([
      getHuerto(orchardId),
      getCultivos(orchardId),
      getTareas(orchardId),
      getPosts(orchardId),
    ])
  } catch (e) {
    error.value = 'No se pudo cargar el huerto.'
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function addCrop() {
  if (!cropNombre.value.trim()) return
  try {
    await createCultivo(orchardId, {
      nombre: cropNombre.value.trim(),
      especie: cropEspecie.value.trim(),
    })
    cropNombre.value = ''
    cropEspecie.value = ''
    cultivos.value = await getCultivos(orchardId)
  } catch (e) {
    error.value = 'No se pudo crear el cultivo.'
    console.error(e)
  }
}

async function removeCrop(id) {
  if (!confirm('¿Eliminar este cultivo?')) return
  try {
    await deleteCultivo(orchardId, id)
    cultivos.value = cultivos.value.filter((c) => c.id !== id)
  } catch (e) {
    error.value = 'No se pudo eliminar el cultivo.'
    console.error(e)
  }
}

async function addTask() {
  if (!taskTitulo.value.trim()) return
  try {
    await createTarea(orchardId, { titulo: taskTitulo.value.trim(), frecuenciaRiego: taskFrec.value })
    taskTitulo.value = ''
    tareas.value = await getTareas(orchardId)
  } catch (e) {
    error.value = 'No se pudo crear la tarea.'
    console.error(e)
  }
}

async function toggleTask(t) {
  const nuevo = !t.completada
  t.completada = nuevo
  try {
    await updateTarea(orchardId, t.id, { completada: nuevo })
    // Al completar una tarea se publica automáticamente en el cuaderno.
    if (nuevo) {
      await createPost(orchardId, {
        texto: `✅ He completado la tarea: ${t.titulo}`,
        ...autorInfo(),
      })
      posts.value = await getPosts(orchardId)
    }
  } catch (e) {
    t.completada = !nuevo
    console.error(e)
  }
}

async function removeTask(t) {
  if (!confirm('¿Eliminar esta tarea?')) return
  try {
    await deleteTarea(orchardId, t.id)
    tareas.value = tareas.value.filter((x) => x.id !== t.id)
  } catch (e) {
    console.error(e)
  }
}

async function publicar() {
  if (!nuevoPost.value.trim()) return
  publicando.value = true
  try {
    await createPost(orchardId, { texto: nuevoPost.value.trim(), ...autorInfo() })
    nuevoPost.value = ''
    posts.value = await getPosts(orchardId)
  } catch (e) {
    error.value = 'No se pudo publicar.'
    console.error(e)
  } finally {
    publicando.value = false
  }
}

async function removePost(p) {
  if (!confirm('¿Eliminar esta publicación?')) return
  try {
    await deletePost(orchardId, p.id)
    posts.value = posts.value.filter((x) => x.id !== p.id)
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
.hero {
  border-radius: var(--radius-lg);
  background: linear-gradient(120deg, var(--color-primary), var(--color-secondary));
  margin-bottom: 28px;
  overflow: hidden;
}
.hero-overlay {
  padding: 38px 32px;
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
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  flex-shrink: 0;
}
.crop-info {
  flex: 1;
  min-width: 0;
}
.crop-info strong {
  display: block;
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
.pill.water {
  background: var(--color-primary-soft);
  color: #0369a1;
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
  margin-top: 4px;
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
.empty-emoji {
  font-size: 2.4rem;
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
  background: transparent;
  border: none;
  color: #cbd5e1;
  cursor: pointer;
  font-size: 0.9rem;
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
