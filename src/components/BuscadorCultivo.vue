<template>
  <div class="buscador" @focusout="alSalir">
    <input
      id="nuevo-cultivo"
      v-model="texto"
      role="combobox"
      autocomplete="off"
      aria-autocomplete="list"
      aria-controls="nuevo-cultivo-lista"
      :aria-expanded="abierto"
      :aria-activedescendant="abierto && activo >= 0 ? `sugerencia-${activo}` : undefined"
      placeholder="Nuevo cultivo: escribe tomate, lechuga, fresa…"
      @input="abierto = true; activo = 0"
      @focus="abierto = !!texto.trim()"
      @keydown.down.prevent="mover(1)"
      @keydown.up.prevent="mover(-1)"
      @keydown.enter.prevent="elegirActivo"
      @keydown.esc="abierto = false"
    />
    <ul v-if="abierto && texto.trim()" id="nuevo-cultivo-lista" class="lista" role="listbox">
      <li
        v-for="(c, i) in sugerencias"
        :id="`sugerencia-${i}`"
        :key="c.id"
        role="option"
        :aria-selected="i === activo"
        :class="{ activo: i === activo }"
        @mousedown.prevent="elegir(c)"
        @mousemove="activo = i"
      >
        <img :src="c.foto" alt="" width="44" height="33" />
        <span class="nombre">{{ c.nombre }}</span>
        <span class="familia">{{ c.familia }}</span>
      </li>
      <li
        :id="`sugerencia-${sugerencias.length}`"
        role="option"
        class="propio"
        :aria-selected="activo === sugerencias.length"
        :class="{ activo: activo === sugerencias.length }"
        @mousedown.prevent="personalizado"
        @mousemove="activo = sugerencias.length"
      >
        <Plus :size="16" /> Crear “{{ texto.trim() }}” como cultivo personalizado
      </li>
    </ul>
  </div>
</template>

<script setup>
// Buscador con autocompletado sobre la biblioteca. Si no se elige ninguna variedad,
// lo escrito se puede crear igualmente como cultivo personalizado.
import { computed, ref } from 'vue'
import { Plus } from 'lucide-vue-next'
import { buscarBiblioteca } from '../data/cropsLibrary'

const emit = defineEmits(['elegir', 'personalizado'])

const MAX_SUGERENCIAS = 8
const texto = ref('')
const abierto = ref(false)
const activo = ref(0)

const sugerencias = computed(() =>
  texto.value.trim() ? buscarBiblioteca(texto.value).slice(0, MAX_SUGERENCIAS) : [],
)

function mover(paso) {
  if (!texto.value.trim()) return
  abierto.value = true
  const total = sugerencias.value.length + 1
  activo.value = (activo.value + paso + total) % total
}

function reiniciar() {
  texto.value = ''
  abierto.value = false
  activo.value = 0
}

function elegir(c) {
  emit('elegir', c)
  reiniciar()
}

function personalizado() {
  emit('personalizado', texto.value.trim())
  reiniciar()
}

function elegirActivo() {
  if (!texto.value.trim()) return
  const c = sugerencias.value[activo.value]
  if (c) elegir(c)
  else personalizado()
}

function alSalir(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) abierto.value = false
}
</script>

<style scoped>
.buscador {
  position: relative;
  width: 100%;
}
input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  font-size: 0.92rem;
}
.lista {
  position: absolute;
  z-index: 20;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 340px;
  overflow-y: auto;
  list-style: none;
  margin: 0;
  padding: 4px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-elevated);
}
li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
}
li.activo {
  background: var(--color-primary-soft);
}
li img {
  width: 44px;
  height: 33px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
}
.nombre {
  flex: 1;
  min-width: 0;
  font-size: 0.92rem;
}
.familia {
  font-size: 0.78rem;
  color: var(--color-text-soft);
}
.propio {
  border-top: 1px solid var(--color-border);
  border-radius: 0 0 6px 6px;
  margin-top: 4px;
  padding-block: 9px;
  font-size: 0.88rem;
  color: var(--color-primary-dark);
  font-weight: 600;
  overflow-wrap: anywhere;
}
</style>
