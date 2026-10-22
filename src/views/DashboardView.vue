<template>
  <div>
    <p v-if="loading" class="muted center">Cargando…</p>

    <template v-else>
      <!-- Hero de bienvenida -->
      <section class="welcome">
        <div class="welcome-text">
          <h1>Hola, {{ nombreCorto }} 👋</h1>
          <p>Bienvenido de nuevo a tu panel de GrowHub.</p>
        </div>
        <button class="welcome-cta" @click="openModal">＋ Nuevo huerto</button>
      </section>

      <!-- Estadísticas rápidas -->
      <div class="stats">
        <div class="stat" style="--c: #0284c7; --bg: #e0f2fe">
          <span class="stat-ic">🌱</span>
          <div><strong>{{ totals.huertos }}</strong><span>Huertos</span></div>
        </div>
        <div class="stat" style="--c: #16a34a; --bg: #dcfce7">
          <span class="stat-ic">🌿</span>
          <div><strong>{{ totals.cultivos }}</strong><span>Cultivos</span></div>
        </div>
        <div class="stat" style="--c: #d97706; --bg: #fef3c7">
          <span class="stat-ic">✅</span>
          <div><strong>{{ totals.tareasPend }}</strong><span>Tareas pendientes</span></div>
        </div>
        <div class="stat" style="--c: #7c3aed; --bg: #ede9fe">
          <span class="stat-ic">📡</span>
          <div><strong>{{ totals.sensores }}</strong><span>Sensores</span></div>
        </div>
      </div>

      <!-- Accesos rápidos -->
      <div class="quick">
        <router-link to="/tasks" class="quick-btn">✅ Tareas</router-link>
        <router-link to="/sensors" class="quick-btn">📡 Sensores</router-link>
        <router-link to="/biblioteca" class="quick-btn">📚 Biblioteca</router-link>
        <router-link to="/settings" class="quick-btn">⚙️ Ajustes</router-link>
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <!-- Pestañas -->
      <div class="tabs">
        <button :class="{ active: tab === 'mis' }" @click="tab = 'mis'">Mis Huertos</button>
        <button :class="{ active: tab === 'comunidad' }" @click="verComunidad">Comunidad</button>
      </div>

      <!-- MIS HUERTOS -->
      <template v-if="tab === 'mis'">
        <div v-if="!huertos.length" class="onboarding">
          <div class="onboarding-art">🌱</div>
          <h3>Crea tu primer huerto</h3>
          <p>Empieza a gestionar tus cultivos, sensores y tareas. Es rápido y fácil.</p>
          <button class="primary big" @click="openModal">＋ Registrar mi primer huerto</button>
        </div>

        <div v-else class="grid">
          <div v-for="h in huertos" :key="h.id" class="card" :style="cardStyle(h)">
            <div class="card-overlay">
              <button v-if="h.esPropio" class="del" title="Eliminar" @click.stop="remove(h.id)">✕</button>
              <div class="card-top">
                <div class="card-tags">
                  <span v-if="h.publico" class="tag pub">PÚBLICO</span>
                  <span v-if="!h.esPropio" class="tag shared">COMPARTIDO</span>
                </div>
                <h3>{{ h.nombre }}</h3>
                <p class="loc">📍 {{ h.descripcion || 'Sin ubicación' }}</p>
              </div>
              <div class="card-bottom">
                <div class="badges">
                  <span class="badge">🌿 {{ h.nCultivos }}</span>
                  <span class="badge">✅ {{ h.nTareasPend }}</span>
                  <span class="badge">📡 {{ h.nSensores }}</span>
                </div>
                <router-link :to="`/orchard/${h.id}`" class="explore-btn">Explorar →</router-link>
              </div>
            </div>
          </div>

          <button class="add-card" @click="openModal">
            <span class="plus">＋</span>
            <span>Registrar Nuevo Huerto</span>
          </button>
        </div>
      </template>

      <!-- COMUNIDAD -->
      <template v-else>
        <p v-if="loadingCom" class="muted center">Cargando comunidad…</p>
        <div v-else-if="!comunidad.length" class="onboarding">
          <div class="onboarding-art">🌍</div>
          <h3>Aún no hay huertos públicos</h3>
          <p>Cuando otros usuarios compartan sus huertos, aparecerán aquí.</p>
        </div>
        <div v-else class="grid">
          <div v-for="h in comunidad" :key="h.id" class="card" :style="cardStyle(h)">
            <div class="card-overlay">
              <div class="card-top">
                <span class="tag pub">PÚBLICO</span>
                <h3>{{ h.nombre }}</h3>
                <p class="loc">📍 {{ h.descripcion || 'Sin ubicación' }}</p>
              </div>
              <div class="card-bottom">
                <span class="owner-chip">👤 {{ h.ownerNombre || 'Usuario' }}</span>
                <router-link :to="`/orchard/${h.id}`" class="explore-btn">Ver →</router-link>
              </div>
            </div>
          </div>
        </div>
      </template>
    </template>

    <!-- Modal nuevo huerto -->
    <BaseModal v-if="showModal" title="Nuevo Huerto" @close="closeModal">
      <form id="orchard-form" @submit.prevent="add">
        <label>Nombre del Huerto</label>
        <input v-model="nombre" placeholder="Ej: Invernadero Tomates" autofocus />

        <label>Ubicación Descriptiva</label>
        <input v-model="descripcion" placeholder="Ej: Finca Sur, Salamanca" />

        <label>Foto del Huerto (URL, opcional)</label>
        <input v-model="imagen" placeholder="https://…/foto.jpg" />
        <div v-if="imagen" class="preview" :style="{ backgroundImage: `url(${imagen})` }"></div>

        <label>Pin en el Mapa (Opcional)</label>
        <p class="hint">Haz clic en el mapa para marcar la ubicación exacta.</p>
        <LocationMap :lat="lat" :lng="lng" editable @update="onPick" />
        <p v-if="lat != null" class="coords">📍 {{ lat.toFixed(5) }}, {{ lng.toFixed(5) }}</p>

        <label class="check">
          <input type="checkbox" v-model="publico" />
          <span>Huerto público (visible en la Comunidad)</span>
        </label>

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
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { useAuth } from '../composables/useAuth'
import BaseModal from '../components/BaseModal.vue'
const LocationMap = defineAsyncComponent(() => import('../components/LocationMap.vue'))
import {
  getResumen,
  getHuertosPublicos,
  createHuerto,
  deleteHuerto,
} from '../services/firestoreService'

