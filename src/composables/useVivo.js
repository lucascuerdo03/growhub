import { computed, onScopeDispose, ref, shallowRef, watch } from 'vue'

// Datos en tiempo real de Firestore, compartidos entre pantallas.
//
// Cada fuente es { clave, escuchar(alRecibir, alFallar) -> parar }. Varias vistas
// con la misma clave comparten un único onSnapshot, y este se mantiene un rato
// tras dejar de usarse: volver a una pantalla es instantáneo y no gasta lecturas.
//
// onSnapshot también avisa al momento de las escrituras propias (antes de que
// responda el servidor) y las revierte solo si las reglas las rechazan, así que
// las vistas no necesitan tocar sus listas al crear, editar o borrar.
const RETENCION_MS = 30000
const entradas = new Map()

function adquirir({ clave, escuchar }) {
  let e = entradas.get(clave)
  if (!e) {
    e = {
      clave,
      datos: shallowRef(null),
      cargando: ref(true),
      error: ref(null),
      usos: 0,
      parar: null,
      temporizador: null,
    }
    const entrada = e
    entradas.set(clave, entrada)
    entrada.parar = escuchar(
      (datos) => {
        entrada.datos.value = datos
        entrada.cargando.value = false
        entrada.error.value = null
      },
      (err) => {
        console.warn(`No se pudo escuchar ${clave}:`, err)
        entrada.error.value = err
        entrada.cargando.value = false
        // El listener ha muerto: la próxima vez que se pida se abre otro.
        if (entradas.get(clave) === entrada) entradas.delete(clave)
      },
    )
  }
  clearTimeout(e.temporizador)
  e.usos++
  return e
}

function soltar(e) {
  e.usos--
  if (e.usos > 0) return
  e.temporizador = setTimeout(() => {
    if (e.usos > 0) return
    e.parar?.()
    if (entradas.get(e.clave) === e) entradas.delete(e.clave)
  }, RETENCION_MS)
}

// Al cerrar sesión: los datos de una cuenta no pueden llegar a la siguiente.
export function cerrarTodo() {
  for (const e of entradas.values()) {
    clearTimeout(e.temporizador)
    e.parar?.()
  }
  entradas.clear()
}

// Una fuente. `fuente` es un getter que puede devolver null (aún no hay huerto).
export function useVivo(fuente) {
  const actual = shallowRef(null)
  watch(
    () => fuente()?.clave ?? null,
    () => {
      const anterior = actual.value
      const f = fuente()
      actual.value = f ? adquirir(f) : null
      if (anterior) soltar(anterior)
    },
    { immediate: true },
  )
  onScopeDispose(() => actual.value && soltar(actual.value))
  return {
    datos: computed(() => actual.value?.datos.value ?? []),
    cargando: computed(() => !actual.value || actual.value.cargando.value),
    error: computed(() => actual.value?.error.value ?? null),
  }
}

// Varias fuentes a la vez. Devuelve los datos indexados por `clave`.
export function useVivoMuchos(fuentes) {
  const actuales = shallowRef(new Map())
  watch(
    () => fuentes().map((f) => f.clave).join('|'),
    () => {
      const previas = actuales.value
      const nuevas = new Map()
      for (const f of fuentes()) nuevas.set(f.clave, previas.get(f.clave) ?? adquirir(f))
      for (const [clave, e] of previas) if (!nuevas.has(clave)) soltar(e)
      actuales.value = nuevas
    },
    { immediate: true },
  )
  onScopeDispose(() => actuales.value.forEach(soltar))
  return {
    porClave: computed(() => {
      const r = {}
      for (const [clave, e] of actuales.value) r[clave] = e.datos.value ?? []
      return r
    }),
    cargando: computed(() => [...actuales.value.values()].some((e) => e.cargando.value)),
  }
}
