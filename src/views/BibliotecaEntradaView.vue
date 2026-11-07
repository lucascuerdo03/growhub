<template>
  <div v-if="entrada">
    <router-link to="/biblioteca" class="volver">← Biblioteca de cultivos</router-link>

    <section class="portada">
      <figure>
        <img :src="entrada.foto" :alt="entrada.nombre" width="800" height="600" />
        <figcaption>
          <template v-if="!entrada.credito.exacta">Imagen de la especie, no de esta variedad concreta. </template>
          Foto: {{ entrada.credito.autor || 'autor en la fuente' }} ·
          <a v-if="entrada.credito.licenciaUrl" :href="entrada.credito.licenciaUrl" target="_blank" rel="noopener">{{ entrada.credito.licencia }}</a>
          <template v-else>{{ entrada.credito.licencia }}</template>
          · <a :href="entrada.credito.pagina" target="_blank" rel="noopener">Wikimedia Commons</a>
        </figcaption>
      </figure>

      <div class="resumen">
        <p class="tipo">{{ TIPOS[entrada.tipo] }} · {{ entrada.familia }}</p>
        <h1>{{ entrada.nombre }}</h1>
        <p class="latin">{{ entrada.especie }}</p>

        <dl class="hechos">
          <div><dt>Hasta la cosecha</dt><dd>{{ textoCosecha(entrada) }}</dd></div>
          <div><dt>Dificultad</dt><dd>{{ entrada.dificultad }}</dd></div>
          <div><dt>Riego</dt><dd>{{ entrada.riego }}</dd></div>
          <div><dt>Exposición</dt><dd>{{ entrada.sol }}</dd></div>
          <div><dt>Temperatura ideal</dt><dd>{{ entrada.tempIdeal }}</dd></div>
          <div><dt>Marco de plantación</dt><dd>{{ entrada.marco }}</dd></div>
        </dl>
        <p class="nota">{{ entrada.notaRiego }}.</p>

        <button class="anadir" :disabled="!destinos.length" @click="abierto = true">
          <Plus :size="17" /> Añadir a mi huerto
        </button>
        <p v-if="!destinos.length" class="nota">
          Necesitas un huerto donde puedas gestionar cultivos.
          <router-link to="/dashboard">Ir a Mis huertos</router-link>
        </p>
        <p v-if="aviso" class="ok">
          {{ aviso.texto }}
          <router-link :to="`/orchard/${aviso.orchardId}/crop/${aviso.cropId}`">Ver cultivo</router-link>
        </p>
      </div>
    </section>

    <section class="bloque">
      <h2>Calendario</h2>
      <CalendarioCultivo :entrada="entrada" />
      <p class="nota">Orientativo para clima mediterráneo-continental. En zonas frías, retrasa las siembras unas semanas.</p>
    </section>

    <div class="columnas">
      <section class="bloque">
        <h2>Plagas y enfermedades</h2>
        <ul class="plagas">
          <li v-for="p in entrada.plagas" :key="p.nombre">
            <strong>{{ p.nombre }}</strong>
            <span>{{ p.tratamiento }}</span>
          </li>
        </ul>
      </section>

      <section class="bloque">
        <h2>Asociaciones</h2>
        <h3>Se lleva bien con</h3>
        <p v-if="!favorables.length" class="nota">Sin asociaciones destacadas.</p>
        <ul class="vecinos">
          <li v-for="v in favorables" :key="v.id">
            <router-link :to="`/biblioteca/${v.id}`" class="vecino bien">
              <img :src="v.foto" alt="" loading="lazy" />{{ nombreEspecie(v.especieId) }}
            </router-link>
          </li>
        </ul>
        <h3>Mejor separados</h3>
        <p v-if="!desfavorables.length" class="nota">Sin incompatibilidades destacadas.</p>
        <ul class="vecinos">
          <li v-for="v in desfavorables" :key="v.id">
            <router-link :to="`/biblioteca/${v.id}`" class="vecino mal">
              <img :src="v.foto" alt="" loading="lazy" />{{ nombreEspecie(v.especieId) }}
            </router-link>
          </li>
        </ul>
      </section>
    </div>

    <section v-if="otras.length" class="bloque">
      <h2>Otras variedades</h2>
      <ul class="vecinos">
        <li v-for="v in otras" :key="v.id">
          <router-link :to="`/biblioteca/${v.id}`" class="vecino">
            <img :src="v.foto" alt="" loading="lazy" />{{ v.variedad || v.nombre }}
          </router-link>
        </li>
      </ul>
    </section>

    <BaseModal v-if="abierto" :title="`Añadir ${entrada.nombre}`" @close="abierto = false">
      <FormularioCultivo :entrada="entrada" :huertos="destinos" @guardado="alGuardar" @cancelar="abierto = false" />
    </BaseModal>
  </div>

  <p v-else class="error">
    Este cultivo no está en la biblioteca.
    <router-link to="/biblioteca">Volver a la biblioteca</router-link>
  </p>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Plus } from 'lucide-vue-next'
