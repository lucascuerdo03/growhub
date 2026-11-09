<template>
  <div>
    <router-link :to="`/orchard/${orchardId}`" class="back">← Volver al huerto</router-link>
    <h1>Miembros</h1>
    <p v-if="huerto" class="sub">{{ huerto.nombre }}</p>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="info" class="success">{{ info }}</p>
    <p v-if="!listo" class="muted">Cargando…</p>

    <template v-else-if="huerto">
      <section class="card">
        <ul class="members">
          <li v-for="m in miembros" :key="m.uid" class="member">
            <div class="row">
              <UserAvatar :uid="m.uid" :nombre="m.nombre" :size="38" />
              <div class="who">
                <strong>{{ m.nombre }}<span v-if="m.uid === user.uid" class="you"> (tú)</span></strong>
                <span class="muted small">{{ m.email }}</span>
              </div>

              <select
                v-if="editable(m)"
                class="role-select"
                :value="m.role"
                :aria-label="`Rol de ${m.nombre}`"
                @change="cambiarRol(m, $event.target.value)"
              >
                <option v-for="r in ROLES_ASIGNABLES" :key="r" :value="r">{{ nombreRol(r) }}</option>
              </select>
              <span v-else class="role">{{ nombreRol(m.role) }}</span>

              <button v-if="editable(m)" class="link-btn" @click="abierto = abierto === m.uid ? '' : m.uid">
                Permisos
              </button>
              <button v-if="permisos.propietario && m.uid !== user.uid" class="link-btn" @click="ceder(m)">
                Ceder propiedad
              </button>
              <button
                v-if="editable(m) && m.uid !== user.uid"
                class="link-btn danger"
                @click="expulsar(m)"
              >
                Expulsar
              </button>
            </div>

            <div v-if="abierto === m.uid" class="perms">
              <label v-for="p in PERMISOS" :key="p.key" class="perm">
                <input
                  type="checkbox"
                  :checked="m.permissions[p.key] === true"
                  @change="cambiarPermiso(m, p.key, $event.target.checked)"
                />
                {{ p.label }}
              </label>
            </div>
          </li>
        </ul>
      </section>

      <section v-if="permisos.inviteMembers" class="card">
        <h2>Invitar por email</h2>
        <p class="muted small">
          La persona verá la invitación al entrar en GrowHub con ese email, aunque aún no tenga
          cuenta. Después puedes copiarle el enlace o compartirlo.
        </p>
        <form class="invite" @submit.prevent="invitar">
          <input v-model="email" type="email" placeholder="persona@email.com" aria-label="Email de la persona invitada" />
          <select v-model="rolInvitado" aria-label="Rol de la persona invitada">
            <option v-for="r in rolesInvitables" :key="r" :value="r">{{ nombreRol(r) }}</option>
          </select>
          <button type="submit" class="primary" :disabled="invitando || !email.trim()">
            {{ invitando ? 'Invitando…' : 'Invitar' }}
          </button>
        </form>
      </section>

      <section v-if="pendientes.length" class="card">
        <h2>Invitaciones pendientes</h2>
        <p class="muted small">Para aceptarla, la persona debe entrar o registrarse con el mismo email al que se envió la invitación.</p>
        <ul class="pending">
          <li v-for="inv in pendientes" :key="inv.id">
            <span>{{ inv.email }}</span>
            <span class="role">{{ nombreRol(inv.role) }}</span>
            <button class="link-btn" @click="copiarEnlace(inv)">Copiar enlace de invitación</button>
            <button v-if="puedeCompartir" class="link-btn" @click="compartir(inv)">Compartir</button>
            <button
              v-if="permisos.admin || inv.invitedBy === user.uid"
              class="link-btn danger"
              @click="cancelar(inv)"
            >
              Cancelar
            </button>
          </li>
        </ul>
      </section>

      <button v-if="!permisos.propietario" class="leave" @click="abandonar">Abandonar el huerto</button>
    </template>

    <template v-else>
      <p class="error">No tienes acceso a este huerto o ya no existe.</p>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useHuerto } from '../composables/useHuertos'
import { useVivo } from '../composables/useVivo'
import UserAvatar from '../components/UserAvatar.vue'
import {
  fuenteInvitacionesHuerto,
  getUsuario,
  setMiembro,
  quitarMiembro,
  cederPropiedad,
  invitarMiembro,
  cancelarInvitacion,
} from '../services/firestoreService'
import {
  PERMISOS,
  ROLES_ASIGNABLES,
  nombreRol,
  rolEn,
  miembroConRol,
  mensajeError,
} from '../utils/permissions'

