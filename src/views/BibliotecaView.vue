<template>
  <div>
    <header class="page-head">
      <h1>Biblioteca de cultivos</h1>
      <p class="sub">Consulta la ficha de cada cultivo y variedad, y añádelo a tus huertos.</p>
    </header>

    <input
      v-model="search"
      class="search"
      placeholder="Buscar cultivo o variedad (tomate, raf, padrón…)"
    />

    <p v-if="!grupos.length" class="muted">No se encontró ningún cultivo.</p>

    <section v-for="g in grupos" :key="g.cultivo" class="group">
      <h2 class="group-title">
        {{ g.cultivo }}
        <span class="group-count">{{ g.items.length }} {{ g.items.length === 1 ? 'variedad' : 'variedades' }}</span>
      </h2>
      <div class="grid">
        <button v-for="c in g.items" :key="c.id" class="crop-card" @click="abrir(c)">
          <div
            class="thumb"
            :class="{ photo: c.foto }"
            :style="c.foto ? { backgroundImage: `url(${c.foto})` } : null"
          >
            <Leaf v-if="!c.foto" :size="28" />
          </div>
          <div class="body">
            <h3>{{ c.variedad || c.cultivo }}</h3>
            <span class="fam">{{ c.familia }}</span>
            <div class="facts">
              <span>Temp. ideal: {{ c.tempIdeal }}</span>
              <span>Cosecha: {{ c.tiempoCosecha }}</span>
            </div>
          </div>
        </button>
      </div>
    </section>

    <!-- Ficha + añadir -->
    <BaseModal v-if="sel" :title="sel.nombre" @close="cerrar">
      <div
        class="ficha-head"
        :class="{ photo: sel.foto }"
        :style="sel.foto ? { backgroundImage: `url(${sel.foto})` } : null"
      >
        <Leaf v-if="!sel.foto" :size="40" />
      </div>
      <dl class="ficha">
        <div><dt>Cultivo</dt><dd>{{ sel.cultivo }}</dd></div>
        <div v-if="sel.variedad"><dt>Variedad</dt><dd>{{ sel.variedad }}</dd></div>
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
          {{ adding ? 'Añadiendo…' : 'Añadir a mi huerto' }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Leaf } from 'lucide-vue-next'
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

// Entradas filtradas por nombre / cultivo / variedad / familia, agrupadas por
// cultivo manteniendo el orden del catálogo.
const grupos = computed(() => {
  const q = search.value.trim().toLowerCase()
  const lista = !q
    ? CROPS_LIBRARY
    : CROPS_LIBRARY.filter((c) =>
        [c.nombre, c.cultivo, c.variedad, c.familia].some((v) =>
          (v || '').toLowerCase().includes(q),
        ),
      )
  const map = new Map()
  for (const c of lista) {
    if (!map.has(c.cultivo)) map.set(c.cultivo, [])
    map.get(c.cultivo).push(c)
  }
  return [...map.entries()].map(([cultivo, items]) => ({ cultivo, items }))
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
      foto: c.foto,
    })
    const nombreHuerto = huertos.value.find((h) => h.id === destino.value)?.nombre
    addMsg.value = `"${c.nombre}" añadido a ${nombreHuerto}.`
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
.group {
  margin-bottom: 30px;
}
.group-title {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin: 0 0 14px;
  font-size: 1.25rem;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border-soft);
}
.group-count {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text-soft);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 18px;
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
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-soft);
  color: var(--color-primary);
}
.thumb.photo {
  background-size: cover;
  background-position: center;
}
.body {
  padding: 14px 16px;
}
.body h3 {
  margin: 0;
  font-size: 1rem;
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
  height: 150px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
}
.ficha-head.photo {
  background-size: cover;
  background-position: center;
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
