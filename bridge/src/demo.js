// npm run bridge:demo: lecturas simuladas realistas por el mismo camino que el
// nodo real (mismo deviceId, mismo módulo de escritura), para enseñar la app sin él.
//
// Opciones (después de "--", por ejemplo npm run bridge:demo -- --humedad-baja):
//   --humedad-baja | --humedad-alta | --temperatura-alta | --temperatura-baja
//       fuerza un valor fuera de rango para ver los avisos de la app
//   --una            envía una sola lectura y termina
//   --cada <s>       segundos entre lecturas (por defecto, 15)
import { RAW_MOJADO_DEFECTO, RAW_SECO_DEFECTO } from '../../src/utils/humedad.js'
import { ErrorConfig, INTERVALO_MINIMO_S, leerConfig } from './config.js'
import { crearEscritor, log } from './firestore.js'

const args = process.argv.slice(2)
const opcion = (n) => args.includes(n)
const cadaS = Math.max(INTERVALO_MINIMO_S, Number(args[args.indexOf('--cada') + 1]) || INTERVALO_MINIMO_S)

// Suelo que se va secando poco a poco y se riega de vez en cuando; temperatura y
// luz que siguen la hora del día.
let raw = 2100
function lecturaSimulada() {
  const ahora = new Date()
  const h = ahora.getHours() + ahora.getMinutes() / 60
  const dia = Math.max(0, Math.sin(((h - 6) / 14) * Math.PI)) // 0 de noche, 1 a mediodía
  raw += 4 + Math.random() * 6
  if (raw > 2750) raw = 1650 // riego
  const ruido = (a) => (Math.random() - 0.5) * a

  let temperatura = 14 + 10 * dia + ruido(0.6)
  let lux = dia > 0 ? 300 + 24000 * dia ** 1.5 + ruido(400) : Math.random() * 3
  let soilRaw = raw + ruido(30)

  const seco = Number(process.env.SOIL_RAW_DRY) || RAW_SECO_DEFECTO
  const mojado = Number(process.env.SOIL_RAW_WET) || RAW_MOJADO_DEFECTO
  if (opcion('--humedad-baja')) soilRaw = seco - (seco - mojado) * 0.12 // ~12 %
  if (opcion('--humedad-alta')) soilRaw = mojado + (seco - mojado) * 0.03 // ~97 %
  if (opcion('--temperatura-alta')) temperatura = 38 + ruido(1)
  if (opcion('--temperatura-baja')) temperatura = 2 + ruido(1)

  return { soilRaw, temperatura, lux: Math.max(0, lux) }
}

async function main() {
  // La demo puede escribir cada 15 s aunque el nodo real use un intervalo mayor.
  const base = leerConfig()
  const cfg = { ...base, intervaloS: Math.min(base.intervaloS, cadaS) }
  const escritor = await crearEscritor(cfg, { origen: 'demo' })
  if (!escritor.sensores().length) {
    log('Esperando a que haya sensores con ese deviceId en la app…')
  }

  const enviar = async () => {
    const n = await escritor.registrar(lecturaSimulada())
    if (!n && escritor.sensores().length === 0) log('Sin sensores con ese deviceId: no se guarda nada.')
  }
  await enviar()
  if (opcion('--una')) {
    escritor.cerrar()
    process.exit(0)
  }
  log(`Demo del nodo ${cfg.deviceId}: una lectura cada ${cadaS} s. Ctrl+C para salir.`)
  setInterval(enviar, cadaS * 1000)
  process.on('SIGINT', () => {
    escritor.cerrar()
    process.exit(0)
  })
}

main().catch((e) => {
  console.error(e instanceof ErrorConfig ? `ERROR: ${e.message}` : e)
  process.exit(1)
})
