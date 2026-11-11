<template>
  <AuthLayout titulo="Inicia sesión" subtitulo="Entra para ver qué toca hoy en tus huertos.">
    <p v-if="conInvitacion" class="notice">
      Tienes una invitación a un huerto. Entra o regístrate con el email al que te han invitado.
    </p>

    <form class="acceso-form" novalidate @submit.prevent="login">
      <div class="campo">
        <label for="login-email">Email</label>
        <input
          id="login-email"
          v-model="email"
          type="email"
          placeholder="tu@email.com"
          autocomplete="email"
          :aria-invalid="!!errores.email"
          :aria-describedby="errores.email ? 'login-email-error' : undefined"
          @input="errores.email = ''"
        />
        <p v-if="errores.email" id="login-email-error" class="error-campo">{{ errores.email }}</p>
      </div>

      <div class="campo">
        <label for="login-password">Contraseña</label>
        <div class="pw-field">
          <input
            id="login-password"
            v-model="password"
            :type="verPassword ? 'text' : 'password'"
            autocomplete="current-password"
            :aria-invalid="!!errores.password"
            :aria-describedby="errores.password ? 'login-password-error' : undefined"
            @input="errores.password = ''"
          />
          <button type="button" class="pw-toggle" :aria-label="verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'" @click="verPassword = !verPassword">
            <component :is="verPassword ? EyeOff : Eye" :size="18" />
          </button>
        </div>
        <p v-if="errores.password" id="login-password-error" class="error-campo">{{ errores.password }}</p>
      </div>
      <div class="campo-pie">
        <router-link to="/forgot-password">¿Olvidaste tu contraseña?</router-link>
      </div>

      <p v-if="errores.general" class="error-general" role="alert">{{ errores.general }}</p>

      <button type="submit" class="boton-principal" :disabled="loading">
        {{ loading ? 'Entrando…' : 'Entrar' }}
      </button>
    </form>

    <p class="pie">
      ¿No tienes cuenta?
      <router-link to="/register">Crea una</router-link>
    </p>
  </AuthLayout>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff } from 'lucide-vue-next'
import AuthLayout from '../components/AuthLayout.vue'
import { loginUser, authErrorMessage, campoDeError, validarEmail } from '../services/authService'
import { reloadUser } from '../composables/useAuth'
import { hayDestino, tomarDestino } from '../utils/destino'

const router = useRouter()
const email = ref('')
const password = ref('')
const verPassword = ref(false)
const errores = reactive({ email: '', password: '', general: '' })
const loading = ref(false)
const conInvitacion = hayDestino()

async function login() {
  errores.email = validarEmail(email.value)
  errores.password = password.value ? '' : 'Escribe tu contraseña.'
  errores.general = ''
  if (errores.email || errores.password) return
  loading.value = true
  try {
    await loginUser(email.value.trim(), password.value)
    const u = await reloadUser()
    // replace: el formulario no queda en el historial, así que "atrás" desde la
    // app vuelve a la página principal y no aquí.
    router.replace(u?.emailVerified ? tomarDestino() : '/verify-email')
  } catch (e) {
    const campo = campoDeError(e.code)
    errores[campo || 'general'] = authErrorMessage(e.code)
  } finally {
    loading.value = false
  }
}
</script>
