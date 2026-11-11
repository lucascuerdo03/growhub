// Interpreta lo que el nodo envía por el puerto serie. Entiende dos programas:
//
//  a) Firmware de GrowHub, una línea por lectura:
//       GH,<soil_raw>,<temp_C>,<lux>        ("nan" si falta un valor)
//     Las líneas que empiezan por "#" son comentarios y se ignoran.
//
//  b) Programa de prueba de clase, líneas sueltas en bloques:
//       Humedad suelo RAW: 1523
//       Temperatura DS18B20: 24.31 ºC
//       Luz BH1750: 812.50 lux
//       ----------
//     (un valor puede venir como "ERROR ..."). Cada bloque es una lectura.
//
// Cada lectura es { soilRaw, temperatura, lux }, con null en lo que falte.

// "24.31", "24,31" o "nan"/"ERROR..." -> número o null.
function numero(texto) {
  const t = String(texto ?? '').trim()
  if (!t || /^nan$/i.test(t) || /^error/i.test(t)) return null
  const m = t.replace(',', '.').match(/^-?\d+(\.\d+)?/)
  return m ? Number(m[0]) : null
}

const hayAlgo = (l) => l.soilRaw !== null || l.temperatura !== null || l.lux !== null
const vacia = () => ({ soilRaw: null, temperatura: null, lux: null })

const CAMPOS_B = [
  { clave: 'soilRaw', patron: /^humedad\s+suelo\s+raw\s*:\s*(.*)$/i },
  { clave: 'temperatura', patron: /^temperatura[^:]*:\s*(.*)$/i },
  { clave: 'lux', patron: /^luz[^:]*:\s*(.*)$/i },
]

// Devuelve un objeto con linea(texto), que llama a alLeer(lectura) por cada lectura
// completa, y terminar(), que entrega el último bloque si quedó a medias.
export function crearParser(alLeer) {
  let bloque = vacia()
  let vistos = new Set()

  function cerrarBloque() {
    if (hayAlgo(bloque)) alLeer(bloque)
    bloque = vacia()
    vistos = new Set()
  }

  function linea(texto) {
    const l = String(texto).replace(/\r/g, '').trim()
    if (!l || l.startsWith('#')) return

    // a) Firmware de GrowHub.
    if (/^GH,/i.test(l)) {
      const [, soil, temp, lux] = l.split(',')
      const lectura = { soilRaw: numero(soil), temperatura: numero(temp), lux: numero(lux) }
      if (hayAlgo(lectura)) alLeer(lectura)
      return
    }

    // b) Programa de clase: separador de bloque.
    if (/^-{3,}$/.test(l)) {
      cerrarBloque()
      return
    }
    for (const { clave, patron } of CAMPOS_B) {
      const m = l.match(patron)
      if (!m) continue
      // Si un campo se repite sin separador, el bloque anterior ya estaba completo.
      if (vistos.has(clave)) cerrarBloque()
      bloque[clave] = numero(m[1])
      vistos.add(clave)
      return
    }
    // Cualquier otra línea (mensajes de arranque, etc.) se ignora.
  }

  return { linea, terminar: cerrarBloque }
}

// Uplink de The Things Network v3 -> lectura, o null si no trae datos. El
// formateador de TTN debe devolver decoded_payload = { soil_raw, temperature, lux }.
const num = (v) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v))

export function lecturaDeTTN(mensaje) {
  const p = mensaje?.uplink_message?.decoded_payload
  if (!p) return null
  const lectura = { soilRaw: num(p.soil_raw), temperatura: num(p.temperature), lux: num(p.lux) }
  return hayAlgo(lectura) ? lectura : null
}
