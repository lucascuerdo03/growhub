<template>
  <div>
    <router-link :to="`/orchard/${orchardId}`" class="back">← Volver al huerto</router-link>
    <h1>Ajustes del huerto</h1>

    <p v-if="!listo" class="muted">Cargando…</p>

    <p v-else-if="huerto && !permisos.admin" class="error">
      Solo el propietario o un administrador pueden cambiar los ajustes de este huerto.
    </p>

    <template v-else-if="huerto">
      <form class="form" @submit.prevent="save">
        <label>Nombre</label>
        <input v-model="nombre" placeholder="Nombre del huerto" />

        <label>Descripción</label>
        <textarea v-model="descripcion" rows="3" placeholder="Descripción"></textarea>

        <label>Foto del huerto</label>
        <ImageUpload
          v-model="foto"
          v-model:removed="fotoQuitada"
          :orchard-id="orchardId"
          :foto-id="huerto.fotoId"
          :url="huerto.imagen"
        />

        <label>Ubicación</label>
        <p class="hint">Haz clic en el mapa para marcar la ubicación exacta.</p>
        <LocationMap :lat="lat" :lng="lng" editable @update="onPick" />
        <p class="coords" v-if="lat != null">
          Coordenadas: {{ lat.toFixed(5) }}, {{ lng.toFixed(5) }}
        </p>

        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="saved" class="success">Cambios guardados.</p>

        <button type="submit" :disabled="saving">
          {{ saving ? 'Guardando…' : 'Guardar cambios' }}
        </button>
      </form>

      <div v-if="permisos.propietario" class="danger">
        <h3>Eliminar huerto</h3>
        <p class="hint">Esta acción es permanente y no se puede deshacer.</p>
        <button class="del" @click="remove">Eliminar huerto</button>
      </div>
    </template>

    <p v-else class="error">No tienes acceso a este huerto o ya no existe.</p>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHuerto } from '../composables/useHuertos'
import { mensajeError } from '../utils/permissions'
import LocationMap from '../components/LocationMap.vue'
import ImageUpload from '../components/ImageUpload.vue'
import {
  updateHuerto,
  deleteHuerto,
  resolverFoto,
  limpiarFoto,
} from '../services/firestoreService'

const route = useRoute()
const router = useRouter()
const orchardId = route.params.id
const { huerto, permisos, listo } = useHuerto(orchardId)
const nombre = ref('')
const descripcion = ref('')
const foto = ref('')
const fotoQuitada = ref(false)
const lat = ref(null)
const lng = ref(null)
const saving = ref(false)
const saved = ref(false)
const error = ref('')

function onPick({ lat: la, lng: ln }) {
  lat.value = la
  lng.value = ln
  saved.value = false
}

// El formulario se rellena una sola vez: un cambio de otro miembro no debe pisar
// lo que se está escribiendo.
const stop = watch(
  huerto,
  (h) => {
    if (!h) return
    nombre.value = h.nombre || ''
    descripcion.value = h.descripcion || ''
    lat.value = h.lat ?? null
    lng.value = h.lng ?? null
    queueMicrotask(() => stop())
  },
  { immediate: true },
)

async function save() {
  saving.value = true
  saved.value = false
  error.value = ''
  try {
    const anterior = huerto.value.fotoId || ''
    const fotoId = await resolverFoto(orchardId, anterior, foto.value, fotoQuitada.value)
    const cambios = {
      nombre: nombre.value.trim(),
      descripcion: descripcion.value.trim(),
      fotoId,
      // Una foto nueva o quitada sustituye también a la URL antigua, si la había.
      imagen: foto.value || fotoQuitada.value ? '' : huerto.value.imagen || '',
      lat: lat.value,
      lng: lng.value,
    }
    await updateHuerto(orchardId, cambios)
    foto.value = ''
    fotoQuitada.value = false
    await limpiarFoto(orchardId, anterior, fotoId)
    saved.value = true
  } catch (e) {
    error.value = mensajeError(e, 'No se pudieron guardar los cambios.')
    console.error(e)
  } finally {
    saving.value = false
  }
}

async function remove() {
  if (!confirm('¿Eliminar este huerto? Esta acción no se puede deshacer.')) return
  try {
    await deleteHuerto(orchardId)
    router.push('/dashboard')
  } catch (e) {
    error.value = mensajeError(e, 'No se pudo eliminar el huerto.')
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
.form {
  display: flex;
  flex-direction: column;
  max-width: 640px;
}
label {
  font-weight: 600;
  color: #374151;
  margin: 14px 0 4px;
}
input,
textarea {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.95rem;
}
.hint {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0 0 8px;
}
.coords {
  font-size: 0.9rem;
  color: #374151;
  margin: 8px 0 0;
}
button[type='submit'] {
  margin-top: 18px;
  padding: 12px;
  background: #0284c7;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
button[type='submit']:disabled {
  opacity: 0.6;
  cursor: default;
}
.check {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  font-weight: 600;
  cursor: pointer;
}
.check input {
  width: 18px;
  height: 18px;
}
.team {
  margin-top: 32px;
  padding: 22px;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  max-width: 640px;
}
.team h3 {
  margin: 0 0 6px;
}
.team-add {
  display: flex;
  gap: 8px;
  margin: 12px 0;
}
.team-add input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-sm);
}
.team-add button {
  background: var(--color-primary);
  color: #fff;
  border: none;
  padding: 10px 18px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
}
.team-add button:disabled {
  opacity: 0.55;
}
.team-list {
  list-style: none;
  padding: 0;
  margin: 10px 0 0;
}
.team-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-top: 1px solid var(--color-border-soft);
}
.del-sm {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-danger);
  padding: 5px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
  cursor: pointer;
}
.small {
  font-size: 0.85rem;
}
.danger {
  margin-top: 36px;
  padding: 20px;
  border: 1px solid #f3c2c2;
  border-radius: 10px;
  background: #fdf2f2;
  max-width: 640px;
}
.danger h3 {
  margin: 0 0 12px;
  color: #b91c1c;
}
.del {
  background: #dc2626;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.del:hover {
  background: #b91c1c;
}
.muted {
  color: #6b7280;
}
.error {
  color: #dc2626;
}
.success {
  color: #16a34a;
}
</style>
