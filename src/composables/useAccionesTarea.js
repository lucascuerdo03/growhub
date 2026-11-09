// Completar, desmarcar, cambiar la frecuencia y borrar tareas: lo mismo en todas
// las listas. `orchardIdDe(t)` y `permisosDe(t)` dicen de qué huerto es cada una.
import { useAuth } from './useAuth'
import { mensajeError } from '../utils/permissions'
import { fechaCorta } from '../utils/fechas'
import {
  autopublicarTarea,
  completarTarea,
  deleteTarea,
  descompletarTarea,
  updateTarea,
} from '../services/firestoreService'

export function useAccionesTarea({ orchardIdDe, permisosDe, error, aviso = null }) {
  const { user } = useAuth()

  async function alternar(t) {
    const orchardId = orchardIdDe(t)
    const completar = !t.completada
    error.value = ''
    if (aviso) aviso.value = ''
    let siguiente = ''
    try {
      if (completar) siguiente = await completarTarea(orchardId, t)
      else await descompletarTarea(orchardId, t.id)
    } catch (e) {
      error.value = mensajeError(e, 'No se pudo actualizar la tarea.')
      console.error(e)
      return
    }
    if (siguiente && aviso) aviso.value = `«${t.titulo}» se repite: la siguiente queda para el ${fechaCorta(siguiente)}.`
    if (completar && permisosDe(t).publishPosts) await autopublicarTarea(orchardId, t.titulo, user.value)
  }

  async function cambiarFrecuencia(t, frecuencia) {
    error.value = ''
    try {
      await updateTarea(orchardIdDe(t), t.id, { frecuencia })
    } catch (e) {
      error.value = mensajeError(e, 'No se pudo cambiar la frecuencia.')
      console.error(e)
    }
  }

  async function borrar(t) {
    if (!confirm('¿Eliminar esta tarea?')) return
    error.value = ''
    try {
      await deleteTarea(orchardIdDe(t), t.id)
    } catch (e) {
      error.value = mensajeError(e, 'No se pudo eliminar la tarea.')
      console.error(e)
    }
  }

  return { alternar, cambiarFrecuencia, borrar }
}
