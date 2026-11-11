<template>
  <div>
    <p v-if="!listos" class="muted">Cargando…</p>

    <template v-else>
      <header class="portada">
        <StoredImage class="portada-foto" :orchard-id="fotoPortada.orchardId" :foto-id="fotoPortada.fotoId" :url="fotoPortada.url" />
        <div class="portada-texto">
          <p class="fecha">{{ fechaHoy }}</p>
          <h1>Hoy en tu huerto</h1>
          <p class="resumen">{{ resumen }}</p>
        </div>
        <button class="btn-primary portada-accion" @click="openModal"><Plus :size="17" /> Nuevo huerto</button>
      </header>

      <div v-if="huertoTiempo" class="franja-tiempo">
        <TiempoHuerto :huerto="huertoTiempo" />
        <select v-if="conPin.length > 1" id="tiempo-huerto" v-model="idTiempo" aria-label="Huerto del que ver el tiempo">
          <option v-for="h in conPin" :key="h.id" :value="h.id">{{ h.nombre }}</option>
        </select>
      </div>
      <TiempoHuerto v-else-if="primerEditable" :huerto="primerEditable" enlace-ajustes class="franja-tiempo" />

      <p v-if="error" class="error">{{ error }}</p>

      <AvisosSensores
        :avisos="avisos"
        :con-huerto="lista.length > 1"
        :puede-crear-tareas="(id) => permisosEn(lista.find((h) => h.id === id), user.uid).manageTasks"
        :tareas-de="(id) => tareasPorHuerto[id] || []"
      />

      <div v-if="invitaciones.length" class="notice">
        <span>
          Tienes {{ invitaciones.length }}
          {{ invitaciones.length === 1 ? 'invitación pendiente' : 'invitaciones pendientes' }}.
        </span>
        <router-link to="/invitations">Ver invitaciones</router-link>
      </div>

      <div v-if="!lista.length" class="vacio-inicio">
        <Ilustracion tipo="huerto" />
        <h2>Crea tu primer huerto</h2>
        <p>Añade tus cultivos y aquí verás cada día qué toca hacer, qué está a punto de cosecharse y qué sembrar.</p>
        <button class="btn-primary" @click="openModal"><Plus :size="17" /> Crear huerto</button>
      </div>

      <div v-else class="columnas">
        <section class="tareas" aria-labelledby="t-tareas">
          <div class="titulo-seccion">
            <h2 id="t-tareas">Tareas</h2>
            <router-link to="/tasks">Ver todas</router-link>
          </div>
          <p v-if="aviso" class="aviso-tarea" role="status">{{ aviso }}</p>
          <ListaTareas
            :tareas="paraPanel"
            :historial="false"
            :max-proximas="5"
            :clave-de="(t) => t.orchardId + t.id"
            :planta-de="plantaDe"
            :huerto-de="(t) => t.huerto"
            :permisos-de="permisosDe"
            @toggle="alternar"
            @remove="borrar"
            @frecuencia="cambiarFrecuencia"
          >
            <template #vacio>
              <div class="vacio-seccion">
                <Ilustracion tipo="tareas" />
                <p>Nada pendiente esta semana.<template v-if="proximaTarea"> La próxima: {{ proximaTarea.titulo }}, el {{ fechaCorta(proximaTarea.fecha) }}.</template></p>
              </div>
            </template>
            <template #mas="{ ocultas }">
              <router-link to="/tasks">{{ ocultas }} {{ ocultas === 1 ? 'próxima más' : 'próximas más' }}</router-link>
            </template>
          </ListaTareas>
          <p v-if="sinFecha" class="pie-seccion">
            <router-link to="/tasks">{{ sinFecha }} {{ sinFecha === 1 ? 'tarea' : 'tareas' }} sin fecha</router-link>
          </p>

          <div class="titulo-seccion separado"><h2>Próximas cosechas</h2></div>
          <ul v-if="cosechas.length" class="cosechas">
            <li v-for="c in cosechas" :key="c.orchardId + c.id">
              <router-link :to="`/orchard/${c.orchardId}/crop/${c.id}`" class="cosecha">
                <StoredImage class="cosecha-foto" :orchard-id="c.orchardId" :foto-id="c.fotoId" :url="c.foto"><Leaf :size="18" /></StoredImage>
                <div class="cosecha-datos">
                  <div class="cosecha-linea">
                    <strong>{{ c.nombre }}</strong>
                    <span :class="{ listo: c.estado.etapa === 'listo' }">{{ c.estado.texto }}</span>
                  </div>
                  <div class="barra" role="progressbar" :aria-valuenow="c.estado.pct" aria-valuemin="0" aria-valuemax="100" :aria-label="`Progreso de ${c.nombre}`">
                    <i :class="c.estado.etapa" :style="{ width: `${c.estado.pct}%` }"></i>
                  </div>
                </div>
              </router-link>
            </li>
          </ul>
          <p v-else class="muted small">Indica la fecha de siembra de tus cultivos para ver aquí cuánto les falta.</p>
        </section>

        <aside class="lateral">
          <section v-if="lecturas.length" aria-labelledby="t-sensores">
            <div class="titulo-seccion">
              <h2 id="t-sensores">Últimas lecturas</h2>
              <router-link to="/sensors">Ver sensores</router-link>
            </div>
            <ul class="lecturas">
              <li v-for="l in lecturas" :key="l.clave">
                <component :is="SENSOR_TYPES[l.tipo]?.icon" :size="18" :style="{ color: SENSOR_TYPES[l.tipo]?.color }" />
                <div class="lectura-nombre">
                  <span>{{ l.nombre }}</span>
                  <small>{{ l.lugar }} · <span :class="{ antigua: !l.reciente }">{{ l.reciente ? l.hace : `Sin datos recientes (${l.hace})` }}</span></small>
                </div>
                <strong>{{ l.valor }}&nbsp;<small>{{ l.unidad }}</small></strong>
              </li>
            </ul>
          </section>

          <section aria-labelledby="t-sembrar">
            <div class="titulo-seccion">
              <h2 id="t-sembrar">Qué sembrar en {{ MESES_LARGOS[mes - 1] }}</h2>
              <router-link to="/biblioteca?mes=1">Ver todo</router-link>
            </div>
            <ul class="sembrar">
              <li v-for="c in paraSembrar" :key="c.id">
                <router-link :to="`/biblioteca/${c.id}`">
                  <img :src="c.foto" :alt="c.nombre" loading="lazy" width="800" height="600" />
                  <span>{{ c.nombre }}</span>
                </router-link>
              </li>
            </ul>
          </section>
        </aside>
      </div>

      <template v-if="lista.length">
        <div class="titulo-seccion separado"><h2>Mis huertos</h2></div>
        <div class="huertos">
          <article v-for="h in huertos" :key="h.id" class="huerto">
            <router-link :to="`/orchard/${h.id}`" class="huerto-enlace">
              <StoredImage class="huerto-foto" :orchard-id="h.foto.orchardId" :foto-id="h.foto.fotoId" :url="h.foto.url" :alt="h.nombre">
                <Sprout :size="30" />
              </StoredImage>
              <div class="huerto-datos">
                <strong>{{ h.nombre }}</strong>
                <span>{{ h.nCultivos }} {{ h.nCultivos === 1 ? 'cultivo' : 'cultivos' }} · {{ h.nTareasPend }} {{ h.nTareasPend === 1 ? 'tarea' : 'tareas' }}<template v-if="h.ownerId !== user.uid"> · {{ nombreRol(rolEn(h, user.uid)) }}</template></span>
              </div>
            </router-link>
            <button v-if="h.ownerId === user.uid" class="del" :aria-label="`Eliminar ${h.nombre}`" @click="remove(h.id)"><X :size="14" /></button>
          </article>
        </div>
      </template>
    </template>

    <BaseModal v-if="showModal" title="Nuevo huerto" @close="closeModal">
      <form id="orchard-form" @submit.prevent="add">
        <label for="h-nombre">Nombre del huerto</label>
        <input id="h-nombre" v-model="nombre" placeholder="Ej: Invernadero Tomates" autofocus />

        <label for="h-lugar">Ubicación</label>
        <input id="h-lugar" v-model="descripcion" placeholder="Ej: Finca Sur, Salamanca" />

        <label>Foto (opcional)</label>
        <ImageUpload v-model="foto" />

        <label>Ubicación en el mapa (opcional)</label>
        <p class="hint">Haz clic en el mapa. Sirve para mostrar el tiempo y la lluvia prevista.</p>
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
import { computed, defineAsyncComponent, ref } from 'vue'
import { Leaf, Plus, Sprout, X } from 'lucide-vue-next'
import { useAuth } from '../composables/useAuth'
import { useInvitaciones } from '../composables/useInvitaciones'
import { useHuertos, usePorHuerto } from '../composables/useHuertos'
import { useVivoMuchos } from '../composables/useVivo'
import BaseModal from '../components/BaseModal.vue'
import Ilustracion from '../components/Ilustracion.vue'
import ImageUpload from '../components/ImageUpload.vue'
import StoredImage from '../components/StoredImage.vue'
import ListaTareas from '../components/ListaTareas.vue'
import { porFecha } from '../utils/tareas'
import { useAccionesTarea } from '../composables/useAccionesTarea'
import TiempoHuerto from '../components/TiempoHuerto.vue'
import { CROPS_LIBRARY, MESES_LARGOS, entradaDeCultivo, sePuedeSembrar } from '../data/cropsLibrary'
import { estadoCultivo } from '../utils/cultivos'
import { fotoDeHuerto } from '../utils/fotoHuerto'
import { esReciente, haceTexto, msDe, valorLectura } from '../utils/lecturas'
import { useAhora } from '../composables/useAhora'
import { avisosDe } from '../utils/avisos'
import AvisosSensores from '../components/AvisosSensores.vue'
import { fechaCorta, hoyISO, mesActual, sumarDias } from '../utils/fechas'
import { mensajeError, nombreRol, permisosEn, rolEn } from '../utils/permissions'
import { SENSOR_TYPES } from '../utils/sensorTypes'
import {
  createFoto,
  createHuerto,
  deleteHuerto,
  fuenteCultivos,
  fuenteLecturas,
  fuenteSensores,
  fuenteTareas,
  updateHuerto,
} from '../services/firestoreService'

