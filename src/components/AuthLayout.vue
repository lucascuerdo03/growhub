<template>
  <div class="acceso">
    <aside class="acceso-foto">
      <img :src="FOTO_HUERTO.url" alt="" width="1400" height="933" />
      <div class="acceso-marca">
        <router-link to="/" class="marca">GrowHub</router-link>
        <p>Tu huerto, al día.</p>
      </div>
      <p class="credito">
        Foto: <a :href="FOTO_HUERTO.pagina" target="_blank" rel="noopener">{{ FOTO_HUERTO.autor }}</a>,
        <a :href="FOTO_HUERTO.licenciaUrl" target="_blank" rel="noopener">{{ FOTO_HUERTO.licencia }}</a>
      </p>
    </aside>

    <main class="acceso-panel">
      <router-link to="/" class="volver"><ArrowLeft :size="16" aria-hidden="true" /> Volver a la página principal</router-link>
      <div class="acceso-contenido">
        <h1>{{ titulo }}</h1>
        <p v-if="subtitulo" class="subtitulo">{{ subtitulo }}</p>
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup>
// Marco de las pantallas de acceso (entrar, registrarse, recuperar la contraseña
// y verificar el email): foto de huerto a un lado y el formulario al otro.
import { ArrowLeft } from 'lucide-vue-next'
import { FOTO_HUERTO } from '../utils/fotoHuerto'
import '../assets/auth.css'

defineProps({
  titulo: { type: String, required: true },
  subtitulo: { type: String, default: '' },
})
</script>
