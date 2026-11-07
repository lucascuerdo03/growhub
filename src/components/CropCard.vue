<template>
  <article class="cultivo">
    <router-link :to="`/orchard/${orchardId}/crop/${cultivo.id}`" class="enlace">
      <StoredImage class="foto" :orchard-id="orchardId" :foto-id="cultivo.fotoId" :url="cultivo.foto" :alt="cultivo.nombre">
        <Leaf :size="26" />
      </StoredImage>
      <div class="datos">
        <strong>{{ cultivo.nombre }}</strong>
        <span class="etapa" :class="estado.etapa">{{ ETAPAS[estado.etapa] }}</span>
        <template v-if="estado.pct !== null">
          <div class="barra" role="progressbar" :aria-valuenow="estado.pct" aria-valuemin="0" aria-valuemax="100" :aria-label="`Progreso hasta la cosecha de ${cultivo.nombre}`">
            <i :class="estado.etapa" :style="{ width: `${estado.pct}%` }"></i>
          </div>
          <span class="resto">{{ estado.texto }}</span>
        </template>
        <span v-else-if="estado.etapa !== 'sin-fecha'" class="resto">{{ estado.texto }}</span>
      </div>
    </router-link>
    <button v-if="puedeBorrar" class="borrar" :aria-label="`Eliminar ${cultivo.nombre}`" @click="$emit('remove', cultivo)">
      <X :size="14" />
    </button>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { Leaf, X } from 'lucide-vue-next'
import StoredImage from './StoredImage.vue'
import { ETAPAS, estadoCultivo } from '../utils/cultivos'

const props = defineProps({
  cultivo: { type: Object, required: true },
  orchardId: { type: String, required: true },
  puedeBorrar: { type: Boolean, default: false },
})
defineEmits(['remove'])

const estado = computed(() => estadoCultivo(props.cultivo))
</script>

<style scoped>
.cultivo {
  position: relative;
  min-width: 0;
}
.enlace {
  display: flex;
  flex-direction: column;
  color: inherit;
  text-decoration: none;
}
.enlace:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 3px;
}
.foto {
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-sm);
  background: var(--color-tierra-suave);
  color: var(--color-tierra-oscuro);
}
.datos {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  padding-top: 8px;
}
.datos strong {
  overflow-wrap: anywhere;
}
.enlace:hover strong {
  color: var(--color-primary);
}
.etapa {
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--color-text-soft);
}
.etapa.sembrado {
  color: var(--color-tierra-oscuro);
}
.etapa.creciendo,
.etapa.listo {
  color: var(--color-verde-oscuro);
}
.barra {
  width: 100%;
  height: 5px;
  margin-top: 3px;
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
.resto {
  font-size: 0.76rem;
  color: var(--color-text-soft);
}
.borrar {
  position: absolute;
  top: 6px;
  right: 6px;
  display: flex;
  padding: 4px;
  border: none;
  border-radius: 50%;
  background: rgb(255 255 255 / 0.88);
  color: var(--color-text-soft);
  cursor: pointer;
}
.borrar:hover {
  color: var(--color-danger);
}
</style>
