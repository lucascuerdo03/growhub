<template>
  <span class="user-avatar" :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${size * 0.42}px` }">
    <img v-if="src && !fallo" :src="src" alt="" @error="fallo = true" />
    <span v-else>{{ inicial }}</span>
  </span>
</template>

<script setup>
// Foto de perfil (userPhotos/{uid}, en tiempo real) o, si no hay, la inicial.
// `url` es la foto por enlace de las cuentas antiguas.
import { computed, ref, watch } from 'vue'
import { useVivo } from '../composables/useVivo'
import { fuenteFotoUsuario } from '../services/firestoreService'

const props = defineProps({
  uid: { type: String, default: '' },
  nombre: { type: String, default: '' },
  url: { type: String, default: '' },
  size: { type: Number, default: 36 },
})

const { datos } = useVivo(() => (props.uid ? fuenteFotoUsuario(props.uid) : null))
const src = computed(() => datos.value[0]?.data || props.url || '')
const inicial = computed(() => (props.nombre || '?').charAt(0).toUpperCase())
const fallo = ref(false)
watch(src, () => (fallo.value = false))
</script>

<style scoped>
.user-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-weight: 600;
}
.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
