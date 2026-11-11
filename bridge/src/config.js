// Configuración del puente: variables de bridge/.env (ver .env.example).
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { RAW_MOJADO_DEFECTO, RAW_SECO_DEFECTO } from '../../src/utils/humedad.js'

const RUTA_ENV = fileURLToPath(new URL('../.env', import.meta.url))

export class ErrorConfig extends Error {}

if (existsSync(RUTA_ENV)) process.loadEnvFile(RUTA_ENV)

const env = process.env
const entero = (nombre, porDefecto) => {
  const v = env[nombre]
  if (v === undefined || v === '') return porDefecto
  const n = Number(v)
  if (!Number.isFinite(n)) throw new ErrorConfig(`${nombre} debe ser un número (ahora vale "${v}").`)
  return n
}

// Mínimo absoluto entre dos escrituras del mismo sensor: con el plan gratuito
// (20 000 escrituras al día) no conviene bajar de aquí.
export const INTERVALO_MINIMO_S = 15

export function leerConfig({ necesitaDeviceId = true } = {}) {
  if (!existsSync(RUTA_ENV) && !env.DEVICE_ID) {
    throw new ErrorConfig(
      'No existe bridge/.env. Copia bridge/.env.example a bridge/.env y rellénalo (ver bridge/README.md).',
    )
  }
  const deviceId = (env.DEVICE_ID || '').trim()
  if (necesitaDeviceId && !deviceId) {
    throw new ErrorConfig('Falta DEVICE_ID en bridge/.env (por ejemplo, DEVICE_ID=growhub-nodo-01).')
  }
  if (deviceId && !/^[\w-]{1,64}$/.test(deviceId)) {
    throw new ErrorConfig('DEVICE_ID solo puede tener letras, números, "-" y "_" (máximo 64).')
  }
  const intervalo = entero('MIN_INTERVAL_S', 60)
  if (intervalo < INTERVALO_MINIMO_S) {
    throw new ErrorConfig(`MIN_INTERVAL_S no puede ser menor que ${INTERVALO_MINIMO_S} segundos.`)
  }
  return {
    deviceId,
    usarEmulador: env.USE_EMULATOR === 'true',
    rutaClave: (env.SERVICE_ACCOUNT_PATH || env.GOOGLE_APPLICATION_CREDENTIALS || '').trim(),
    intervaloS: intervalo,
    sueloSeco: entero('SOIL_RAW_DRY', RAW_SECO_DEFECTO),
    sueloMojado: entero('SOIL_RAW_WET', RAW_MOJADO_DEFECTO),
    puerto: (env.SERIAL_PORT || '').trim(),
    baudios: entero('SERIAL_BAUD', 115200),
    ttn: {
      appId: (env.TTN_APP_ID || '').trim(),
      deviceId: (env.TTN_DEVICE_ID || '').trim(),
      apiKey: (env.TTN_API_KEY || '').trim(),
      host: (env.TTN_HOST || 'eu1.cloud.thethings.network').trim(),
    },
  }
}