const LocationMap = defineAsyncComponent(() => import('../components/LocationMap.vue'))

const { user } = useAuth()
const { invitaciones } = useInvitaciones()
const { huertos: lista, listos } = useHuertos()
const { porHuerto: cultivos } = usePorHuerto(fuenteCultivos)
const { porHuerto: tareasPorHuerto } = usePorHuerto(fuenteTareas)
const { porHuerto: sensoresPorHuerto } = usePorHuerto(fuenteSensores)

const hoy = hoyISO()
const mes = mesActual()
const fechaHoy = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
const error = ref('')

const huertos = computed(() =>
  lista.value.map((h) => ({
    ...h,
    nCultivos: (cultivos.value[h.id] || []).length,
    nTareasPend: (tareasPorHuerto.value[h.id] || []).filter((t) => !t.completada).length,
    foto: fotoDeHuerto(h, cultivos.value[h.id] || []),
  })),
)

/* --- Tareas --- */
const pendientes = computed(() =>
  lista.value.flatMap((h) =>
    (tareasPorHuerto.value[h.id] || [])
      .filter((t) => !t.completada)
      .map((t) => ({ ...t, orchardId: h.id, huerto: lista.value.length > 1 ? h : null, huertoReal: h })),
  ),
)
const deHoy = computed(() => pendientes.value.filter((t) => t.fecha && t.fecha <= hoy))
// En el panel: lo atrasado, lo de hoy y lo de los próximos siete días.
const enUnaSemana = sumarDias(hoy, 7)
const paraPanel = computed(() => pendientes.value.filter((t) => t.fecha && t.fecha <= enUnaSemana))
const atrasadas = computed(() => deHoy.value.filter((t) => t.fecha < hoy).length)
const sinFecha = computed(() => pendientes.value.filter((t) => !t.fecha).length)
const proximaTarea = computed(
  () => pendientes.value.filter((t) => t.fecha > enUnaSemana).sort(porFecha)[0] || null,
)
const permisosDe = (t) => permisosEn(t.huertoReal, user.value.uid)
const plantaDe = (t) => (cultivos.value[t.orchardId] || []).find((c) => c.id === t.cropId)?.nombre || ''

