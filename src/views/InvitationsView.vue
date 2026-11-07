<template>
  <div>
    <header class="page-head">
      <h1>Invitaciones</h1>
      <p class="sub">Huertos que otras personas quieren compartir contigo.</p>
    </header>

    <template v-if="orchardId && !cargando && !invitaciones.length">
      <p v-if="huerto" class="muted">
        Ya eres miembro de este huerto.
        <router-link :to="`/orchard/${orchardId}`">Abrir {{ huerto.nombre }}</router-link>
      </p>
      <p v-else-if="listo" class="muted">
        No hay ninguna invitación pendiente para {{ user.email }} en este huerto. Comprueba que has
        entrado con el email al que te invitaron, o pide que te envíen una invitación nueva.
      </p>
    </template>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="errorCarga" class="error">No se pudieron cargar las invitaciones.</p>
    <p v-else-if="!orchardId && !cargando && !invitaciones.length" class="muted">No tienes invitaciones pendientes.</p>

    <ul class="list">
      <li v-for="inv in invitaciones" :key="inv.id" class="card">
        <div class="info">
          <strong>{{ inv.orchardNombre }}</strong>
          <span class="muted small">Te invita {{ inv.invitedByNombre }}</span>
          <span class="role">{{ nombreRol(inv.role) }}</span>
        </div>
        <div class="actions">
          <button class="ghost" :disabled="ocupada === inv.id" @click="rechazar(inv)">Rechazar</button>
          <button class="primary" :disabled="ocupada === inv.id" @click="aceptar(inv)">Aceptar</button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useInvitaciones } from '../composables/useInvitaciones'
import { esperarHuerto, useHuerto } from '../composables/useHuertos'
import { aceptarInvitacion, rechazarInvitacion } from '../services/firestoreService'
import { nombreRol } from '../utils/permissions'

const router = useRouter()
const route = useRoute()
// Desde un enlace de invitación solo se muestra la de ese huerto.
const orchardId = route.params.orchardId || null
const { user } = useAuth()
const { invitaciones, cargando, error: errorCarga } = useInvitaciones(orchardId)
const { huerto, listo } = useHuerto(orchardId)
const ocupada = ref('')
const error = ref('')

async function aceptar(inv) {
  ocupada.value = inv.id
  error.value = ''
  try {
    await aceptarInvitacion(inv, user.value.uid)
    await esperarHuerto(inv.orchardId)
    router.push(`/orchard/${inv.orchardId}`)
  } catch (e) {
    error.value = 'No se pudo aceptar: puede que el huerto ya no exista o que la invitación se haya cancelado.'
    console.error(e)
  } finally {
    ocupada.value = ''
  }
}

async function rechazar(inv) {
  ocupada.value = inv.id
  error.value = ''
  try {
    await rechazarInvitacion(inv)
  } catch (e) {
    error.value = 'No se pudo rechazar la invitación.'
    console.error(e)
  } finally {
    ocupada.value = ''
  }
}
</script>

<style scoped>
.page-head {
  margin-bottom: 22px;
}
.page-head h1 {
  margin: 0;
}
.sub {
  color: var(--color-text-soft);
  margin: 4px 0 0;
}
.list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-width: 720px;
}
.card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  padding: 18px 20px;
  margin-bottom: 12px;
}
.info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
}
.role {
  margin-top: 4px;
  background: var(--color-primary-soft);
  color: var(--color-primary-dark);
  font-size: 0.76rem;
  font-weight: 600;
  padding: 2px 9px;
  border-radius: 999px;
}
.actions {
  display: flex;
  gap: 8px;
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
.ghost {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-soft);
  padding: 9px 16px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
}
.primary:disabled,
.ghost:disabled {
  opacity: 0.55;
  cursor: default;
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
</style>
