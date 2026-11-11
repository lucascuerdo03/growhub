<template>
  <AuthLayout titulo="Confirma tu cuenta">
    <p class="msg">
      Te hemos enviado un correo de confirmación a
      <strong>{{ user?.email }}</strong>. Ábrelo y pulsa el enlace para
      verificar tu cuenta.
    </p>

    <p v-if="info" class="success" role="status">{{ info }}</p>
    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <button class="boton-principal" :disabled="checking" @click="comprobar">
      {{ checking ? 'Comprobando…' : 'Ya lo he verificado' }}
    </button>
    <button class="boton-secundario" :disabled="sending" @click="reenviar">
      {{ sending ? 'Enviando…' : 'Reenviar correo' }}
    </button>

    <p class="pie">
      ¿No es tu cuenta? <a href="#" @click.prevent="salir">Cerrar sesión</a>
    </p>
  </AuthLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth, reloadUser } from '../composables/useAuth'
import { resendVerification, logoutUser } from '../services/authService'
import { tomarDestino } from '../utils/destino'
import AuthLayout from '../components/AuthLayout.vue'

const router = useRouter()
const { user } = useAuth()
const checking = ref(false)
const sending = ref(false)
const info = ref('')
const error = ref('')

async function comprobar() {
  checking.value = true
  error.value = ''
  info.value = ''
  try {
    const u = await reloadUser()
    if (u?.emailVerified) {
      router.replace(tomarDestino())
    } else {
      error.value = 'Tu correo aún no está verificado. Revisa tu bandeja de entrada.'
    }
  } catch (e) {
    error.value = 'No se pudo comprobar. Inténtalo de nuevo.'
    console.error(e)
  } finally {
    checking.value = false
  }
}

async function reenviar() {
  sending.value = true
  error.value = ''
  info.value = ''
  try {
    await resendVerification()
    info.value = 'Correo reenviado. Revisa tu bandeja de entrada y la carpeta de spam.'
  } catch (e) {
    error.value = 'No se pudo reenviar el correo. Espera un momento e inténtalo de nuevo.'
    console.error(e)
  } finally {
    sending.value = false
  }
}

async function salir() {
  await logoutUser()
  router.replace('/')
}
</script>
