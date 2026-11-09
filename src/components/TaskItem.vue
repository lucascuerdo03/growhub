<template>
  <div class="tarea" :class="{ hecha, atrasada }">
    <button
      type="button"
      class="check"
      role="checkbox"
      :aria-checked="hecha"
      :aria-label="`Completar ${tarea.titulo}`"
      :disabled="!puedeCompletar"
      @click="alPulsar"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path class="marca" d="M6 12.5l4 4 8-9" /></svg>
    </button>
    <div class="info">
      <span class="titulo">{{ tarea.titulo }}</span>
      <p v-if="tarea.descripcion" class="desc">{{ tarea.descripcion }}</p>
      <div class="etiquetas">
        <span v-if="tarea.fecha && !tarea.completada" class="fecha">{{ textoVencimiento(tarea.fecha, hoy) }}</span>
        <router-link v-if="huerto" :to="`/orchard/${huerto.id}`" class="enlace">{{ huerto.nombre }}</router-link>
        <span v-if="planta">{{ planta }}</span>
        <span v-if="tarea.completada && tarea.completadaEl">Hecha el {{ fechaCorta(tarea.completadaEl) }}</span>
        <label v-if="puedeEditar && !tarea.completada" class="frecuencia editable">
          <Repeat :size="12" aria-hidden="true" />
          <select :value="frecuencia?.valor || ''" :aria-label="`Frecuencia de ${tarea.titulo}`" @change="$emit('frecuencia', tarea, $event.target.value)">
            <option v-for="f in FRECUENCIAS" :key="f.valor" :value="f.valor">{{ f.texto }}</option>
          </select>
        </label>
        <span v-else-if="frecuencia" class="frecuencia"><Repeat :size="12" aria-hidden="true" /> {{ frecuencia.texto }}</span>
      </div>
    </div>
    <button v-if="puedeBorrar" type="button" class="borrar" :aria-label="`Eliminar ${tarea.titulo}`" @click="$emit('remove', tarea)">
      <X :size="15" />
    </button>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Repeat, X } from 'lucide-vue-next'
import { fechaCorta, hoyISO, textoVencimiento } from '../utils/fechas'
import { FRECUENCIAS, frecuenciaDe } from '../utils/tareas'

const props = defineProps({
  tarea: { type: Object, required: true },
  planta: { type: String, default: '' },
  // Huerto al que enlazar, en las listas que mezclan varios.
  huerto: { type: Object, default: null },
  puedeCompletar: { type: Boolean, default: true },
  puedeBorrar: { type: Boolean, default: false },
  // Cambiar la frecuencia o dejar de repetirla (permiso de gestionar tareas).
  puedeEditar: { type: Boolean, default: false },
})
const emit = defineEmits(['toggle', 'remove', 'frecuencia'])
const frecuencia = computed(() => frecuenciaDe(props.tarea))

// La marca se dibuja al pulsar, antes de que la lista saque la tarea (ver
// .tarea-lista-* en base.css). Si la escritura falla, vuelve a su estado real.
const marcando = ref(false)
const hecha = computed(() => !!props.tarea.completada || marcando.value)
let temporizador = null
function alPulsar() {
  if (!props.tarea.completada) {
    marcando.value = true
    clearTimeout(temporizador)
    temporizador = setTimeout(() => (marcando.value = false), 2000)
  }
  emit('toggle', props.tarea)
}
watch(
  () => props.tarea.completada,
  () => (marcando.value = false),
)
onBeforeUnmount(() => clearTimeout(temporizador))

const hoy = hoyISO()
const atrasada = computed(() => !props.tarea.completada && props.tarea.fecha && props.tarea.fecha < hoy)
</script>

<style scoped>
.tarea {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding: 11px 0;
  border-top: 1px solid var(--color-border);
}
.check {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  margin-top: 1px;
  padding: 2px;
  border-radius: 50%;
  border: 1.5px solid var(--color-input-border);
  background: var(--color-surface);
  cursor: pointer;
  transition: background 0.18s, border-color 0.18s;
}
.check:hover:not(:disabled) {
  border-color: var(--color-verde);
}
.check:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
.check:disabled {
  cursor: default;
  background: var(--color-border-soft);
}
.check svg {
  display: block;
  width: 100%;
  height: 100%;
  fill: none;
}
.marca {
  stroke: #fff;
  stroke-width: 2.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 22;
  stroke-dashoffset: 22;
  transition: stroke-dashoffset 0.25s ease-out;
}
.hecha .check {
  background: var(--color-verde);
  border-color: var(--color-verde);
}
.hecha .marca {
  stroke-dashoffset: 0;
}
.info {
  flex: 1;
  min-width: 0;
}
.titulo {
  font-weight: 500;
  overflow-wrap: anywhere;
  transition: color 0.2s;
}
.hecha .titulo {
  text-decoration: line-through;
  color: var(--color-text-soft);
}
.desc {
  margin: 2px 0 0;
  font-size: 0.86rem;
  color: var(--color-text-soft);
}
.etiquetas {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 10px;
  margin-top: 2px;
  font-size: 0.78rem;
  color: var(--color-text-soft);
}
.fecha {
  font-weight: 600;
  color: var(--color-verde-oscuro);
}
.atrasada .fecha {
  color: var(--color-danger);
}
.frecuencia {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.frecuencia.editable {
  position: relative;
  color: var(--color-text-soft);
}
.frecuencia select {
  appearance: none;
  border: none;
  background: transparent;
  padding: 0 2px;
  font: inherit;
  color: inherit;
  text-decoration: underline dotted;
  text-underline-offset: 3px;
  cursor: pointer;
}
.frecuencia select:hover,
.frecuencia select:focus-visible {
  color: var(--color-primary);
}
.enlace {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.borrar {
  display: flex;
  background: transparent;
  border: none;
  color: var(--color-text-soft);
  cursor: pointer;
  padding: 4px;
  opacity: 0.7;
}
.borrar:hover {
  color: var(--color-danger);
  opacity: 1;
}
</style>
