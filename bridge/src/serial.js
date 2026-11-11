// npm run bridge:serial: lee el nodo por USB y guarda las lecturas en Firestore.
import { existsSync } from 'node:fs'
import { SerialPort, ReadlineParser } from 'serialport'
import { ErrorConfig, leerConfig } from './config.js'
import { crearEscritor, log } from './firestore.js'
import { crearParser } from './parser.js'

// Nombres con los que suele aparecer el nodo. Primero los chips USB-serie de las
// placas LILYGO/ESP32 (CH9102/CH340: wchusbserial; CP210x: usbserial); usbmodem
// también lo usan otros aparatos, como los adaptadores USB-C ("BillBoard").
const PREFERENCIA = [/wchusbserial/i, /usbserial/i, /usbmodem|ttyUSB|ttyACM/i]
const rango = (p) => PREFERENCIA.findIndex((r) => r.test(p.path))

// En macOS, /dev/tty.* espera la señal de portadora al abrirse; para un puerto
// USB-serie hay que usar su pareja /dev/cu.*.
function rutaCu(ruta) {
  const cu = ruta.replace('/dev/tty.', '/dev/cu.')
  return process.platform === 'darwin' && cu !== ruta && existsSync(cu) ? cu : ruta
}

async function elegirPuerto(indicado) {
  const puertos = await SerialPort.list()
  const lista = puertos.map((p) => `  ${p.path}${p.manufacturer ? `  (${p.manufacturer})` : ''}`).join('\n')
  if (indicado) {
    if (!puertos.some((p) => p.path === indicado || rutaCu(p.path) === indicado)) {
      log(`AVISO: ${indicado} no aparece entre los puertos disponibles:\n${lista || '  (ninguno)'}`)
    }
    return indicado
  }
  log(`Puertos disponibles:\n${lista || '  (ninguno)'}`)
  const candidatos = puertos
    .filter((p) => rango(p) >= 0 && !/billboard/i.test(p.manufacturer || ''))
    .sort((a, b) => rango(a) - rango(b))
  if (!candidatos.length) {
    throw new ErrorConfig(
      'No se encuentra el nodo. Conéctalo por USB con un cable de datos (no solo de carga) y vuelve a ' +
        'intentarlo, o indica el puerto con SERIAL_PORT en bridge/.env.',
    )
  }
  const elegido = rutaCu(candidatos[0].path)
  if (candidatos.length > 1) log(`Hay varios posibles; se usa ${elegido} (cámbialo con SERIAL_PORT).`)
  return elegido
}

function explicarError(e, ruta) {
  const m = e.message || ''
  if (/busy|lock|access denied|permission/i.test(m)) {
    return `El puerto ${ruta} está ocupado: cierra el Monitor serie del IDE de Arduino (o cualquier otro programa que lo use).`
  }
  if (/no such file|not found|cannot open/i.test(m)) {
    return `No se puede abrir ${ruta}: el nodo se ha desconectado o el puerto no existe.`
  }
  return `Error en el puerto ${ruta}: ${m}`
}

async function main() {
  const cfg = leerConfig()
  const ruta = await elegirPuerto(cfg.puerto)
  const escritor = await crearEscritor(cfg, { origen: 'nodo' })
  log(`Nodo ${cfg.deviceId}: como mucho una escritura cada ${cfg.intervaloS} s por sensor.`)

  const parser = crearParser((lectura) => {
    escritor.registrar(lectura).catch((e) => log('ERROR al guardar:', e.message))
  })

  function abrir() {
    const puerto = new SerialPort({ path: ruta, baudRate: cfg.baudios, autoOpen: false })
    const lineas = puerto.pipe(new ReadlineParser({ delimiter: '\n' }))
    lineas.on('data', (l) => parser.linea(l))
    puerto.on('close', () => {
      log(`Se ha cerrado ${ruta}. Reintentando en 5 s…`)
      setTimeout(abrir, 5000)
    })
    puerto.on('error', (e) => log('ERROR:', explicarError(e, ruta)))
    puerto.open((e) => {
      if (e) {
        log('ERROR:', explicarError(e, ruta), 'Reintentando en 5 s…')
        setTimeout(abrir, 5000)
        return
      }
      log(`Leyendo ${ruta} a ${cfg.baudios} baudios. Ctrl+C para salir.`)
    })
  }
  abrir()

  process.on('SIGINT', () => {
    parser.terminar()
    escritor.cerrar()
    process.exit(0)
  })
}

main().catch((e) => {
  console.error(e instanceof ErrorConfig ? `ERROR: ${e.message}` : e)
  process.exit(1)
})
