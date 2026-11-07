<template>
  <div v-if="huerto?.lat != null" class="tiempo" :class="aviso?.tipo">
    <template v-if="tiempo">
      <component :is="icono" :size="26" class="icono" />
      <div class="ahora">
        <strong>{{ tiempo.temperatura }}°</strong>
        <span>{{ descripcionTiempo(tiempo.codigo) }} · {{ tiempo.min }}° / {{ tiempo.max }}°</span>
      </div>
      <p class="aviso">{{ aviso.texto }}</p>
      <span v-if="mostrarNombre" class="lugar">{{ huerto.nombre }}</span>
    </template>
    <p v-else-if="error" class="estado">No se ha podido consultar el tiempo ahora mismo.</p>
    <p v-else class="estado">Consultando el tiempo…</p>
  </div>
  <p v-else-if="enlaceAjustes" class="sin-pin">
    <MapPin :size="15" />
    <span>Marca el huerto en el mapa para ver el tiempo y la lluvia prevista.</span>
    <router-link :to="`/orchard/${huerto.id}/settings`">Marcar ubicación</router-link>
  </p>
</template>

<script setup>
import { computed } from 'vue'
import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, MapPin, Sun } from 'lucide-vue-next'
import { avisoTiempo, descripcionTiempo, useTiempo } from '../composables/useTiempo'

const props = defineProps({
  huerto: { type: Object, default: null },
  mostrarNombre: { type: Boolean, default: false },
  // Solo quien puede editar el huerto ve la invitación a marcarlo.
  enlaceAjustes: { type: Boolean, default: false },
})

const { tiempo, error } = useTiempo(() =>
  props.huerto?.lat != null ? { lat: props.huerto.lat, lng: props.huerto.lng } : null,
)
const aviso = computed(() => (tiempo.value ? avisoTiempo(tiempo.value) : null))
const icono = computed(() => {
  const c = tiempo.value?.codigo
  if (c === 0) return Sun
  if (c <= 2) return CloudSun
  if (c === 3) return Cloud
  if (c <= 48) return CloudFog
  if (c >= 95) return CloudLightning
  if ((c >= 71 && c <= 77) || c === 85 || c === 86) return CloudSnow
  return CloudRain
})
</script>

<style scoped>
.tiempo {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 14px;
  padding: 11px 16px;
  border-radius: var(--radius-sm);
  background: var(--color-tierra-suave);
}
.tiempo.lluvia {
  background: var(--color-primary-soft);
}
.icono {
  color: var(--color-tierra-oscuro);
  flex-shrink: 0;
}
.lluvia .icono {
  color: var(--color-primary-dark);
}
.ahora {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}
.ahora strong {
  font-family: var(--font-titulos);
  font-size: 1.5rem;
  line-height: 1;
}
.ahora span {
  font-size: 0.86rem;
  color: var(--color-text-soft);
}
.aviso {
  flex: 1 1 240px;
  margin: 0;
  font-size: 0.9rem;
  font-weight: 500;
}
.lugar {
  font-size: 0.8rem;
  color: var(--color-text-soft);
}
.estado {
  margin: 0;
  font-size: 0.86rem;
  color: var(--color-text-soft);
}
.sin-pin {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 8px;
  margin: 0;
  font-size: 0.86rem;
  color: var(--color-text-soft);
}
.sin-pin a {
  font-weight: 600;
  text-decoration: none;
}
</style>
