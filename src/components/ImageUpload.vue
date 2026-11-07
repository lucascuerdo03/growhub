<template>
  <div class="image-upload">
    <div v-if="hayImagen" class="iu-preview">
      <img v-if="modelValue" :src="modelValue" alt="Vista previa" />
      <StoredImage v-else class="iu-stored" :orchard-id="orchardId" :foto-id="fotoId" :url="url" alt="Foto actual" />
    </div>

    <div class="iu-actions">
      <label class="iu-btn" :class="{ busy: procesando }">
        <Camera :size="16" />
        {{ procesando ? 'Procesando…' : hayImagen ? 'Cambiar foto' : 'Subir foto' }}
        <input type="file" accept="image/*" :disabled="procesando" @change="onFile" />
      </label>
      <button v-if="hayImagen" type="button" class="iu-remove" @click="quitar">Quitar</button>
      <span v-if="modelValue" class="iu-size">{{ tamano }}</span>
    </div>

    <p v-if="error" class="iu-error">{{ error }}</p>
  </div>
</template>

<script setup>
// Selector de imagen con vista previa. `accept="image/*"` permite en el móvil
// elegir entre la cámara y la galería. Solo prepara la imagen: quien lo usa
// decide cuándo guardarla en Firestore.
//   v-model          data URL de la imagen nueva ('' si no hay)
//   v-model:removed  true si el usuario quita la foto que ya existía
import { ref, computed } from 'vue'
import { Camera } from 'lucide-vue-next'
import StoredImage from './StoredImage.vue'
import { comprimirImagen, bytesDeDataUrl } from '../utils/imagen'

const props = defineProps({
  modelValue: { type: String, default: '' },
  removed: { type: Boolean, default: false },
  // Foto ya guardada (solo en formularios de edición).
  orchardId: { type: String, default: '' },
  fotoId: { type: String, default: '' },
  url: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue', 'update:removed'])

const procesando = ref(false)
const error = ref('')

const hayImagen = computed(
  () => !!props.modelValue || (!props.removed && !!(props.fotoId || props.url)),
)
const tamano = computed(() => `${Math.round(bytesDeDataUrl(props.modelValue) / 1024)} KB`)

async function onFile(e) {
  const file = e.target.files?.[0]
  // Permite volver a elegir el mismo archivo después de quitarlo.
  e.target.value = ''
  if (!file) return
  procesando.value = true
  error.value = ''
  try {
    emit('update:modelValue', await comprimirImagen(file))
  } catch (err) {
    error.value = err.message
  } finally {
    procesando.value = false
  }
}

function quitar() {
  error.value = ''
  emit('update:modelValue', '')
  emit('update:removed', true)
}
</script>

<style scoped>
.iu-preview {
  height: 130px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  margin-bottom: 8px;
}
.iu-preview img,
.iu-stored {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.iu-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.iu-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin: 0;
  padding: 8px 14px;
  background: var(--color-surface);
  color: var(--color-primary-dark);
  border: 1px solid var(--color-primary-border);
  border-radius: var(--radius-sm);
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
}
.iu-btn:hover,
.iu-btn:focus-within {
  background: var(--color-primary-soft);
}
.iu-btn.busy {
  opacity: 0.6;
  cursor: default;
}
/* Oculto a la vista pero accesible con teclado. */
.iu-btn input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  opacity: 0;
  overflow: hidden;
}
.iu-remove {
  background: transparent;
  border: none;
  color: var(--color-text-soft);
  font-size: 0.86rem;
  cursor: pointer;
  padding: 4px;
}
.iu-remove:hover {
  color: var(--color-danger);
}
.iu-size {
  font-size: 0.8rem;
  color: var(--color-text-soft);
}
.iu-error {
  color: var(--color-danger);
  font-size: 0.85rem;
  margin: 6px 0 0;
}
</style>
