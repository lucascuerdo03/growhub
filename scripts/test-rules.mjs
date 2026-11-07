// Comprueba firestore.rules contra el emulador local: lo que debe permitirse y,
// sobre todo, lo que debe rechazarse. Requiere los emuladores en marcha:
//   firebase emulators:start --only auth,firestore --project demo-growhub
//   node scripts/test-rules.mjs
// El proyecto demo-* no existe en la nube: esto nunca toca datos reales.
import { initializeApp, deleteApp } from 'firebase/app'
import {
  getAuth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from 'firebase/auth'
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  collection,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  arrayUnion,
  arrayRemove,
  deleteField,
  writeBatch,
  serverTimestamp,
  setLogLevel,
} from 'firebase/firestore'
import { randomBytes } from 'node:crypto'
import { ROLES, miembroConRol } from '../src/utils/permissions.js'

// Los rechazos son lo esperado aquí: no los mostramos como errores.
setLogLevel('silent')

const PROYECTO = 'demo-growhub'
const AUTH = 'http://127.0.0.1:9099'
const sufijo = randomBytes(4).toString('hex')
const clave = randomBytes(12).toString('hex')

let fallos = 0
let total = 0
const apps = []

function informar(ok, nombre, detalle = '') {
  total++
  if (!ok) fallos++
  console.log(`${ok ? 'OK   ' : 'FALLO'} ${nombre}${detalle ? ` (${detalle})` : ''}`)
}
async function permitido(nombre, fn) {
  try {
    await fn()
    informar(true, nombre)
  } catch (e) {
    informar(false, nombre, `debía permitirse: ${e.code || e.message}`)
  }
}
async function rechazado(nombre, fn) {
  try {
    await fn()
    informar(false, nombre, 'debía rechazarse')
  } catch (e) {
    informar(e.code === 'permission-denied', nombre, e.code === 'permission-denied' ? '' : e.message)
  }
}

async function crearCuenta(alias, { verificada = true } = {}) {
  const app = initializeApp({ apiKey: 'demo', projectId: PROYECTO }, alias + sufijo)
  apps.push(app)
  const auth = getAuth(app)
  connectAuthEmulator(auth, AUTH, { disableWarnings: true })
  const db = getFirestore(app)
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  const email = `${alias}.${sufijo}@growhub.test`
  const { user } = await createUserWithEmailAndPassword(auth, email, clave)
  if (verificada) {
    await sendEmailVerification(user)
    const res = await fetch(`${AUTH}/emulator/v1/projects/${PROYECTO}/oobCodes`)
    const { oobCodes } = await res.json()
    const codigo = oobCodes.filter((c) => c.email === email && c.requestType === 'VERIFY_EMAIL').at(-1)
    await fetch(codigo.oobLink)
    await user.reload()
    await user.getIdToken(true)
  }
  return { db, uid: user.uid, email }
}

const huertoRef = (u, id) => doc(u.db, 'orchards', id)
const sub = (u, id, nombre) => collection(u.db, 'orchards', id, nombre)

async function crearHuerto(u, nombre) {
  const ref = await addDoc(collection(u.db, 'orchards'), {
    nombre,
    ownerId: u.uid,
    memberIds: [u.uid],
    members: { [u.uid]: miembroConRol('propietario') },
    createdAt: serverTimestamp(),
  })
  return ref.id
}

const invitacion = (invitador, orchardId, email, role, extra = {}) =>
  setDoc(doc(invitador.db, 'invitations', `${orchardId}_${email}`), {
    orchardId,
    orchardNombre: 'Huerto',
    email,
    role,
    invitedBy: invitador.uid,
    status: 'pending',
    ...extra,
  })

function aceptar(u, orchardId, role) {
  const batch = writeBatch(u.db)
  batch.update(huertoRef(u, orchardId), {
    memberIds: arrayUnion(u.uid),
    [`members.${u.uid}`]: miembroConRol(role),
  })
  batch.update(doc(u.db, 'invitations', `${orchardId}_${u.email}`), { status: 'accepted' })
  return batch.commit()
}