const route = useRoute()
const router = useRouter()
const orchardId = route.params.id
const { user } = useAuth()

const { huerto, permisos, listo } = useHuerto(orchardId)
const { datos: pendientes } = useVivo(() =>
  huerto.value ? fuenteInvitacionesHuerto(orchardId) : null,
)
const usuarios = ref({})
const error = ref('')
const info = ref('')
const abierto = ref('')
const email = ref('')
const rolInvitado = ref('colaborador')
const invitando = ref(false)

// Solo un administrador o el propietario puede dar el rol de administrador.
const rolesInvitables = computed(() =>
  permisos.value.admin ? ROLES_ASIGNABLES : ROLES_ASIGNABLES.filter((r) => r !== 'administrador'),
)

const orden = ['propietario', 'administrador', 'colaborador', 'lector']
const miembros = computed(() => {
  const h = huerto.value
  if (!h) return []
  return (h.memberIds || [h.ownerId])
    .map((uid) => ({
      uid,
      role: rolEn(h, uid),
      permissions: h.members?.[uid]?.permissions || {},
      nombre: usuarios.value[uid]?.nombre || 'Usuario',
      email: usuarios.value[uid]?.email || '',
    }))
    .sort((a, b) => orden.indexOf(a.role) - orden.indexOf(b.role))
})

// El propietario no se puede editar; un administrador puede gestionar al resto.
const editable = (m) => permisos.value.admin && m.role !== 'propietario'

function avisar(texto) {
  error.value = ''
  info.value = texto
}
function fallar(e, texto) {
  info.value = ''
  error.value = mensajeError(e, texto)
  console.error(e)
}

// Nombres y emails de los miembros: se piden al aparecer alguien nuevo.
watch(
  () => huerto.value?.memberIds || [],
  async (ids) => {
    const nuevos = ids.filter((uid) => !usuarios.value[uid])
    const perfiles = await Promise.allSettled(nuevos.map((uid) => getUsuario(uid)))
    const mapa = { ...usuarios.value }
    nuevos.forEach((uid, i) => {
      if (perfiles[i].status === 'fulfilled' && perfiles[i].value) mapa[uid] = perfiles[i].value
    })
    usuarios.value = mapa
  },
  { immediate: true },
)

async function guardarMiembro(m, datos, texto) {
  try {
    await setMiembro(orchardId, m.uid, datos)
    avisar(texto)
  } catch (e) {
    fallar(e, 'No se pudo guardar el cambio.')
  }
}

const cambiarRol = (m, role) =>
  guardarMiembro(m, miembroConRol(role), `${m.nombre} ahora es ${nombreRol(role)}.`)

const cambiarPermiso = (m, key, valor) =>
  guardarMiembro(
    m,
    { role: m.role, permissions: { ...m.permissions, [key]: valor } },
    `Permisos de ${m.nombre} actualizados.`,
  )

async function expulsar(m) {
  if (!confirm(`¿Expulsar a ${m.nombre} de este huerto?`)) return
  try {
    await quitarMiembro(orchardId, m.uid)
    avisar(`${m.nombre} ya no es miembro del huerto.`)
  } catch (e) {
    fallar(e, 'No se pudo expulsar al miembro.')
  }
}

async function ceder(m) {
  const ok = confirm(
    `¿Ceder ${huerto.value.nombre} a ${m.nombre}? Pasará a ser propietario y tú quedarás como administrador. No podrás deshacerlo por tu cuenta.`,
  )
  if (!ok) return
  try {
    await cederPropiedad(orchardId, m.uid, user.value.uid)
    avisar(`${m.nombre} es ahora el propietario. Ya puedes abandonar el huerto si quieres.`)
  } catch (e) {
    fallar(e, 'No se pudo ceder la propiedad.')
  }
}

const enlaceDe = () => `${location.origin}/invitacion/${orchardId}`

async function copiarEnlace(inv) {
  try {
    await navigator.clipboard.writeText(enlaceDe())
    avisar(`Enlace copiado. Envíaselo a ${inv.email}.`)
  } catch {
    // Sin permiso de portapapeles (o sin https) se muestra para copiarlo a mano.
    avisar(`Copia este enlace y envíaselo a ${inv.email}: ${enlaceDe()}`)
  }
}

