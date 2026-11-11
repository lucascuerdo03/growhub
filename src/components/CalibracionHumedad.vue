<template>
  <div class="calibracion">
    <p class="estado">
      <template v-if="completa">Calibrado: seco {{ cal.seco }} · mojado {{ cal.mojado }} (RAW)</template>
      <template v-else-if="cal.seco != null || cal.mojado != null">
        Calibración a medias: {{ cal.seco != null ? `seco ${cal.seco}` : `mojado ${cal.mojado}` }}. Falta el otro valor.
      </template>
      <template v-else>Sin calibrar: el porcentaje usa los valores del puente (bridge/.env).</template>
    </p>
    <p v-if="completa && cal.seco < cal.mojado" class="aviso">
      El valor seco suele ser mayor que el mojado: revisa que no estén cambiados.
    </p>
    <template v-if="puedeEditar">
      <div class="botones">
        <button type="button" :disabled="!rawActual || guardando" @click="guardar('seco')">Guardar como seco</button>
        <button type="button" :disabled="!rawActual || guardando" @click="guardar('mojado')">Guardar como mojado</button>
        <button v-if="cal.seco != null || cal.mojado != null" type="button" class="quitar" :disabled="guardando" @click="quitar">
          Quitar calibración
        </button>
      </div>
      <p class="ayuda">
        <template v-if="rawActual">Última lectura: RAW {{ rawActual }}. Con el sensor al aire pulsa "seco"; dentro de un vaso de agua, "mojado".</template>
        <template v-else>Hace falta una lectura del nodo con el valor RAW para calibrar.</template>
      </p>
      <p v-if="error" class="error">{{ error }}</p>
    </template>
  </div>
</template>

<script setup>
// Calibración del sensor de humedad del suelo con la última lectura RAW. Si existe,
// manda sobre SOIL_RAW_DRY/SOIL_RAW_WET del puente.
import { computed, ref } from 'vue'
import { deleteField } from 'firebase/firestore'
import { calibracionCompleta } from '../utils/humedad'
import { mensajeError } from '../utils/permissions'
import { updateSensor } from '../services/firestoreService'

const props = defineProps({
  orchardId: { type: String, required: true },
  sensor: { type: Object, required: true },
  // Última lectura del sensor (o null).
  ultima: { type: Object, default: null },
  puedeEditar: { type: Boolean, default: false },
})

const guardando = ref(false)
const error = ref('')
const cal = computed(() => props.sensor.calibracion || {})
const completa = computed(() => calibracionCompleta(props.sensor.calibracion))
const rawActual = computed(() => (Number.isFinite(props.ultima?.raw) ? props.ultima.raw : null))

async function escribir(datos) {
  guardando.value = true
  error.value = ''
  try {
    await updateSensor(props.orchardId, props.sensor.id, datos)
  } catch (e) {
    error.value = mensajeError(e, 'No se pudo guardar la calibración.')
    console.error(e)
  } finally {
    guardando.value = false
  }
}

const guardar = (cual) => escribir({ [`calibracion.${cual}`]: rawActual.value })
const quitar = () => escribir({ calibracion: deleteField() })
</script>

<style scoped>
.calibracion {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--color-border-soft);
  font-size: 0.82rem;
}
.estado {
  margin: 0 0 6px;
  color: var(--color-text);
}
.aviso {
  margin: 0 0 6px;
  color: var(--color-tierra-oscuro);
}
.botones {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.botones button {
  padding: 6px 10px;
  border: 1px solid var(--color-primary-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-primary);
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
}
.botones button:disabled {
  opacity: 0.5;
  cursor: default;
}
.botones .quitar {
  border-color: transparent;
  color: var(--color-text-soft);
}
.ayuda {
  margin: 6px 0 0;
  color: var(--color-text-soft);
}
.error {
  margin: 6px 0 0;
  color: var(--color-danger);
}
</style>
