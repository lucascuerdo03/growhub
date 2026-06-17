<template>
  <div>
    <header class="page-head">
      <h1>Tareas</h1>
      <p class="sub">Todas las tareas de tus huertos en un solo sitio.</p>
    </header>

    <form v-if="huertos.length" class="task-form" @submit.prevent="add">
      <input v-model="titulo" class="full" placeholder="Nueva tarea (ej: Regar tomates)" />
      <div class="row">
        <select v-model="orchardId">
          <option v-for="h in huertos" :key="h.id" :value="h.id">{{ h.nombre }}</option>
        </select>
        <select v-model="frecuenciaRiego">
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

    <ul v-else class="list">
      <li v-for="t in tareas" :key="t.orchardId + t.id" :class="{ done: t.completada }">
        <input type="checkbox" :checked="t.completada" @change="toggle(t)" />
        <div class="info">
          <strong>{{ t.titulo }}</strong>
          <p v-if="t.descripcion" class="desc">{{ t.descripcion }}</p>
          <div class="tags">
            <router-link :to="`/orchard/${t.orchardId}`" class="tag orchard">
              🌱 {{ t.orchardNombre }}
            </router-link>
            <span v-if="t.cropNombre" class="tag crop">{{ t.cropNombre }}</span>
            <span v-if="t.frecuenciaRiego" class="tag water">💧 {{ t.frecuenciaRiego }}</span>
          </div>
        </div>
        <button class="del" @click="remove(t)">✕</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import {
  getHuertos,
  getAllTareas,
  createTarea,
  updateTarea,
  deleteTarea,
} from '../services/firestoreService'

const FRECUENCIAS = ['Sin riego', 'Diario', 'Cada 2-3 días', 'Semanal', 'Solo en sequía']

const { user } = useAuth()
const huertos = ref([])
const tareas = ref([])
const titulo = ref('')
const orchardId = ref(null)
const frecuenciaRiego = ref('Cada 2-3 días')
const loading = ref(true)
const saving = ref(false)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    huertos.value = await getHuertos(user.value.uid)
    if (huertos.value.length && !orchardId.value) orchardId.value = huertos.value[0].id
    tareas.value = await getAllTareas(user.value.uid)
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
  try {
    await createTarea(orchardId.value, {
      titulo: titulo.value.trim(),
      frecuenciaRiego: frecuenciaRiego.value,
    })
    titulo.value = ''
    await load()
  } catch (e) {
    error.value = 'No se pudo crear la tarea.'
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
    error.value = 'No se pudo actualizar la tarea.'
    console.error(e)
  }
}

async function remove(t) {
  if (!confirm('¿Eliminar esta tarea?')) return
  try {
    await deleteTarea(t.orchardId, t.id)
    tareas.value = tareas.value.filter((x) => !(x.orchardId === t.orchardId && x.id === t.id))
  } catch (e) {
    error.value = 'No se pudo eliminar la tarea.'
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
