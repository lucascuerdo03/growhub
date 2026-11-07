import { computed, ref, unref } from 'vue'
import { useAuth } from './useAuth'
import { useVivoMuchos } from './useVivo'
import { escucharHuertos, migrarHuerto } from '../services/firestoreService'
import { permisosEn } from '../utils/permissions'

// Huertos del usuario en tiempo real: los propios y los compartidos conmigo.
// Es la fuente de verdad de los permisos: si me cambian el rol o me expulsan, el
// huerto cambia o desaparece de esta lista y toda la interfaz reacciona sin recargar.
const huertos = ref([])
const listos = ref(false)
const errorCarga = ref(null)
let parar = null
let uidActual = null

export function pararHuertos() {
  parar?.()
  parar = null
  uidActual = null
  huertos.value = []
  listos.value = false
  errorCarga.value = null
}

export function escucharMisHuertos(uid) {
  if (uidActual === uid) return
  pararHuertos()
  uidActual = uid
  parar = escucharHuertos(
    uid,
    (lista) => {
      huertos.value = lista
      listos.value = true
      errorCarga.value = null
      lista.filter((h) => h.ownerId === uid && !h.memberIds).forEach((h) => migrarHuerto(h, uid))
    },
    (e) => {
      errorCarga.value = e
      listos.value = true
    },
  )
}

// Tras aceptar una invitación el huerto tarda un instante en llegar a la lista.
export function esperarHuerto(id, ms = 4000) {
  return new Promise((resolve) => {
    const inicio = Date.now()
    const comprobar = () => {
      if (huertos.value.some((h) => h.id === id)) return resolve(true)
      if (Date.now() - inicio > ms) return resolve(false)
      setTimeout(comprobar, 80)
    }
    comprobar()
  })
}

export function useHuertos() {
  const { user } = useAuth()
  return {
    huertos,
    listos,
    errorCarga,
    propios: computed(() => huertos.value.filter((h) => h.ownerId === user.value?.uid)),
    compartidos: computed(() => huertos.value.filter((h) => h.ownerId !== user.value?.uid)),
  }
}

// Un huerto concreto, con mis permisos sobre él.
export function useHuerto(id) {
  const { user } = useAuth()
  const huerto = computed(() => huertos.value.find((h) => h.id === unref(id)) || null)
  return {
    huerto,
    listo: listos,
    permisos: computed(() => permisosEn(huerto.value, user.value?.uid)),
  }
}

// Datos de una subcolección en todos los huertos, indexados por id de huerto.
export function usePorHuerto(fuenteDe, lista = huertos) {
  const { porClave, cargando } = useVivoMuchos(() => unref(lista).map((h) => fuenteDe(h.id)))
  return {
    cargando,
    porHuerto: computed(() => {
      const r = {}
      for (const h of unref(lista)) r[h.id] = porClave.value[fuenteDe(h.id).clave] ?? []
      return r
    }),
  }
}
