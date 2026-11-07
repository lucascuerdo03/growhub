<template>
  <div>
    <p v-if="loading" class="muted center">Cargando…</p>

    <template v-else>
      <header class="head">
        <div>
          <h1>Hola, {{ nombreCorto }}</h1>
          <p class="sub">Panel de gestión de tus huertos.</p>
        </div>
        <button class="btn-primary" @click="openModal">
          <Plus :size="18" /> Nuevo huerto
        </button>
      </header>

      <div class="stats">
        <div class="stat">
          <span class="stat-ic" style="--bg:#e0f2fe;--c:#0284c7"><Sprout :size="20" /></span>
          <div><strong>{{ totals.huertos }}</strong><span>Huertos</span></div>
        </div>
        <div class="stat">
          <span class="stat-ic" style="--bg:#dcfce7;--c:#16a34a"><Leaf :size="20" /></span>
          <div><strong>{{ totals.cultivos }}</strong><span>Cultivos</span></div>
        </div>
        <div class="stat">
          <span class="stat-ic" style="--bg:#fef3c7;--c:#d97706"><ListChecks :size="20" /></span>
          <div><strong>{{ totals.tareasPend }}</strong><span>Tareas pendientes</span></div>
        </div>
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <h2 class="section-title">Mis huertos</h2>

      <div v-if="!huertos.length" class="empty">
        <Sprout :size="40" class="empty-ic" />
        <h3>No tienes huertos todavía</h3>
        <p>Crea tu primer huerto para empezar a gestionar cultivos, sensores y tareas.</p>
        <button class="btn-primary" @click="openModal"><Plus :size="18" /> Crear huerto</button>
      </div>

      <div v-else class="grid">
        <div v-for="h in huertos" :key="h.id" class="card">
          <div class="card-media">
            <StoredImage class="card-img" :orchard-id="h.id" :foto-id="h.fotoId" :url="h.imagen" :alt="h.nombre">
              <Sprout :size="30" class="media-ic" />
            </StoredImage>
            <button class="del" title="Eliminar" @click="remove(h.id)"><X :size="15" /></button>
          </div>
          <div class="card-body">
            <h3>{{ h.nombre }}</h3>
            <p class="loc">{{ h.descripcion || 'Sin ubicación' }}</p>
            <div class="meta">
              <span>{{ h.nCultivos }} cultivos</span>
              <span>{{ h.nTareasPend }} tareas</span>
            </div>
            <router-link :to="`/orchard/${h.id}`" class="btn-outline">Abrir huerto</router-link>
          </div>
        </div>

        <button class="add-card" @click="openModal">
          <Plus :size="26" />
          <span>Nuevo huerto</span>
        </button>
      </div>
    </template>

    <BaseModal v-if="showModal" title="Nuevo huerto" @close="closeModal">
      <form id="orchard-form" @submit.prevent="add">
        <label>Nombre del huerto</label>
        <input v-model="nombre" placeholder="Ej: Invernadero Tomates" autofocus />

        <label>Ubicación</label>
        <input v-model="descripcion" placeholder="Ej: Finca Sur, Salamanca" />

        <label>Foto (opcional)</label>
        <ImageUpload v-model="foto" />

        <label>Ubicación en el mapa (opcional)</label>
        <p class="hint">Haz clic en el mapa para marcar la ubicación exacta.</p>
        <LocationMap :lat="lat" :lng="lng" editable @update="onPick" />
        <p v-if="lat != null" class="coords">Coordenadas: {{ lat.toFixed(5) }}, {{ lng.toFixed(5) }}</p>

        <p v-if="modalError" class="error">{{ modalError }}</p>
      </form>

      <template #footer>
        <button type="button" class="btn-ghost" @click="closeModal">Cancelar</button>
        <button type="submit" form="orchard-form" class="btn-primary" :disabled="saving || !nombre.trim()">
          {{ saving ? 'Guardando…' : 'Guardar huerto' }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { Plus, Sprout, Leaf, ListChecks, X } from 'lucide-vue-next'
import { useAuth } from '../composables/useAuth'
import BaseModal from '../components/BaseModal.vue'
import ImageUpload from '../components/ImageUpload.vue'
import StoredImage from '../components/StoredImage.vue'
const LocationMap = defineAsyncComponent(() => import('../components/LocationMap.vue'))
import {
  getResumen,
  createHuerto,
  updateHuerto,
  deleteHuerto,
  createFoto,
} from '../services/firestoreService'

const { user } = useAuth()
const huertos = ref([])
const totals = ref({ huertos: 0, cultivos: 0, tareasPend: 0, sensores: 0 })
const loading = ref(true)
const error = ref('')

const showModal = ref(false)
const nombre = ref('')
const descripcion = ref('')
const foto = ref('')
const lat = ref(null)
const lng = ref(null)
const saving = ref(false)
const modalError = ref('')

const nombreCorto = computed(() => {
  const n = user.value?.displayName || user.value?.email || 'usuario'
  return n.split(' ')[0].split('@')[0]
})

function onPick({ lat: la, lng: ln }) {
  lat.value = la
  lng.value = ln
}
function openModal() {
  showModal.value = true
}
function closeModal() {
  showModal.value = false
  nombre.value = ''
  descripcion.value = ''
  foto.value = ''
  lat.value = null
  lng.value = null
  modalError.value = ''
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const r = await getResumen(user.value.uid)
    huertos.value = r.huertos
    totals.value = r.totals
  } catch (e) {
    error.value = 'No se pudieron cargar los huertos. Revisa tu conexión e inténtalo de nuevo.'
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function add() {
  if (!nombre.value.trim()) return
  saving.value = true
  modalError.value = ''
  const fotoNueva = foto.value
  let id
  try {
    id = await createHuerto(user.value.uid, {
      nombre: nombre.value.trim(),
      descripcion: descripcion.value.trim(),
      lat: lat.value,
      lng: lng.value,
    })
  } catch (e) {
    modalError.value = 'No se pudo crear el huerto: ' + (e?.message || 'error desconocido')
    console.error(e)
    saving.value = false
    return
  }
  closeModal()
  // La foto vive en una subcolección del huerto, así que va después de crearlo.
  let errorFoto = ''
  if (fotoNueva) {
    try {
      await updateHuerto(id, { fotoId: await createFoto(id, fotoNueva) })
    } catch (e) {
      errorFoto = 'El huerto se ha creado, pero no se pudo guardar la foto.'
      console.error(e)
    }
  }
  await load()
  error.value = errorFoto
  saving.value = false
}

async function remove(id) {
  if (!confirm('¿Eliminar este huerto? Esta acción no se puede deshacer.')) return
  try {
    await deleteHuerto(id)
    await load()
  } catch (e) {
    error.value = 'No se pudo eliminar el huerto.'
    console.error(e)
  }
}

onMounted(load)
</script>

<style scoped>
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 26px;
  flex-wrap: wrap;
}
.head h1 {
  margin: 0;
  font-size: 1.7rem;
}
.sub {
  color: var(--color-text-soft);
  margin: 4px 0 0;
}
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 30px;
}
.stat {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  padding: 18px 20px;
}
.stat-ic {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  background: var(--bg);
  color: var(--c);
  display: flex;
  align-items: center;
  justify-content: center;
}
.stat div {
  display: flex;
  flex-direction: column;
}
.stat strong {
  font-size: 1.6rem;
  line-height: 1;
}
.stat span {
  font-size: 0.82rem;
  color: var(--color-text-soft);
}
.section-title {
  margin: 0 0 18px;
  font-size: 1.2rem;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  transition: box-shadow 0.15s;
}
.card:hover {
  box-shadow: var(--shadow-elevated);
}
.card-media {
  position: relative;
  height: 110px;
  background: #eef4fb;
  color: var(--color-primary);
}
.card-img {
  width: 100%;
  height: 100%;
}
.media-ic {
  opacity: 0.6;
}
.card-body {
  padding: 18px;
}
.card-body h3 {
  margin: 0 0 4px;
  font-size: 1.1rem;
}
.loc {
  color: var(--color-text-soft);
  margin: 0 0 12px;
  font-size: 0.9rem;
}
.meta {
  display: flex;
  gap: 14px;
  font-size: 0.82rem;
  color: var(--color-text-soft);
  margin-bottom: 14px;
}
.del {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--color-border);
  color: var(--color-text-soft);
  width: 26px;
  height: 26px;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  cursor: pointer;
}
.del:hover {
  color: var(--color-danger);
  border-color: var(--color-danger);
}
.add-card {
  border: 1px dashed var(--color-input-border);
  background: transparent;
  border-radius: var(--radius-md);
  min-height: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--color-text-soft);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
}
.add-card:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.empty {
  text-align: center;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  padding: 50px 32px;
}
.empty-ic {
  color: var(--color-primary);
  opacity: 0.7;
}
.empty h3 {
  margin: 14px 0 6px;
  font-size: 1.25rem;
}
.empty p {
  color: var(--color-text-soft);
  margin: 0 0 20px;
}
/* Botones */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  padding: 10px 18px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.92rem;
  cursor: pointer;
}
.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}
.btn-primary:disabled {
  opacity: 0.55;
  cursor: default;
}
.btn-outline {
  display: inline-block;
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  padding: 9px 16px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.88rem;
  text-decoration: none;
}
.btn-outline:hover {
  background: var(--color-primary);
  color: #fff;
}
.btn-ghost {
  background: transparent;
  border: none;
  color: var(--color-text-soft);
  font-weight: 600;
  cursor: pointer;
  padding: 10px 14px;
}
/* Modal form */
label {
  display: block;
  font-weight: 600;
  font-size: 0.88rem;
  margin: 14px 0 6px;
}
label:first-child {
  margin-top: 0;
}
input {
  width: 100%;
  padding: 11px 13px;
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
}
input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}
.hint {
  font-size: 0.82rem;
  color: var(--color-text-soft);
  margin: 0 0 8px;
}
.coords {
  font-size: 0.85rem;
  color: var(--color-text-soft);
  margin: 8px 0 0;
}
.muted {
  color: var(--color-text-soft);
}
.center {
  text-align: center;
}
.error {
  color: var(--color-danger);
  margin: 8px 0;
}
</style>
