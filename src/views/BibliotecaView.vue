<template>
  <div>
    <header class="cabecera">
      <h1>Biblioteca de cultivos</h1>
      <p class="sub">
        {{ CROPS_LIBRARY.length }} hortalizas, aromáticas y frutales de huerto, con su calendario para España.
      </p>
    </header>

    <div class="controles">
      <div class="busqueda">
        <Search :size="17" />
        <input id="bib-buscar" v-model="search" aria-label="Buscar cultivo o variedad" placeholder="Buscar cultivo o variedad: tomate, raf, padrón…" />
      </div>
      <button class="este-mes" :class="{ activo: soloEsteMes }" :aria-pressed="soloEsteMes" @click="soloEsteMes = !soloEsteMes">
        <Sprout :size="16" /> Qué sembrar en {{ MESES_LARGOS[mes - 1] }}
      </button>
      <select id="bib-tipo" v-model="tipo" aria-label="Filtrar por tipo">
        <option value="">Todos los tipos</option>
        <option v-for="(n, k) in TIPOS" :key="k" :value="k">{{ n }}</option>
      </select>
      <select id="bib-familia" v-model="familia" aria-label="Filtrar por familia">
        <option value="">Todas las familias</option>
        <option v-for="f in FAMILIAS" :key="f" :value="f">{{ f }}</option>
      </select>
      <select id="bib-dificultad" v-model="dificultad" aria-label="Filtrar por dificultad">
        <option value="">Cualquier dificultad</option>
        <option v-for="d in DIFICULTADES" :key="d" :value="d">{{ d }}</option>
      </select>
    </div>

    <p class="resumen" aria-live="polite">
      {{ total }} {{ total === 1 ? 'resultado' : 'resultados' }}
      <button v-if="hayFiltros" class="limpiar" @click="limpiar">Quitar filtros</button>
    </p>

    <div v-if="!grupos.length" class="vacio">
      <p>Ningún cultivo coincide con estos filtros.</p>
      <button class="limpiar" @click="limpiar">Quitar filtros</button>
    </div>

    <section v-for="g in grupos" :key="g.id" class="grupo">
      <h2>
        {{ g.nombre }}
        <span v-if="g.items.length > 1" class="cuenta">{{ g.items.length }} variedades</span>
      </h2>
      <div class="rejilla">
        <router-link v-for="c in g.items" :key="c.id" :to="`/biblioteca/${c.id}`" class="ficha">
          <img :src="c.foto" :alt="c.nombre" loading="lazy" width="800" height="600" />
          <div class="datos">
            <strong>{{ c.variedad || c.nombre }}</strong>
            <span class="meta">{{ textoCosecha(c) }} · {{ c.dificultad }}</span>
            <CalendarioCultivo :entrada="c" compacto />
          </div>
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Search, Sprout } from 'lucide-vue-next'
import CalendarioCultivo from '../components/CalendarioCultivo.vue'
import {
  CROPS_LIBRARY,
  DIFICULTADES,
  FAMILIAS,
  MESES_LARGOS,
  TIPOS,
  buscarBiblioteca,
  nombreEspecie,
  sePuedeSembrar,
  textoCosecha,
} from '../data/cropsLibrary'
import { mesActual } from '../utils/fechas'

const route = useRoute()
const mes = mesActual()
const search = ref('')
const tipo = ref('')
const familia = ref('')
const dificultad = ref('')
// Desde "Qué sembrar este mes" del panel se llega con el filtro puesto.
const soloEsteMes = ref(route.query.mes === '1')

const filtradas = computed(() =>
  buscarBiblioteca(search.value).filter(
    (c) =>
      (!tipo.value || c.tipo === tipo.value) &&
      (!familia.value || c.familia === familia.value) &&
      (!dificultad.value || c.dificultad === dificultad.value) &&
      (!soloEsteMes.value || sePuedeSembrar(c, mes)),
  ),
)
const total = computed(() => filtradas.value.length)
const hayFiltros = computed(
  () => search.value || tipo.value || familia.value || dificultad.value || soloEsteMes.value,
)
const grupos = computed(() => {
  const mapa = new Map()
  for (const c of filtradas.value) {
    if (!mapa.has(c.especieId)) {
      mapa.set(c.especieId, { id: c.especieId, nombre: nombreEspecie(c.especieId), items: [] })
    }
    mapa.get(c.especieId).items.push(c)
  }
  return [...mapa.values()]
})

function limpiar() {
  search.value = ''
  tipo.value = ''
  familia.value = ''
  dificultad.value = ''
  soloEsteMes.value = false
}
</script>

<style scoped>
.cabecera h1 {
  margin: 0;
}
.sub {
  color: var(--color-text-soft);
  margin: 4px 0 18px;
}
.controles {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: stretch;
}
.busqueda {
  flex: 1 1 280px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-soft);
}
.busqueda input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  padding: 10px 0;
  font-size: 0.94rem;
  color: var(--color-text);
}
.busqueda input:focus {
  outline: none;
}
.busqueda:focus-within {
  border-color: var(--color-primary);
}
.controles select {
  padding: 9px 10px;
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  font-size: 0.88rem;
}
.este-mes {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  border: 1px solid var(--color-verde);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-verde-oscuro);
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
}
.este-mes.activo {
  background: var(--color-verde-oscuro);
  border-color: var(--color-verde-oscuro);
  color: #fff;
}
.resumen {
  display: flex;
  align-items: baseline;
  gap: 12px;
  font-size: 0.86rem;
  color: var(--color-text-soft);
  margin: 12px 0 22px;
}
.limpiar {
  background: none;
  border: none;
  padding: 0;
  color: var(--color-primary);
  font-weight: 600;
  font-size: inherit;
  cursor: pointer;
}
.vacio {
  padding: 30px 0;
  color: var(--color-text-soft);
}
.grupo {
  margin-bottom: 34px;
}
.grupo h2 {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin: 0 0 12px;
  font-size: 1.35rem;
}
.cuenta {
  font-family: var(--font-texto);
  font-size: 0.8rem;
  font-weight: 400;
  color: var(--color-text-soft);
}
.rejilla {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 18px 16px;
}
.ficha {
  display: flex;
  flex-direction: column;
  color: inherit;
  text-decoration: none;
}
.ficha img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: var(--radius-sm);
  background: var(--color-tierra-suave);
  transition: filter 0.15s;
}
.ficha:hover img {
  filter: brightness(1.06);
}
.ficha:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 3px;
}
.datos {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 9px;
}
.datos strong {
  font-size: 0.98rem;
}
.ficha:hover strong {
  color: var(--color-primary);
}
.meta {
  font-size: 0.8rem;
  color: var(--color-text-soft);
  margin-bottom: 6px;
}
</style>