const a = await crearCuenta('ana')
const b = await crearCuenta('beto')
const c = await crearCuenta('carla')
const sinVerificar = await crearCuenta('nover', { verificada: false })

console.log('\n--- Perfiles ---')
await permitido('crear mi perfil', () => setDoc(doc(a.db, 'users', a.uid), { nombre: 'Ana', email: a.email }))
await rechazado('crear el perfil de otro', () => setDoc(doc(a.db, 'users', b.uid), { nombre: 'x', email: b.email }))
await rechazado('perfil con un email que no es el mío', () =>
  setDoc(doc(b.db, 'users', b.uid), { nombre: 'x', email: a.email }))
await permitido('leer un perfil conociendo el uid', () => getDoc(doc(b.db, 'users', a.uid)))
await rechazado('listar todos los usuarios', () => getDocs(collection(b.db, 'users')))

console.log('\n--- Huertos y consultas ---')
const id = await crearHuerto(a, 'Huerto de Ana')
await rechazado('crear huerto a nombre de otro', () =>
  addDoc(collection(b.db, 'orchards'), {
    nombre: 'x',
    ownerId: a.uid,
    memberIds: [a.uid],
    members: { [a.uid]: miembroConRol('propietario') },
  }))
await permitido("consulta where('ownerId','==',uid)", () =>
  getDocs(query(collection(a.db, 'orchards'), where('ownerId', '==', a.uid))))
await permitido("consulta where('memberIds','array-contains',uid)", () =>
  getDocs(query(collection(a.db, 'orchards'), where('memberIds', 'array-contains', a.uid))))
await rechazado('un ajeno consulta los huertos de otro', () =>
  getDocs(query(collection(b.db, 'orchards'), where('ownerId', '==', a.uid))))
await rechazado('listar todos los huertos', () => getDocs(collection(b.db, 'orchards')))
await rechazado('un ajeno lee el huerto', () => getDoc(huertoRef(b, id)))
await rechazado('un ajeno lee sus cultivos', () => getDocs(sub(b, id, 'crops')))
await rechazado('un ajeno se añade a sí mismo sin invitación', () =>
  updateDoc(huertoRef(b, id), {
    memberIds: arrayUnion(b.uid),
    [`members.${b.uid}`]: miembroConRol('administrador'),
  }))

console.log('\n--- Huerto antiguo (sin miembros) ---')
// Se crea saltándose las reglas (solo posible en el emulador), porque un huerto
// así ya no se puede crear desde la app pero sí existe en la base de datos real.
const antiguoId = `antiguo${sufijo}`
await fetch(
  `http://127.0.0.1:8080/v1/projects/${PROYECTO}/databases/(default)/documents/orchards/${antiguoId}`,
  {
    method: 'PATCH',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: { nombre: { stringValue: 'Antiguo' }, ownerId: { stringValue: c.uid } },
    }),
  },
)
await permitido('el dueño lo encuentra con la consulta por ownerId', async () => {
  const snap = await getDocs(query(collection(c.db, 'orchards'), where('ownerId', '==', c.uid)))
  if (!snap.docs.some((d) => d.id === antiguoId)) throw new Error('no aparece')
})
await permitido('el dueño sigue accediendo a sus subcolecciones', () =>
  addDoc(sub(c, antiguoId, 'crops'), { nombre: 'x' }))
await rechazado('un ajeno no lo lee', () => getDoc(huertoRef(b, antiguoId)))
await rechazado('un ajeno no lo migra a su favor', () =>
  updateDoc(huertoRef(b, antiguoId), {
    memberIds: [b.uid],
    members: { [b.uid]: miembroConRol('propietario') },
  }))
await permitido('el dueño lo migra', () =>
  updateDoc(huertoRef(c, antiguoId), {
    memberIds: [c.uid],
    members: { [c.uid]: miembroConRol('propietario') },
  }))
await permitido('ya aparece con la consulta de memberIds', async () => {
  const snap = await getDocs(query(collection(c.db, 'orchards'), where('memberIds', 'array-contains', c.uid)))
  if (!snap.docs.some((d) => d.id === antiguoId)) throw new Error('no aparece')
})

