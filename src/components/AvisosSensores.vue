<template>
  <section v-if="avisos.length" class="avisos" aria-live="polite" aria-label="Avisos de los sensores">
    <div v-for="a in avisos" :key="a.clave" class="aviso" :class="a.tipo">
      <AlertTriangle :size="18" class="icono" aria-hidden="true" />
      <div class="texto">
        <router-link :to="`/orchard/${a.orchardId}/crop/${a.cropId}`" class="titulo">{{ a.texto }}</router-link>
        <span class="detalle">{{ a.rango }}<template v-if="conHuerto && a.huerto"> · {{ a.huerto }}</template> · {{ haceTexto(a.ms, ahora) }}</span>
      </div>
      <template v-if="a.tipo === 'humedad' && a.baja">
        <span v-if="riegoPendiente(a)" class="hecho">Tarea de riego para hoy creada</span>
        <button
          v-else-if="puedeCrearTareas(a.orchardId)"
          type="button"
          class="crear"
          :disabled="creando[a.clave]"
          @click="crearRiego(a)"
        >
          {{ creando[a.clave] ? 'Creando…' : 'Crear tarea de riego' }}
        </button>
      </template>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
  </section>
</template>

<script setup>
// Lecturas fuera del rango recomendado del cultivo. Con humedad baja, se puede
// crear en un clic una tarea de riego para hoy en ese cultivo.
import { reactive, ref } from 'vue'
import { AlertTriangle } from 'lucide-vue-next'
import { useAhora } from '../composables/useAhora'
import { createTarea } from '../services/firestoreService'
import { hoyISO } from '../utils/fechas'
import { haceTexto } from '../utils/lecturas'
import { mensajeError } from '../utils/permissions'

const props = defineProps({
  avisos: { type: Array, required: true },
  // orchardId -> true si puede crear tareas en ese huerto.
  puedeCrearTareas: { type: Function, required: true },
  // orchardId -> tareas del huerto, para no duplicar el riego.
  tareasDe: { type: Function, required: true },
  conHuerto: { type: Boolean, default: false },
})

const ahora = useAhora()
const creando = reactive({})
const error = ref('')

// Ya hay una tarea de riego pendiente para hoy (o atrasada) en ese cultivo.
const riegoPendiente = (a) =>
  props.tareasDe(a.orchardId).some(
    (t) => !t.completada && t.cropId === a.cropId && /^regar/i.test(t.titulo || '') && (!t.fecha || t.fecha <= hoyISO()),
  )

async function crearRiego(a) {
  creando[a.clave] = true
  error.value = ''
  try {
    await createTarea(a.orchardId, { titulo: `Regar ${a.cultivo}`, cropId: a.cropId, fecha: hoyISO(), frecuencia: '' })
  } catch (e) {
    error.value = mensajeError(e, 'No se pudo crear la tarea de riego.')
    console.error(e)
  } finally {
    creando[a.clave] = false
  }
}
</script>

<style scoped>
.avisos {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}
.aviso {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  border: 1px solid #f0c9a8;
  background: #fdf3ea;
}
.aviso.temperatura {
  border-color: #f3c0b9;
  background: #fdf0ee;
}
.icono {
  flex-shrink: 0;
  color: #b4581b;
}
.temperatura .icono {
  color: var(--color-danger);
}
.texto {
  flex: 1 1 220px;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.titulo {
  font-weight: 700;
  color: var(--color-text);
  text-decoration: none;
}
.titulo:hover {
  text-decoration: underline;
}
.detalle {
  font-size: 0.8rem;
  color: var(--color-text-soft);
}
.crear {
  padding: 7px 12px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--color-primary);
  color: #fff;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}
.crear:disabled {
  opacity: 0.6;
  cursor: default;
}
.hecho {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-verde-oscuro);
}
.error {
  margin: 0;
  color: var(--color-danger);
  font-size: 0.85rem;
}
</style>
