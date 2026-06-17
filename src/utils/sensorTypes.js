// Tipos de sensor soportados en el MVP, con su unidad, color de gráfica
// y rango realista usado para simular lecturas (sin hardware real todavía).
export const SENSOR_TYPES = {
  temperatura: { label: 'Temperatura', unidad: '°C', color: '#ef4444', min: 12, max: 32 },
  humedad: { label: 'Humedad del suelo', unidad: '%', color: '#3b82f6', min: 20, max: 90 },
  luz: { label: 'Luz', unidad: 'lux', color: '#f59e0b', min: 200, max: 1000 },
}

// Genera un valor plausible para un tipo de sensor (simulación de lectura).
export function simularValor(tipo) {
  const t = SENSOR_TYPES[tipo] || SENSOR_TYPES.temperatura
  const v = t.min + Math.random() * (t.max - t.min)
  return Math.round(v * 10) / 10
}
