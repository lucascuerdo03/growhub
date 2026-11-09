// Frecuencia de las tareas que se repiten y agrupación por fecha.
import { diasEntre, hoyISO, sumarDias } from './fechas'

// `valor` es lo que se guarda en la tarea (campo `frecuencia`); vacío, no se repite.
export const FRECUENCIAS = [
  { valor: '', texto: 'No se repite' },
  { valor: 'diaria', texto: 'Cada día', dias: 1 },
  { valor: '2-3dias', texto: 'Cada 2-3 días', dias: 2 },
  { valor: 'semanal', texto: 'Cada semana', dias: 7 },
  { valor: 'quincenal', texto: 'Cada 2 semanas', dias: 14 },
  { valor: 'mensual', texto: 'Cada mes', dias: 30 },
]

export const frecuenciaDe = (t) => FRECUENCIAS.find((f) => f.valor && f.valor === t?.frecuencia) || null

// Riego de la biblioteca ('Diario', 'Cada 2-3 días'...) a frecuencia de tarea.
// "Solo en sequía" no tiene un ritmo fijo, así que no se repite.
const DESDE_RIEGO = { Diario: 'diaria', 'Cada 2-3 días': '2-3dias', Semanal: 'semanal' }
export const frecuenciaDeRiego = (riego) => DESDE_RIEGO[riego] || ''

// La siguiente se cuenta desde el día en que se completa: si una tarea diaria se
// hace con tres días de retraso, la próxima es mañana y no otra ya atrasada.
export function siguienteFecha(t, hoy = hoyISO()) {
  const f = frecuenciaDe(t)
  return f ? sumarDias(hoy, f.dias) : ''
}

// Pendientes por fecha (las sin fecha, al final).
export const porFecha = (a, b) => (a.fecha || '9999').localeCompare(b.fecha || '9999')

export const GRUPOS = [
  { clave: 'atrasadas', titulo: 'Atrasadas' },
  { clave: 'hoy', titulo: 'Hoy' },
  { clave: 'proximas', titulo: 'Próximas' },
  { clave: 'sinFecha', titulo: 'Sin fecha' },
]

export function grupoDe(t, hoy = hoyISO()) {
  if (!t.fecha) return 'sinFecha'
  const d = diasEntre(hoy, t.fecha)
  return d < 0 ? 'atrasadas' : d === 0 ? 'hoy' : 'proximas'
}

// Las pendientes, ordenadas y repartidas en grupos; solo los que tienen tareas.
export function agruparPendientes(tareas, hoy = hoyISO()) {
  const grupos = Object.fromEntries(GRUPOS.map((g) => [g.clave, []]))
  for (const t of [...tareas].sort(porFecha)) grupos[grupoDe(t, hoy)].push(t)
  return GRUPOS.filter((g) => grupos[g.clave].length).map((g) => ({ ...g, tareas: grupos[g.clave] }))
}

// Historial: lo último que se hizo, primero.
export const porCompletada = (a, b) => (b.completadaEl || '').localeCompare(a.completadaEl || '')
