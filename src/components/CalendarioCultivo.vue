<template>
  <div class="calendario" :class="{ compacto }" role="img" :aria-label="descripcion">
    <div v-if="!compacto" class="fila cabecera">
      <span class="etiqueta"></span>
      <span v-for="(m, i) in MESES" :key="m" class="mes" :class="{ actual: i + 1 === hoy }">{{ m }}</span>
    </div>
    <div v-for="f in filas" :key="f.clave" class="fila">
      <span v-if="!compacto" class="etiqueta">{{ f.nombre }}</span>
      <span
        v-for="m in 12"
        :key="m"
        class="celda"
        :class="[f.meses.includes(m) ? f.clave : '', { actual: m === hoy }]"
      ></span>
    </div>
    <ul v-if="!compacto" class="leyenda" aria-hidden="true">
      <li v-for="f in filas" :key="f.clave"><i :class="f.clave"></i>{{ f.nombre }}</li>
    </ul>
  </div>
</template>

<script setup>
// Calendario de 12 meses de un cultivo. `compacto` es la tira de las tarjetas.
import { computed } from 'vue'
import { MESES_LARGOS, MESES } from '../data/cropsLibrary'
import { mesActual } from '../utils/fechas'

const props = defineProps({
  entrada: { type: Object, required: true },
  compacto: { type: Boolean, default: false },
})

const hoy = mesActual()
const filas = computed(() => {
  const e = props.entrada
  const lista = []
  if (e.siembra.length) lista.push({ clave: 'siembra', nombre: 'Siembra', meses: e.siembra })
  if (e.trasplante.length) {
    lista.push({ clave: 'trasplante', nombre: e.siembra.length ? 'Trasplante' : 'Plantación', meses: e.trasplante })
  }
  lista.push({ clave: 'cosecha', nombre: 'Cosecha', meses: e.cosecha })
  return lista
})
const descripcion = computed(() =>
  filas.value
    .map((f) => `${f.nombre}: ${f.meses.map((m) => MESES_LARGOS[m - 1]).join(', ')}`)
    .join('. '),
)
</script>

<style scoped>
.calendario {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-variant-numeric: tabular-nums;
}
.fila {
  display: grid;
  grid-template-columns: 78px repeat(12, minmax(0, 1fr));
  gap: 3px;
  align-items: center;
}
.compacto .fila {
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 2px;
}
.compacto {
  gap: 2px;
}
.etiqueta {
  font-size: 0.78rem;
  color: var(--color-text-soft);
}
.mes {
  font-size: 0.68rem;
  text-align: center;
  color: var(--color-text-soft);
}
.mes.actual {
  color: var(--color-text);
  font-weight: 700;
}
.celda {
  height: 20px;
  border-radius: 2px;
  background: var(--color-tierra-suave);
}
.compacto .celda {
  height: 5px;
  border-radius: 1px;
}
.celda.actual {
  box-shadow: inset 0 0 0 1.5px var(--color-text);
}
.compacto .celda.actual {
  box-shadow: none;
}
.celda.siembra,
.leyenda i.siembra {
  background: var(--color-verde);
}
.celda.trasplante,
.leyenda i.trasplante {
  background: var(--color-verde-claro);
}
.celda.cosecha,
.leyenda i.cosecha {
  background: var(--color-tierra);
}
.leyenda {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  font-size: 0.8rem;
  color: var(--color-text-soft);
}
.leyenda li {
  display: flex;
  align-items: center;
  gap: 6px;
}
.leyenda i {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}
@media (max-width: 520px) {
  .fila {
    grid-template-columns: 62px repeat(12, minmax(0, 1fr));
    gap: 2px;
  }
  .compacto .fila {
    grid-template-columns: repeat(12, minmax(0, 1fr));
  }
  .mes {
    font-size: 0.58rem;
  }
}
</style>
