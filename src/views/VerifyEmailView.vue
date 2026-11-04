<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1>GrowHub</h1>
      <p class="subtitle">Confirma tu cuenta</p>

      <p class="msg">
        Te hemos enviado un correo de confirmación a
        <strong>{{ user?.email }}</strong>. Ábrelo y pulsa el enlace para
        verificar tu cuenta.
      </p>

      <p v-if="info" class="success">{{ info }}</p>
      <p v-if="error" class="error">{{ error }}</p>

      <button class="primary" :disabled="checking" @click="comprobar">
        {{ checking ? 'Comprobando…' : 'Ya lo he verificado' }}
      </button>
      <button class="secondary" :disabled="sending" @click="reenviar">
        {{ sending ? 'Enviando…' : 'Reenviar correo' }}
      </button>

      <p class="foot">
        <a href="#" @click.prevent="salir">Cerrar sesión</a>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth, reloadUser } from '../composables/useAuth'
import { resendVerification, logoutUser } from '../services/authService'
import '../assets/auth.css'

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
      router.push('/dashboard')
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
  router.push('/login')
}
</script>

<style scoped>
.msg {
  color: var(--color-text-soft);
  text-align: left;
  margin: 0 0 18px;
  line-height: 1.5;
}
.primary {
  width: 100%;
  margin-top: 6px;
  padding: 12px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
}
.primary:disabled {
  opacity: 0.6;
}
.secondary {
  width: 100%;
  margin-top: 10px;
  padding: 12px;
  background: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary-border);
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
}
.secondary:disabled {
  opacity: 0.6;
}
</style>
