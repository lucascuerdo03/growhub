<template>
  <form class="form-cultivo" @submit.prevent="guardar">
    <template v-if="huertos.length > 1">
      <label for="fc-huerto">Huerto</label>
      <select id="fc-huerto" v-model="destino">
        <option v-for="h in huertos" :key="h.id" :value="h.id">{{ h.nombre }}</option>
      </select>
    </template>

    <div class="dos">
      <div>
        <label for="fc-nombre">Nombre</label>
        <input id="fc-nombre" v-model="nombre" />
      </div>
      <div>
        <label for="fc-fecha">Fecha de siembra</label>
        <input id="fc-fecha" v-model="fecha" type="date" />
      </div>
      <div>
        <label for="fc-especie">Especie</label>
        <input id="fc-especie" v-model="especie" placeholder="Opcional" />
      </div>
      <div>
        <label for="fc-familia">Familia</label>
        <input id="fc-familia" v-model="familia" placeholder="Opcional" />
      </div>
    </div>

    <label>Foto</label>
    <ImageUpload v-model="fotoNueva" v-model:removed="fotoQuitada" :url="entrada?.foto || ''" />
    <p v-if="entrada && !fotoNueva && !fotoQuitada" class="ayuda">
      Se usará la foto de la biblioteca. Puedes quitarla o subir una tuya.
    </p>

    <fieldset v-if="tareas.length && puedeTareas" class="tareas">
      <legend>Crear también estas tareas</legend>
      <div class="tareas-cabecera">
        <span class="tareas-cuenta">{{ textoMarcadas }}</span>
        <button type="button" class="enlace" :disabled="marcadas.length === tareas.length" @click="marcarTodas">Seleccionar todas</button>
        <button type="button" class="enlace" :disabled="!marcadas.length" @click="marcadas = []">Ninguna</button>
      </div>
      <label v-for="t in tareas" :key="t.clave" class="tarea">
        <input v-model="marcadas" type="checkbox" :value="t.clave" />
        <span class="tarea-titulo">
          {{ t.titulo }}
          <span v-if="t.frecuenciaRiego" class="tarea-frecuencia">{{ t.frecuenciaRiego.toLowerCase() }}</span>
        </span>
        <span class="tarea-fecha">{{ fechaCorta(fechaDe(t)) }}</span>
      </label>
    </fieldset>

    <p v-if="error" class="error">{{ error }}</p>

    <div class="acciones">
      <button type="button" class="ghost" @click="$emit('cancelar')">Cancelar</button>
      <button type="submit" class="primary" :disabled="guardando || !nombre.trim() || !destino">
        {{ guardando ? 'Añadiendo…' : 'Añadir cultivo' }}
      </button>
    </div>
  </form>
</template>

<script setup>
// Alta de un cultivo, desde la biblioteca o personalizado.
import { computed, ref } from 'vue'
import ImageUpload from './ImageUpload.vue'
import { useAuth } from '../composables/useAuth'
import { tareasRecomendadas } from '../data/cropsLibrary'
import { crearCultivoConTareas, createFoto, limpiarFoto } from '../services/firestoreService'
import { fechaCorta, hoyISO, sumarDias } from '../utils/fechas'
import { mensajeError, permisosEn } from '../utils/permissions'

const props = defineProps({
  // Entrada de la biblioteca, o null si es un cultivo personalizado.
  entrada: { type: Object, default: null },
  nombreInicial: { type: String, default: '' },
  // Huertos donde se puede añadir. Con uno solo no se pregunta.
  huertos: { type: Array, required: true },
})
const emit = defineEmits(['guardado', 'cancelar'])

const { user } = useAuth()
const destino = ref(props.huertos[0]?.id || null)
const nombre = ref(props.entrada?.nombre || props.nombreInicial)
const especie = ref(props.entrada?.especie || '')
const familia = ref(props.entrada?.familia || '')
const fecha = ref(hoyISO())
const fotoNueva = ref('')
const fotoQuitada = ref(false)
const guardando = ref(false)
const error = ref('')

