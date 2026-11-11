// npm run bridge:ttn: recibe las lecturas del nodo por LoRaWAN a través de The
// Things Network (MQTT) y las guarda en Firestore con el mismo módulo que el modo serie.
//
// El formateador de uplinks de TTN debe devolver
//   decoded_payload = { soil_raw, temperature, lux }
import mqtt from 'mqtt'
import { ErrorConfig, leerConfig } from './config.js'
import { crearEscritor, log } from './firestore.js'
import { lecturaDeTTN } from './parser.js'

async function main() {
  const cfg = leerConfig()
  const { appId, deviceId, apiKey, host } = cfg.ttn
  const faltan = [['TTN_APP_ID', appId], ['TTN_DEVICE_ID', deviceId], ['TTN_API_KEY', apiKey]]
    .filter(([, v]) => !v)
    .map(([n]) => n)
  if (faltan.length) throw new ErrorConfig(`Faltan en bridge/.env: ${faltan.join(', ')}.`)

  const escritor = await crearEscritor(cfg, { origen: 'ttn' })
  const usuario = `${appId}@ttn`
  const tema = `v3/${usuario}/devices/${deviceId}/up`
  const cliente = mqtt.connect(`mqtts://${host}:8883`, {
    username: usuario,
    password: apiKey,
    reconnectPeriod: 5000,
  })

  cliente.on('connect', () => {
    log(`Conectado a ${host}. Esperando uplinks de ${deviceId}…`)
    cliente.subscribe(tema, (e) => e && log('ERROR al suscribirse:', e.message))
  })
  cliente.on('error', (e) => {
    const m = /not authorized|bad user name or password/i.test(e.message)
      ? 'TTN rechaza la conexión: revisa TTN_APP_ID y TTN_API_KEY (la clave necesita permiso para leer el tráfico de la aplicación).'
      : e.message
    log('ERROR:', m)
  })
  cliente.on('message', (_tema, cuerpo) => {
    let mensaje
    try {
      mensaje = JSON.parse(cuerpo.toString())
    } catch {
      log('Mensaje de TTN no válido; se ignora.')
      return
    }
    const lectura = lecturaDeTTN(mensaje)
    if (!lectura) {
      log('Uplink sin decoded_payload { soil_raw, temperature, lux }: revisa el formateador en TTN.')
      return
    }
    escritor.registrar(lectura).catch((e) => log('ERROR al guardar:', e.message))
  })

  process.on('SIGINT', () => {
    cliente.end()
    escritor.cerrar()
    process.exit(0)
  })
}

main().catch((e) => {
  console.error(e instanceof ErrorConfig ? `ERROR: ${e.message}` : e)
  process.exit(1)
})
