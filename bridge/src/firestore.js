// Escribe las lecturas del nodo en Firestore con firebase-admin. Lo comparten los
// tres modos del puente (serie, TTN y demo).
//
// Qué sensores reciben cada lectura: devices/{deviceId}/sensores/{orchardId}_{sensorId}.
// Lo mantiene la app al guardar un sensor con "Identificador del nodo"; así no hace
// falta buscar en todos los huertos ni crear índices en la consola.
//
// Cada lectura se guarda como la app: orchards/{o}/sensors/{s}/readings/{auto}
// con { valor, createdAt } y, en humedad, también el RAW del sensor.
import { existsSync, readFileSync } from 'node:fs'
import { cert, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { porcentajeHumedad, calibracionCompleta } from '../../src/utils/humedad.js'
import { ErrorConfig } from './config.js'

const hora = () => new Date().toLocaleTimeString('es-ES')
export const log = (...args) => console.log(hora(), ...args)

function conectar(cfg) {
  if (cfg.usarEmulador) {
    process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080'
    log(`Usando el emulador de Firestore (${process.env.FIRESTORE_EMULATOR_HOST}), proyecto demo-growhub.`)
    return getFirestore(initializeApp({ projectId: 'demo-growhub' }))
  }
  if (!cfg.rutaClave) {
    throw new ErrorConfig(
      'Falta SERVICE_ACCOUNT_PATH en bridge/.env: la ruta a la clave de la cuenta de servicio (ver bridge/README.md).',
    )
  }
  if (!existsSync(cfg.rutaClave)) {
    throw new ErrorConfig(`No se encuentra la clave de la cuenta de servicio en ${cfg.rutaClave}.`)
  }
  let clave
  try {
    clave = JSON.parse(readFileSync(cfg.rutaClave, 'utf8'))
  } catch {
    throw new ErrorConfig(`${cfg.rutaClave} no es un JSON válido: descarga de nuevo la clave desde la consola.`)
  }
  if (clave.type !== 'service_account' || !clave.project_id) {
    throw new ErrorConfig(`${cfg.rutaClave} no es una clave de cuenta de servicio de Firebase.`)
  }
  log(`Conectado al proyecto ${clave.project_id}.`)
  return getFirestore(initializeApp({ credential: cert(clave), projectId: clave.project_id }))
}

// Valores fuera de lo que puede medir cada sensor: lecturas corruptas.
const RANGO = {
  soilRaw: [0, 4095],
  temperatura: [-40, 85],
  lux: [0, 120000],
}
const valido = (clave, v) => v !== null && Number.isFinite(v) && v >= RANGO[clave][0] && v <= RANGO[clave][1]

const redondear = (v, decimales) => Math.round(v * 10 ** decimales) / 10 ** decimales

export async function crearEscritor(cfg, { origen = 'nodo' } = {}) {
  const db = conectar(cfg)
  const sensores = new Map() // "{orchardId}_{sensorId}" -> datos del sensor
  const ultimaEscritura = new Map()
  const nombresHuerto = new Map()
  const bajas = []
  let avisadoVacio = false

  const entradas = db.collection('devices').doc(cfg.deviceId).collection('sensores')

  async function nombreHuerto(orchardId) {
    if (!nombresHuerto.has(orchardId)) {
      const snap = await db.collection('orchards').doc(orchardId).get()
      nombresHuerto.set(orchardId, snap.exists ? snap.get('nombre') || orchardId : orchardId)
    }
    return nombresHuerto.get(orchardId)
  }

  // Sensores creados antes de existir devices/: se buscan una vez en los huertos y
  // se registran. Solo hace falta la primera vez.
  async function registrarAntiguos() {
    const huertos = await db.collection('orchards').listDocuments()
    let n = 0
    for (const h of huertos) {
      const snap = await h.collection('sensors').where('deviceId', '==', cfg.deviceId).get()
      for (const s of snap.docs) {
        await entradas.doc(`${h.id}_${s.id}`).set({ orchardId: h.id, sensorId: s.id })
        n++
      }
    }
    if (n === 1) log(`Registrado 1 sensor que ya tenía el deviceId ${cfg.deviceId}.`)
    else if (n) log(`Registrados ${n} sensores que ya tenían el deviceId ${cfg.deviceId}.`)
    return n
  }

  // Cada entrada apunta a un sensor; se escucha el sensor para conocer su tipo y
  // su calibración, y para descartarlo si ya no tiene este deviceId.
  function escucharSensor(id, orchardId, sensorId) {
    return db
      .collection('orchards').doc(orchardId).collection('sensors').doc(sensorId)
      .onSnapshot(async (snap) => {
        const d = snap.data()
        if (!snap.exists || d.deviceId !== cfg.deviceId) {
          sensores.delete(id)
          return
        }
        const nuevo = !sensores.has(id)
        sensores.set(id, {
          orchardId,
          sensorId,
          tipo: d.tipo,
          nombre: d.nombre || sensorId,
          calibracion: d.calibracion || null,
          huerto: await nombreHuerto(orchardId),
        })
        if (nuevo) log(`Sensor conectado: ${d.nombre} (${d.tipo}) en ${await nombreHuerto(orchardId)}.`)
      }, (e) => log('No se pudo leer un sensor:', e.message))
  }

  let primeraCarga
  const cargado = new Promise((resolve) => (primeraCarga = resolve))
  const escuchas = new Map()

  let antiguosBuscados = false
  const parar = entradas.onSnapshot(async (snap) => {
    if (snap.empty && !antiguosBuscados) {
      antiguosBuscados = true
      try {
        // Si registra alguno, la escucha vuelve a dispararse con ellos.
        if (await registrarAntiguos()) return
      } catch (e) {
        log('No se pudieron buscar sensores antiguos:', e.message)
      }
    }
    for (const cambio of snap.docChanges()) {
      const id = cambio.doc.id
      if (cambio.type === 'removed') {
        escuchas.get(id)?.()
        escuchas.delete(id)
        sensores.delete(id)
        continue
      }
      if (!escuchas.has(id)) {
        const { orchardId, sensorId } = cambio.doc.data()
        escuchas.set(id, escucharSensor(id, orchardId, sensorId))
      }
    }
    if (snap.empty && !avisadoVacio) {
      avisadoVacio = true
      log(
        `ERROR: ningún sensor de la app tiene el deviceId "${cfg.deviceId}". En la app, ve a ` +
          'Huerto > Sensores, crea o edita los sensores y pon ese valor en "Identificador del nodo". ' +
          'El puente sigue esperando y los conectará en cuanto existan.',
      )
    }
    if (!snap.empty) avisadoVacio = false
    // Un momento para que lleguen los datos de cada sensor antes de la primera escritura.
    setTimeout(primeraCarga, 1500)
  }, (e) => {
    log('ERROR: no se pudo leer devices/ en Firestore:', e.message)
    primeraCarga()
  })
  bajas.push(parar)

  await cargado

  // Una lectura del nodo: { soilRaw, temperatura, lux } (null en lo que falte).
  async function registrar(lectura) {
    const escrituras = []
    for (const s of sensores.values()) {
      let datos = null
      if (s.tipo === 'humedad' && valido('soilRaw', lectura.soilRaw)) {
        const cal = calibracionCompleta(s.calibracion) ? s.calibracion : { seco: cfg.sueloSeco, mojado: cfg.sueloMojado }
        const valor = porcentajeHumedad(lectura.soilRaw, cal.seco, cal.mojado)
        if (valor !== null) datos = { valor, raw: Math.round(lectura.soilRaw), texto: `${valor} % (RAW ${Math.round(lectura.soilRaw)})` }
      } else if (s.tipo === 'temperatura' && valido('temperatura', lectura.temperatura)) {
        const valor = redondear(lectura.temperatura, 1)
        datos = { valor, texto: `${valor} °C` }
      } else if (s.tipo === 'luz' && valido('lux', lectura.lux)) {
        const valor = Math.round(lectura.lux)
        datos = { valor, texto: `${valor} lux` }
      }
      if (!datos) continue

      const clave = `${s.orchardId}_${s.sensorId}`
      const ahora = Date.now()
      // 300 ms de margen: un temporizador de 15 s puede disparar unos ms antes.
      if (ahora - (ultimaEscritura.get(clave) || 0) < cfg.intervaloS * 1000 - 300) continue
      ultimaEscritura.set(clave, ahora)

      const { texto, ...campos } = datos
      escrituras.push(
        db
          .collection('orchards').doc(s.orchardId)
          .collection('sensors').doc(s.sensorId)
          .collection('readings')
          .add({ ...campos, origen, createdAt: FieldValue.serverTimestamp() })
          .then(() => log(`${s.nombre} (${s.huerto}): ${texto}`))
          .catch((e) => {
            ultimaEscritura.delete(clave)
            log(`ERROR al guardar ${s.nombre}:`, e.message)
          }),
      )
    }
    await Promise.all(escrituras)
    return escrituras.length
  }

  return {
    registrar,
    sensores: () => [...sensores.values()],
    cerrar: () => {
      bajas.forEach((f) => f())
      escuchas.forEach((f) => f())
    },
  }
}
