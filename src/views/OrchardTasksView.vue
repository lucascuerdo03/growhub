<template>
  <div>
    <router-link :to="`/orchard/${orchardId}`" class="back">← Volver al huerto</router-link>
    <h1>Tareas</h1>

    <form v-if="permisos.manageTasks" class="task-form" @submit.prevent="add">
      <input v-model="titulo" class="full" placeholder="Título de la tarea (ej: Regar tomates)" />
      <input v-model="descripcion" class="full" placeholder="Descripción (opcional)" />
      <input v-model="fecha" class="full" type="date" aria-label="Fecha de la tarea" />

      <div class="row">
        <label>
          <span>Cultivo</span>
          <select v-model="cropId">
            <option :value="null">General</option>
            <option v-for="c in cultivos" :key="c.id" :value="c.id">{{ c.nombre }}</option>
          </select>
        </label>

        <label>
          <span>Se repite</span>
          <select v-model="frecuencia">
            <option v-for="f in FRECUENCIAS" :key="f.valor" :value="f.valor">{{ f.texto }}</option>
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
    <p v-if="aviso" class="aviso-tarea" role="status">{{ aviso }}</p>
    <ListaTareas
      v-if="tareasFiltradas.length"
      class="list"
      :tareas="tareasFiltradas"
      :planta-de="plantaDe"
      :permisos-de="() => permisos"
      @toggle="alternar"
      @remove="borrar"
      @frecuencia="cambiarFrecuencia"
    />
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useHuerto } from '../composables/useHuertos'
import { useVivo } from '../composables/useVivo'
import { mensajeError } from '../utils/permissions'
import { hoyISO } from '../utils/fechas'
import { FRECUENCIAS } from '../utils/tareas'
import { useAccionesTarea } from '../composables/useAccionesTarea'
import ListaTareas from '../components/ListaTareas.vue'
import {
  fuenteCultivos,
  fuenteTareas,
  createTarea,
} from '../services/firestoreService'

const route = useRoute()
const orchardId = route.params.id
const { huerto, permisos, listo } = useHuerto(orchardId)

const siHay = (fuente) => () => (huerto.value ? fuente(orchardId) : null)
const { datos: cultivos } = useVivo(siHay(fuenteCultivos))
const { datos: tareas } = useVivo(siHay(fuenteTareas))

const titulo = ref('')
const descripcion = ref('')
const cropId = ref(null)
const frecuencia = ref('')
const fecha = ref(hoyISO())
const saving = ref(false)
const error = ref('')
const filtroPlanta = ref('')
const aviso = ref('')

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
    frecuencia: frecuencia.value,
    fecha: fecha.value,
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

const { alternar, cambiarFrecuencia, borrar } = useAccionesTarea({
  orchardIdDe: () => orchardId,
  permisosDe: () => permisos.value,
  error,
  aviso,
})
</script>

<style scoped>
.back {
  display: inline-block;
  margin-bottom: 12px;
  color: var(--color-primary);
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
  background: var(--color-primary);
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
  max-width: 720px;
}
.muted {
  color: #6b7280;
}
.error {
  color: var(--color-danger);
}
</style>
