<template>
  <div>
    <header class="page-head">
      <h1>Tareas</h1>
      <p class="sub">Todas las tareas de tus huertos en un solo sitio.</p>
    </header>

    <form v-if="huertosEditables.length" class="task-form" @submit.prevent="add">
      <input v-model="titulo" class="full" placeholder="Nueva tarea (ej: Regar tomates)" />
      <div class="row">
        <select v-model="orchardId">
          <option v-for="h in huertosEditables" :key="h.id" :value="h.id">{{ h.nombre }}</option>
        </select>
        <select v-model="cropId" aria-label="Planta de la tarea">
          <option value="">General</option>
          <option v-for="c in cultivosDe(orchardId)" :key="c.id" :value="c.id">{{ c.nombre }}</option>
        </select>
        <select v-model="frecuenciaRiego" aria-label="Frecuencia de riego">
          <option v-for="f in FRECUENCIAS" :key="f" :value="f">{{ f }}</option>
        </select>
        <button type="submit" :disabled="saving || !titulo.trim()">Añadir</button>
      </div>
    </form>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="loading" class="muted">Cargando…</p>
    <template v-else-if="!huertos.length">
      <div class="empty">
        <p>Aún no tienes huertos.</p>
        <router-link to="/dashboard" class="link">Crea tu primer huerto →</router-link>
      </div>
    </template>
    <p v-else-if="!tareas.length" class="muted">No hay tareas todavía.</p>

    <template v-else>
    <select v-if="opcionesPlanta.length" v-model="filtroPlanta" class="task-filter" aria-label="Filtrar por planta">
      <option value="">Todas las plantas</option>
      <option value="general">General</option>
      <option v-for="o in opcionesPlanta" :key="o.valor" :value="o.valor">{{ o.etiqueta }}</option>
    </select>
    <p v-if="!tareasFiltradas.length" class="muted">No hay tareas para esta planta.</p>
    <ul class="list">
      <li v-for="t in tareasFiltradas" :key="t.orchardId + t.id" :class="{ done: t.completada }">
        <input type="checkbox" :checked="t.completada" :disabled="!permisosDe(t).completeTasks || t.pendiente" @change="toggle(t)" />
        <div class="info">
          <strong>{{ t.titulo }}</strong>
          <p v-if="t.descripcion" class="desc">{{ t.descripcion }}</p>
          <div class="tags">
            <router-link :to="`/orchard/${t.orchardId}`" class="tag orchard">
              {{ t.orchardNombre }}
            </router-link>
            <span class="tag crop">{{ plantaDe(t) }}</span>
            <span v-if="t.frecuenciaRiego" class="tag water">Riego: {{ t.frecuenciaRiego }}</span>
          </div>
        </div>
        <button v-if="permisosDe(t).manageTasks && !t.pendiente" class="del" aria-label="Eliminar" @click="remove(t)">✕</button>
      </li>
    </ul>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import { permisosEn, mensajeError } from '../utils/permissions'
import { insertarOptimista, quitarOptimista } from '../utils/listas'
import {
  getHuertos,
  getAllTareas,
  getCultivos,
  createTarea,
  updateTarea,
  deleteTarea,
  autopublicarTarea,
} from '../services/firestoreService'

const FRECUENCIAS = ['Sin riego', 'Diario', 'Cada 2-3 días', 'Semanal', 'Solo en sequía']

const { user } = useAuth()
const huertos = ref([])
const tareas = ref([])
const cultivos = ref({}) // orchardId -> [cultivos]
const cropId = ref('')
const filtroPlanta = ref('')
const titulo = ref('')
const orchardId = ref(null)
const frecuenciaRiego = ref('Cada 2-3 días')
const loading = ref(true)
const saving = ref(false)
const error = ref('')

const huertosEditables = computed(() =>
  huertos.value.filter((h) => permisosEn(h, user.value.uid).manageTasks),
)
const cultivosDe = (id) => cultivos.value[id] || []
const cultivoDe = (t) => cultivosDe(t.orchardId).find((c) => c.id === t.cropId)
const plantaDe = (t) => cultivoDe(t)?.nombre || 'General'
const opcionesPlanta = computed(() =>
  huertos.value.flatMap((h) =>
    cultivosDe(h.id).map((c) => ({
      valor: `${h.id}/${c.id}`,
      etiqueta: `${c.nombre} · ${h.nombre}`,
    })),
  ),
)
const tareasFiltradas = computed(() => {
  if (!filtroPlanta.value) return tareas.value
  if (filtroPlanta.value === 'general') return tareas.value.filter((t) => !cultivoDe(t))
  return tareas.value.filter((t) => `${t.orchardId}/${t.cropId}` === filtroPlanta.value)
})
// Las plantas elegibles dependen del huerto seleccionado.
watch(orchardId, () => (cropId.value = ''))

