<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1>GrowHub 🌱</h1>
      <p class="subtitle">Crea tu cuenta</p>

      <form @submit.prevent="register">
        <label>Nombre</label>
        <input v-model="name" type="text" placeholder="Tu nombre" autocomplete="name" />

        <label>Email</label>
        <input v-model="email" type="email" placeholder="tu@email.com" autocomplete="email" />

        <label>Contraseña</label>
        <input
          v-model="password"
          type="password"
          placeholder="Mínimo 6 caracteres"
          autocomplete="new-password"
        />

        <p v-if="error" class="error">{{ error }}</p>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Creando…' : 'Crear cuenta' }}
        </button>
      </form>

      <p class="foot">
        ¿Ya tienes cuenta?
        <router-link to="/login">Inicia sesión</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { registerUser, authErrorMessage } from '../services/authService'
import '../assets/auth.css'

const router = useRouter()
const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function register() {
  error.value = ''
  loading.value = true
  try {
    await registerUser(email.value, password.value, name.value)
    router.push('/dashboard')
  } catch (e) {
    error.value = authErrorMessage(e.code)
  } finally {
    loading.value = false
  }
}
</script>
