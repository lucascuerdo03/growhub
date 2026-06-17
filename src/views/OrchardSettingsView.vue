<template>
  <div>
    <router-link :to="`/orchard/${orchardId}`" class="back">← Volver al huerto</router-link>
    <h1>Ajustes del huerto</h1>

    <p v-if="loading" class="muted">Cargando…</p>

    <template v-else-if="huerto">
      <form class="form" @submit.prevent="save">
        <label>Nombre</label>
        <input v-model="nombre" placeholder="Nombre del huerto" />

        <label>Descripción</label>
        <textarea v-model="descripcion" rows="3" placeholder="Descripción"></textarea>

        <label>Ubicación</label>
        <p class="hint">Haz clic en el mapa para marcar la ubicación exacta.</p>
        <LocationMap :lat="lat" :lng="lng" editable @update="onPick" />
        <p class="coords" v-if="lat != null">
          📍 {{ lat.toFixed(5) }}, {{ lng.toFixed(5) }}
        </p>

        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="saved" class="success">Cambios guardados.</p>

        <button type="submit" :disabled="saving">
          {{ saving ? 'Guardando…' : 'Guardar cambios' }}
        </button>
      </form>

      <div class="danger">
        <h3>Zona peligrosa</h3>
        <button class="del" @click="remove">Eliminar huerto</button>
      </div>
    </template>

    <p v-else class="error">No se encontró el huerto.</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LocationMap from '../components/LocationMap.vue'
import {
  getHuerto,
  updateHuerto,
  deleteHuerto,
} from '../services/firestoreService'

const route = useRoute()
const router = useRouter()
const orchardId = route.params.id

const huerto = ref(null)
const nombre = ref('')
const descripcion = ref('')
const lat = ref(null)
const lng = ref(null)
const loading = ref(true)
const saving = ref(false)
const saved = ref(false)
const error = ref('')

function onPick({ lat: la, lng: ln }) {
  lat.value = la
  lng.value = ln
  saved.value = false
}

async function load() {
  loading.value = true
  try {
    huerto.value = await getHuerto(orchardId)
    if (huerto.value) {
      nombre.value = huerto.value.nombre || ''
      descripcion.value = huerto.value.descripcion || ''
      lat.value = huerto.value.lat ?? null
      lng.value = huerto.value.lng ?? null
    }
  } catch (e) {
    error.value = 'No se pudo cargar el huerto.'
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  saved.value = false
  error.value = ''
  try {
    await updateHuerto(orchardId, {
      nombre: nombre.value.trim(),
      descripcion: descripcion.value.trim(),
      lat: lat.value,
      lng: lng.value,
    })
    saved.value = true
  } catch (e) {
    error.value = 'No se pudieron guardar los cambios.'
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
    error.value = 'No se pudo eliminar el huerto.'
    console.error(e)
  }
}

onMounted(load)
</script>

<style scoped>
.back {
  display: inline-block;
  margin-bottom: 12px;
  color: #4a90d9;
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
  background: #4a90d9;
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