const { user } = useAuth()
const huertos = ref([])
const totals = ref({ huertos: 0, cultivos: 0, tareasPend: 0, sensores: 0 })
const loading = ref(true)
const error = ref('')

const tab = ref('mis')
const comunidad = ref([])
const loadingCom = ref(false)
const comCargada = ref(false)

const showModal = ref(false)
const nombre = ref('')
const descripcion = ref('')
const imagen = ref('')
const publico = ref(false)
const lat = ref(null)
const lng = ref(null)
const saving = ref(false)
const modalError = ref('')

const nombreCorto = computed(() => {
  const n = user.value?.displayName || user.value?.email || 'hortelano'
  return n.split(' ')[0].split('@')[0]
})

// Fondo de la tarjeta: imagen del huerto o un degradado de color estable.
const GRADIENTES = [
  'linear-gradient(135deg, #0ea5e9, #2563eb)',
  'linear-gradient(135deg, #10b981, #059669)',
  'linear-gradient(135deg, #f59e0b, #d97706)',
  'linear-gradient(135deg, #8b5cf6, #6366f1)',
  'linear-gradient(135deg, #14b8a6, #0d9488)',
]
function cardStyle(h) {
  if (h.imagen) return { backgroundImage: `url(${h.imagen})` }
  let s = 0
  for (const ch of h.id) s += ch.charCodeAt(0)
  return { backgroundImage: GRADIENTES[s % GRADIENTES.length] }
}

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
  imagen.value = ''
  publico.value = false
  lat.value = null
  lng.value = null
  modalError.value = ''
}

async function verComunidad() {
  tab.value = 'comunidad'
  if (comCargada.value) return
  loadingCom.value = true
  try {
    comunidad.value = await getHuertosPublicos(user.value.uid)
    comCargada.value = true
  } catch (e) {
    console.error(e)
  } finally {
    loadingCom.value = false
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const r = await getResumen(user.value.uid, user.value.email)
    huertos.value = r.huertos
    totals.value = r.totals
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
      imagen: imagen.value.trim(),
      publico: publico.value,
      ownerNombre: user.value.displayName || user.value.email,
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
    await load()
  } catch (e) {
    error.value = 'No se pudo eliminar el huerto.'
    console.error(e)
  }
}

onMounted(load)
</script>

