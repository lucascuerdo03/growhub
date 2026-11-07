// Adónde ir tras entrar: al abrir un enlace de invitación sin sesión hay que pasar
// por el login, el registro y la verificación del email sin perder la invitación.
// Se guarda en localStorage porque el correo de verificación puede abrirse aparte.
const CLAVE = 'growhub.destino'
const VALIDO = /^\/invitacion\/[\w-]+$/ // Solo rutas internas de invitación.

export function guardarDestino(ruta) {
  if (!VALIDO.test(ruta)) return
  try {
    localStorage.setItem(CLAVE, ruta)
  } catch {
    // Sin almacenamiento solo se pierde la redirección: la invitación sigue en la app.
  }
}

export function hayDestino() {
  try {
    return VALIDO.test(localStorage.getItem(CLAVE) || '')
  } catch {
    return false
  }
}

export function tomarDestino() {
  try {
    const ruta = localStorage.getItem(CLAVE)
    localStorage.removeItem(CLAVE)
    if (ruta && VALIDO.test(ruta)) return ruta
  } catch {
    // Sigue al panel.
  }
  return '/dashboard'
}
