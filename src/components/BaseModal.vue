<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card">
      <header class="modal-head">
        <h2>{{ title }}</h2>
        <button class="modal-x" @click="$emit('close')" aria-label="Cerrar">✕</button>
      </header>
      <div class="modal-body">
        <slot />
      </div>
      <footer v-if="$slots.footer" class="modal-foot">
        <slot name="footer" />
      </footer>
    </div>
  </div>
</template>

<script setup>
defineProps({ title: { type: String, default: '' } })
defineEmits(['close'])
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 200;
}
.modal-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-hover);
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 24px 0;
}
.modal-head h2 {
  margin: 0;
  font-size: 1.35rem;
}
.modal-x {
  background: transparent;
  border: none;
  color: var(--color-text-soft);
  font-size: 1.05rem;
  cursor: pointer;
}
.modal-x:hover {
  color: var(--color-text);
}
.modal-body {
  padding: 18px 24px;
  overflow-y: auto;
}
.modal-foot {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--color-border-soft);
}
</style>
