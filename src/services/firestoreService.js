import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  writeBatch,
} from 'firebase/firestore'
import { db, auth } from '../firebase'

/* ----------------------------- Huertos ----------------------------- */

const porFecha = (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)

// Huertos del usuario (solo los que posee). Una única consulta simple que
// funciona con reglas de solo-dueño.
export const getHuertos = async (uid) => {
  const snap = await getDocs(query(collection(db, 'orchards'), where('ownerId', '==', uid)))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(porFecha)
}

export const createHuerto = async (
  uid,
  { nombre, descripcion = '', lat = null, lng = null },
) => {
  const ref = await addDoc(collection(db, 'orchards'), {
    nombre,
    descripcion,
    lat,
    lng,
    ownerId: uid,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export const getHuerto = async (id) => {
  const snap = await getDoc(doc(db, 'orchards', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// Actualiza campos del huerto (nombre, descripción, lat, lng…).
export const updateHuerto = (id, data) =>
  updateDoc(doc(db, 'orchards', id), data)

// Firestore no borra las subcolecciones al borrar un documento: sin esto, las
// fotos y los demás datos del huerto quedarían ocupando espacio para siempre.
const borrarDocs = async (ref) => {
  const snap = await getDocs(ref)
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = writeBatch(db)
    snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref))
    await batch.commit()
  }
}

export const deleteHuerto = async (id) => {
  const sub = (...ruta) => collection(db, 'orchards', id, ...ruta)
  try {
    const sensores = await getDocs(sub('sensors'))
    await Promise.all(sensores.docs.map((s) => borrarDocs(sub('sensors', s.id, 'readings'))))
    for (const nombre of ['crops', 'tasks', 'posts', 'photos', 'sensors']) {
      await borrarDocs(sub(nombre))
    }
  } catch (e) {
    console.warn('No se pudieron borrar todos los datos del huerto:', e)
  }
  await deleteDoc(doc(db, 'orchards', id))
}

// Equipo: colaboradores por email (en minúsculas).
export const addColaborador = (id, email) =>
  updateDoc(doc(db, 'orchards', id), {
    colaboradoresEmails: arrayUnion(email.trim().toLowerCase()),
  })

export const removeColaborador = (id, email) =>
  updateDoc(doc(db, 'orchards', id), {
    colaboradoresEmails: arrayRemove(email),
  })

/* ----------------------------- Cultivos ---------------------------- */
// Cada cultivo se guarda como subcolección del huerto: orchards/{id}/crops

export const getCultivos = async (orchardId) => {
  const q = query(
    collection(db, 'orchards', orchardId, 'crops'),
    orderBy('createdAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const createCultivo = async (orchardId, data) => {
  const ref = await addDoc(collection(db, 'orchards', orchardId, 'crops'), {
    nombre: data.nombre,
    especie: data.especie || '',
    descripcion: data.descripcion || '',
    fotoId: data.fotoId || '',
    foto: data.foto || '',
    fechaSiembra: data.fechaSiembra || '',
    familia: data.familia || '',
    epocaSiembra: data.epocaSiembra || '',
    riego: data.riego || '',
    tempIdeal: data.tempIdeal || '',
    plagas: data.plagas || '',
    tiempoCosecha: data.tiempoCosecha || '',
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export const getCultivo = async (orchardId, cropId) => {
  const snap = await getDoc(doc(db, 'orchards', orchardId, 'crops', cropId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export const updateCultivo = (orchardId, cropId, data) =>
  updateDoc(doc(db, 'orchards', orchardId, 'crops', cropId), data)

export const deleteCultivo = async (orchardId, cropId, fotoId = '') => {
  await deleteDoc(doc(db, 'orchards', orchardId, 'crops', cropId))
  await limpiarFoto(orchardId, fotoId, '')
}

/* ----------------------------- Sensores ---------------------------- */
// Sensores como subcolección del huerto: orchards/{id}/sensors
// tipo: 'temperatura' | 'humedad' | 'luz' (define unidad y rango de simulación)

export const getSensores = async (orchardId) => {
  const q = query(
    collection(db, 'orchards', orchardId, 'sensors'),
    orderBy('createdAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const createSensor = async (orchardId, { nombre, tipo, unidad, cropId = null }) => {
  const ref = await addDoc(collection(db, 'orchards', orchardId, 'sensors'), {
    nombre,
    tipo,
    unidad,
    cropId,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export const updateSensor = (orchardId, sensorId, data) =>
  updateDoc(doc(db, 'orchards', orchardId, 'sensors', sensorId), data)

export const deleteSensor = (orchardId, sensorId) =>
  deleteDoc(doc(db, 'orchards', orchardId, 'sensors', sensorId))

/* ----------------------------- Lecturas ---------------------------- */
// Histórico de lecturas: orchards/{id}/sensors/{sensorId}/readings

export const addLectura = (orchardId, sensorId, valor) =>
  addDoc(
    collection(db, 'orchards', orchardId, 'sensors', sensorId, 'readings'),
    { valor, createdAt: serverTimestamp() },
  )

// Devuelve las últimas `max` lecturas en orden cronológico (ascendente).
export const getLecturas = async (orchardId, sensorId, max = 30) => {
  const q = query(
    collection(db, 'orchards', orchardId, 'sensors', sensorId, 'readings'),
    orderBy('createdAt', 'desc'),
    limit(max),
  )
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .reverse()
}

/* ------------------------------ Tareas ----------------------------- */
// Tareas como subcolección del huerto: orchards/{id}/tasks
// Pueden asociarse a un cultivo (cropId) o ser generales del huerto.

export const getTareas = async (orchardId) => {
  const q = query(
    collection(db, 'orchards', orchardId, 'tasks'),
    orderBy('createdAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const createTarea = async (orchardId, data) => {
  const ref = await addDoc(collection(db, 'orchards', orchardId, 'tasks'), {
    titulo: data.titulo,
    descripcion: data.descripcion || '',
    cropId: data.cropId || null,
    cropNombre: data.cropNombre || '',
    frecuenciaRiego: data.frecuenciaRiego || '',
    responsable: data.responsable || '',
    completada: false,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export const updateTarea = (orchardId, taskId, data) =>
  updateDoc(doc(db, 'orchards', orchardId, 'tasks', taskId), data)

export const deleteTarea = (orchardId, taskId) =>
  deleteDoc(doc(db, 'orchards', orchardId, 'tasks', taskId))

/* ------------------------- Cuaderno de Campo ----------------------- */
// Publicaciones del huerto (muro social): orchards/{id}/posts

export const getPosts = async (orchardId) => {
  const q = query(
    collection(db, 'orchards', orchardId, 'posts'),
    orderBy('createdAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const createPost = (orchardId, { texto, autorId, autorNombre, autorFoto = '', fotoId = '' }) =>
  addDoc(collection(db, 'orchards', orchardId, 'posts'), {
    texto,
    autorId,
    autorNombre,
    autorFoto,
    fotoId,
    createdAt: serverTimestamp(),
  })

export const deletePost = async (orchardId, postId, fotoId = '') => {
  await deleteDoc(doc(db, 'orchards', orchardId, 'posts', postId))
  await limpiarFoto(orchardId, fotoId, '')
}

/* ------------------------------- Fotos ----------------------------- */
// Cada imagen es un documento aparte: orchards/{id}/photos/{fotoId} con el data
// URL en `data`. Así leer un huerto, cultivo o publicación no descarga la imagen.
// Una foto nunca cambia una vez creada, por lo que se puede cachear por id.

const fotosCache = new Map()

export const createFoto = async (orchardId, data) => {
  const ref = await addDoc(collection(db, 'orchards', orchardId, 'photos'), {
    data,
    uploadedBy: auth.currentUser?.uid || '',
    createdAt: serverTimestamp(),
  })
  fotosCache.set(ref.id, data)
  return ref.id
}

export const getFoto = async (orchardId, fotoId) => {
  if (fotosCache.has(fotoId)) return fotosCache.get(fotoId)
  const snap = await getDoc(doc(db, 'orchards', orchardId, 'photos', fotoId))
  const data = snap.exists() ? snap.data().data : ''
  if (data) fotosCache.set(fotoId, data)
  return data
}

export const deleteFoto = (orchardId, fotoId) => {
  fotosCache.delete(fotoId)
  return deleteDoc(doc(db, 'orchards', orchardId, 'photos', fotoId))
}

// fotoId resultante de un formulario con ImageUpload.
export const resolverFoto = async (orchardId, actualId, nueva, quitada) => {
  if (nueva) return createFoto(orchardId, nueva)
  return quitada ? '' : actualId || ''
}

// Borra la foto anterior si ha dejado de usarse. No es crítico: si falla, solo
// queda un documento sin referencias.
export const limpiarFoto = async (orchardId, anteriorId, nuevoId) => {
  if (!anteriorId || anteriorId === nuevoId) return
  try {
    await deleteFoto(orchardId, anteriorId)
  } catch (e) {
    console.warn('No se pudo borrar la foto anterior:', e)
  }
}

/* ----------------------- Agregados globales ------------------------ */
// Datos de TODOS los huertos del usuario, para las secciones globales
// (Tareas / Sensores) accesibles sin entrar en un huerto concreto.

export const getAllTareas = async (uid) => {
  const huertos = await getHuertos(uid)
  const listas = await Promise.all(
    huertos.map(async (h) => {
      const tareas = await getTareas(h.id)
      return tareas.map((t) => ({ ...t, orchardId: h.id, orchardNombre: h.nombre }))
    }),
  )
  return listas.flat()
}

export const getAllSensores = async (uid) => {
  const huertos = await getHuertos(uid)
  const listas = await Promise.all(
    huertos.map(async (h) => {
      const sensores = await getSensores(h.id)
      return Promise.all(
        sensores.map(async (s) => ({
          ...s,
          orchardId: h.id,
          orchardNombre: h.nombre,
          lecturas: await getLecturas(h.id, s.id),
        })),
      )
    }),
  )
  return listas.flat()
}

// Resumen para el dashboard: huertos enriquecidos con sus contadores
// (cultivos, tareas pendientes, sensores) y los totales globales.
export const getResumen = async (uid) => {
  const huertos = await getHuertos(uid)
  const detalles = await Promise.all(
    huertos.map(async (h) => {
      const [crops, tasks, sensors] = await Promise.all([
        getCultivos(h.id),
        getTareas(h.id),
        getSensores(h.id),
      ])
      return {
        ...h,
        nCultivos: crops.length,
        nTareasPend: tasks.filter((t) => !t.completada).length,
        nSensores: sensors.length,
      }
    }),
  )
  const totals = {
    huertos: detalles.length,
    cultivos: detalles.reduce((a, h) => a + h.nCultivos, 0),
    tareasPend: detalles.reduce((a, h) => a + h.nTareasPend, 0),
    sensores: detalles.reduce((a, h) => a + h.nSensores, 0),
  }
  return { huertos: detalles, totals }
}
