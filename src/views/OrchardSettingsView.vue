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

        <label>Foto del huerto (URL)</label>
        <input v-model="imagen" placeholder="https://…/foto.jpg" />
        <div v-if="imagen" class="preview" :style="{ backgroundImage: `url(${imagen})` }"></div>

        <label>Ubicación</label>
        <p class="hint">Haz clic en el mapa para marcar la ubicación exacta.</p>
        <LocationMap :lat="lat" :lng="lng" editable @update="onPick" />
        <p class="coords" v-if="lat != null">
          📍 {{ lat.toFixed(5) }}, {{ lng.toFixed(5) }}
        </p>

        <label class="check">
          <input type="checkbox" v-model="publico" />
          <span>Huerto público (visible en la Comunidad)</span>
        </label>

        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="saved" class="success">Cambios guardados.</p>

        <button type="submit" :disabled="saving">
          {{ saving ? 'Guardando…' : 'Guardar cambios' }}
        </button>
      </form>

      <!-- Equipo -->
      <section class="team">
        <h3>👥 Equipo del huerto</h3>
        <p class="hint">Añade colaboradores por email. Podrán ver y editar este huerto.</p>
        <form class="team-add" @submit.prevent="addEmail">
          <input v-model="nuevoEmail" type="email" placeholder="colaborador@email.com" />
          <button type="submit" :disabled="!nuevoEmail.trim()">Añadir</button>
        </form>
        <p v-if="teamMsg" class="hint">{{ teamMsg }}</p>
        <ul v-if="colaboradores.length" class="team-list">
          <li v-for="em in colaboradores" :key="em">
            <span>👤 {{ em }}</span>
            <button class="del-sm" @click="removeEmail(em)">Quitar</button>
          </li>
        </ul>
        <p v-else class="muted small">Todavía no hay colaboradores.</p>
      </section>

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
  addColaborador,
  removeColaborador,
} from '../services/firestoreService'

const route = useRoute()
const router = useRouter()
const orchardId = route.params.id

const huerto = ref(null)
const publico = ref(false)
const colaboradores = ref([])
const nuevoEmail = ref('')
const teamMsg = ref('')
const nombre = ref('')
const descripcion = ref('')
const imagen = ref('')
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
      imagen.value = huerto.value.imagen || ''
      publico.value = huerto.value.publico || false
      colaboradores.value = huerto.value.colaboradoresEmails || []
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
      imagen: imagen.value.trim(),
      publico: publico.value,
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

async function addEmail() {
  const em = nuevoEmail.value.trim().toLowerCase()
  if (!em) return
  teamMsg.value = ''
  try {
    await addColaborador(orchardId, em)
    if (!colaboradores.value.includes(em)) colaboradores.value.push(em)
    nuevoEmail.value = ''
    teamMsg.value = `✓ ${em} añadido.`
  } catch (e) {
    teamMsg.value = 'No se pudo añadir el colaborador.'
    console.error(e)
  }
}

async function removeEmail(em) {
  try {
    await removeColaborador(orchardId, em)
    colaboradores.value = colaboradores.value.filter((x) => x !== em)
  } catch (e) {
    console.error(e)
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
.preview {
  height: 130px;
  border-radius: var(--radius-sm);
  background-size: cover;
  background-position: center;
  margin-top: 8px;
  border: 1px solid var(--color-border);
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
