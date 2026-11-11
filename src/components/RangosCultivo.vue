<template>
  <div class="rangos">
    <div class="resumen">
      <span><strong>Temperatura:</strong> {{ r.tempMin }}–{{ r.tempMax }} °C</span>
      <span><strong>Humedad del suelo:</strong> {{ r.humMin }}–{{ r.humMax }} %</span>
      <span class="origen">{{ r.propios ? 'Rangos propios' : 'Según la biblioteca' }}</span>
      <button v-if="puedeEditar && !editando" type="button" class="enlace" @click="abrir">Editar rangos</button>
    </div>

    <form v-if="editando" class="editor" @submit.prevent="guardar">
      <label>Temperatura mínima (°C)<input v-model.number="f.tempMin" type="number" step="1" /></label>
      <label>Temperatura máxima (°C)<input v-model.number="f.tempMax" type="number" step="1" /></label>
      <label>Humedad mínima (%)<input v-model.number="f.humMin" type="number" min="0" max="100" step="1" /></label>
      <label>Humedad máxima (%)<input v-model.number="f.humMax" type="number" min="0" max="100" step="1" /></label>
      <p v-if="error" class="error">{{ error }}</p>
      <div class="acciones">
        <button v-if="r.propios" type="button" class="enlace" :disabled="guardando" @click="restablecer">Volver a los de la biblioteca</button>
        <button type="button" class="enlace" @click="editando = false">Cancelar</button>
        <button type="submit" class="guardar" :disabled="guardando">{{ guardando ? 'Guardando…' : 'Guardar' }}</button>
      </div>
    </form>
  </div>
</template>

<script setup>
// Rangos recomendados del cultivo para los avisos de los sensores. Por defecto
// salen de la biblioteca; si se editan, se guardan en el cultivo (`rangos`).
import { computed, reactive, ref } from 'vue'
import { deleteField } from 'firebase/firestore'
import { rangosDe, rangosValidos } from '../utils/rangos'
import { mensajeError } from '../utils/permissions'
import { updateCultivo } from '../services/firestoreService'

const props = defineProps({
  orchardId: { type: String, required: true },
  cultivo: { type: Object, required: true },
  puedeEditar: { type: Boolean, default: false },
})

const r = computed(() => rangosDe(props.cultivo))
const editando = ref(false)
const guardando = ref(false)
const error = ref('')
const f = reactive({ tempMin: 0, tempMax: 0, humMin: 0, humMax: 0 })

function abrir() {
  Object.assign(f, { tempMin: r.value.tempMin, tempMax: r.value.tempMax, humMin: r.value.humMin, humMax: r.value.humMax })
  error.value = ''
  editando.value = true
}

async function escribir(datos) {
  guardando.value = true
  error.value = ''
  try {
    await updateCultivo(props.orchardId, props.cultivo.id, datos)
    editando.value = false
  } catch (e) {
    error.value = mensajeError(e, 'No se pudieron guardar los rangos.')
    console.error(e)
  } finally {
    guardando.value = false
  }
}

function guardar() {
  const nuevos = { tempMin: f.tempMin, tempMax: f.tempMax, humMin: f.humMin, humMax: f.humMax }
  if (!rangosValidos(nuevos)) {
    error.value = 'Cada mínimo tiene que ser menor que su máximo, y la humedad debe estar entre 0 y 100 %.'
    return
  }
  escribir({ rangos: nuevos })
}

const restablecer = () => escribir({ rangos: deleteField() })
</script>

<style scoped>
.rangos {
  margin-bottom: 14px;
  font-size: 0.88rem;
}
.resumen {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 16px;
}
.origen {
  color: var(--color-text-soft);
  font-size: 0.8rem;
}
.enlace {
  background: transparent;
  border: none;
  padding: 0;
  color: var(--color-primary);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}
.editor {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 10px 14px;
  margin-top: 10px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}
.editor label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}
.editor input {
  padding: 8px 10px;
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-sm);
}
.acciones {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
}
.guardar {
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--color-primary);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}
.guardar:disabled {
  opacity: 0.6;
}
.error {
  grid-column: 1 / -1;
  margin: 0;
  color: var(--color-danger);
}
</style>