import BaseModal from '../components/BaseModal.vue'
import CalendarioCultivo from '../components/CalendarioCultivo.vue'
import FormularioCultivo from '../components/FormularioCultivo.vue'
import { useAuth } from '../composables/useAuth'
import { useHuertos } from '../composables/useHuertos'
import {
  TIPOS,
  entradaDeEspecie,
  entradaPorId,
  nombreEspecie,
  textoCosecha,
  variedadesDe,
} from '../data/cropsLibrary'
import { permisosEn } from '../utils/permissions'

const route = useRoute()
const { user } = useAuth()
const { huertos } = useHuertos()
const entrada = entradaPorId(route.params.id)

const abierto = ref(false)
const aviso = ref(null)

const destinos = computed(() =>
  huertos.value.filter((h) => permisosEn(h, user.value.uid).manageCrops),
)
const vecinos = (ids) => (ids || []).map(entradaDeEspecie).filter(Boolean)
const favorables = vecinos(entrada?.favorables)
const desfavorables = vecinos(entrada?.desfavorables)
const otras = entrada ? variedadesDe(entrada.especieId).filter((v) => v.id !== entrada.id) : []

function alGuardar({ orchardId, cropId, nombre, tareas }) {
  abierto.value = false
  const extra = tareas ? ` con ${tareas} ${tareas === 1 ? 'tarea' : 'tareas'}` : ''
  aviso.value = { orchardId, cropId, texto: `${nombre} añadido a tu huerto${extra}.` }
}
</script>

<style scoped>
.volver {
  display: inline-block;
  margin-bottom: 14px;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
}
.portada {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: 28px;
  align-items: start;
}
figure {
  margin: 0;
  min-width: 0;
}
figure img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: var(--radius-md);
  background: var(--color-tierra-suave);
}
figcaption {
  font-size: 0.74rem;
  color: var(--color-text-soft);
  margin-top: 6px;
}
.resumen {
  min-width: 0;
}
.tipo {
  margin: 0;
  font-size: 0.82rem;
  color: var(--color-verde-oscuro);
  font-weight: 600;
}
.resumen h1 {
  margin: 2px 0 0;
  font-size: 2.3rem;
}
.latin {
  margin: 2px 0 16px;
  font-style: italic;
  color: var(--color-text-soft);
}
.hechos {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 20px;
  margin: 0;
}
.hechos dt {
  font-size: 0.76rem;
  color: var(--color-text-soft);
}
.hechos dd {
  margin: 0;
  font-weight: 600;
}
.nota {
  font-size: 0.84rem;
  color: var(--color-text-soft);
  margin: 10px 0 0;
}
.anadir {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 16px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  padding: 11px 18px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
}
.anadir:disabled {
  opacity: 0.5;
  cursor: default;
}
.ok {
  color: var(--color-verde-oscuro);
  font-size: 0.88rem;
  margin: 10px 0 0;
}
.bloque {
  margin-top: 32px;
  min-width: 0;
}
.bloque h2 {
  margin: 0 0 12px;
  font-size: 1.3rem;
}
.bloque h3 {
  margin: 14px 0 8px;
  font-family: var(--font-texto);
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--color-text-soft);
}
.bloque h3:first-of-type {
  margin-top: 0;
}
.columnas {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 36px;
}
.plagas {
  list-style: none;
  margin: 0;
  padding: 0;
}
.plagas li {
  display: flex;
  flex-direction: column;
  padding: 10px 0;
  border-top: 1px solid var(--color-border);
}
.plagas li:first-child {
  border-top: none;
  padding-top: 0;
}
.plagas span {
  font-size: 0.88rem;
  color: var(--color-text-soft);
}
.vecinos {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  list-style: none;
  margin: 0;
  padding: 0;
}
.vecino {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 4px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.88rem;
  text-decoration: none;
}
.vecino:hover {
  border-color: var(--color-primary);
}
.vecino img {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}
.vecino.bien {
  border-color: var(--color-verde-claro);
}
.vecino.mal {
  border-color: var(--color-tierra);
}
@media (max-width: 760px) {
  .portada,
  .columnas {
    grid-template-columns: minmax(0, 1fr);
  }
  .resumen h1 {
    font-size: 1.9rem;
  }
}
</style>