const resumen = computed(() => {
  if (!lista.value.length) return 'Todavía no tienes ningún huerto.'
  const n = deHoy.value.length - atrasadas.value
  const partes = []
  if (n) partes.push(`${n} ${n === 1 ? 'tarea para hoy' : 'tareas para hoy'}`)
  if (atrasadas.value) partes.push(`${atrasadas.value} ${atrasadas.value === 1 ? 'atrasada' : 'atrasadas'}`)
  return partes.length ? partes.join(' y ') : 'Sin tareas pendientes para hoy'
})

const aviso = ref('')
const { alternar, cambiarFrecuencia, borrar } = useAccionesTarea({
  orchardIdDe: (t) => t.orchardId,
  permisosDe,
  error,
  aviso,
})

/* --- Cosechas --- */
const conEstado = computed(() =>
  lista.value.flatMap((h) =>
    (cultivos.value[h.id] || []).map((c) => ({ ...c, orchardId: h.id, estado: estadoCultivo(c) })),
  ),
)
const cosechas = computed(() =>
  conEstado.value
    .filter((c) => c.estado.pct !== null)
    .sort((a, b) => (a.estado.restantes === b.estado.restantes ? 0 : a.estado.restantes - b.estado.restantes))
    .slice(0, 5),
)

/* --- Lecturas --- */
const sensores = computed(() =>
  lista.value.flatMap((h) =>
    (sensoresPorHuerto.value[h.id] || []).map((s) => ({ ...s, orchardId: h.id, orchardNombre: h.nombre })),
  ),
)
const { porClave: lecturasPorClave } = useVivoMuchos(() =>
  sensores.value.map((s) => fuenteLecturas(s.orchardId, s.id)),
)
const ahora = useAhora()
// Lecturas fuera del rango recomendado, en todos los huertos.
const avisos = computed(() =>
  lista.value.flatMap((h) =>
    avisosDe({
      orchardId: h.id,
      huerto: h.nombre,
      cultivos: cultivos.value[h.id] || [],
      sensores: sensoresPorHuerto.value[h.id] || [],
      lecturasDe: (s) => lecturasPorClave.value[fuenteLecturas(h.id, s.id).clave] || [],
      ahora: ahora.value,
    }),
  ),
)
const lecturas = computed(() =>
  sensores.value
    .map((s) => {
      const clave = fuenteLecturas(s.orchardId, s.id).clave
      const ultima = (lecturasPorClave.value[clave] || []).at(-1)
      const cuando = msDe(ultima)
      if (cuando === null) return null
      const planta = (cultivos.value[s.orchardId] || []).find((c) => c.id === s.cropId)?.nombre
      return {
        clave,
        tipo: s.tipo,
        nombre: s.nombre,
        unidad: s.unidad,
        valor: valorLectura(s, ultima),
        lugar: planta || s.orchardNombre,
        cuando,
        hace: haceTexto(cuando, ahora.value),
        reciente: esReciente(cuando, ahora.value),
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.cuando - a.cuando)
    .slice(0, 5),
)

/* --- Qué sembrar --- */
const paraSembrar = computed(() => {
  const yaTengo = new Set(conEstado.value.map((c) => entradaDeCultivo(c)?.especieId))
  const orden = { Fácil: 0, Media: 1, Difícil: 2 }
  const vistas = new Set()
  return CROPS_LIBRARY.filter((c) => sePuedeSembrar(c, mes))
    .sort((a, b) => orden[a.dificultad] - orden[b.dificultad])
    .filter((c) => {
      // Una variedad por especie y, antes que nada, lo que aún no se cultiva.
      if (vistas.has(c.especieId) || yaTengo.has(c.especieId)) return false
      vistas.add(c.especieId)
      return true
    })
    .slice(0, 6)
})

/* --- Portada y tiempo --- */
// La del primer huerto con foto propia; si ninguno la tiene, la automática del primero.
const fotoPortada = computed(() => {
  const h = lista.value.find((x) => x.fotoId || x.imagen) || lista.value[0]
  return fotoDeHuerto(h, h ? cultivos.value[h.id] || [] : [])
})
const conPin = computed(() => lista.value.filter((h) => h.lat != null))
const idTiempo = ref(null)
const huertoTiempo = computed(
  () => conPin.value.find((h) => h.id === idTiempo.value) || conPin.value[0] || null,
)
const primerEditable = computed(
  () => lista.value.find((h) => permisosEn(h, user.value.uid).admin) || null,
)

/* --- Nuevo huerto --- */
const showModal = ref(false)
const nombre = ref('')
const descripcion = ref('')
const foto = ref('')
const lat = ref(null)
const lng = ref(null)
const saving = ref(false)
const modalError = ref('')

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
  error.value = errorFoto
  saving.value = false
}

async function remove(id) {
  if (!confirm('¿Eliminar este huerto? Esta acción no se puede deshacer.')) return
  try {
    await deleteHuerto(id)
  } catch (e) {
    error.value = 'No se pudo eliminar el huerto.'
    console.error(e)
  }
}
</script>

<style scoped>
.lecturas .antigua {
  color: var(--color-tierra-oscuro);
  font-weight: 600;
}
.portada {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  min-height: 190px;
  padding: 22px 24px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-verde-oscuro);
}
.portada-foto {
  position: absolute;
  inset: 0;
}
.portada::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgb(15 30 26 / 0.85), rgb(15 30 26 / 0.35));
}
.portada-texto,
.portada-accion {
  position: relative;
  z-index: 1;
}
.fecha {
  margin: 0;
  color: #eef3ec;
  font-size: 0.9rem;
}
.fecha::first-letter {
  text-transform: uppercase;
}
.portada h1 {
  margin: 0;
  color: #fff;
  font-size: 2.4rem;
}
.resumen {
  margin: 2px 0 0;
  color: #eef3ec;
}
.franja-tiempo {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}
.franja-tiempo > :first-child {
  flex: 1 1 320px;
  min-width: 0;
}
.franja-tiempo select {
  padding: 8px 10px;
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  font-size: 0.86rem;
}
.notice {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 12px;
  padding: 11px 16px;
  border-radius: var(--radius-sm);
  background: var(--color-primary-soft);
}
.notice a {
  font-weight: 600;
  text-decoration: none;
}
.vacio-inicio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 48px 16px;
  text-align: center;
}
.vacio-inicio h2 {
  margin: 8px 0 0;
  font-size: 1.5rem;
}
.vacio-inicio p {
  max-width: 46ch;
  margin: 0 0 10px;
  color: var(--color-text-soft);
}
.columnas {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
  gap: 44px;
  align-items: start;
  margin-top: 28px;
}
.titulo-seccion {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}
.titulo-seccion.separado {
  margin-top: 36px;
}
.titulo-seccion h2 {
  margin: 0;
  font-size: 1.4rem;
}
.titulo-seccion a,
.pie-seccion a {
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
}
.pie-seccion {
  margin: 8px 0 0;
}
.vacio-seccion {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 10px 0;
}
.vacio-seccion p {
  flex: 1 1 200px;
  margin: 0;
  color: var(--color-text-soft);
}
.cosechas,
.lecturas,
.sembrar {
  list-style: none;
  margin: 0;
  padding: 0;
}
.cosecha {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  color: inherit;
  text-decoration: none;
}
.cosecha-foto {
  width: 58px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 5px;
  background: var(--color-tierra-suave);
  color: var(--color-tierra-oscuro);
}
.cosecha-datos {
  flex: 1;
  min-width: 0;
}
.cosecha-linea {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0 10px;
  margin-bottom: 4px;
}
.cosecha:hover strong {
  color: var(--color-primary);
}
.cosecha-linea span {
  font-size: 0.8rem;
  color: var(--color-text-soft);
}
.cosecha-linea span.listo {
  color: var(--color-verde-oscuro);
  font-weight: 600;
}
.barra {
  height: 6px;
  border-radius: 3px;
  background: var(--color-tierra-suave);
  overflow: hidden;
}
.barra i {
  display: block;
  height: 100%;
  background: var(--color-verde);
}
.barra i.sembrado {
  background: var(--color-tierra);
}
.barra i.listo {
  background: var(--color-verde-oscuro);
}
.lateral {
  display: flex;
  flex-direction: column;
  gap: 32px;
  min-width: 0;
}
.lecturas li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-top: 1px solid var(--color-border);
}
.lecturas li:first-child {
  border-top: none;
}
.lectura-nombre {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.lectura-nombre small {
  color: var(--color-text-soft);
  font-size: 0.76rem;
}
.lecturas strong {
  font-family: var(--font-titulos);
  font-size: 1.2rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.lecturas strong small {
  font-family: var(--font-texto);
  font-size: 0.74rem;
  font-weight: 400;
  color: var(--color-text-soft);
}
.sembrar {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px 10px;
}
.sembrar a {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: inherit;
  text-decoration: none;
  font-size: 0.8rem;
  line-height: 1.25;
}
.sembrar a:hover {
  color: var(--color-primary);
}
.sembrar img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 5px;
  background: var(--color-tierra-suave);
}
.huertos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px 18px;
}
.huerto {
  position: relative;
  min-width: 0;
}
.huerto-enlace {
  display: flex;
  flex-direction: column;
  color: inherit;
  text-decoration: none;
}
.huerto-foto {
  aspect-ratio: 16 / 10;
  border-radius: var(--radius-sm);
  background: var(--color-tierra-suave);
  color: var(--color-tierra-oscuro);
}
.huerto-datos {
  display: flex;
  flex-direction: column;
  padding-top: 8px;
}
.huerto-datos strong {
  font-family: var(--font-titulos);
  font-size: 1.15rem;
}
.huerto-enlace:hover strong {
  color: var(--color-primary);
}
.huerto-datos span {
  font-size: 0.82rem;
  color: var(--color-text-soft);
}
.del {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  padding: 5px;
  border: none;
  border-radius: 50%;
  background: rgb(255 255 255 / 0.88);
  color: var(--color-text-soft);
  cursor: pointer;
}
.del:hover {
  color: var(--color-danger);
}
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  padding: 10px 16px;
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
.btn-ghost {
  background: transparent;
  border: none;
  color: var(--color-text-soft);
  font-weight: 600;
  cursor: pointer;
  padding: 10px 14px;
}
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
.small {
  font-size: 0.88rem;
}
.error {
  color: var(--color-danger);
  margin: 10px 0 0;
}
@media (max-width: 860px) {
  .columnas {
    grid-template-columns: minmax(0, 1fr);
    gap: 32px;
  }
}
@media (max-width: 520px) {
  .portada h1 {
    font-size: 1.9rem;
  }
  .portada {
    padding: 16px;
    min-height: 170px;
  }
}
</style>
