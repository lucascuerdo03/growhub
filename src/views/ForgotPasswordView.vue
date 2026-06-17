<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1>GrowHub 🌱</h1>
      <p class="subtitle">Recuperar contraseña</p>

      <form @submit.prevent="submit">
        <label>Email</label>
        <input v-model="email" type="email" placeholder="tu@email.com" autocomplete="email" />

        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="sent" class="success">
          Te hemos enviado un correo para restablecer tu contraseña.
        </p>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Enviando…' : 'Enviar enlace' }}
        </button>
      </form>

      <p class="foot">
        <router-link to="/login">Volver a inicio de sesión</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { resetPassword, authErrorMessage } from '../services/authService'
import '../assets/auth.css'

const email = ref('')
const error = ref('')
const sent = ref(false)
const loading = ref(false)

async function submit() {
  error.value = ''
  sent.value = false
  loading.value = true
  try {
    await resetPassword(email.value)
    sent.value = true
  } catch (e) {
    error.value = authErrorMessage(e.code)
  } finally {
    loading.value = false
  }
}
</script>
