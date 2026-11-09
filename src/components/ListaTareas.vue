<template>
  <div class="lista-tareas">
    <slot v-if="!pendientes.length" name="vacio">
      <p class="vacio">No hay tareas pendientes.</p>
    </slot>

    <!-- Los cuatro grupos están siempre montados: así la tarea que se completa
         puede terminar su animación aunque sea la última de su grupo. -->
    <section v-for="g in grupos" :key="g.clave" class="grupo" :class="g.clave">
      <h3 v-if="g.tareas.length" class="grupo-titulo">
        {{ g.titulo }} <span class="cuenta">{{ g.total }}</span>
      </h3>
      <TransitionGroup name="tarea-lista" tag="div">
        <TaskItem
          v-for="t in g.tareas"
          :key="claveDe(t)"
          :tarea="t"
          :planta="plantaDe(t)"
          :huerto="huertoDe(t)"
          :puede-completar="!!permisosDe(t).completeTasks"
          :puede-borrar="!!permisosDe(t).manageTasks"
          :puede-editar="!!permisosDe(t).manageTasks"
          @toggle="(x) => $emit('toggle', x)"
          @remove="(x) => $emit('remove', x)"
          @frecuencia="(x, f) => $emit('frecuencia', x, f)"
        />
      </TransitionGroup>
      <p v-if="g.total > g.tareas.length" class="mas">
        <slot name="mas" :ocultas="g.total - g.tareas.length">Y {{ g.total - g.tareas.length }} más.</slot>
      </p>
    </section>

    <template v-if="historial && completadas.length">
      <button type="button" class="historial" :aria-expanded="verHistorial" @click="verHistorial = !verHistorial">
        <ChevronRight :size="15" class="flecha" :class="{ abierta: verHistorial }" aria-hidden="true" />
        Historial: {{ completadas.length }} {{ completadas.length === 1 ? 'completada' : 'completadas' }}
      </button>
      <div v-if="verHistorial">
        <TaskItem
          v-for="t in completadas"
          :key="claveDe(t)"
          :tarea="t"
          :planta="plantaDe(t)"
          :huerto="huertoDe(t)"
          :puede-completar="!!permisosDe(t).completeTasks"
          :puede-borrar="!!permisosDe(t).manageTasks"
          @toggle="(x) => $emit('toggle', x)"
          @remove="(x) => $emit('remove', x)"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
// Tareas agrupadas en atrasadas, hoy, próximas y sin fecha, cada grupo por fecha,
// con las completadas debajo como historial.
import { computed, ref } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import TaskItem from './TaskItem.vue'
import { hoyISO } from '../utils/fechas'
import { GRUPOS, grupoDe, porCompletada, porFecha } from '../utils/tareas'

const props = defineProps({
  tareas: { type: Array, required: true },
  permisosDe: { type: Function, required: true },
  claveDe: { type: Function, default: (t) => t.id },
  plantaDe: { type: Function, default: () => '' },
  huertoDe: { type: Function, default: () => null },
  historial: { type: Boolean, default: true },
  // Máximo de próximas a la vista (0, todas), para el panel de inicio.
  maxProximas: { type: Number, default: 0 },
})
defineEmits(['toggle', 'remove', 'frecuencia'])

const verHistorial = ref(false)
const pendientes = computed(() => props.tareas.filter((t) => !t.completada))
const completadas = computed(() => props.tareas.filter((t) => t.completada).sort(porCompletada))

const grupos = computed(() => {
  const hoy = hoyISO()
  const ordenadas = [...pendientes.value].sort(porFecha)
  return GRUPOS.map((g) => {
    const todas = ordenadas.filter((t) => grupoDe(t, hoy) === g.clave)
    const limite = g.clave === 'proximas' && props.maxProximas ? props.maxProximas : todas.length
    return { ...g, total: todas.length, tareas: todas.slice(0, limite) }
  })
})
</script>

<style scoped>
.grupo-titulo {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin: 12px 0 2px;
  font-family: var(--font-texto);
  font-size: 0.74rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-soft);
}
/* Bajo cada título, la primera tarea no lleva línea encima. */
.grupo :deep(.tarea:first-child) {
  border-top: none;
}
.atrasadas .grupo-titulo {
  color: var(--color-danger);
}
.hoy .grupo-titulo {
  color: var(--color-verde-oscuro);
}
.cuenta {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  opacity: 0.8;
}
.vacio,
.mas {
  margin: 6px 0;
  color: var(--color-text-soft);
  font-size: 0.86rem;
}
.historial {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  margin-top: 10px;
  padding: 12px 0 4px;
  border: none;
  border-top: 1px solid var(--color-border-soft);
  background: transparent;
  color: var(--color-text-soft);
  font-weight: 700;
  font-size: 0.82rem;
  text-align: left;
  cursor: pointer;
}
.historial:hover {
  color: var(--color-text);
}
.flecha {
  transition: transform 0.15s;
}
.flecha.abierta {
  transform: rotate(90deg);
}
</style>
