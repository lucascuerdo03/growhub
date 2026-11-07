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

// Documentos de un snapshot. `estimate` da fecha también a lo recién escrito, que
// aún no tiene la hora del servidor.
const docsDe = (snap) =>
  snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }))

// Fuente de useVivo para una consulta. Evita consultas con where + orderBy sobre
// campos distintos: Firestore pediría un índice compuesto, que hay que crear a mano
// en la consola, y el emulador no avisa de que falta.
const fuenteConsulta = (clave, crearConsulta, transformar = (x) => x) => ({
  clave,
  escuchar: (alRecibir, alFallar) =>
    onSnapshot(crearConsulta(), (snap) => alRecibir(transformar(docsDe(snap))), alFallar),
})

const subcoleccion = (orchardId, nombre) => collection(db, 'orchards', orchardId, nombre)
const porFechaDesc = (orchardId, nombre) =>
  query(subcoleccion(orchardId, nombre), orderBy('createdAt', 'desc'))

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

export const fuenteFotoUsuario = (uid) => ({
  clave: `userPhoto:${uid}`,
  escuchar: (alRecibir, alFallar) =>
    onSnapshot(
      doc(db, 'userPhotos', uid),
      (snap) => alRecibir(snap.exists() ? [snap.data()] : []),
      alFallar,
    ),
})

export const guardarFotoUsuario = (uid, data) => setDoc(doc(db, 'userPhotos', uid), { data })

export const borrarFotoUsuario = (uid) => deleteDoc(doc(db, 'userPhotos', uid))

/* ----------------------------- Huertos ----------------------------- */

const porFecha = (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)

// Los huertos anteriores a los roles no tienen miembros: su dueño pasa a figurar
// como propietario la primera vez que los carga.
export const migrarHuerto = async (h, uid) => {
  try {
    await updateDoc(doc(db, 'orchards', h.id), {
      memberIds: [uid],
      members: { [uid]: miembroConRol('propietario') },
    })
  } catch (e) {
    console.warn('No se pudo migrar el huerto:', e)
  }
}

