// npm --prefix bridge test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { crearParser, lecturaDeTTN } from '../src/parser.js'
import { porcentajeHumedad } from '../../src/utils/humedad.js'

function leer(lineas) {
  const lecturas = []
  const p = crearParser((l) => lecturas.push(l))
  lineas.forEach((l) => p.linea(l))
  p.terminar()
  return lecturas
}

test('firmware nuevo: GH,<soil_raw>,<temp>,<lux>', () => {
  assert.deepEqual(leer(['GH,1523,24.31,812.5']), [{ soilRaw: 1523, temperatura: 24.31, lux: 812.5 }])
})

test('firmware nuevo: "nan" deja ese valor a null', () => {
  assert.deepEqual(leer(['GH,1523,nan,812.5\r']), [{ soilRaw: 1523, temperatura: null, lux: 812.5 }])
})

test('firmware nuevo: comentarios y líneas vacías se ignoran', () => {
  assert.deepEqual(leer(['# GrowHub nodo v1', '', '#GH,1,2,3', 'Arrancando...']), [])
})

test('firmware nuevo: todo nan no es una lectura', () => {
  assert.deepEqual(leer(['GH,nan,nan,nan']), [])
})

test('programa de clase: un bloque es una lectura', () => {
  assert.deepEqual(
    leer([
      'Humedad suelo RAW: 1523',
      'Temperatura DS18B20: 24.31 ºC',
      'Luz BH1750: 812.50 lux',
      '----------',
    ]),
    [{ soilRaw: 1523, temperatura: 24.31, lux: 812.5 }],
  )
})

test('programa de clase: ERROR deja ese valor a null', () => {
  assert.deepEqual(
    leer(['Humedad suelo RAW: 1600', 'Temperatura DS18B20: ERROR sensor no encontrado', 'Luz BH1750: 90 lux', '----------']),
    [{ soilRaw: 1600, temperatura: null, lux: 90 }],
  )
})

test('programa de clase: varios bloques, con el grado escrito de dos maneras', () => {
  assert.deepEqual(
    leer([
      'Humedad suelo RAW: 1500',
      'Temperatura DS18B20: 20.5 °C',
      'Luz BH1750: 100.00 lux',
      '----------',
      'Humedad suelo RAW: 1510',
      'Temperatura DS18B20: 20,7 ºC',
      'Luz BH1750: 101.00 lux',
      '----------',
    ]),
    [
      { soilRaw: 1500, temperatura: 20.5, lux: 100 },
      { soilRaw: 1510, temperatura: 20.7, lux: 101 },
    ],
  )
})

test('programa de clase: un campo repetido sin separador cierra el bloque anterior', () => {
  assert.deepEqual(leer(['Humedad suelo RAW: 1500', 'Humedad suelo RAW: 1490']), [
    { soilRaw: 1500, temperatura: null, lux: null },
    { soilRaw: 1490, temperatura: null, lux: null },
  ])
})

test('TTN: decoded_payload a lectura', () => {
  const m = { uplink_message: { decoded_payload: { soil_raw: 2000, temperature: 18.2, lux: 5000 } } }
  assert.deepEqual(lecturaDeTTN(m), { soilRaw: 2000, temperatura: 18.2, lux: 5000 })
  assert.equal(lecturaDeTTN({ uplink_message: {} }), null)
})

test('humedad: más RAW es más seco, con límites en 0 y 100', () => {
  assert.equal(porcentajeHumedad(3300, 3300, 1300), 0)
  assert.equal(porcentajeHumedad(1300, 3300, 1300), 100)
  assert.equal(porcentajeHumedad(2300, 3300, 1300), 50)
  assert.equal(porcentajeHumedad(4000, 3300, 1300), 0)
  assert.equal(porcentajeHumedad(900, 3300, 1300), 100)
  assert.equal(porcentajeHumedad(2000, 1500, 1500), null)
})
