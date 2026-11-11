<template>
  <AuthLayout titulo="Recupera tu contraseña" subtitulo="Te enviaremos un enlace para elegir una nueva.">
    <form class="acceso-form" novalidate @submit.prevent="submit">
      <div class="campo">
        <label for="rec-email">Email</label>
        <input
          id="rec-email"
          v-model="email"
          type="email"
          placeholder="tu@email.com"
          autocomplete="email"
          :aria-invalid="!!errores.email"
          :aria-describedby="errores.email ? 'rec-email-error' : undefined"
          @input="errores.email = ''"
        />
        <p v-if="errores.email" id="rec-email-error" class="error-campo">{{ errores.email }}</p>
      </div>

      <p v-if="errores.general" class="error-general" role="alert">{{ errores.general }}</p>
      <p v-if="sent" class="success" role="status">
        Te hemos enviado un correo para restablecer tu contraseña. Revisa también la carpeta de spam.
      </p>

      <button type="submit" class="boton-principal" :disabled="loading">
        {{ loading ? 'Enviando…' : 'Enviar enlace' }}
      </button>
    </form>

    <p class="pie">
      ¿La recuerdas?
      <router-link to="/login">Inicia sesión</router-link>
    </p>
  </AuthLayout>
</template>

<script setup>
import { reactive, ref } from 'vue'
import AuthLayout from '../components/AuthLayout.vue'
import { resetPassword, authErrorMessage, campoDeError, validarEmail } from '../services/authService'

const email = ref('')
const errores = reactive({ email: '', general: '' })
const sent = ref(false)
const loading = ref(false)

async function submit() {
  sent.value = false
  errores.email = validarEmail(email.value)
  errores.general = ''
  if (errores.email) return
  loading.value = true
  try {
    await resetPassword(email.value.trim())
    sent.value = true
  } catch (e) {
    errores[campoDeError(e.code) === 'email' ? 'email' : 'general'] = authErrorMessage(e.code)
  } finally {
    loading.value = false
  }
}
</script>
