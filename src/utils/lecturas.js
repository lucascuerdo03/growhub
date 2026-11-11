// Lecturas de sensores: valor a mostrar, antigüedad y si siguen siendo recientes.
import { calibracionCompleta, porcentajeHumedad } from './humedad'

// Pasado este tiempo sin lecturas, el sensor se muestra como "Sin datos recientes".
export const RECIENTE_MS = 10 * 60 * 1000

export const msDe = (l) => l?.createdAt?.toMillis?.() ?? null

// En humedad, si el sensor está calibrado desde la app y la lectura trae el RAW,
// el porcentaje se recalcula con esa calibración: así un cambio de calibración se
// ve al momento, también en las lecturas anteriores.
export function valorLectura(sensor, l) {
  if (!l) return null
  if (sensor?.tipo === 'humedad' && Number.isFinite(l.raw) && calibracionCompleta(sensor.calibracion)) {
    return porcentajeHumedad(l.raw, sensor.calibracion.seco, sensor.calibracion.mojado)
  }
  return l.valor ?? null
}

export const conValores = (sensor, lecturas) => lecturas.map((l) => ({ ...l, valor: valorLectura(sensor, l) }))

export const esReciente = (ms, ahora) => ms !== null && ahora - ms <= RECIENTE_MS

export function haceTexto(ms, ahora) {
  if (ms === null) return ''
  const min = Math.max(0, Math.floor((ahora - ms) / 60000))
  if (min < 1) return 'hace menos de 1 min'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  return d === 1 ? 'hace 1 día' : `hace ${d} días`
}
