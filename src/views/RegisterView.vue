<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1>GrowHub</h1>
      <p class="subtitle">Crea tu cuenta</p>
      <p v-if="conInvitacion" class="notice">
        Tienes una invitación a un huerto. Regístrate con el email al que te han invitado.
      </p>

      <form @submit.prevent="register">
        <label>Nombre</label>
        <input v-model="name" type="text" placeholder="Tu nombre" autocomplete="name" />

        <label>Email</label>
        <input v-model="email" type="email" placeholder="tu@email.com" autocomplete="email" />

        <label>Contraseña</label>
        <div class="pw-field">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Mínimo 6 caracteres"
            autocomplete="new-password"
          />
          <button type="button" class="pw-toggle" @click="showPassword = !showPassword"
            :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'">
            <component :is="showPassword ? EyeOff : Eye" :size="18" />
          </button>
        </div>

        <label>Confirmar contraseña</label>
        <div class="pw-field">
          <input
            v-model="confirm"
            :type="showConfirm ? 'text' : 'password'"
            placeholder="Repite la contraseña"
            autocomplete="new-password"
          />
          <button type="button" class="pw-toggle" @click="showConfirm = !showConfirm"
            :aria-label="showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'">
            <component :is="showConfirm ? EyeOff : Eye" :size="18" />
          </button>
        </div>
        <p v-if="mismatch" class="error">Las contraseñas no coinciden.</p>

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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff } from 'lucide-vue-next'
import { registerUser, authErrorMessage } from '../services/authService'
import { hayDestino } from '../utils/destino'
import '../assets/auth.css'

const router = useRouter()
const name = ref('')
const email = ref('')
const password = ref('')
const confirm = ref('')
const showPassword = ref(false)
const showConfirm = ref(false)
const error = ref('')
const loading = ref(false)
const attempted = ref(false)
const conInvitacion = hayDestino()

// Mostramos el error de coincidencia cuando el usuario ya ha escrito en el
// campo de confirmación o cuando ha intentado enviar el formulario.
const mismatch = computed(
  () =>
    password.value !== confirm.value &&
    (confirm.value.length > 0 || attempted.value),
)

async function register() {
  error.value = ''
  attempted.value = true
  // No enviamos el formulario si las contraseñas no coinciden.
  if (password.value !== confirm.value) return
  loading.value = true
  try {
    await registerUser(email.value, password.value, name.value)
    // La cuenta se crea sin verificar: vamos a la pantalla de confirmación.
    router.push('/verify-email')
  } catch (e) {
    error.value = authErrorMessage(e.code)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.pw-field {
  position: relative;
  display: flex;
}
.pw-field input {
  flex: 1;
  width: 100%;
  padding-right: 42px;
}
.pw-toggle {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  width: 40px;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
}
.pw-toggle:hover {
  color: var(--color-primary);
  background: transparent;
}
</style>