const permisosDe = (t) =>
  permisosEn(huertos.value.find((h) => h.id === t.orchardId), user.value.uid)

async function load() {
  loading.value = true
  error.value = ''
  try {
    huertos.value = await getHuertos(user.value.uid)
    if (huertosEditables.value.length && !orchardId.value) orchardId.value = huertosEditables.value[0].id
    const [listas, todas] = await Promise.all([
      Promise.all(huertos.value.map((h) => getCultivos(h.id))),
      getAllTareas(huertos.value),
    ])
    cultivos.value = Object.fromEntries(huertos.value.map((h, i) => [h.id, listas[i]]))
    tareas.value = todas
  } catch (e) {
    error.value = 'No se pudieron cargar las tareas.'
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function add() {
  if (!titulo.value.trim() || !orchardId.value) return
  saving.value = true
  error.value = ''
  const destino = orchardId.value
  const datos = {
    titulo: titulo.value.trim(),
    frecuenciaRiego: frecuenciaRiego.value,
    cropId: cropId.value || null,
  }
  const h = huertos.value.find((x) => x.id === destino)
  titulo.value = ''
  try {
    await insertarOptimista(
      tareas,
      { ...datos, completada: false, orchardId: destino, orchardNombre: h?.nombre || '' },
      () => createTarea(destino, datos),
    )
  } catch (e) {
    titulo.value = datos.titulo
    error.value = mensajeError(e, 'No se pudo crear la tarea.')
    console.error(e)
  } finally {
    saving.value = false
  }
}

async function toggle(t) {
  const nuevo = !t.completada
  t.completada = nuevo
  try {
    await updateTarea(t.orchardId, t.id, { completada: nuevo })
  } catch (e) {
    t.completada = !nuevo
    error.value = mensajeError(e, 'No se pudo actualizar la tarea.')
    console.error(e)
    return
  }
  // Al completar, se autopublica en el cuaderno del huerto (no es crítico).
  if (nuevo && permisosDe(t).publishPosts) {
    await autopublicarTarea(t.orchardId, t.titulo, user.value)
  }
}

async function remove(t) {
  if (!confirm('¿Eliminar esta tarea?')) return
  error.value = ''
  try {
    await quitarOptimista(tareas, t, () => deleteTarea(t.orchardId, t.id))
  } catch (e) {
    error.value = mensajeError(e, 'No se pudo eliminar la tarea.')
    console.error(e)
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
.task-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 680px;
  margin-bottom: 26px;
}
.task-form .full,
.task-form select {
  padding: 10px 12px;
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
}
.task-form .row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.task-form select {
  flex: 1;
  min-width: 140px;
}
.task-form button {
  padding: 10px 22px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
}
.task-form button:disabled {
  opacity: 0.6;
  cursor: default;
}
.task-filter {
  display: block;
  width: 100%;
  max-width: 340px;
  padding: 9px 11px;
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-sm);
  margin-bottom: 14px;
}
.list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-width: 760px;
}
.list li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #f0f7ff;
  border: 1px solid #dbeafe;
  padding: 15px 18px;
  border-radius: var(--radius-md);
  margin-bottom: 12px;
}
.list li.done {
  background: var(--color-surface);
  border-color: var(--color-border-soft);
}
.list li.done .info strong {
  text-decoration: line-through;
  color: #9ca3af;
}
.list input[type='checkbox'] {
  margin-top: 4px;
  width: 18px;
  height: 18px;
  cursor: pointer;
}
.info {
  flex: 1;
}
.desc {
  margin: 4px 0;
  color: var(--color-text-soft);
  font-size: 0.9rem;
}
.tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 6px;
}
.tag {
  font-size: 0.78rem;
  padding: 3px 8px;
  border-radius: 999px;
  text-decoration: none;
}
.tag.orchard {
  background: #e8f3ea;
  color: var(--color-accent-green);
}
.tag.crop {
  background: #eef2f7;
  color: #475569;
}
.tag.water {
  background: var(--color-primary-soft);
  color: #0369a1;
}
.del {
  background: transparent;
  border: none;
  color: #9ca3af;
  cursor: pointer;
}
.del:hover {
  color: var(--color-danger);
}
.muted {
  color: var(--color-text-soft);
}
.error {
  color: var(--color-danger);
}
.empty {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  padding: 30px;
  max-width: 420px;
}
.empty .link {
  font-weight: 600;
  text-decoration: none;
}
</style>
