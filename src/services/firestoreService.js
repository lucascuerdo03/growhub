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
} from 'firebase/firestore'
import { db } from '../firebase'

/* ----------------------------- Huertos ----------------------------- */

// Lista los huertos que pertenecen al usuario dado.
// Solo filtramos por ownerId y ordenamos en el cliente para no exigir
// un índice compuesto de Firestore (where + orderBy).
export const getHuertos = async (uid) => {
  const q = query(collection(db, 'orchards'), where('ownerId', '==', uid))
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
}

export const createHuerto = async (uid, { nombre, descripcion = '' }) => {
  const ref = await addDoc(collection(db, 'orchards'), {
    nombre,
    descripcion,
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

export const deleteHuerto = (id) => deleteDoc(doc(db, 'orchards', id))

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

export const createCultivo = async (orchardId, { nombre, especie = '' }) => {
  const ref = await addDoc(collection(db, 'orchards', orchardId, 'crops'), {
    nombre,
    especie,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export const deleteCultivo = (orchardId, cropId) =>
  deleteDoc(doc(db, 'orchards', orchardId, 'crops', cropId))

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

export const createSensor = async (orchardId, { nombre, tipo, unidad }) => {
  const ref = await addDoc(collection(db, 'orchards', orchardId, 'sensors'), {
    nombre,
    tipo,
    unidad,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

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
    completada: false,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export const updateTarea = (orchardId, taskId, data) =>
  updateDoc(doc(db, 'orchards', orchardId, 'tasks', taskId), data)

export const deleteTarea = (orchardId, taskId) =>
  deleteDoc(doc(db, 'orchards', orchardId, 'tasks', taskId))

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
