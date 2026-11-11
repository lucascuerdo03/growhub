<template>
  <AuthLayout titulo="Crea tu cuenta" subtitulo="Organiza tu huerto y compártelo con quien lo trabaja contigo.">
    <p v-if="conInvitacion" class="notice">
      Tienes una invitación a un huerto. Regístrate con el email al que te han invitado.
    </p>

    <form class="acceso-form" novalidate @submit.prevent="register">
      <div class="campo">
        <label for="reg-nombre">Nombre</label>
        <input id="reg-nombre" v-model="name" type="text" placeholder="Tu nombre" autocomplete="name" />
      </div>

      <div class="campo">
        <label for="reg-email">Email</label>
        <input
          id="reg-email"
          v-model="email"
          type="email"
          placeholder="tu@email.com"
          autocomplete="email"
          :aria-invalid="!!errores.email"
          :aria-describedby="errores.email ? 'reg-email-error' : undefined"
          @input="errores.email = ''"
        />
        <p v-if="errores.email" id="reg-email-error" class="error-campo">{{ errores.email }}</p>
      </div>

      <div class="campo">
        <label for="reg-password">Contraseña</label>
        <div class="pw-field">
          <input
            id="reg-password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Mínimo 6 caracteres"
            autocomplete="new-password"
            :aria-invalid="!!errores.password"
            :aria-describedby="errores.password ? 'reg-password-error' : undefined"
            @input="errores.password = ''"
          />
          <button type="button" class="pw-toggle" :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'" @click="showPassword = !showPassword">
            <component :is="showPassword ? EyeOff : Eye" :size="18" />
          </button>
        </div>
        <p v-if="errores.password" id="reg-password-error" class="error-campo">{{ errores.password }}</p>
      </div>

      <div class="campo">
        <label for="reg-confirm">Confirmar contraseña</label>
        <div class="pw-field">
          <input
            id="reg-confirm"
            v-model="confirm"
            :type="showConfirm ? 'text' : 'password'"
            placeholder="Repite la contraseña"
            autocomplete="new-password"
            :aria-invalid="!!errorConfirm"
            :aria-describedby="errorConfirm ? 'reg-confirm-error' : undefined"
          />
          <button type="button" class="pw-toggle" :aria-label="showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'" @click="showConfirm = !showConfirm">
            <component :is="showConfirm ? EyeOff : Eye" :size="18" />
          </button>
        </div>
        <p v-if="errorConfirm" id="reg-confirm-error" class="error-campo">{{ errorConfirm }}</p>
      </div>

      <p v-if="errores.general" class="error-general" role="alert">{{ errores.general }}</p>

      <button type="submit" class="boton-principal" :disabled="loading">
        {{ loading ? 'Creando…' : 'Crear cuenta' }}
      </button>
    </form>

    <p class="pie">
      ¿Ya tienes cuenta?
      <router-link to="/login">Inicia sesión</router-link>
    </p>
  </AuthLayout>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff } from 'lucide-vue-next'
import AuthLayout from '../components/AuthLayout.vue'
import { registerUser, authErrorMessage, campoDeError, validarEmail } from '../services/authService'
import { hayDestino } from '../utils/destino'

const router = useRouter()
const name = ref('')
const email = ref('')
const password = ref('')
const confirm = ref('')
const showPassword = ref(false)
const showConfirm = ref(false)
const errores = reactive({ email: '', password: '', general: '' })
const loading = ref(false)
const attempted = ref(false)
const conInvitacion = hayDestino()

// La coincidencia se avisa en cuanto se escribe en la confirmación, o al enviar.
const errorConfirm = computed(() => {
  if (!confirm.value && !attempted.value) return ''
  if (!confirm.value) return 'Repite la contraseña.'
  return password.value !== confirm.value ? 'Las contraseñas no coinciden.' : ''
})

async function register() {
  attempted.value = true
  errores.email = validarEmail(email.value)
  errores.password = !password.value
    ? 'Escribe una contraseña.'
    : password.value.length < 6
      ? 'La contraseña debe tener al menos 6 caracteres.'
      : ''
  errores.general = ''
  if (errores.email || errores.password || errorConfirm.value) return
  loading.value = true
  try {
    await registerUser(email.value.trim(), password.value, name.value.trim())
    // La cuenta se crea sin verificar: a la pantalla de confirmación, sin dejar
    // el formulario en el historial.
    router.replace('/verify-email')
  } catch (e) {
    const campo = campoDeError(e.code)
    errores[campo || 'general'] = authErrorMessage(e.code)
  } finally {
    loading.value = false
  }
}
</script>
