<template>
  <div class="stored-image">
    <img v-if="src && !fallo" :src="src" :alt="alt" @error="fallo = true" />
    <slot v-else />
  </div>
</template>

<script setup>
// Muestra una foto guardada en la subcolección `photos` del huerto (fotoId) o,
// si no la hay, una URL antigua. Sin imagen, o si falla, muestra el slot.
import { ref, watch } from 'vue'
import { getFoto } from '../services/firestoreService'

const props = defineProps({
  orchardId: { type: String, default: '' },
  fotoId: { type: String, default: '' },
  url: { type: String, default: '' },
  alt: { type: String, default: '' },
})

const src = ref('')
const fallo = ref(false)
let peticion = 0

async function cargar() {
  const actual = ++peticion
  fallo.value = false
  if (!props.fotoId) {
    src.value = props.url || ''
    return
  }
  src.value = ''
  let resultado = ''
  try {
    resultado = await getFoto(props.orchardId, props.fotoId)
  } catch (e) {
    console.warn('No se pudo cargar la foto:', e)
  }
  if (actual === peticion) src.value = resultado || props.url || ''
}

watch(() => [props.orchardId, props.fotoId, props.url], cargar, { immediate: true })
</script>

<style scoped>
.stored-image {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.stored-image img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
