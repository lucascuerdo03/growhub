import { ref } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'

// Estado de sesión compartido en toda la app.
// Guardamos un objeto plano (no el User de Firebase) para que cambios de
// perfil (nombre/foto) sean reactivos en toda la UI.
const user = ref(null)
const ready = ref(false)

function mapUser(u) {
  return u
    ? { uid: u.uid, email: u.email, displayName: u.displayName, photoURL: u.photoURL }
    : null
}

onAuthStateChanged(auth, (u) => {
  user.value = mapUser(u)
  ready.value = true
})

// Reaplica los datos del usuario actual de Firebase al estado reactivo.
// Útil tras actualizar el perfil.
export const refreshUser = () => {
  user.value = mapUser(auth.currentUser)
}

// Promesa que resuelve cuando ya sabemos si hay sesión o no.
// Útil en los guards del router para no decidir antes de tiempo.
export const waitForAuth = () =>
  new Promise((resolve) => {
    if (ready.value) return resolve(user.value)
    const stop = onAuthStateChanged(auth, (u) => {
      stop()
      resolve(mapUser(u))
    })
  })

export function useAuth() {
  return { user, ready }
}
