<template>
  <div>
    <header class="page-head">
      <h1>Tus Huertos</h1>
      <p class="sub">Selecciona un huerto para gestionar sus sensores, cultivos y tareas.</p>
    </header>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="loading" class="muted center">Cargando…</p>

    <div v-else class="grid">
      <div v-for="h in huertos" :key="h.id" class="card">
        <button class="del" title="Eliminar" @click="remove(h.id)">✕</button>
        <h3>{{ h.nombre }}</h3>
        <p class="loc">📍 {{ h.descripcion || 'Sin ubicación' }}</p>
        <router-link :to="`/orchard/${h.id}`" class="explore-btn">Explorar Huerto</router-link>
      </div>

      <button class="add-card" @click="showModal = true">
        <span class="plus">+</span>
        <span>Registrar Nuevo Huerto</span>
      </button>
    </div>

    <BaseModal v-if="showModal" title="Nuevo Huerto" @close="closeModal">
      <form id="orchard-form" @submit.prevent="add">
        <label>Nombre del Huerto</label>
        <input v-model="nombre" placeholder="Ej: Invernadero Tomates" autofocus />

        <label>Ubicación Descriptiva</label>
        <input v-model="descripcion" placeholder="Ej: Finca Sur, Salamanca" />

        <label>Pin en el Mapa (Opcional)</label>
        <p class="hint">Haz clic en el mapa para marcar la ubicación exacta.</p>
        <LocationMap :lat="lat" :lng="lng" editable @update="onPick" />
        <p v-if="lat != null" class="coords">📍 {{ lat.toFixed(5) }}, {{ lng.toFixed(5) }}</p>

        <p v-if="modalError" class="error">{{ modalError }}</p>
      </form>

      <template #footer>
        <button type="button" class="ghost" @click="closeModal">Cancelar</button>
        <button type="submit" form="orchard-form" class="primary" :disabled="saving || !nombre.trim()">
          {{ saving ? 'Guardando…' : 'Guardar Huerto' }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, onMounted, defineAsyncComponent } from 'vue'
import { useAuth } from '../composables/useAuth'
import BaseModal from '../components/BaseModal.vue'
// El mapa (Leaflet) se carga solo al abrir el modal, para no inflar la carga inicial.
const LocationMap = defineAsyncComponent(() => import('../components/LocationMap.vue'))
import { getHuertos, createHuerto, deleteHuerto } from '../services/firestoreService'

const { user } = useAuth()
const huertos = ref([])
const loading = ref(true)
const error = ref('')

const showModal = ref(false)
const nombre = ref('')
const descripcion = ref('')
const lat = ref(null)
const lng = ref(null)
const saving = ref(false)
const modalError = ref('')

function onPick({ lat: la, lng: ln }) {
  lat.value = la
  lng.value = ln
}

function closeModal() {
  showModal.value = false
  nombre.value = ''
  descripcion.value = ''
  lat.value = null
  lng.value = null
  modalError.value = ''
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    huertos.value = await getHuertos(user.value.uid)
  } catch (e) {
    error.value = 'No se pudieron cargar los huertos.'
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function add() {
  if (!nombre.value.trim()) return
  saving.value = true
  modalError.value = ''
  try {
    await createHuerto(user.value.uid, {
      nombre: nombre.value.trim(),
      descripcion: descripcion.value.trim(),
      lat: lat.value,
      lng: lng.value,
    })
    closeModal()
    await load()
  } catch (e) {
    modalError.value = 'No se pudo crear el huerto.'
    console.error(e)
  } finally {
    saving.value = false
  }
}

async function remove(id) {
  if (!confirm('¿Eliminar este huerto?')) return
  try {
    await deleteHuerto(id)
    huertos.value = huertos.value.filter((h) => h.id !== id)
  } catch (e) {
    error.value = 'No se pudo eliminar el huerto.'
    console.error(e)
  }
}

onMounted(load)
</script>

<style scoped>
.page-head {
  text-align: center;
  margin: 8px 0 32px;
}
.page-head h1 {
  margin: 0;
  font-size: 2.6rem;
  color: var(--color-heading);
}
.sub {
  color: var(--color-text-soft);
  margin: 8px 0 0;
  font-size: 1.05rem;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 22px;
}
.card {
  position: relative;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 26px;
  transition: transform 0.15s, box-shadow 0.15s;
}
.card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-elevated);
}
.card h3 {
  margin: 0 0 6px;
  color: var(--color-heading);
  font-size: 1.25rem;
  text-transform: uppercase;
  padding-right: 20px;
}
.loc {
  color: var(--color-text-soft);
  margin: 0 0 20px;
  font-size: 0.92rem;
}
.explore-btn {
  display: block;
  text-align: center;
  border: 1.5px solid var(--color-primary);
  color: var(--color-primary);
  padding: 11px;
  border-radius: var(--radius-sm);
  font-weight: 700;
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}
.explore-btn:hover {
  background: var(--color-primary);
  color: #fff;
}
.del {
  position: absolute;
  top: 12px;
  right: 12px;
  background: transparent;
  border: none;
  color: #cbd5e1;
  cursor: pointer;
  font-size: 0.95rem;
}
.del:hover {
  color: var(--color-danger);
}
.add-card {
  border: 2px dashed var(--color-primary-border);
  background: transparent;
  border-radius: var(--radius-lg);
  padding: 26px;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--color-text-soft);
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.add-card:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-soft);
}
.add-card .plus {
  font-size: 2.4rem;
  line-height: 1;
  font-weight: 300;
}
/* Modal form */
label {
  display: block;
  font-weight: 700;
  color: var(--color-text);
  font-size: 0.9rem;
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
  font-size: 0.88rem;
  color: var(--color-text);
  margin: 8px 0 0;
}
.ghost {
  background: transparent;
  border: none;
  color: var(--color-text-soft);
  font-weight: 600;
  cursor: pointer;
  padding: 10px 14px;
}
.primary {
  background: var(--color-primary);
  color: #fff;
  border: none;
  padding: 11px 22px;
  border-radius: var(--radius-sm);
  font-weight: 700;
  cursor: pointer;
}
.primary:disabled {
  opacity: 0.55;
  cursor: default;
}
.muted {
  color: var(--color-text-soft);
}
.center {
  text-align: center;
}
.error {
  color: var(--color-danger);
}
</style>
