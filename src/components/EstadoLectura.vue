<template>
  <span class="estado-lectura" :class="{ antigua: ms !== null && !reciente }">
    <template v-if="ms === null">Sin lecturas</template>
    <template v-else-if="reciente">{{ haceTexto(ms, ahora) }}</template>
    <template v-else>Sin datos recientes · última {{ haceTexto(ms, ahora) }}</template>
  </span>
</template>

<script setup>
// Antigüedad de la última lectura de un sensor, actualizada en vivo.
import { computed } from 'vue'
import { useAhora } from '../composables/useAhora'
import { esReciente, haceTexto, msDe } from '../utils/lecturas'

const props = defineProps({
  // Última lectura del sensor (o null).
  lectura: { type: Object, default: null },
})
const ahora = useAhora()
const ms = computed(() => msDe(props.lectura))
const reciente = computed(() => esReciente(ms.value, ahora.value))
</script>

<style scoped>
.estado-lectura {
  font-size: 0.78rem;
  color: var(--color-text-soft);
}
.antigua {
  color: var(--color-tierra-oscuro);
  font-weight: 600;
}
</style>