// Menú de compartir del sistema (WhatsApp, Mensajes...). Solo existe en algunos
// navegadores, sobre todo en móvil; donde no está, el botón no se muestra.
const datosCompartir = (inv) => ({
  title: 'Invitación a GrowHub',
  text: `Te invito a mi huerto "${huerto.value.nombre}" en GrowHub. Entra o regístrate con ${inv.email} para aceptar la invitación:`,
  url: enlaceDe(),
})
const puedeCompartir =
  typeof navigator.share === 'function' &&
  (typeof navigator.canShare !== 'function' || navigator.canShare({ title: 'GrowHub', text: 'GrowHub', url: location.origin }))

async function compartir(inv) {
  try {
    await navigator.share(datosCompartir(inv))
  } catch (e) {
    // Cerrar el menú sin elegir nada no es un error.
    if (e?.name !== 'AbortError') fallar(e, 'No se pudo compartir el enlace. Cópialo y envíalo tú.')
  }
}

async function abandonar() {
  if (!confirm('¿Abandonar este huerto? Necesitarás una nueva invitación para volver.')) return
  try {
    await quitarMiembro(orchardId, user.value.uid)
    router.push('/dashboard')
  } catch (e) {
    fallar(e, 'No se pudo abandonar el huerto.')
  }
}

async function invitar() {
  const correo = email.value.trim().toLowerCase()
  // La barra no se admite porque el email forma parte del id del documento.
  if (!/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(correo)) {
    fallar(null, 'Introduce un email válido.')
    return
  }
  if (miembros.value.some((m) => m.email === correo)) {
    fallar(null, 'Esa persona ya es miembro del huerto.')
    return
  }
  if (pendientes.value.some((i) => i.email === correo)) {
    fallar(null, 'Esa persona ya tiene una invitación pendiente.')
    return
  }
  invitando.value = true
  try {
    await invitarMiembro(huerto.value, correo, rolInvitado.value, user.value)
    email.value = ''
    avisar(`Invitación creada para ${correo}.`)
  } catch (e) {
    fallar(e, 'No se pudo crear la invitación.')
  } finally {
    invitando.value = false
  }
}

async function cancelar(inv) {
  try {
    await cancelarInvitacion(inv.id)
    avisar('Invitación cancelada.')
  } catch (e) {
    fallar(e, 'No se pudo cancelar la invitación.')
  }
}

</script>

<style scoped>
.back {
  display: inline-block;
  margin-bottom: 12px;
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
}
h1 {
  margin: 0;
}
.sub {
  color: var(--color-text-soft);
  margin: 4px 0 20px;
}
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  padding: 20px 22px;
  margin-bottom: 18px;
  max-width: 820px;
}
.card h2 {
  margin: 0 0 6px;
  font-size: 1.1rem;
}
.members,
.pending {
  list-style: none;
  padding: 0;
  margin: 0;
}
.member {
  padding: 12px 0;
  border-top: 1px solid var(--color-border-soft);
}
.member:first-child {
  border-top: none;
  padding-top: 0;
}
.row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.who {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 170px;
}
.you {
  font-weight: 400;
  color: var(--color-text-soft);
}
.role {
  background: var(--color-primary-soft);
  color: var(--color-primary-dark);
  font-size: 0.76rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;
}
.role-select,
.invite select,
.invite input {
  padding: 8px 10px;
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
}
.link-btn {
  text-decoration: none;
  background: transparent;
  border: none;
  color: var(--color-primary-dark);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  padding: 4px;
}
.link-btn.danger {
  color: var(--color-danger);
}
.perms {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 8px;
  margin: 12px 0 2px 50px;
}
.perm {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
  cursor: pointer;
}
.invite {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 12px;
}
.invite input {
  flex: 1;
  min-width: 200px;
}
.primary {
  background: var(--color-primary);
  color: #fff;
  border: none;
  padding: 9px 18px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
}
.primary:disabled {
  opacity: 0.55;
  cursor: default;
}
.pending li {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 8px 0;
}
.pending li span:first-child {
  flex: 1;
  min-width: 160px;
}
.leave {
  background: transparent;
  border: 1px solid var(--color-danger);
  color: var(--color-danger);
  padding: 9px 16px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
}
.muted {
  color: var(--color-text-soft);
}
.small {
  font-size: 0.85rem;
}
.error {
  color: var(--color-danger);
}
.success {
  color: var(--color-success);
}
@media (max-width: 560px) {
  .perms {
    margin-left: 0;
  }
}
</style>
