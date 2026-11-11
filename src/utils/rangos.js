// Rangos recomendados de cada cultivo para los avisos de los sensores.
//   Temperatura: la temperatura ideal de la biblioteca con un margen de 6 °C,
//     porque la "ideal" es la óptima de crecimiento y de noche es normal bajar de ella.
//   Humedad del suelo: según lo que pide de riego en la biblioteca.
// El usuario puede cambiarlos en la ficha del cultivo (campo `rangos`).
import { entradaDeCultivo } from '../data/cropsLibrary'

export const MARGEN_TEMPERATURA = 6

const HUMEDAD_POR_RIEGO = {
  Diario: [60, 85],
  'Cada 2-3 días': [45, 75],
  Semanal: [30, 60],
  'Solo en sequía': [20, 50],
}
const POR_DEFECTO = { tempMin: 8, tempMax: 32, humMin: 35, humMax: 70 }

// "20–28 °C" -> [20, 28]
function rangoTexto(texto) {
  const m = String(texto || '').match(/(-?\d+)\s*[–-]\s*(-?\d+)/)
  return m ? [Number(m[1]), Number(m[2])] : null
}

export function rangosRecomendados(cultivo) {
  const entrada = entradaDeCultivo(cultivo)
  const temp = rangoTexto(entrada?.tempIdeal ?? cultivo?.tempIdeal)
  const hum = HUMEDAD_POR_RIEGO[entrada?.riego ?? cultivo?.riego]
  return {
    tempMin: temp ? temp[0] - MARGEN_TEMPERATURA : POR_DEFECTO.tempMin,
    tempMax: temp ? temp[1] + MARGEN_TEMPERATURA : POR_DEFECTO.tempMax,
    humMin: hum ? hum[0] : POR_DEFECTO.humMin,
    humMax: hum ? hum[1] : POR_DEFECTO.humMax,
  }
}

const CAMPOS = ['tempMin', 'tempMax', 'humMin', 'humMax']

export const rangosValidos = (r) =>
  !!r &&
  CAMPOS.every((k) => Number.isFinite(r[k])) &&
  r.tempMin < r.tempMax &&
  r.humMin < r.humMax &&
  r.humMin >= 0 &&
  r.humMax <= 100

// Los que se usan: los del usuario si los ha guardado; si no, los recomendados.
export function rangosDe(cultivo) {
  if (rangosValidos(cultivo?.rangos)) return { ...cultivo.rangos, propios: true }
  return { ...rangosRecomendados(cultivo), propios: false }
}
