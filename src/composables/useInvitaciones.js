import { computed, unref } from 'vue'
import { useVivo } from './useVivo'
import { fuenteMisInvitaciones } from '../services/firestoreService'
import { useAuth } from './useAuth'

// Invitaciones pendientes del usuario, compartidas entre la navbar y su sección.
export function useInvitaciones(soloHuerto = null) {
  const { user } = useAuth()
  const { datos, cargando, error } = useVivo(() =>
    user.value?.email ? fuenteMisInvitaciones(user.value.email) : null,
  )
  return {
    invitaciones: computed(() =>
      unref(soloHuerto) ? datos.value.filter((i) => i.orchardId === unref(soloHuerto)) : datos.value,
    ),
    cargando,
    error,
  }
}