// Huertos propios y compartidos conmigo. Las dos consultas coinciden con las reglas
// (una rama de `allow read` cada una) y se escuchan por separado: si falla la de
// compartidos, los huertos propios se siguen viendo.
export const escucharHuertos = (uid, alRecibir, alFallar) => {
  const col = collection(db, 'orchards')
  const partes = { propios: null, compartidos: null }
  const emitir = () => {
    if (partes.propios === null) return
    const porId = new Map()
    for (const h of [...partes.propios, ...(partes.compartidos || [])]) porId.set(h.id, h)
    alRecibir([...porId.values()].sort(porFecha))
  }
  const pararPropios = onSnapshot(
    query(col, where('ownerId', '==', uid)),
    (snap) => {
      partes.propios = docsDe(snap)
      emitir()
    },
    alFallar,
  )
  const pararCompartidos = onSnapshot(
    query(col, where('memberIds', 'array-contains', uid)),
    (snap) => {
      partes.compartidos = docsDe(snap)
      emitir()
    },
    (e) => console.warn('No se pudieron cargar los huertos compartidos:', e),
  )
  return () => {
    pararPropios()
    pararCompartidos()
  }
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

// El propietario cede el huerto y pasa a ser administrador; después ya puede irse.
export const cederPropiedad = (orchardId, nuevoUid, miUid) =>
  updateDoc(doc(db, 'orchards', orchardId), {
    ownerId: nuevoUid,
    [`members.${nuevoUid}`]: miembroConRol('propietario'),
    [`members.${miUid}`]: miembroConRol('administrador'),
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

// Las dos consultas son solo de igualdad: no necesitan índice compuesto.
export const fuenteInvitacionesHuerto = (orchardId) =>
  fuenteConsulta(`invitations:${orchardId}`, () =>
    query(
      collection(db, 'invitations'),
      where('orchardId', '==', orchardId),
      where('status', '==', 'pending'),
    ),
  )

export const cancelarInvitacion = (id) => deleteDoc(doc(db, 'invitations', id))

export const fuenteMisInvitaciones = (email) =>
  fuenteConsulta(
    `mis-invitaciones:${email.toLowerCase()}`,
    () =>
      query(
        collection(db, 'invitations'),
        where('email', '==', email.toLowerCase()),
        where('status', '==', 'pending'),
      ),
    (docs) => [...docs].sort(porFecha),
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

export const fuenteCultivos = (orchardId) =>
  fuenteConsulta(`crops:${orchardId}`, () => porFechaDesc(orchardId, 'crops'))

// Un cultivo y sus tareas de una vez, para no dejar a medias ninguna de las dos cosas.
export const crearCultivoConTareas = async (orchardId, datos, tareas = []) => {
  const refCultivo = doc(collection(db, 'orchards', orchardId, 'crops'))
  const batch = writeBatch(db)
  batch.set(refCultivo, { ...datos, createdAt: serverTimestamp() })
  for (const t of tareas) {
    batch.set(doc(collection(db, 'orchards', orchardId, 'tasks')), {
      titulo: t.titulo,
      descripcion: '',
      cropId: refCultivo.id,
      fecha: t.fecha || '',
      frecuenciaRiego: t.frecuenciaRiego || '',
      responsable: '',
      completada: false,
      createdAt: serverTimestamp(),
    })
  }
  await batch.commit()
  return refCultivo.id
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

export const updateCultivo = (orchardId, cropId, data) =>
  updateDoc(doc(db, 'orchards', orchardId, 'crops', cropId), data)

export const deleteCultivo = async (orchardId, cropId, fotoId = '') => {
  await deleteDoc(doc(db, 'orchards', orchardId, 'crops', cropId))
  await limpiarFoto(orchardId, fotoId, '')
}

/* ----------------------------- Sensores ---------------------------- */
// Sensores como subcolección del huerto: orchards/{id}/sensors
// tipo: 'temperatura' | 'humedad' | 'luz' (define unidad y rango de simulación)
// cropId: planta a la que mide (opcional). deviceId: identificador del nodo físico
// (p. ej. "growhub-nodo-01"), para conectar después el sensor real.

export const fuenteSensores = (orchardId) =>
  fuenteConsulta(`sensors:${orchardId}`, () => porFechaDesc(orchardId, 'sensors'))

export const createSensor = async (orchardId, { nombre, tipo, unidad, cropId = null, deviceId = '' }) => {
  const ref = await addDoc(collection(db, 'orchards', orchardId, 'sensors'), {
    nombre,
    tipo,
    unidad,
    cropId,
    deviceId,
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

// Últimas lecturas en orden cronológico (ascendente).
export const fuenteLecturas = (orchardId, sensorId, max = 30) =>
  fuenteConsulta(
    `readings:${orchardId}:${sensorId}`,
    () =>
      query(
        collection(db, 'orchards', orchardId, 'sensors', sensorId, 'readings'),
        orderBy('createdAt', 'desc'),
        limit(max),
      ),
    (docs) => [...docs].reverse(),
  )

/* ------------------------------ Tareas ----------------------------- */
// Tareas como subcolección del huerto: orchards/{id}/tasks
// cropId las asocia a un cultivo; sin él son tareas generales del huerto. El
// nombre de la planta se busca siempre por cropId, así que renombrar un cultivo
// no deja etiquetas viejas y una tarea de un cultivo borrado pasa a ser general.

export const fuenteTareas = (orchardId) =>
  fuenteConsulta(`tasks:${orchardId}`, () => porFechaDesc(orchardId, 'tasks'))

export const createTarea = async (orchardId, data) => {
  const ref = await addDoc(collection(db, 'orchards', orchardId, 'tasks'), {
    titulo: data.titulo,
    descripcion: data.descripcion || '',
    cropId: data.cropId || null,
    // Día previsto (AAAA-MM-DD) o vacío si no tiene fecha.
    fecha: data.fecha || '',
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

export const fuentePosts = (orchardId) =>
  fuenteConsulta(`posts:${orchardId}`, () => porFechaDesc(orchardId, 'posts'))

export const createPost = (orchardId, { texto, autorId, autorNombre, autorFoto = '', fotoId = '' }) =>
  addDoc(collection(db, 'orchards', orchardId, 'posts'), {
    texto,
    autorId,
    autorNombre,
    autorFoto,
    fotoId,
    createdAt: serverTimestamp(),
  })

// Entrada automática al completar una tarea. No es crítica: si falla, la tarea
// sigue completada.
export const autopublicarTarea = async (orchardId, titulo, user) => {
  const datos = {
    texto: `He completado la tarea: ${titulo}`,
    autorId: user.uid,
    autorNombre: user.displayName || user.email,
    autorFoto: user.photoURL || '',
  }
  try {
    await createPost(orchardId, datos)
  } catch (e) {
    console.warn('No se pudo autopublicar en el cuaderno:', e)
  }
}

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

export const vaciarFotos = () => fotosCache.clear()

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
