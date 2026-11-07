// Fechas de calendario (AAAA-MM-DD), siempre en hora local: con toISOString() una
// tarea de "hoy" pasaría a ser de ayer o de mañana según la hora y la zona.
const dos = (n) => String(n).padStart(2, '0')

export const aISO = (d) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`

export const hoyISO = () => aISO(new Date())

export const desdeISO = (iso) => {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d)
}

export const sumarDias = (iso, dias) => {
  const d = desdeISO(iso)
  d.setDate(d.getDate() + dias)
  return aISO(d)
}

// Días de `a` a `b`; negativo si `b` es anterior. Se redondea por el cambio de hora.
export const diasEntre = (a, b) => Math.round((desdeISO(b) - desdeISO(a)) / 86400000)

export const fechaCorta = (iso) =>
  desdeISO(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })

// "Hoy", "Mañana", "Atrasada 3 días", "12 nov".
export function textoVencimiento(iso, hoy = hoyISO()) {
  const d = diasEntre(hoy, iso)
  if (d === 0) return 'Hoy'
  if (d === 1) return 'Mañana'
  if (d < 0) return d === -1 ? 'Atrasada 1 día' : `Atrasada ${-d} días`
  return fechaCorta(iso)
}

export const mesActual = () => new Date().getMonth() + 1
