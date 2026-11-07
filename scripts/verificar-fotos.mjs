// Comprueba las fotos de la biblioteca: que existen, que son 4:3, que no hay dos
// iguales (hash del archivo), que están bien de brillo y que tienen sus créditos.
//   node scripts/verificar-fotos.mjs
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const raiz = fileURLToPath(new URL('..', import.meta.url))
const fotos = JSON.parse(readFileSync(`${raiz}src/data/cropsPhotos.json`, 'utf8'))
const BRILLO_MIN = 90
const BRILLO_MAX = 225
const errores = []

// Dimensiones leídas de la cabecera JPEG, sin depender de ninguna librería.
function dimensiones(buf) {
  let i = 2
  while (i < buf.length) {
    const marca = buf[i + 1]
    if (marca >= 0xc0 && marca <= 0xc3) return { alto: buf.readUInt16BE(i + 5), ancho: buf.readUInt16BE(i + 7) }
    i += 2 + buf.readUInt16BE(i + 2)
  }
  return null
}

const hashes = new Map()
const ids = Object.keys(fotos)
for (const id of ids) {
  const f = fotos[id]
  let buf
  try {
    buf = readFileSync(`${raiz}public${f.archivo}`)
  } catch {
    errores.push(`${id}: falta el archivo ${f.archivo}`)
    continue
  }
  const hash = createHash('sha256').update(buf).digest('hex')
  if (hashes.has(hash)) errores.push(`${id}: misma foto que ${hashes.get(hash)}`)
  hashes.set(hash, id)
  const d = dimensiones(buf)
  if (!d || d.ancho * 3 !== d.alto * 4) errores.push(`${id}: no es 4:3 (${d?.ancho}x${d?.alto})`)
  if (f.brillo < BRILLO_MIN || f.brillo > BRILLO_MAX) errores.push(`${id}: brillo ${f.brillo}`)
  if (!f.licencia || !f.pagina) errores.push(`${id}: sin licencia o sin fuente`)
}

const sobrantes = readdirSync(`${raiz}public/biblioteca`).filter(
  (a) => !ids.includes(a.replace(/\.jpg$/, '')),
)
if (sobrantes.length) errores.push(`archivos sin usar: ${sobrantes.join(', ')}`)

const exactas = ids.filter((id) => fotos[id].exacta).length
console.log(`${ids.length} fotos, ${hashes.size} distintas, ${exactas} de la variedad exacta.`)
if (errores.length) {
  console.log(errores.join('\n'))
  process.exit(1)
}
console.log('Todo correcto.')
