# Puente del nodo de sensores

Programa de Node.js que lee el nodo de GrowHub y guarda sus lecturas en Firestore. El nodo es un LILYGO T3 V1.6.1 (ESP32) con sensor capacitivo de humedad de suelo, DS18B20 y BH1750. La app las muestra en tiempo real, en la planta a la que está asociado cada sensor.

Tiene tres modos, que comparten el mismo módulo de escritura (`src/firestore.js`):

| Comando (desde la raíz del proyecto) | De dónde vienen las lecturas |
| --- | --- |
| `npm run bridge:serial` | Nodo conectado por USB (115200 baudios) |
| `npm run bridge:ttn` | Nodo por LoRaWAN a través de The Things Network (MQTT) |
| `npm run bridge:demo` | Lecturas simuladas realistas, para enseñar la app sin el nodo |

## Instalación

Requisitos: Node.js 20.19 o superior.

```bash
npm run bridge:instalar
cp bridge/.env.example bridge/.env
```

Después edita `bridge/.env`. Como mínimo hay que poner `DEVICE_ID` y `SERVICE_ACCOUNT_PATH`.

## Clave de la cuenta de servicio

El puente escribe con `firebase-admin`, que necesita una clave privada del proyecto. Esa clave da **acceso completo** a la base de datos y se salta las reglas de seguridad, así que:

- guárdala **fuera** de la carpeta del proyecto;
- no la subas nunca a GitHub ni la compartas.

Para generarla:

