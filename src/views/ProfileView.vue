<template>
  <div>
    <h1>Mi perfil</h1>

    <div class="profile-card">
      <UserAvatar :uid="user?.uid" :nombre="displayName || user?.email" :url="user?.photoURL || ''" :size="96" />

      <form class="form" @submit.prevent="save">
        <label>Nombre</label>
        <input v-model="displayName" placeholder="Tu nombre" />

        <label>Email</label>
        <input :value="user?.email" disabled />

        <label>Foto de perfil</label>
        <ImageUpload v-model="foto" v-model:removed="fotoQuitada" :url="fotoActual" :opciones="OPCIONES_FOTO" />

        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="saved" class="success">Tus datos se han guardado correctamente.</p>

        <button type="submit" class="save" :disabled="saving">
          {{ saving ? 'Guardando…' : 'Guardar cambios' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useAuth, refreshUser } from '../composables/useAuth'
import { useVivo } from '../composables/useVivo'
import { updateUserProfile } from '../services/authService'
import {
  asegurarUsuario,
  fuenteFotoUsuario,
  guardarFotoUsuario,
  borrarFotoUsuario,
} from '../services/firestoreService'
import ImageUpload from '../components/ImageUpload.vue'
import UserAvatar from '../components/UserAvatar.vue'

// Pequeña: se descarga en cada lista de miembros y en cada publicación.
const OPCIONES_FOTO = { ladoMax: 320, bytesMax: 140 * 1024 }

const { user } = useAuth()
const { datos: fotoGuardada } = useVivo(() =>
  user.value ? fuenteFotoUsuario(user.value.uid) : null,
)
const fotoActual = computed(() => fotoGuardada.value[0]?.data || user.value?.photoURL || '')

const displayName = ref(user.value?.displayName || '')
const foto = ref('')
const fotoQuitada = ref(false)
const saving = ref(false)
const saved = ref(false)
const error = ref('')

async function save() {
  saving.value = true
  saved.value = false
  error.value = ''
  try {
    if (foto.value) await guardarFotoUsuario(user.value.uid, foto.value)
    else if (fotoQuitada.value && fotoGuardada.value.length) await borrarFotoUsuario(user.value.uid)
    await updateUserProfile({
      displayName: displayName.value.trim(),
      // La foto por enlace de las cuentas antiguas deja de usarse al cambiarla.
      ...(user.value.photoURL && (foto.value || fotoQuitada.value) ? { photoURL: '' } : {}),
    })
    refreshUser()
    // El nombre también se muestra a los demás miembros de tus huertos.
    await asegurarUsuario(user.value).catch((e) => console.warn(e))
    foto.value = ''
    fotoQuitada.value = false
    saved.value = true
  } catch (e) {
    error.value = 'No se pudieron guardar los cambios.'
    console.error(e)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
h1 {
  margin: 0 0 20px;
}
.profile-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  padding: 30px;
  max-width: 520px;
  display: flex;
  gap: 28px;
  flex-wrap: wrap;
}
.form {
  flex: 1;
  min-width: 240px;
  display: flex;
  flex-direction: column;
}
label {
  font-weight: 600;
  color: #374151;
  font-size: 0.85rem;
  margin: 12px 0 4px;
}
input {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
}
input:disabled {
  background: #f3f4f6;
  color: #6b7280;
}
.hint {
  font-size: 0.8rem;
  margin: 4px 0 0;
}
.warn {
  color: #b45309;
}
.save {
  margin-top: 18px;
  padding: 11px;
  background: #0284c7;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.save:disabled {
  opacity: 0.6;
  cursor: default;
}
.error {
  color: #dc2626;
}
.success {
  color: #16a34a;
}
</style>
