// Hora actual que se actualiza sola cada 30 s, para textos como "hace 3 min" y
// para que un sensor pase a "Sin datos recientes" sin recargar. Un solo
// temporizador para toda la app, activo mientras alguna vista lo use.
import { onBeforeUnmount, ref } from 'vue'

const ahora = ref(Date.now())
let usuarios = 0
let temporizador = null

export function useAhora() {
  if (usuarios++ === 0) {
    ahora.value = Date.now()
    temporizador = setInterval(() => (ahora.value = Date.now()), 30000)
  }
  onBeforeUnmount(() => {
    if (--usuarios === 0) clearInterval(temporizador)
  })
  return ahora
}
