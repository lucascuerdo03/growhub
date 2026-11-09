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
        <input v-model="fecha" class="fecha" type="date" aria-label="Fecha de la tarea" />
        <select v-model="frecuencia" aria-label="Se repite">
          <option v-for="f in FRECUENCIAS" :key="f.valor" :value="f.valor">{{ f.texto }}</option>
        </select>
        <button type="submit" :disabled="saving || !titulo.trim()">Añadir</button>
      </div>
    </form>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="!listos" class="muted">Cargando…</p>
    <template v-else-if="!huertos.length">
      <div class="empty">
        <Ilustracion tipo="huerto" />
        <p>Aún no tienes huertos.</p>
        <router-link to="/dashboard" class="link">Crea tu primer huerto →</router-link>
      </div>
    </template>
    <div v-else-if="!tareas.length" class="empty">
      <Ilustracion tipo="tareas" />
      <p>No hay tareas todavía. Crea la primera arriba.</p>
    </div>

    <template v-else>
    <select v-if="opcionesPlanta.length" v-model="filtroPlanta" class="task-filter" aria-label="Filtrar por planta">
      <option value="">Todas las plantas</option>
      <option value="general">General</option>
      <option v-for="o in opcionesPlanta" :key="o.valor" :value="o.valor">{{ o.etiqueta }}</option>
    </select>
    <p v-if="!tareasFiltradas.length" class="muted">No hay tareas para esta planta.</p>
    <p v-if="aviso" class="aviso-tarea" role="status">{{ aviso }}</p>
    <ListaTareas
      v-if="tareasFiltradas.length"
      class="list"
      :tareas="tareasFiltradas"
      :clave-de="(t) => t.orchardId + t.id"
      :planta-de="plantaDe"
      :huerto-de="(t) => ({ id: t.orchardId, nombre: t.orchardNombre })"
      :permisos-de="permisosDe"
      @toggle="alternar"
      @remove="borrar"
      @frecuencia="cambiarFrecuencia"
    />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useHuertos, usePorHuerto } from '../composables/useHuertos'
import { permisosEn, mensajeError } from '../utils/permissions'
import { hoyISO } from '../utils/fechas'
import { FRECUENCIAS } from '../utils/tareas'
import { useAccionesTarea } from '../composables/useAccionesTarea'
import ListaTareas from '../components/ListaTareas.vue'
import Ilustracion from '../components/Ilustracion.vue'
import {
  fuenteCultivos,
  fuenteTareas,
  createTarea,
} from '../services/firestoreService'

const { user } = useAuth()
const { huertos, listos } = useHuertos()
const { porHuerto: cultivos } = usePorHuerto(fuenteCultivos)
const { porHuerto: tareasPorHuerto } = usePorHuerto(fuenteTareas)

const cropId = ref('')
const filtroPlanta = ref('')
const titulo = ref('')
const orchardId = ref(null)
const frecuencia = ref('')
const fecha = ref(hoyISO())
const saving = ref(false)
const error = ref('')
const aviso = ref('')

const nombreHuerto = (id) => huertos.value.find((h) => h.id === id)?.nombre || ''
const tareas = computed(() =>
  huertos.value
    .flatMap((h) =>
      (tareasPorHuerto.value[h.id] || []).map((t) => ({ ...t, orchardId: h.id, orchardNombre: h.nombre })),
    )
)
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
const permisosDe = (t) =>
  permisosEn(huertos.value.find((h) => h.id === t.orchardId), user.value.uid)

// Las plantas elegibles dependen del huerto seleccionado.
watch(orchardId, () => (cropId.value = ''))
// Si el huerto elegido deja de ser editable (me cambian el rol), se elige otro.
watch(
  huertosEditables,
  (lista) => {
    if (!lista.some((h) => h.id === orchardId.value)) orchardId.value = lista[0]?.id ?? null
  },
  { immediate: true },
)

async function add() {
  if (!titulo.value.trim() || !orchardId.value) return
  error.value = ''
  const destino = orchardId.value
  const datos = {
    titulo: titulo.value.trim(),
    frecuencia: frecuencia.value,
    cropId: cropId.value || null,
    fecha: fecha.value,
  }
  titulo.value = ''
  // Un filtro de otra planta ocultaría la tarea recién creada.
  const clave = datos.cropId ? `${destino}/${datos.cropId}` : 'general'
  if (filtroPlanta.value && filtroPlanta.value !== clave) filtroPlanta.value = ''
  try {
    await createTarea(destino, datos)
  } catch (e) {
    titulo.value = datos.titulo
    error.value = mensajeError(e, 'No se pudo crear la tarea.')
    console.error(e)
  }
}

const { alternar, cambiarFrecuencia, borrar } = useAccionesTarea({
  orchardIdDe: (t) => t.orchardId,
  permisosDe,
  error,
  aviso,
})
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
.task-form .fecha {
  padding: 10px 12px;
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-sm);
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
  max-width: 760px;
}
.list :deep(.tarea:first-child) {
  border-top: none;
}
.muted {
  color: var(--color-text-soft);
}
.error {
  color: var(--color-danger);
}
.empty {
  padding: 24px 0;
  max-width: 420px;
  color: var(--color-text-soft);
}
.empty .link {
  font-weight: 600;
  text-decoration: none;
}
</style>