const tareas = computed(() => (props.entrada ? tareasRecomendadas(props.entrada) : []))
// Ninguna marcada de entrada: el usuario elige las que quiere.
const marcadas = ref([])
const marcarTodas = () => (marcadas.value = tareas.value.map((t) => t.clave))
const textoMarcadas = computed(() => {
  const n = marcadas.value.length
  if (!n) return 'Ninguna seleccionada'
  return n === 1 ? '1 seleccionada' : `${n} seleccionadas`
})
const puedeTareas = computed(
  () => permisosEn(props.huertos.find((h) => h.id === destino.value), user.value?.uid).manageTasks,
)

// Las tareas se cuentan desde la siembra, sin dejar ninguna ya atrasada al crearla.
function fechaDe(t) {
  const prevista = sumarDias(fecha.value || hoyISO(), t.dias)
  return prevista < hoyISO() ? hoyISO() : prevista
}

async function guardar() {
  guardando.value = true
  error.value = ''
  let fotoId = ''
  const orchardId = destino.value
  try {
    if (fotoNueva.value) fotoId = await createFoto(orchardId, fotoNueva.value)
    const usarBiblioteca = props.entrada && !fotoNueva.value && !fotoQuitada.value
    const elegidas = puedeTareas.value
      ? tareas.value
          .filter((t) => marcadas.value.includes(t.clave))
          .map((t) => ({ titulo: t.titulo, fecha: fechaDe(t), frecuenciaRiego: t.frecuenciaRiego || '' }))
      : []
    const cropId = await crearCultivoConTareas(
      orchardId,
      {
        nombre: nombre.value.trim(),
        especie: especie.value.trim(),
        familia: familia.value.trim(),
        fechaSiembra: fecha.value,
        libraryId: props.entrada?.id || '',
        fotoId,
        foto: usarBiblioteca ? props.entrada.foto : '',
      },
      elegidas,
    )
    emit('guardado', { orchardId, cropId, nombre: nombre.value.trim(), tareas: elegidas.length })
  } catch (e) {
    await limpiarFoto(orchardId, fotoId, '')
    error.value = mensajeError(e, 'No se pudo añadir el cultivo.')
    console.error(e)
  } finally {
    guardando.value = false
  }
}
</script>

<style scoped>
.form-cultivo {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
label {
  font-weight: 600;
  font-size: 0.84rem;
  margin-top: 8px;
}
input:not([type='checkbox']),
select {
  width: 100%;
  padding: 9px 11px;
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-sm);
  font-size: 0.92rem;
  background: var(--color-surface);
}
.dos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 4px 12px;
}
.dos > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.ayuda {
  margin: 2px 0 0;
  font-size: 0.8rem;
  color: var(--color-text-soft);
}
.tareas {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 8px 12px 10px;
  margin: 12px 0 0;
  min-width: 0;
}
.tareas legend {
  font-weight: 600;
  font-size: 0.84rem;
  padding: 0 4px;
}
.tarea {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-weight: 400;
  font-size: 0.88rem;
  margin: 0;
  padding: 4px 0;
  cursor: pointer;
}
.tareas-cabecera {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px 14px;
  margin: 2px 0 4px;
  font-size: 0.8rem;
}
.tareas-cuenta {
  flex: 1;
  color: var(--color-text-soft);
}
.enlace {
  background: transparent;
  border: none;
  padding: 2px 0;
  color: var(--color-primary);
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
}
.enlace:disabled {
  color: var(--color-text-soft);
  opacity: 0.6;
  cursor: default;
}
.tarea-titulo {
  flex: 1;
  min-width: 0;
}
.tarea-frecuencia {
  margin-left: 4px;
  color: var(--color-text-soft);
  font-size: 0.8rem;
}
.tarea-frecuencia::before {
  content: '· ';
}
.tarea-fecha {
  color: var(--color-text-soft);
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.acciones {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}
.ghost {
  background: transparent;
  border: none;
  color: var(--color-text-soft);
  font-weight: 600;
  cursor: pointer;
  padding: 9px 12px;
}
.primary {
  background: var(--color-primary);
  color: #fff;
  border: none;
  padding: 10px 18px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
}
.primary:disabled {
  opacity: 0.55;
  cursor: default;
}
.error {
  color: var(--color-danger);
  margin: 8px 0 0;
}
</style>
