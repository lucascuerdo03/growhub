import { ref } from 'vue'
import { escucharMisInvitaciones } from '../services/firestoreService'

// Invitaciones pendientes del usuario, compartidas entre la navbar y su sección.
const invitaciones = ref([])
const error = ref(false)
let parar = null

export const dejarDeEscucharInvitaciones = () => {
  parar?.()
  parar = null
  invitaciones.value = []
}

export const escucharInvitaciones = (email) => {
  dejarDeEscucharInvitaciones()
  error.value = false
  parar = escucharMisInvitaciones(
    email,
    (lista) => (invitaciones.value = lista),
    (e) => {
      console.warn('No se pudieron cargar las invitaciones:', e)
      error.value = true
    },
  )
}

export function useInvitaciones() {
  return { invitaciones, error }
}
