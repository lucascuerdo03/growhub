// Humedad del suelo a partir del valor RAW del sensor capacitivo (ADC de 12 bits
// del ESP32, 0-4095): cuanto más alto, más seco. Lo usan la app y el puente
// (bridge/), así que no importa nada más.

// Valores orientativos de un sensor capacitivo v1.2 a 3,3 V: al aire y en agua.
export const RAW_SECO_DEFECTO = 3300
export const RAW_MOJADO_DEFECTO = 1300

// Porcentaje 0-100 entre el RAW en seco (0 %) y en mojado (100 %), o null si los
// datos no sirven.
export function porcentajeHumedad(raw, seco, mojado) {
  if (![raw, seco, mojado].every(Number.isFinite) || seco === mojado) return null
  const pct = ((seco - raw) / (seco - mojado)) * 100
  return Math.round(Math.min(100, Math.max(0, pct)))
}

// Calibración guardada en el sensor: { seco, mojado } con los dos valores.
export const calibracionCompleta = (c) =>
  !!c && Number.isFinite(c.seco) && Number.isFinite(c.mojado) && c.seco !== c.mojado
