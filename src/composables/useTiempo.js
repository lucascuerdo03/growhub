import { ref, watch } from 'vue'

// Tiempo de Open-Meteo (gratuito, sin clave). Las coordenadas se redondean a unos
// kilómetros: basta para la previsión y no envía la posición exacta del huerto.
const VALIDEZ_MS = 30 * 60 * 1000
const cache = new Map()

const CAMPOS_ACTUAL = 'temperature_2m,weather_code'
const CAMPOS_DIA = 'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max'

async function pedirTiempo(lat, lng) {
  const clave = `${lat.toFixed(2)},${lng.toFixed(2)}`
  const guardado = cache.get(clave)
  if (guardado && Date.now() - guardado.cuando < VALIDEZ_MS) return guardado.datos
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(2)}&longitude=${lng.toFixed(2)}` +
    `&current=${CAMPOS_ACTUAL}&daily=${CAMPOS_DIA}&forecast_days=3&timezone=auto`
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`Open-Meteo respondió ${res.status}`)
  const j = await res.json()
  const datos = {
    temperatura: Math.round(j.current.temperature_2m),
    codigo: j.current.weather_code,
    max: Math.round(j.daily.temperature_2m_max[0]),
    min: Math.round(j.daily.temperature_2m_min[0]),
    lluviaHoy: j.daily.precipitation_sum[0] ?? 0,
    probHoy: j.daily.precipitation_probability_max[0] ?? 0,
    lluviaManana: j.daily.precipitation_sum[1] ?? 0,
    probManana: j.daily.precipitation_probability_max[1] ?? 0,
  }
  cache.set(clave, { cuando: Date.now(), datos })
  return datos
}

const descripciones = [
  [[0], 'Despejado'],
  [[1, 2], 'Poco nuboso'],
  [[3], 'Nublado'],
  [[45, 48], 'Niebla'],
  [[51, 53, 55, 56, 57], 'Llovizna'],
  [[61, 63, 65, 66, 67, 80, 81, 82], 'Lluvia'],
  [[71, 73, 75, 77, 85, 86], 'Nieve'],
  [[95, 96, 99], 'Tormenta'],
]
export const descripcionTiempo = (codigo) =>
  descripciones.find(([cs]) => cs.includes(codigo))?.[1] || 'Sin datos'

// Aviso sencillo para el riego. La lluvia manda sobre el resto.
export function avisoTiempo(t) {
  const mm = (n) => `${String(Math.round(n * 10) / 10).replace('.', ',')} mm`
  if (t.lluviaHoy >= 1 || t.probHoy >= 60) {
    return { tipo: 'lluvia', texto: `Lluvia prevista hoy (${mm(t.lluviaHoy)}): puedes posponer el riego.` }
  }
  if (t.lluviaManana >= 2 || t.probManana >= 70) {
    return { tipo: 'lluvia', texto: `Lluvia prevista mañana (${mm(t.lluviaManana)}): puedes posponer el riego.` }
  }
  if (t.min <= 1) return { tipo: 'frio', texto: 'Riesgo de helada: protege los cultivos sensibles.' }
  if (t.max >= 32) return { tipo: 'calor', texto: 'Día de calor: riega a primera hora o al atardecer.' }
  return { tipo: 'normal', texto: 'Sin lluvia prevista: riega según lo previsto.' }
}

export function useTiempo(coords) {
  const tiempo = ref(null)
  const cargando = ref(false)
  const error = ref(false)
  let peticion = 0
  watch(
    coords,
    async (c) => {
      const actual = ++peticion
      tiempo.value = null
      error.value = false
      if (c?.lat == null || c?.lng == null) return
      cargando.value = true
      try {
        const datos = await pedirTiempo(c.lat, c.lng)
        if (actual === peticion) tiempo.value = datos
      } catch (e) {
        console.warn('No se pudo consultar el tiempo:', e)
        if (actual === peticion) error.value = true
      } finally {
        if (actual === peticion) cargando.value = false
      }
    },
    { immediate: true },
  )
  return { tiempo, cargando, error }
}
