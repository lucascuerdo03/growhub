<template>
  <div>
    <h1>Mi perfil</h1>

    <div class="profile-card">
      <div class="avatar">
        <img v-if="photoURL" :src="photoURL" alt="Foto de perfil" @error="imgError = true" />
        <span v-else class="placeholder">{{ initial }}</span>
      </div>

      <form class="form" @submit.prevent="save">
        <label>Nombre</label>
        <input v-model="displayName" placeholder="Tu nombre" />

        <label>Email</label>
        <input :value="user?.email" disabled />

        <label>Foto de perfil (URL)</label>
        <input v-model="photoURL" placeholder="https://…/foto.jpg" />
        <p v-if="imgError" class="hint warn">No se pudo cargar la imagen de esa URL.</p>

        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="saved" class="success">Tus datos se han guardado correctamente.</p>

        <button type="submit" :disabled="saving">
          {{ saving ? 'Guardando…' : 'Guardar cambios' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAuth, refreshUser } from '../composables/useAuth'
import { updateUserProfile } from '../services/authService'

const { user } = useAuth()

const displayName = ref(user.value?.displayName || '')
const photoURL = ref(user.value?.photoURL || '')
const saving = ref(false)
const saved = ref(false)
const error = ref('')
const imgError = ref(false)

const initial = computed(() =>
  (displayName.value || user.value?.email || '?').charAt(0).toUpperCase(),
)

watch(photoURL, () => (imgError.value = false))

async function save() {
  saving.value = true
  saved.value = false
  error.value = ''
  try {
    await updateUserProfile({
      displayName: displayName.value.trim(),
      photoURL: photoURL.value.trim(),
    })
    refreshUser()
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
.avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  overflow: hidden;
  background: #0284c7;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.placeholder {
  color: white;
  font-size: 2.4rem;
  font-weight: 700;
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
button {
  margin-top: 18px;
  padding: 11px;
  background: #0284c7;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
button:disabled {
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