console.log('\n--- Invitaciones ---')
await rechazado('un ajeno invita', () => invitacion(b, id, c.email, 'colaborador'))
await rechazado('invitar con id que no corresponde', () =>
  setDoc(doc(a.db, 'invitations', 'cualquiera'), {
    orchardId: id, email: b.email, role: 'lector', invitedBy: a.uid, status: 'pending',
  }))
await rechazado('invitar como propietario', () => invitacion(a, id, b.email, 'propietario'))
await permitido('el propietario invita como colaborador', () => invitacion(a, id, b.email, 'colaborador'))
await permitido('el invitado ve su invitación por email', () =>
  getDocs(query(collection(b.db, 'invitations'), where('email', '==', b.email), where('status', '==', 'pending'))))
await permitido('un miembro ve las pendientes del huerto', () =>
  getDocs(query(collection(a.db, 'invitations'), where('orchardId', '==', id), where('status', '==', 'pending'))))
await rechazado('un ajeno ve las pendientes del huerto', () =>
  getDocs(query(collection(c.db, 'invitations'), where('orchardId', '==', id), where('status', '==', 'pending'))))
await rechazado('listar todas las invitaciones', () => getDocs(collection(b.db, 'invitations')))
await rechazado('aceptar con más rol del invitado', () => aceptar(b, id, 'administrador'))
await rechazado('aceptar con permisos inflados', () =>
  updateDoc(huertoRef(b, id), {
    memberIds: arrayUnion(b.uid),
    [`members.${b.uid}`]: { role: 'colaborador', permissions: ROLES.administrador.permissions },
  }))
await rechazado('otra cuenta usa la invitación ajena', () => aceptar(c, id, 'colaborador'))
// Sin email verificado no se puede reclamar una invitación: si no, cualquiera
// podría registrarse con un email ajeno y entrar antes que su dueño.
await permitido('se invita a un email aún sin verificar', () => invitacion(a, id, sinVerificar.email, 'lector'))
await rechazado('un email sin verificar lee la invitación', () =>
  getDocs(query(collection(sinVerificar.db, 'invitations'), where('email', '==', sinVerificar.email))))
await rechazado('un email sin verificar acepta', () => aceptar(sinVerificar, id, 'lector'))
await permitido('el invitado acepta', () => aceptar(b, id, 'colaborador'))

console.log('\n--- Colaborador ---')
let tareaB
await permitido('lee el huerto', () => getDoc(huertoRef(b, id)))
await permitido('lo ve con la consulta de compartidos', async () => {
  const snap = await getDocs(query(collection(b.db, 'orchards'), where('memberIds', 'array-contains', b.uid)))
  if (!snap.docs.some((d) => d.id === id)) throw new Error('no aparece')
})
await permitido('crea cultivo', () => addDoc(sub(b, id, 'crops'), { nombre: 'Tomates' }))
await permitido('crea tarea', async () => {
  tareaB = await addDoc(sub(b, id, 'tasks'), { titulo: 't', completada: false })
})
await permitido('completa tarea', () => updateDoc(tareaB, { completada: true }))
await permitido('crea sensor', () => addDoc(sub(b, id, 'sensors'), { nombre: 's' }))
await permitido('publica a su nombre', () => addDoc(sub(b, id, 'posts'), { texto: 'x', autorId: b.uid }))
await rechazado('publica a nombre de otro', () => addDoc(sub(b, id, 'posts'), { texto: 'x', autorId: a.uid }))
await permitido('sube una foto', () =>
  addDoc(sub(b, id, 'photos'), { data: 'data:image/jpeg;base64,AA', uploadedBy: b.uid }))
await rechazado('sube una foto demasiado grande', () =>
  addDoc(sub(b, id, 'photos'), { data: 'x'.repeat(1000001), uploadedBy: b.uid }))