1. Abre [Firebase Console](https://console.firebase.google.com/) y entra en el proyecto.
2. Pulsa el engranaje, junto a "Descripción general del proyecto", y elige **Configuración del proyecto**.
3. Entra en la pestaña **Cuentas de servicio**.
4. En "SDK de Firebase Admin", pulsa **Generar nueva clave privada** y confirma con **Generar clave**. Se descarga un archivo `.json`.
5. Muévelo a una carpeta tuya y quítale permisos a los demás usuarios:

   ```bash
   mkdir -p ~/.growhub
   mv ~/Downloads/*-firebase-adminsdk-*.json ~/.growhub/clave-firebase.json
   chmod 600 ~/.growhub/clave-firebase.json
   ```

6. En `bridge/.env`, pon la ruta completa: `SERVICE_ACCOUNT_PATH=/Users/tu-usuario/.growhub/clave-firebase.json`.

Si la clave se filtra, bórrala desde la misma pestaña (Google Cloud > Cuentas de servicio > Claves) y genera otra.

## Conectar el nodo con la app

Cada lectura del nodo se reparte entre los sensores de la app que tienen su mismo identificador:

1. En la app, entra en **Huerto > Sensores**.
2. Crea un sensor por cada magnitud que mide el nodo: **Humedad del suelo**, **Temperatura** y **Luz**. A cada uno elige su planta y, en **Identificador del nodo**, pon el mismo valor que `DEVICE_ID` (por ejemplo, `growhub-nodo-01`).
3. Arranca el puente. En la terminal verás `Sensor conectado: ...` por cada sensor encontrado y una línea por cada lectura guardada.

Puedes poner el mismo identificador en sensores de varios huertos: todos reciben la lectura.

### Cómo encuentra los sensores

Al guardar un sensor con identificador, la app crea la entrada `devices/{deviceId}/sensores/{orchardId}_{sensorId}`. El puente escucha esa lista, así que no hace falta ningún índice ni nada en la consola. Si encuentra la lista vacía, busca una vez en los huertos los sensores creados antes de existir este registro y los añade.

## Humedad del suelo

El nodo envía el valor RAW del ADC: de 0 a 4095, y cuanto más alto, más seco. El puente guarda el RAW y el porcentaje:

- Por defecto, el porcentaje se calcula con `SOIL_RAW_DRY` (0 %) y `SOIL_RAW_WET` (100 %) de `.env`.
- Si en la app pulsas **Guardar como seco** y **Guardar como mojado** en el sensor, se usan esos valores, que tienen prioridad sobre los de `.env`.

Para calibrar:

1. Con el sensor al aire y seco, espera a una lectura y pulsa "Guardar como seco".
2. Mételo en un vaso de agua (sin mojar la parte electrónica), espera a otra lectura y pulsa "Guardar como mojado".

## Formatos que entiende el modo serie

**Firmware de GrowHub:** una línea por lectura. Pon `nan` si falta un valor; las líneas que empiezan por `#` se ignoran.

```
# GrowHub nodo v1
GH,1523,24.31,812.50
GH,1530,nan,815.00
```

**Programa de prueba de clase:** bloques separados por guiones. Cada bloque es una lectura, y un valor puede venir como `ERROR ...`.

```
Humedad suelo RAW: 1523
Temperatura DS18B20: 24.31 ºC
Luz BH1750: 812.50 lux
----------
```

Si no indicas el puerto (`SERIAL_PORT`), el puente lista los disponibles y usa el primero cuyo nombre contenga `usbmodem`, `wchusbserial` o `usbserial`. Si el nodo se desconecta, vuelve a intentarlo cada 5 segundos.

## The Things Network

1. En la consola de TTN, crea una clave de API de la aplicación con permiso para leer el tráfico ("Read application traffic").
2. Rellena `TTN_APP_ID`, `TTN_DEVICE_ID` y `TTN_API_KEY` en `.env`.
3. El formateador de uplinks de la aplicación debe devolver `{ soil_raw, temperature, lux }`. Por ejemplo, si el nodo envía 2 + 2 + 4 bytes:

   ```js
   function decodeUplink(input) {
     const b = input.bytes
     return {
       data: {
         soil_raw: (b[0] << 8) | b[1],
         temperature: ((b[2] << 24) >> 16 | b[3]) / 100,
         lux: ((b[4] << 24) | (b[5] << 16) | (b[6] << 8) | b[7]) / 100,
       },
     }
   }
   ```

El puente se conecta a `eu1.cloud.thethings.network:8883` (MQTT con TLS) y escribe por el mismo camino que el modo serie.

## Demo

```bash
npm run bridge:demo                          # una lectura cada 15 s
npm run bridge:demo -- --humedad-baja        # fuerza humedad ~12 % para ver el aviso
npm run bridge:demo -- --temperatura-alta    # fuerza unos 38 °C
npm run bridge:demo -- --una                 # una sola lectura y termina
```

Otras opciones: `--humedad-alta`, `--temperatura-baja` y `--cada <segundos>` (mínimo 15).

## Cuota gratuita

Cada sensor recibe como mucho una escritura cada `MIN_INTERVAL_S` segundos (60 por defecto, nunca menos de 15). Si llegan más lecturas, el resto se descartan. El plan gratuito de Firestore permite 20 000 escrituras al día:

- con 3 sensores a 60 s son unas 4 300 al día;
- a 15 s serían 17 300, casi todo el cupo.

La demo usa 15 s porque está pensada para sesiones cortas.

## Probar contra el emulador

Con los emuladores en marcha (`npm run emuladores`), pon `USE_EMULATOR=true` en `bridge/.env`. Así el puente escribe en el proyecto local `demo-growhub` y no necesita clave.

## Problemas frecuentes

| Mensaje | Qué hacer |
| --- | --- |
| `No se encuentra el nodo` | Conecta el nodo con un cable de datos o indica `SERIAL_PORT`. |
| `El puerto ... está ocupado` | Cierra el Monitor serie del IDE de Arduino: solo un programa puede usar el puerto a la vez. |
| `No se encuentra la clave de la cuenta de servicio` | Revisa la ruta de `SERVICE_ACCOUNT_PATH`. |
| `ningún sensor de la app tiene el deviceId` | Pon ese identificador en los sensores de la app; el puente los conectará sin reiniciarlo. |
| Llegan líneas pero no se guarda nada | Comprueba que el nodo envía uno de los dos formatos y que el valor es válido (RAW de 0 a 4095). |

## Tests

```bash
npm --prefix bridge test
```

Comprueban el intérprete de los dos formatos y del uplink de TTN, y el cálculo del porcentaje de humedad.
