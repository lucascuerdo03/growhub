// Genera public/biblioteca/*.jpg (fotos reales de Wikimedia Commons) y
// src/data/cropsLibrary.js con rutas locales. Reutiliza la foto del cultivo
// para sus variedades cuando no hay una específica.
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const ROOT = '/Users/lucas/Desktop/growhub'
const OUT_DIR = path.join(ROOT, 'public/biblioteca')
const DATA_FILE = path.join(ROOT, 'src/data/cropsLibrary.js')

// Términos de búsqueda en Commons por clave de imagen.
const IMAGE_TERMS = {
  tomate: 'ripe red tomato fruit',
  'tomate-cherry': 'cherry tomatoes',
  'tomate-raf': 'raf tomato',
  'tomate-pera': 'plum tomato roma',
  lechuga: 'lettuce head garden',
  pimiento: 'red bell pepper',
  'pimiento-padron': 'Padrón peppers',
  'pimiento-piquillo': 'piquillo pepper',
  cebolla: 'onion bulbs',
  'cebolla-morada': 'red onion',
  patata: 'potato tubers',
  calabacin: 'zucchini courgette vegetable',
  judia: 'green beans vegetable',
  fresa: 'strawberry fruit ripe',
  zanahoria: 'carrots bunch',
  'zanahoria-morada': 'purple carrot',
  pepino: 'cucumber vegetable',
  berenjena: 'eggplant aubergine',
  ajo: 'garlic bulbs',
  puerro: 'leek vegetable',
  espinaca: 'spinach leaves',
  acelga: 'swiss chard',
  brocoli: 'broccoli',
  coliflor: 'cauliflower',
  guisante: 'pea pods green',
  calabaza: 'pumpkin squash',
  sandia: 'watermelon fruit',
  maiz: 'maize corn cob',
  albahaca: 'basil plant leaves',
  perejil: 'parsley herb',
  rabano: 'radish vegetable',
}