<style scoped>
/* Hero bienvenida */
.welcome {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: linear-gradient(120deg, var(--color-primary), var(--color-secondary));
  border-radius: var(--radius-lg);
  padding: 30px 32px;
  margin-bottom: 22px;
  box-shadow: var(--shadow-elevated);
  flex-wrap: wrap;
}
.welcome-text h1 {
  margin: 0;
  color: #fff;
  font-size: 1.9rem;
}
.welcome-text p {
  margin: 6px 0 0;
  color: #e0f2fe;
}
.welcome-cta {
  background: #fff;
  color: var(--color-primary);
  border: none;
  padding: 12px 20px;
  border-radius: var(--radius-sm);
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}
.welcome-cta:hover {
  background: #f1f5f9;
}
/* Stats */
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 16px;
  margin-bottom: 18px;
}
.stat {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 18px 20px;
}
.stat-ic {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
}
.stat div {
  display: flex;
  flex-direction: column;
}
.stat strong {
  font-size: 1.7rem;
  color: var(--c);
  line-height: 1;
}
.stat span {
  font-size: 0.82rem;
  color: var(--color-text-soft);
}
/* Accesos rápidos */
.quick {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 28px;
}
.quick-btn {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  padding: 10px 16px;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
}
.quick-btn:hover {
  background: var(--color-primary-soft);
  border-color: var(--color-primary-border);
  color: var(--color-primary-dark);
}
.section-title {
  margin: 0 0 18px;
  font-size: 1.3rem;
}
/* Pestañas */
.tabs {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid var(--color-border-soft);
  margin-bottom: 22px;
}
.tabs button {
  background: transparent;
  border: none;
  padding: 10px 16px;
  font-size: 1.02rem;
  font-weight: 600;
  color: var(--color-text-soft);
  cursor: pointer;
  position: relative;
  bottom: -2px;
}
.tabs button.active {
  color: var(--color-primary);
  border-bottom: 3px solid var(--color-primary);
}
.card-tags {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
}
.tag {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  padding: 3px 9px;
  border-radius: 999px;
}
.tag.pub {
  background: rgba(255, 255, 255, 0.85);
  color: var(--color-primary-dark);
}
.tag.shared {
  background: rgba(255, 255, 255, 0.85);
  color: #7c3aed;
}
.owner-chip {
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  align-self: flex-start;
  backdrop-filter: blur(4px);
}
.check {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
}
.check input {
  width: 18px;
  height: 18px;
}
/* Grid huertos */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 22px;
}
.card {
  position: relative;
  min-height: 210px;
  border-radius: var(--radius-lg);
  background-size: cover;
  background-position: center;
  box-shadow: var(--shadow-card);
  overflow: hidden;
  transition: transform 0.15s, box-shadow 0.15s;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
}
.card-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px;
  background: linear-gradient(0deg, rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 0.15) 55%, rgba(15, 23, 42, 0.35) 100%);
}
.card-top h3 {
  margin: 0;
  color: #fff;
  font-size: 1.35rem;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
}
.loc {
  color: #e2e8f0;
  margin: 4px 0 0;
  font-size: 0.86rem;
}
.card-bottom {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.badge {
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  backdrop-filter: blur(4px);
}
.explore-btn {
  align-self: flex-start;
  background: #fff;
  color: var(--color-primary-dark);
  padding: 9px 18px;
  border-radius: var(--radius-sm);
  font-weight: 700;
  text-decoration: none;
  font-size: 0.88rem;
}
.explore-btn:hover {
  background: #f1f5f9;
}
.del {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(15, 23, 42, 0.4);
  border: none;
  color: #fff;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.85rem;
}
.del:hover {
  background: var(--color-danger);
}
.add-card {
  border: 2px dashed var(--color-primary-border);
  background: transparent;
  border-radius: var(--radius-lg);
  min-height: 210px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--color-text-soft);
  font-size: 1.02rem;
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
}
/* Onboarding */
.onboarding {
  text-align: center;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 56px 32px;
}
.onboarding-art {
  font-size: 4rem;
}
.onboarding h3 {
  margin: 10px 0 6px;
  font-size: 1.5rem;
}
.onboarding p {
  color: var(--color-text-soft);
  margin: 0 0 22px;
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
.preview {
  height: 120px;
  border-radius: var(--radius-sm);
  background-size: cover;
  background-position: center;
  margin-top: 8px;
  border: 1px solid var(--color-border);
}
.hint {
  font-size: 0.82rem;
  color: var(--color-text-soft);
  margin: 0 0 8px;
}
.coords {
  font-size: 0.88rem;
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
.primary.big {
  padding: 13px 26px;
  font-size: 1rem;
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
