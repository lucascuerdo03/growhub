# GrowHub

GrowHub es una aplicación web para gestionar huertos. Cada día muestra qué hay que regar, qué está a punto de cosecharse y qué se puede sembrar este mes. Un huerto se puede compartir con otras personas, cada una con su rol, y la app incluye una biblioteca de más de cien cultivos con su calendario para España.

## Funcionalidades

- **Cuentas.** Registro con confirmación de contraseña y verificación por email, inicio de sesión, recuperación de contraseña y perfil con nombre y foto.
- **Panel "Hoy en tu huerto".** Muestra las tareas atrasadas, las de hoy y las de los próximos días, las próximas cosechas y las últimas lecturas de los sensores. También indica qué sembrar este mes y el tiempo previsto en el huerto, con aviso si va a llover ([Open-Meteo](https://open-meteo.com/), sin clave).
- **Huertos.** Cada huerto tiene foto, ubicación en un mapa (Leaflet + OpenStreetMap) y cultivos con su etapa y lo que les falta para la cosecha.
- **Huertos compartidos.** Se invita por email y el enlace de invitación se puede copiar o compartir con el menú del sistema. Hay cuatro roles (propietario, administrador, colaborador y lector) y permisos ajustables por persona. La propiedad se puede ceder a otro miembro.
- **Cultivos.** Al añadir un cultivo, la biblioteca autocompleta sus datos y propone tareas, que llegan sin marcar para que elijas cuáles crear. También se pueden añadir cultivos personalizados, cada uno con su foto.
- **Tareas.**
  - Cada tarea puede tener fecha, cultivo y frecuencia: cada día, cada 2-3 días, semanal, cada 2 semanas o mensual.
  - Al completar una tarea que se repite, se crea la siguiente con la fecha calculada.
  - Las listas se agrupan en atrasadas, hoy, próximas y sin fecha, y las completadas quedan en un historial.
- **Biblioteca de cultivos.** Tiene 112 variedades con foto, calendario de siembra, trasplante y cosecha, riego, marco de plantación, plagas y asociaciones, con búsqueda y filtros. Los créditos de las fotos están en `src/data/cropsPhotos.json`; la foto de huerto de las pantallas de acceso es de Angela Llop (Wikimedia Commons, CC BY-SA 2.0).
- **Cuaderno de campo.** Cada huerto tiene un muro de notas con fotos, compartido con sus miembros. Al completar una tarea se publica una entrada automáticamente.
- **Sensores.** Admite sensores de temperatura, humedad del suelo y luz, asociados a una planta y a un nodo físico (`deviceId`), con gráfica del histórico. La app también puede simular lecturas.
- **Tiempo real.** Todas las listas se actualizan al momento en todas las sesiones abiertas.

## Tecnologías

- [Vue 3](https://vuejs.org/) (`<script setup>`) y [Vue Router](https://router.vuejs.org/)
- [Vite](https://vite.dev/)
- [Firebase](https://firebase.google.com/):
  - Authentication (email y contraseña)
  - Cloud Firestore como base de datos, con reglas de seguridad por rol
  - Las fotos se comprimen en el navegador y se guardan en Firestore, así que no hace falta Storage y funciona en el plan gratuito Spark.
- [Chart.js](https://www.chartjs.org/) para las gráficas, [Leaflet](https://leafletjs.com/) para el mapa y [Lucide](https://lucide.dev/) para los iconos
- Tipografías Zilla Slab e Inter, servidas desde la propia app

## Instalación y arranque

Requisitos: Node.js 20.19 o superior (o 22.12 o superior).

```bash
git clone <url-del-repositorio>
cd growhub
npm install
```

Crea el archivo `.env` a partir de la plantilla y rellénalo con la configuración web de tu proyecto de Firebase. La encontrarás en Firebase Console > Configuración del proyecto > General > Tus apps.

```bash
cp .env.example .env
```

En Firebase Console hay que activar también:

- **Authentication** > Método de inicio de sesión > **Correo electrónico/contraseña**.
- **Firestore Database** (modo producción) y publicar las reglas (ver más abajo).

Arranque en desarrollo:

```bash
npm run dev
```

La app queda en http://localhost:5173. Para generar la versión de producción en `dist/`:

```bash
npm run build
```

`.env` no se sube al repositorio. La configuración web de Firebase identifica el proyecto pero no da acceso por sí sola: lo que protege los datos son las reglas de Firestore.

## Publicar las reglas de Firestore

Las reglas están en [`firestore.rules`](firestore.rules). Sin ellas no funcionan los huertos compartidos, las invitaciones, las fotos ni las tareas que se repiten.

**Desde la consola:**

1. Abre Firebase Console > Firestore Database > **Reglas**.
2. Sustituye todo el contenido por el de `firestore.rules`.
3. Pulsa **Publicar**.

**Con la CLI de Firebase** (`npm install -g firebase-tools`):

```bash
firebase login
firebase deploy --only firestore:rules --project <id-de-tu-proyecto>
```

## Modo emulador

Sirve para probar la app con varias cuentas sin tocar el proyecto real. Usa los emuladores locales de Authentication y Firestore con el proyecto ficticio `demo-growhub`, que no existe en la nube y no necesita `.env`. Los emuladores cargan las reglas de `firestore.rules` y no se envían correos de verdad.

Requisitos: Java 21 o superior y la CLI de Firebase (`npm install -g firebase-tools`).

1. Arranca los emuladores en una terminal y déjala abierta:

   ```bash
   npm run emuladores
   ```

2. En otra terminal, arranca la app contra los emuladores:

   ```bash
   npm run dev:emu
   ```

3. Para registrarte, usa cualquier email inventado, por ejemplo `ana@growhub.test`. El enlace de verificación no llega por correo: aparece en la terminal de los emuladores. Ábrelo y pulsa "Ya lo he verificado".

4. Para probar con dos cuentas a la vez, abre la app en otro puerto, porque cada puerto guarda su propia sesión:

   ```bash
   npm run dev:emu -- --port 5175
   ```

5. Para comprobar las reglas de seguridad, con los emuladores en marcha:

   ```bash
   npm run test:reglas
   ```

   Lanza más de cien casos (lo que cada rol puede y no puede hacer) y termina con el recuento de comprobaciones correctas.

Los datos del emulador se borran al cerrarlo.

## Sensor real (nodo ESP32)

La carpeta [`bridge/`](bridge/README.md) contiene el puente que lleva las lecturas del nodo (LILYGO T3 con sensores de humedad de suelo, temperatura y luz) a Firestore:

- por USB: `npm run bridge:serial`;
- por The Things Network: `npm run bridge:ttn`;
- simuladas, sin el nodo: `npm run bridge:demo`.

Se instala con `npm run bridge:instalar` y necesita una clave de cuenta de servicio guardada fuera del repositorio. Todos los pasos están en [bridge/README.md](bridge/README.md).

### Arranque con doble clic (macOS)

[`scripts/arrancar-growhub.command`](scripts/arrancar-growhub.command) abre la Terminal con dos pestañas en la carpeta del proyecto: la app (`npm run dev`) y el puente (`caffeinate -i npm run bridge:serial`, para que el Mac no se duerma). Se puede copiar al Escritorio o crear allí un lanzador que lo ejecute. Para abrir la segunda pestaña, la Terminal necesita permiso de Accesibilidad (Ajustes del Sistema > Privacidad y seguridad > Accesibilidad); sin él, el puente se abre en una ventana aparte.

## Estructura

```
src/
  views/        pantallas (panel, huerto, cultivo, tareas, biblioteca, miembros...)
  components/   piezas reutilizables (lista de tareas, buscador de cultivos, mapa...)
  composables/  estado compartido y escuchas en tiempo real (huertos, tareas, tiempo)
  services/     acceso a Firebase (auth y Firestore)
  data/         biblioteca de cultivos y créditos de las fotos
  utils/        fechas, permisos, frecuencias de tareas, compresión de imágenes
public/biblioteca/   fotos de la biblioteca
bridge/              puente entre el nodo de sensores y Firestore
scripts/             pruebas de las reglas y verificación de las fotos
firestore.rules      reglas de seguridad de Firestore
```

Comprobación de las fotos de la biblioteca (que no falte ninguna ni haya repetidas):

```bash
npm run verificar:fotos
```
