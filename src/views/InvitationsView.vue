<template>
  <div>
    <header class="page-head">
      <h1>Invitaciones</h1>
      <p class="sub">Huertos que otras personas quieren compartir contigo.</p>
    </header>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="errorCarga" class="error">No se pudieron cargar las invitaciones.</p>
    <p v-else-if="!invitaciones.length" class="muted">No tienes invitaciones pendientes.</p>

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
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useInvitaciones } from '../composables/useInvitaciones'
import { aceptarInvitacion, rechazarInvitacion } from '../services/firestoreService'
import { nombreRol } from '../utils/permissions'

const router = useRouter()
const { user } = useAuth()
const { invitaciones, error: errorCarga } = useInvitaciones()
const ocupada = ref('')
const error = ref('')

async function aceptar(inv) {
  ocupada.value = inv.id
  error.value = ''
  try {
    await aceptarInvitacion(inv, user.value.uid)
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