const UA = { 'User-Agent': 'GrowHub-demo/1.0 (academic contact: demo@example.com)' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function resolveThumb(term) {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json' +
    '&generator=search&gsrnamespace=6&gsrlimit=6' +
    '&gsrsearch=' + encodeURIComponent(term) +
    '&prop=imageinfo&iiprop=url|mime&iiurlwidth=640'
  // Reintentos con espera creciente ante rate-limit (respuesta no-JSON/429).
  for (let intento = 0; intento < 4; intento++) {
    try {
      const res = await fetch(url, { headers: UA })
      const txt = await res.text()
      if (!res.ok || txt.trim()[0] !== '{') throw new Error('rate-limit/no-json')
      const json = JSON.parse(txt)
      const pages = Object.values(json?.query?.pages || {})
      pages.sort((a, b) => (a.index || 0) - (b.index || 0))
      for (const p of pages) {
        const info = p.imageinfo?.[0]
        if (!info?.thumburl) continue
        if ((info.mime || '').includes('svg')) continue
        return info.thumburl
      }
      return null
    } catch (e) {
      await sleep(2500 * (intento + 1))
    }
  }
  return null
}

async function download(key, term) {
  const dest = path.join(OUT_DIR, key + '.jpg')
  // Si ya existe y es válida, no la volvemos a descargar.
  if (existsSync(dest)) {
    try {
      const b = await readFile(dest)
      if (b.length > 3000 && b[0] === 0xff && b[1] === 0xd8) return { key, ok: true, bytes: b.length, cached: true }
    } catch {}
  }
  try {
    const thumb = await resolveThumb(term)
    if (!thumb) return { key, ok: false, reason: 'sin resultado' }
    const res = await fetch(thumb, { headers: { 'User-Agent': 'GrowHub-demo/1.0 (academic)' } })
    if (!res.ok) return { key, ok: false, reason: 'http ' + res.status }
    const buf = Buffer.from(await res.arrayBuffer())
    // Verificamos que es una imagen raster válida (JPEG o PNG).
    const isJpeg = buf[0] === 0xff && buf[1] === 0xd8
    const isPng = buf[0] === 0x89 && buf[1] === 0x50
    if (buf.length < 3000 || (!isJpeg && !isPng)) {
      return { key, ok: false, reason: 'no es imagen válida' }
    }
    await writeFile(dest, buf)
    return { key, ok: true, bytes: buf.length }
  } catch (e) {
    return { key, ok: false, reason: e.message }
  }
}

// ---- Catálogo (46 entradas agrupadas por cultivo) ----
// base: datos agronómicos por cultivo; v: variedades [nombreVariedad, img?, tweaks?]
const F = {
  tomate: { cultivo: 'Tomate', familia: 'Solanáceas', epocaSiembra: 'Febrero – Mayo', riego: 'Frecuente, suelo húmedo', tempIdeal: '20–28 °C', plagas: 'Mosca blanca, pulgón, tuta', tiempoCosecha: '70–90 días' },
  lechuga: { cultivo: 'Lechuga', familia: 'Asteráceas', epocaSiembra: 'Todo el año', riego: 'Ligero y constante', tempIdeal: '15–20 °C', plagas: 'Pulgón, caracoles, mildiu', tiempoCosecha: '40–60 días' },
  pimiento: { cultivo: 'Pimiento', familia: 'Solanáceas', epocaSiembra: 'Febrero – Abril', riego: 'Regular, sin encharcar', tempIdeal: '20–28 °C', plagas: 'Pulgón, araña roja, oídio', tiempoCosecha: '80–110 días' },
  cebolla: { cultivo: 'Cebolla', familia: 'Amarilidáceas', epocaSiembra: 'Septiembre – Febrero', riego: 'Moderado, reducir al final', tempIdeal: '13–24 °C', plagas: 'Mosca de la cebolla, mildiu', tiempoCosecha: '120–150 días' },
  patata: { cultivo: 'Patata', familia: 'Solanáceas', epocaSiembra: 'Febrero – Abril', riego: 'Moderado y regular', tempIdeal: '15–20 °C', plagas: 'Escarabajo de la patata, mildiu', tiempoCosecha: '90–120 días' },
  calabacin: { cultivo: 'Calabacín', familia: 'Cucurbitáceas', epocaSiembra: 'Abril – Junio', riego: 'Abundante y frecuente', tempIdeal: '18–25 °C', plagas: 'Oídio, mosca blanca', tiempoCosecha: '45–60 días' },
  judia: { cultivo: 'Judía', familia: 'Fabáceas', epocaSiembra: 'Abril – Julio', riego: 'Regular, sin encharcar', tempIdeal: '18–27 °C', plagas: 'Araña roja, mosca blanca', tiempoCosecha: '60–80 días' },
  fresa: { cultivo: 'Fresa', familia: 'Rosáceas', epocaSiembra: 'Septiembre – Noviembre', riego: 'Frecuente y ligero', tempIdeal: '15–22 °C', plagas: 'Araña roja, botritis', tiempoCosecha: '90–120 días' },
  zanahoria: { cultivo: 'Zanahoria', familia: 'Apiáceas', epocaSiembra: 'Marzo – Julio', riego: 'Constante y uniforme', tempIdeal: '15–21 °C', plagas: 'Mosca de la zanahoria', tiempoCosecha: '70–100 días' },
  pepino: { cultivo: 'Pepino', familia: 'Cucurbitáceas', epocaSiembra: 'Abril – Junio', riego: 'Frecuente, suelo húmedo', tempIdeal: '20–28 °C', plagas: 'Araña roja, oídio', tiempoCosecha: '50–70 días' },
  berenjena: { cultivo: 'Berenjena', familia: 'Solanáceas', epocaSiembra: 'Febrero – Abril', riego: 'Regular y abundante', tempIdeal: '22–30 °C', plagas: 'Escarabajo, araña roja', tiempoCosecha: '90–120 días' },
  ajo: { cultivo: 'Ajo', familia: 'Amarilidáceas', epocaSiembra: 'Octubre – Diciembre', riego: 'Escaso', tempIdeal: '13–24 °C', plagas: 'Roya, nematodos', tiempoCosecha: '150–180 días' },
}

const catalog = []
const add = (id, img, nombre, base, extra = {}) =>
  catalog.push({ id, img, nombre, ...base, variedad: extra.variedad || '', ...extra })

// Tomate (6)
add('tomate-cherry', 'tomate-cherry', 'Tomate Cherry', F.tomate, { variedad: 'Cherry', tiempoCosecha: '60–75 días' })
add('tomate-pera', 'tomate-pera', 'Tomate Pera', F.tomate, { variedad: 'Pera' })
add('tomate-corazon', 'tomate', 'Tomate Corazón de buey', F.tomate, { variedad: 'Corazón de buey', tiempoCosecha: '80–95 días' })
add('tomate-raf', 'tomate-raf', 'Tomate Raf', F.tomate, { variedad: 'Raf', tiempoCosecha: '90–110 días' })
add('tomate-rosa', 'tomate', 'Tomate Rosa de Barbastro', F.tomate, { variedad: 'Rosa de Barbastro', tiempoCosecha: '85–100 días' })
add('tomate-canario', 'tomate', 'Tomate Canario', F.tomate, { variedad: 'Canario' })
// Lechuga (4)
add('lechuga-romana', 'lechuga', 'Lechuga Romana', F.lechuga, { variedad: 'Romana' })
add('lechuga-iceberg', 'lechuga', 'Lechuga Iceberg', F.lechuga, { variedad: 'Iceberg', tiempoCosecha: '60–80 días' })
add('lechuga-roble', 'lechuga', 'Lechuga Hoja de roble', F.lechuga, { variedad: 'Hoja de roble', tiempoCosecha: '40–55 días' })
add('lechuga-maravilla', 'lechuga', 'Lechuga Maravilla', F.lechuga, { variedad: 'Maravilla de verano' })
// Pimiento (4)
add('pimiento-italiano', 'pimiento', 'Pimiento Italiano', F.pimiento, { variedad: 'Italiano' })
add('pimiento-california', 'pimiento', 'Pimiento California', F.pimiento, { variedad: 'California rojo' })
add('pimiento-padron', 'pimiento-padron', 'Pimiento de Padrón', F.pimiento, { variedad: 'Padrón', tiempoCosecha: '70–90 días' })
add('pimiento-piquillo', 'pimiento-piquillo', 'Pimiento del Piquillo', F.pimiento, { variedad: 'Piquillo' })
// Cebolla (3)
add('cebolla-blanca', 'cebolla', 'Cebolla Blanca', F.cebolla, { variedad: 'Blanca' })
add('cebolla-morada', 'cebolla-morada', 'Cebolla Morada', F.cebolla, { variedad: 'Morada' })
add('cebolla-chalota', 'cebolla', 'Chalota', F.cebolla, { variedad: 'Chalota', tiempoCosecha: '90–120 días' })
// Patata (3)
add('patata-monalisa', 'patata', 'Patata Monalisa', F.patata, { variedad: 'Monalisa' })
add('patata-kennebec', 'patata', 'Patata Kennebec', F.patata, { variedad: 'Kennebec' })
add('patata-roja', 'patata', 'Patata Roja', F.patata, { variedad: 'Roja', tiempoCosecha: '100–130 días' })
// Calabacín (2)
add('calabacin-verde', 'calabacin', 'Calabacín Verde', F.calabacin, { variedad: 'Verde' })
add('calabacin-amarillo', 'calabacin', 'Calabacín Amarillo', F.calabacin, { variedad: 'Amarillo' })
// Judía (2)
add('judia-plana', 'judia', 'Judía Verde Plana', F.judia, { variedad: 'Plana' })
add('judia-perona', 'judia', 'Judía Perona', F.judia, { variedad: 'Perona' })
// Fresa (2)
add('fresa-freson', 'fresa', 'Fresón', F.fresa, { variedad: 'Fresón' })
add('fresa-silvestre', 'fresa', 'Fresa Silvestre', F.fresa, { variedad: 'Silvestre', tiempoCosecha: '70–90 días' })
// Zanahoria (2)
add('zanahoria-nantesa', 'zanahoria', 'Zanahoria Nantesa', F.zanahoria, { variedad: 'Nantesa' })
add('zanahoria-morada', 'zanahoria-morada', 'Zanahoria Morada', F.zanahoria, { variedad: 'Morada' })
// Pepino (2)
add('pepino-espanol', 'pepino', 'Pepino Español', F.pepino, { variedad: 'Español (corto)' })
add('pepino-holandes', 'pepino', 'Pepino Holandés', F.pepino, { variedad: 'Holandés (largo)' })
// Berenjena (2)
add('berenjena-morada', 'berenjena', 'Berenjena Morada', F.berenjena, { variedad: 'Morada' })
add('berenjena-listada', 'berenjena', 'Berenjena Listada de Gandía', F.berenjena, { variedad: 'Listada de Gandía' })
// Ajo (2)
add('ajo-blanco', 'ajo', 'Ajo Blanco', F.ajo, { variedad: 'Blanco' })
add('ajo-morado', 'ajo', 'Ajo Morado', F.ajo, { variedad: 'Morado' })

// Cultivos sin variedades (12) — un registro cada uno
const SINGLES = {
  puerro: { cultivo: 'Puerro', familia: 'Amarilidáceas', epocaSiembra: 'Febrero – Mayo', riego: 'Regular', tempIdeal: '13–24 °C', plagas: 'Mosca del puerro, roya', tiempoCosecha: '120–150 días' },
  espinaca: { cultivo: 'Espinaca', familia: 'Amarantáceas', epocaSiembra: 'Septiembre – Marzo', riego: 'Frecuente y ligero', tempIdeal: '10–18 °C', plagas: 'Mildiu, pulgón', tiempoCosecha: '40–50 días' },
  acelga: { cultivo: 'Acelga', familia: 'Amarantáceas', epocaSiembra: 'Todo el año', riego: 'Regular', tempIdeal: '15–22 °C', plagas: 'Pulgón, caracoles', tiempoCosecha: '50–70 días' },
  brocoli: { cultivo: 'Brócoli', familia: 'Brasicáceas', epocaSiembra: 'Julio – Septiembre', riego: 'Constante', tempIdeal: '15–20 °C', plagas: 'Oruga de la col, pulgón', tiempoCosecha: '80–100 días' },
  coliflor: { cultivo: 'Coliflor', familia: 'Brasicáceas', epocaSiembra: 'Junio – Agosto', riego: 'Abundante y regular', tempIdeal: '15–20 °C', plagas: 'Oruga de la col, mildiu', tiempoCosecha: '90–120 días' },
  guisante: { cultivo: 'Guisante', familia: 'Fabáceas', epocaSiembra: 'Octubre – Febrero', riego: 'Moderado', tempIdeal: '13–18 °C', plagas: 'Pulgón, oídio', tiempoCosecha: '90–110 días' },
  calabaza: { cultivo: 'Calabaza', familia: 'Cucurbitáceas', epocaSiembra: 'Abril – Junio', riego: 'Abundante', tempIdeal: '20–28 °C', plagas: 'Oídio, mosca blanca', tiempoCosecha: '100–140 días' },
  sandia: { cultivo: 'Sandía', familia: 'Cucurbitáceas', epocaSiembra: 'Abril – Mayo', riego: 'Abundante, reducir al madurar', tempIdeal: '22–30 °C', plagas: 'Oídio, mosca blanca', tiempoCosecha: '80–110 días' },
  maiz: { cultivo: 'Maíz', familia: 'Poáceas', epocaSiembra: 'Abril – Junio', riego: 'Abundante', tempIdeal: '20–30 °C', plagas: 'Taladro, pulgón', tiempoCosecha: '90–120 días' },
  albahaca: { cultivo: 'Albahaca', familia: 'Lamiáceas', epocaSiembra: 'Abril – Junio', riego: 'Frecuente, suelo húmedo', tempIdeal: '20–28 °C', plagas: 'Pulgón, botritis', tiempoCosecha: '50–70 días' },
  perejil: { cultivo: 'Perejil', familia: 'Apiáceas', epocaSiembra: 'Marzo – Septiembre', riego: 'Regular', tempIdeal: '15–22 °C', plagas: 'Pulgón, mildiu', tiempoCosecha: '70–90 días' },
  rabano: { cultivo: 'Rábano', familia: 'Brasicáceas', epocaSiembra: 'Todo el año', riego: 'Ligero y frecuente', tempIdeal: '10–18 °C', plagas: 'Pulguilla, oruga', tiempoCosecha: '25–40 días' },
}
for (const [id, base] of Object.entries(SINGLES)) add(id, id, base.cultivo, base)

// ---- Descarga ----
async function main() {
  if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true })
  const keys = Object.keys(IMAGE_TERMS)
  const results = []
  for (const key of keys) {
    const r = await download(key, IMAGE_TERMS[key])
    results.push(r)
    console.log(r.ok ? `OK   ${key} (${r.bytes} B)${r.cached ? ' [cache]' : ''}` : `FAIL ${key}: ${r.reason}`)
    if (!r.cached) await sleep(1500) // throttle para no saturar la API
  }
  const okKeys = new Set(results.filter((r) => r.ok).map((r) => r.key))

  // Resolver foto de cada entrada: imagen propia -> imagen del cultivo -> ''
  const cultivoKeyOf = (e) => {
    // la clave del cultivo base es el id de IMAGE_TERMS que coincide con cultivo
    const map = { Tomate: 'tomate', Lechuga: 'lechuga', Pimiento: 'pimiento', Cebolla: 'cebolla', Patata: 'patata', 'Calabacín': 'calabacin', 'Judía': 'judia', Fresa: 'fresa', Zanahoria: 'zanahoria', Pepino: 'pepino', Berenjena: 'berenjena', Ajo: 'ajo' }
    return map[e.cultivo] || e.img
  }
  const sinFoto = []
  for (const e of catalog) {
    let fotoKey = okKeys.has(e.img) ? e.img : null
    if (!fotoKey) {
      const ck = cultivoKeyOf(e)
      if (okKeys.has(ck)) fotoKey = ck
    }
    e.foto = fotoKey ? `/biblioteca/${fotoKey}.jpg` : ''
    if (!e.foto) sinFoto.push(e.id)
  }

  // Emitir cropsLibrary.js
  const rows = catalog.map((e) => {
    const o = {
      id: e.id, cultivo: e.cultivo, variedad: e.variedad, nombre: e.nombre,
      familia: e.familia, epocaSiembra: e.epocaSiembra, riego: e.riego,
      tempIdeal: e.tempIdeal, plagas: e.plagas, tiempoCosecha: e.tiempoCosecha, foto: e.foto,
    }
    return '  ' + JSON.stringify(o) + ','
  })
  const content =
`// Biblioteca local de cultivos comunes en España, agrupados por cultivo y
// variedad. Las fotos son archivos reales en public/biblioteca (descargadas de
// Wikimedia Commons) para que no dependan de enlaces externos en la demo.
// Generado por scripts/build-biblioteca; editar a mano si hace falta.
export const CROPS_LIBRARY = [
${rows.join('\n')}
]
`
  await writeFile(DATA_FILE, content)
  console.log(`\nEntradas: ${catalog.length}`)
  console.log(`Imágenes descargadas: ${okKeys.size}/${keys.length}`)
  console.log(`Entradas sin foto (placeholder): ${sinFoto.length ? sinFoto.join(', ') : 'ninguna'}`)
}
main()
