// Avisos de los sensores: la última lectura de humedad o temperatura de un cultivo
// fuera de su rango recomendado (ver rangos.js).
import { msDe, valorLectura } from './lecturas'
import { rangosDe } from './rangos'

// Una lectura más antigua no se tiene en cuenta: el aviso sería de una situación
// que quizá ya no existe (para eso está "Sin datos recientes").
export const EDAD_MAXIMA_AVISO_MS = 60 * 60 * 1000

const NOMBRES = { humedad: 'Humedad', temperatura: 'Temperatura' }

// sensores: los del huerto; lecturasDe(sensor): sus lecturas en orden cronológico.
export function avisosDe({ orchardId, huerto = '', cultivos, sensores, lecturasDe, ahora }) {
  const avisos = []
  for (const s of sensores) {
    if (!NOMBRES[s.tipo]) continue
    const cultivo = cultivos.find((c) => c.id === s.cropId)
    if (!cultivo) continue
    const lectura = lecturasDe(s).at(-1)
    const ms = msDe(lectura)
    if (ms === null || ahora - ms > EDAD_MAXIMA_AVISO_MS) continue
    const valor = valorLectura(s, lectura)
    if (!Number.isFinite(valor)) continue
    const r = rangosDe(cultivo)
    const [min, max] = s.tipo === 'humedad' ? [r.humMin, r.humMax] : [r.tempMin, r.tempMax]
    if (valor >= min && valor <= max) continue
    const baja = valor < min
    avisos.push({
      clave: `${orchardId}/${s.id}`,
      orchardId,
      huerto,
      cropId: cultivo.id,
      cultivo: cultivo.nombre,
      tipo: s.tipo,
      baja,
      valor,
      unidad: s.unidad,
      ms,
      texto: `${NOMBRES[s.tipo]} ${baja ? 'baja' : 'alta'} en ${cultivo.nombre}: ${valor} ${s.unidad}`,
      rango: `Recomendado: ${min}–${max} ${s.unidad}`,
    })
  }
  return avisos
}
