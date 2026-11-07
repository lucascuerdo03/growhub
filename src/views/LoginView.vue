<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1>GrowHub</h1>
      <p class="subtitle">Inicia sesión para continuar</p>
      <p v-if="conInvitacion" class="notice">
        Tienes una invitación a un huerto. Entra o regístrate con el email al que te han invitado.
      </p>

      <form @submit.prevent="login">
        <label>Email</label>
        <input v-model="email" type="email" placeholder="tu@email.com" autocomplete="email" />

        <label>Contraseña</label>
        <input
          v-model="password"
          type="password"
          placeholder="••••••••"
          autocomplete="current-password"
        />

        <router-link to="/forgot-password" class="link-right">
          ¿Olvidaste tu contraseña?
        </router-link>

        <p v-if="error" class="error">{{ error }}</p>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Entrando…' : 'Entrar' }}
        </button>
      </form>

      <p class="foot">
        ¿No tienes cuenta?
        <router-link to="/register">Regístrate</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { loginUser, authErrorMessage } from '../services/authService'
import { reloadUser } from '../composables/useAuth'
import { hayDestino, tomarDestino } from '../utils/destino'
import '../assets/auth.css'

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const conInvitacion = hayDestino()

async function login() {
  error.value = ''
  loading.value = true
  try {
    await loginUser(email.value, password.value)
    const u = await reloadUser()
    // Si el email no está verificado, a la pantalla de confirmación.
    router.push(u?.emailVerified ? tomarDestino() : '/verify-email')
  } catch (e) {
    error.value = authErrorMessage(e.code)
  } finally {
    loading.value = false
  }
}
</script>
