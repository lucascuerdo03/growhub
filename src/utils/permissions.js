// Roles y permisos de un huerto compartido. Debe coincidir con la función
// permisosRol() de firestore.rules: la interfaz oculta lo que no se puede hacer,
// pero quien lo impide de verdad son las reglas.
export const PERMISOS = [
  { key: 'manageCrops', label: 'Gestionar cultivos' },
  { key: 'manageTasks', label: 'Gestionar tareas' },
  { key: 'completeTasks', label: 'Completar tareas' },
  { key: 'manageSensors', label: 'Gestionar sensores' },
  { key: 'publishPosts', label: 'Publicar en el cuaderno' },
  { key: 'inviteMembers', label: 'Invitar miembros' },
]

const todos = (valor) => Object.fromEntries(PERMISOS.map((p) => [p.key, valor]))

export const ROLES = {
  propietario: { label: 'Propietario', permissions: todos(true) },
  administrador: { label: 'Administrador', permissions: todos(true) },
  colaborador: {
    label: 'Colaborador',
    permissions: { ...todos(true), inviteMembers: false },
  },
  lector: { label: 'Lector', permissions: todos(false) },
}

// Roles que se pueden asignar (solo hay un propietario: quien creó el huerto).
export const ROLES_ASIGNABLES = ['administrador', 'colaborador', 'lector']

export const nombreRol = (role) => ROLES[role]?.label || 'Sin rol'

// Los huertos anteriores a los roles no tienen `members`: su dueño sigue siendo
// el propietario aunque aún no se hayan migrado.
export const rolEn = (huerto, uid) => {
  if (!huerto || !uid) return null
  if (huerto.ownerId === uid) return 'propietario'
  return huerto.members?.[uid]?.role || null
}

// Permisos efectivos de un usuario en un huerto, listos para usar en la vista.
export const permisosEn = (huerto, uid) => {
  const rol = rolEn(huerto, uid)
  const propietario = rol === 'propietario'
  const guardados = huerto?.members?.[uid]?.permissions || {}
  const permisos = Object.fromEntries(
    PERMISOS.map((p) => [p.key, propietario || guardados[p.key] === true]),
  )
  return {
    ...permisos,
    rol,
    propietario,
    // Editar el huerto y gestionar miembros depende del rol, no de las casillas.
    admin: propietario || rol === 'administrador',
  }
}

// Campos de `members` para un miembro con los permisos por defecto de su rol.
export const miembroConRol = (role) => ({
  role,
  permissions: { ...ROLES[role].permissions },
})

// Mensaje de error para una escritura: si son las reglas quienes la rechazan,
// lo normal es que hayan cambiado mis permisos mientras tenía la página abierta.
export const mensajeError = (e, porDefecto) =>
  e?.code === 'permission-denied'
    ? 'No tienes permiso para hacer esto. Recarga la página para ver tus permisos actuales.'
    : porDefecto
