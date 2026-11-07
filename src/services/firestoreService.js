import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
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
  deleteField,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore'
import { db, auth } from '../firebase'
import { miembroConRol } from '../utils/permissions'

/* ----------------------------- Usuarios ---------------------------- */
// users/{uid}: nombre y email en minúsculas, para mostrar a los miembros.

export const guardarUsuario = (uid, { nombre, email }) =>
  setDoc(doc(db, 'users', uid), { nombre, email: email.toLowerCase() }, { merge: true })

export const getUsuario = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data() : null
}

// Crea el perfil si no existe y mantiene el nombre al día.
export const asegurarUsuario = async ({ uid, email, displayName }) => {
  const nombre = displayName || email.split('@')[0]
  const actual = await getUsuario(uid)
  if (!actual || (displayName && actual.nombre !== displayName)) {
    await guardarUsuario(uid, { nombre, email })
  }
}

/* ----------------------------- Huertos ----------------------------- */

const porFecha = (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)

// Los huertos anteriores a los roles no tienen miembros: su dueño pasa a figurar
// como propietario la primera vez que los carga.
const migrarHuerto = async (h, uid) => {
  if (h.ownerId !== uid || h.memberIds) return h
  const campos = { memberIds: [uid], members: { [uid]: miembroConRol('propietario') } }
  try {
    await updateDoc(doc(db, 'orchards', h.id), campos)
    return { ...h, ...campos }
  } catch (e) {
    console.warn('No se pudo migrar el huerto:', e)
    return h
  }
}

// Huertos propios y compartidos conmigo. Las dos consultas coinciden con las
// reglas (una rama de `allow read` cada una). Se piden por separado para que los
// huertos propios se sigan viendo aunque falle la de los compartidos.
export const getHuertos = async (uid) => {
  const col = collection(db, 'orchards')
  const [propios, compartidos] = await Promise.allSettled([
    getDocs(query(col, where('ownerId', '==', uid))),
    getDocs(query(col, where('memberIds', 'array-contains', uid))),
  ])
  if (propios.status === 'rejected') throw propios.reason
  if (compartidos.status === 'rejected') {
    console.warn('No se pudieron cargar los huertos compartidos:', compartidos.reason)
  }
  const porId = new Map()
  for (const res of [propios, compartidos]) {
    if (res.status === 'fulfilled') {
      res.value.docs.forEach((d) => porId.set(d.id, { id: d.id, ...d.data() }))
    }
  }
  const huertos = await Promise.all([...porId.values()].map((h) => migrarHuerto(h, uid)))
  return huertos.sort(porFecha)
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
    memberIds: [uid],
    members: { [uid]: miembroConRol('propietario') },
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export const getHuerto = async (id) => {
  const snap = await getDoc(doc(db, 'orchards', id))
  if (!snap.exists()) return null
  return migrarHuerto({ id: snap.id, ...snap.data() }, auth.currentUser?.uid)
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
    await borrarDocs(query(collection(db, 'invitations'), where('orchardId', '==', id)))
  } catch (e) {
    console.warn('No se pudieron borrar todos los datos del huerto:', e)
  }
  await deleteDoc(doc(db, 'orchards', id))
}

/* ----------------------------- Miembros ---------------------------- */
// En el huerto: memberIds (para consultar) y members (uid -> { role, permissions }).

export const setMiembro = (orchardId, uid, datos) =>
  updateDoc(doc(db, 'orchards', orchardId), { [`members.${uid}`]: datos })

// Sirve para expulsar a otro miembro y para abandonar el huerto uno mismo.
export const quitarMiembro = (orchardId, uid) =>
  updateDoc(doc(db, 'orchards', orchardId), {
    memberIds: arrayRemove(uid),
    [`members.${uid}`]: deleteField(),
  })

/* --------------------------- Invitaciones -------------------------- */
// invitations/{orchardId}_{email}: una por persona y huerto. Se buscan por email,
// así que el invitado las ve aunque cree la cuenta después de ser invitado.

export const invitarMiembro = (huerto, email, role, invitador) => {
  const correo = email.trim().toLowerCase()
  return setDoc(doc(db, 'invitations', `${huerto.id}_${correo}`), {
    orchardId: huerto.id,
    orchardNombre: huerto.nombre,
    email: correo,
    role,
    invitedBy: invitador.uid,
    invitedByNombre: invitador.displayName || invitador.email,
    status: 'pending',
    createdAt: serverTimestamp(),
  })
}

export const getInvitacionesHuerto = async (orchardId) => {
  const snap = await getDocs(
    query(
      collection(db, 'invitations'),
      where('orchardId', '==', orchardId),
      where('status', '==', 'pending'),
    ),
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const cancelarInvitacion = (id) => deleteDoc(doc(db, 'invitations', id))

// Avisa en tiempo real de mis invitaciones pendientes. Devuelve la función para
// dejar de escuchar.
export const escucharMisInvitaciones = (email, alCambiar, alFallar) =>
  onSnapshot(
    query(
      collection(db, 'invitations'),
      where('email', '==', email.toLowerCase()),
      where('status', '==', 'pending'),
    ),
    (snap) => alCambiar(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(porFecha)),
    alFallar,
  )

// En un lote: las reglas del huerto comprueban que la invitación siga pendiente,
// y ven el estado anterior al lote.
export const aceptarInvitacion = (inv, uid) => {
  const batch = writeBatch(db)
  batch.update(doc(db, 'orchards', inv.orchardId), {
    memberIds: arrayUnion(uid),
    [`members.${uid}`]: miembroConRol(inv.role),
  })
  batch.update(doc(db, 'invitations', inv.id), {
    status: 'accepted',
    respondedAt: serverTimestamp(),
  })
  return batch.commit()
}

export const rechazarInvitacion = (inv) =>
  updateDoc(doc(db, 'invitations', inv.id), {
    status: 'rejected',
    respondedAt: serverTimestamp(),
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
