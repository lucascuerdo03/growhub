<template>
  <div>
    <router-link :to="`/orchard/${orchardId}`" class="back">← Volver al huerto</router-link>
    <h1>Tareas</h1>

    <form v-if="permisos.manageTasks" class="task-form" @submit.prevent="add">
      <input v-model="titulo" class="full" placeholder="Título de la tarea (ej: Regar tomates)" />
      <input v-model="descripcion" class="full" placeholder="Descripción (opcional)" />

      <div class="row">
        <label>
          <span>Cultivo</span>
          <select v-model="cropId">
            <option :value="null">General</option>
            <option v-for="c in cultivos" :key="c.id" :value="c.id">{{ c.nombre }}</option>
          </select>
        </label>

        <label>
          <span>Frecuencia de riego</span>
          <select v-model="frecuenciaRiego">
            <option v-for="f in FRECUENCIAS" :key="f" :value="f">{{ f }}</option>
          </select>
        </label>
      </div>

      <button type="submit" :disabled="saving || !titulo.trim()">Añadir tarea</button>
    </form>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="!listo" class="muted">Cargando…</p>
    <p v-else-if="!huerto" class="error">No tienes acceso a este huerto o ya no existe.</p>
    <p v-else-if="!tareas.length" class="muted">No hay tareas en este huerto.</p>

    <template v-else>
    <select v-if="cultivos.length" v-model="filtroPlanta" class="task-filter" aria-label="Filtrar por planta">
      <option value="">Todas las plantas</option>
      <option value="general">General</option>
      <option v-for="c in cultivos" :key="c.id" :value="c.id">{{ c.nombre }}</option>
    </select>
    <p v-if="!tareasFiltradas.length" class="muted">No hay tareas para esta planta.</p>
    <ul class="list">
      <li v-for="t in tareasFiltradas" :key="t.id" :class="{ done: t.completada }">
        <input
          type="checkbox"
          :checked="t.completada"
          :disabled="!permisos.completeTasks"
          @change="toggle(t)"
          title="Marcar como completada"
        />
        <div class="info">
          <strong>{{ t.titulo }}</strong>
          <p v-if="t.descripcion" class="desc">{{ t.descripcion }}</p>
          <div class="tags">
            <span class="tag crop">{{ plantaDe(t) }}</span>
            <span v-if="t.frecuenciaRiego" class="tag water">Riego: {{ t.frecuenciaRiego }}</span>
          </div>
        </div>
        <button v-if="permisos.manageTasks" class="del" aria-label="Eliminar" @click="remove(t)">✕</button>
      </li>
    </ul>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useHuerto } from '../composables/useHuertos'
import { useVivo } from '../composables/useVivo'
import { mensajeError } from '../utils/permissions'
import {
  fuenteCultivos,
  fuenteTareas,
  createTarea,
  updateTarea,
  deleteTarea,
  autopublicarTarea,
} from '../services/firestoreService'

const FRECUENCIAS = ['Sin riego', 'Diario', 'Cada 2-3 días', 'Semanal', 'Solo en sequía']

const route = useRoute()
const orchardId = route.params.id
const { user } = useAuth()
const { huerto, permisos, listo } = useHuerto(orchardId)

const siHay = (fuente) => () => (huerto.value ? fuente(orchardId) : null)
const { datos: cultivos } = useVivo(siHay(fuenteCultivos))
const { datos: tareas } = useVivo(siHay(fuenteTareas))

const titulo = ref('')
const descripcion = ref('')
const cropId = ref(null)
const frecuenciaRiego = ref('Cada 2-3 días')
const saving = ref(false)
const error = ref('')
const filtroPlanta = ref('')

const cultivoDe = (t) => cultivos.value.find((c) => c.id === t.cropId)
const plantaDe = (t) => cultivoDe(t)?.nombre || 'General'
const tareasFiltradas = computed(() => {
  if (!filtroPlanta.value) return tareas.value
  if (filtroPlanta.value === 'general') return tareas.value.filter((t) => !cultivoDe(t))
  return tareas.value.filter((t) => t.cropId === filtroPlanta.value)
})

async function add() {
  if (!titulo.value.trim()) return
  error.value = ''
  const datos = {
    titulo: titulo.value.trim(),
    descripcion: descripcion.value.trim(),
    cropId: cropId.value,
    frecuenciaRiego: frecuenciaRiego.value,
  }
  titulo.value = ''
  descripcion.value = ''
  cropId.value = null
  // Un filtro de otra planta ocultaría la tarea recién creada.
  const f = filtroPlanta.value
  if (f && f !== (datos.cropId || 'general')) filtroPlanta.value = ''
  try {
    await createTarea(orchardId, datos)
  } catch (e) {
    titulo.value = datos.titulo
    descripcion.value = datos.descripcion
    cropId.value = datos.cropId
    error.value = mensajeError(e, 'No se pudo crear la tarea.')
    console.error(e)
  }
}

async function toggle(t) {
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

async function remove(t) {
  if (!confirm('¿Eliminar esta tarea?')) return
  error.value = ''
  try {
    await deleteTarea(orchardId, t.id)
  } catch (e) {
    error.value = mensajeError(e, 'No se pudo eliminar la tarea.')
    console.error(e)
  }
}
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
.task-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 640px;
  margin-bottom: 28px;
}
.task-form .full,
.task-form select {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.95rem;
}
.task-form .row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.task-form label {
  flex: 1;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
}
.task-form button {
  align-self: flex-start;
  padding: 10px 20px;
  background: #0284c7;
  color: white;
  border: none;
  border-radius: 8px;
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
  max-width: 320px;
  padding: 9px 11px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  margin-bottom: 14px;
}
.list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-width: 720px;
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
  background: #fff;
  border-color: #f1f5f9;
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
  color: #6b7280;
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
}
.tag.crop {
  background: #e8f3ea;
  color: #2e7d4f;
}
.tag.water {
  background: #e7f1fb;
  color: #0369a1;
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
.error {
  color: #dc2626;
}
</style>