await rechazado('edita el nombre del huerto', () => updateDoc(huertoRef(b, id), { nombre: 'mío' }))
await rechazado('se sube a administrador', () =>
  updateDoc(huertoRef(b, id), { [`members.${b.uid}.role`]: 'administrador' }))
await rechazado('se da permisos', () =>
  updateDoc(huertoRef(b, id), { [`members.${b.uid}.permissions.inviteMembers`]: true }))
await rechazado('se hace dueño', () => updateDoc(huertoRef(b, id), { ownerId: b.uid }))
await rechazado('expulsa al propietario', () =>
  updateDoc(huertoRef(b, id), { memberIds: arrayRemove(a.uid), [`members.${a.uid}`]: deleteField() }))
await rechazado('borra el huerto', () => deleteDoc(huertoRef(b, id)))
await rechazado('invita sin el permiso', () => invitacion(b, id, c.email, 'lector'))

console.log('\n--- Lector ---')
await permitido('el propietario cambia a B a lector', () =>
  updateDoc(huertoRef(a, id), { [`members.${b.uid}`]: miembroConRol('lector') }))
await permitido('lee tareas', () => getDocs(sub(b, id, 'tasks')))
await rechazado('crea tarea', () => addDoc(sub(b, id, 'tasks'), { titulo: 't', completada: false }))
await rechazado('completa tarea', () => updateDoc(tareaB, { completada: false }))
await rechazado('borra tarea', () => deleteDoc(tareaB))
await rechazado('crea cultivo', () => addDoc(sub(b, id, 'crops'), { nombre: 'x' }))
await rechazado('crea sensor', () => addDoc(sub(b, id, 'sensors'), { nombre: 's' }))
await rechazado('publica', () => addDoc(sub(b, id, 'posts'), { texto: 'x', autorId: b.uid }))
await rechazado('sube una foto', () =>
  addDoc(sub(b, id, 'photos'), { data: 'data:image/jpeg;base64,AA', uploadedBy: b.uid }))

console.log('\n--- Permisos sueltos ---')
await permitido('el propietario da solo "completar tareas"', () =>
  updateDoc(huertoRef(a, id), {
    [`members.${b.uid}`]: { role: 'lector', permissions: { ...ROLES.lector.permissions, completeTasks: true } },
  }))
await permitido('completa tarea', () => updateDoc(tareaB, { completada: false }))
await rechazado('pero no puede cambiar otros campos', () =>
  updateDoc(tareaB, { completada: true, titulo: 'cambiado' }))
await rechazado('ni crear tareas', () => addDoc(sub(b, id, 'tasks'), { titulo: 't' }))
await permitido('el propietario da solo "gestionar tareas"', () =>
  updateDoc(huertoRef(a, id), {
    [`members.${b.uid}`]: { role: 'lector', permissions: { ...ROLES.lector.permissions, manageTasks: true } },
  }))
await permitido('edita el título', () => updateDoc(tareaB, { titulo: 'nuevo' }))
await rechazado('pero no completa', () => updateDoc(tareaB, { completada: true }))

console.log('\n--- Administrador ---')
await permitido('el propietario sube a B a administrador', () =>
  updateDoc(huertoRef(a, id), { [`members.${b.uid}`]: miembroConRol('administrador') }))
await permitido('edita el huerto', () => updateDoc(huertoRef(b, id), { nombre: 'Renombrado' }))
await permitido('invita', () => invitacion(b, id, c.email, 'administrador'))
await permitido('el invitado acepta como administrador', () => aceptar(c, id, 'administrador'))
await permitido('cambia el rol de otro miembro', () =>
  updateDoc(huertoRef(b, id), { [`members.${c.uid}`]: miembroConRol('lector') }))
await rechazado('cambia la entrada del propietario', () =>
  updateDoc(huertoRef(b, id), { [`members.${a.uid}`]: miembroConRol('lector') }))
await rechazado('expulsa al propietario', () =>
  updateDoc(huertoRef(b, id), { memberIds: arrayRemove(a.uid), [`members.${a.uid}`]: deleteField() }))
