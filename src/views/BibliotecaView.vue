<template>
  <div>
    <header class="page-head">
      <h1>📚 Biblioteca de Cultivos</h1>
      <p class="sub">Consulta la ficha de cada cultivo y añádelo a tus huertos.</p>
    </header>

    <input v-model="search" class="search" placeholder="🔍  Buscar cultivo (tomate, lechuga, pimiento…)" />

    <p v-if="!filtrados.length" class="muted">No se encontró ningún cultivo.</p>

    <div class="grid">
      <button v-for="c in filtrados" :key="c.id" class="crop-card" @click="abrir(c)">
        <div class="thumb" :style="{ background: gradiente(c.id) }">{{ c.emoji }}</div>
        <div class="body">
          <h3>{{ c.nombre }}</h3>
          <span class="fam">{{ c.familia }}</span>
          <div class="facts">
            <span>🌡️ {{ c.tempIdeal }}</span>
            <span>⏳ {{ c.tiempoCosecha }}</span>
          </div>
        </div>
      </button>
    </div>

    <!-- Ficha + añadir -->
    <BaseModal v-if="sel" :title="sel.nombre" @close="cerrar">
      <div class="ficha-head" :style="{ background: gradiente(sel.id) }">
        <span class="ficha-emoji">{{ sel.emoji }}</span>
      </div>
      <dl class="ficha">
        <div><dt>Familia botánica</dt><dd>{{ sel.familia }}</dd></div>
        <div><dt>Época de siembra</dt><dd>{{ sel.epocaSiembra }}</dd></div>
        <div><dt>Riego</dt><dd>{{ sel.riego }}</dd></div>
        <div><dt>Temperatura ideal</dt><dd>{{ sel.tempIdeal }}</dd></div>
        <div><dt>Plagas comunes</dt><dd>{{ sel.plagas }}</dd></div>
        <div><dt>Tiempo hasta cosecha</dt><dd>{{ sel.tiempoCosecha }}</dd></div>
      </dl>

      <div class="add-box">
        <label>Añadir a mi huerto</label>
        <p v-if="!huertos.length" class="muted small">
          Primero crea un huerto desde <router-link to="/dashboard">Mis Huertos</router-link>.
        </p>
        <template v-else>
          <select v-model="destino">
            <option v-for="h in huertos" :key="h.id" :value="h.id">{{ h.nombre }}</option>
          </select>
          <p v-if="addMsg" class="success small">{{ addMsg }}</p>
        </template>
      </div>

      <template #footer>
        <button type="button" class="ghost" @click="cerrar">Cerrar</button>
        <button
          class="primary"
          :disabled="!huertos.length || adding"
          @click="anadir"
        >
          {{ adding ? 'Añadiendo…' : '＋ Añadir a mi huerto' }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import BaseModal from '../components/BaseModal.vue'
import { CROPS_LIBRARY } from '../data/cropsLibrary'
import { getHuertos, createCultivo } from '../services/firestoreService'

const { user } = useAuth()
const search = ref('')
const huertos = ref([])
const sel = ref(null)
const destino = ref(null)
const adding = ref(false)
const addMsg = ref('')

const GRADIENTES = {
  Solanáceas: 'linear-gradient(135deg,#ef4444,#f97316)',
  Cucurbitáceas: 'linear-gradient(135deg,#22c55e,#16a34a)',
  Brasicáceas: 'linear-gradient(135deg,#10b981,#0d9488)',
  Fabáceas: 'linear-gradient(135deg,#84cc16,#65a30d)',
  Amarilidáceas: 'linear-gradient(135deg,#a855f7,#7c3aed)',
  Asteráceas: 'linear-gradient(135deg,#14b8a6,#0891b2)',
}
function gradiente(id) {
  const c = CROPS_LIBRARY.find((x) => x.id === id)
  return GRADIENTES[c?.familia] || 'linear-gradient(135deg,#0ea5e9,#2563eb)'
}

const filtrados = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return CROPS_LIBRARY
  return CROPS_LIBRARY.filter(
    (c) => c.nombre.toLowerCase().includes(q) || c.familia.toLowerCase().includes(q),
  )
})

function abrir(c) {
  sel.value = c
  addMsg.value = ''
  destino.value = huertos.value[0]?.id || null
}
function cerrar() {
  sel.value = null
}

async function anadir() {
  if (!destino.value || !sel.value) return
  adding.value = true
  addMsg.value = ''
  try {
    const c = sel.value
    await createCultivo(destino.value, {
      nombre: c.nombre,
      especie: c.familia,
      familia: c.familia,
      epocaSiembra: c.epocaSiembra,
      riego: c.riego,
      tempIdeal: c.tempIdeal,
      plagas: c.plagas,
      tiempoCosecha: c.tiempoCosecha,
    })
    const nombreHuerto = huertos.value.find((h) => h.id === destino.value)?.nombre
    addMsg.value = `✓ "${c.nombre}" añadido a ${nombreHuerto}.`
  } catch (e) {
    addMsg.value = 'No se pudo añadir el cultivo.'
    console.error(e)
  } finally {
    adding.value = false
  }
}

onMounted(async () => {
  try {
    huertos.value = await getHuertos(user.value.uid)
  } catch (e) {
    console.error(e)
  }
})
</script>

<style scoped>
.page-head {
  margin-bottom: 20px;
}
.page-head h1 {
  margin: 0;
}
.sub {
  color: var(--color-text-soft);
  margin: 4px 0 0;
}
.search {
  width: 100%;
  max-width: 520px;
  padding: 12px 14px;
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-sm);
  margin-bottom: 24px;
  font-size: 0.95rem;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}
.crop-card {
  text-align: left;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  cursor: pointer;
  padding: 0;
  transition: transform 0.15s, box-shadow 0.15s;
}
.crop-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
}
.thumb {
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
}
.body {
  padding: 14px 16px;
}
.body h3 {
  margin: 0;
}
.fam {
  font-size: 0.8rem;
  color: var(--color-text-soft);
}
.facts {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 8px;
  font-size: 0.8rem;
  color: var(--color-text);
}
/* Ficha modal */
.ficha-head {
  height: 110px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}
.ficha-emoji {
  font-size: 3.6rem;
}
.ficha {
  margin: 0;
}
.ficha > div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border-soft);
}
.ficha dt {
  color: var(--color-text-soft);
  font-size: 0.88rem;
}
.ficha dd {
  margin: 0;
  font-weight: 600;
  text-align: right;
}
.add-box {
  margin-top: 18px;
}
.add-box label {
  display: block;
  font-weight: 700;
  margin-bottom: 8px;
}
.add-box select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-sm);
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
  padding: 11px 20px;
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
.small {
  font-size: 0.85rem;
}
.success {
  color: var(--color-success);
}
</style>