await rechazado('se hace dueño', () => updateDoc(huertoRef(b, id), { ownerId: b.uid }))
await rechazado('deja memberIds y members incoherentes', () =>
  updateDoc(huertoRef(b, id), { memberIds: arrayUnion('fantasma') }))
await rechazado('borra el huerto', () => deleteDoc(huertoRef(b, id)))
// El texto 'propietario' en el rol no da ningún poder: solo cuenta ownerId.
await permitido('escribe el texto "propietario" en un miembro', () =>
  updateDoc(huertoRef(b, id), { [`members.${c.uid}.role`]: 'propietario' }))
await rechazado('ese miembro sigue sin poder borrar el huerto', () => deleteDoc(huertoRef(c, id)))
await rechazado('ni editarlo', () => updateDoc(huertoRef(c, id), { nombre: 'x' }))
await permitido('deja a C como lector', () =>
  updateDoc(huertoRef(b, id), { [`members.${c.uid}`]: miembroConRol('lector') }))

console.log('\n--- Abandonar y expulsar ---')
await rechazado('un lector expulsa a otro', () =>
  updateDoc(huertoRef(c, id), { memberIds: arrayRemove(b.uid), [`members.${b.uid}`]: deleteField() }))
await rechazado('el propietario no puede quitarse a sí mismo', () =>
  updateDoc(huertoRef(a, id), { memberIds: arrayRemove(a.uid), [`members.${a.uid}`]: deleteField() }))
await permitido('un miembro abandona', () =>
  updateDoc(huertoRef(c, id), { memberIds: arrayRemove(c.uid), [`members.${c.uid}`]: deleteField() }))
await rechazado('quien abandona ya no lee el huerto', () => getDoc(huertoRef(c, id)))
await permitido('el propietario expulsa a B', () =>
  updateDoc(huertoRef(a, id), { memberIds: arrayRemove(b.uid), [`members.${b.uid}`]: deleteField() }))
await rechazado('el expulsado ya no lee el huerto', () => getDoc(huertoRef(b, id)))
await rechazado('ni las tareas', () => getDocs(sub(b, id, 'tasks')))
await permitido('y ya no aparece en sus huertos', async () => {
  const snap = await getDocs(query(collection(b.db, 'orchards'), where('memberIds', 'array-contains', b.uid)))
  if (snap.docs.some((d) => d.id === id)) throw new Error('sigue apareciendo')
})
await rechazado('el expulsado no puede volver con la invitación usada', () =>
  updateDoc(huertoRef(b, id), {
    memberIds: arrayUnion(b.uid),
    [`members.${b.uid}`]: miembroConRol('colaborador'),
  }))
await rechazado('ni reactivar él mismo la invitación', () =>
  updateDoc(doc(b.db, 'invitations', `${id}_${b.email}`), { status: 'pending' }))
await permitido('con una invitación nueva sí puede volver', async () => {
  await invitacion(a, id, b.email, 'lector')
  await aceptar(b, id, 'lector')
})

console.log('\n--- Rechazar, cancelar y borrar ---')
const c2 = await crearHuerto(a, 'Otro')
await permitido('invitar para rechazar', () => invitacion(a, c2, c.email, 'lector'))
await rechazado('el invitado cambia su rol', () =>
  updateDoc(doc(c.db, 'invitations', `${c2}_${c.email}`), { role: 'administrador' }))
await permitido('el invitado rechaza', () =>
  updateDoc(doc(c.db, 'invitations', `${c2}_${c.email}`), { status: 'rejected' }))
await rechazado('tras rechazar no puede aceptar', () => aceptar(c, c2, 'lector'))
await permitido('el propietario borra la invitación', () =>
  deleteDoc(doc(a.db, 'invitations', `${c2}_${c.email}`)))
await rechazado('un lector no borra el huerto', () => deleteDoc(huertoRef(b, id)))
await permitido('el propietario borra el huerto', () => deleteDoc(huertoRef(a, id)))

console.log(`\n${total - fallos}/${total} comprobaciones correctas`)
await Promise.all(apps.map((app) => deleteApp(app)))
process.exit(fallos ? 1 : 0)
