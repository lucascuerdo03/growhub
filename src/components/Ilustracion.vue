<template>
  <svg class="ilustracion" viewBox="0 0 160 96" fill="none" aria-hidden="true">
    <!-- La tierra es común a todas: la línea del bancal. -->
    <path d="M8 80c24-5 46-5 72-1s48 4 72 0" stroke="var(--color-tierra)" stroke-width="2.5" stroke-linecap="round" />
    <path d="M24 88h22M66 90h34M116 88h18" stroke="var(--color-tierra)" stroke-width="2" stroke-linecap="round" opacity="0.5" />

    <g v-if="tipo === 'huerto'" stroke="var(--color-verde)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M40 78V58" /><path d="M40 62c-8 0-13-5-14-12 8 0 13 4 14 12z" /><path d="M40 58c1-8 6-12 14-13-1 8-6 13-14 13z" />
      <path d="M80 77V40" /><path d="M80 52c-11-1-17-8-18-18 11 1 17 8 18 18z" /><path d="M80 44c1-11 8-17 18-18-1 11-8 17-18 18z" />
      <path d="M120 78V60" /><path d="M120 64c-7 0-11-4-12-10 7 0 11 4 12 10z" /><path d="M120 60c1-7 5-11 12-12-1 7-5 12-12 12z" />
    </g>

    <g v-else-if="tipo === 'tareas'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5">
      <path d="M58 44h40v30H58z" stroke="var(--color-primary)" />
      <path d="M98 50l22-12M120 38l4 8M116 30l10 6" stroke="var(--color-primary)" />
      <path d="M58 52c-12-2-14-16-2-20 7-2 14 2 16 12" stroke="var(--color-primary)" />
      <path d="M128 50v4M134 56v4M124 60v4" stroke="var(--color-primary)" stroke-width="2" />
      <path d="M36 78V68" stroke="var(--color-verde)" /><path d="M36 70c-5 0-8-3-9-8 5 0 8 3 9 8z" stroke="var(--color-verde)" />
    </g>

    <g v-else-if="tipo === 'cuaderno'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5">
      <path d="M52 20h56v56H52z" stroke="var(--color-tierra-oscuro)" />
      <path d="M62 20v56" stroke="var(--color-tierra-oscuro)" />
      <path d="M72 34h26M72 44h20" stroke="var(--color-tierra)" stroke-width="2" />
      <path d="M86 68V56" stroke="var(--color-verde)" /><path d="M86 60c-5 0-8-3-9-7 5 0 8 3 9 7z" stroke="var(--color-verde)" /><path d="M86 57c1-5 4-8 9-8-1 5-4 8-9 8z" stroke="var(--color-verde)" />
    </g>

    <g v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5">
      <path d="M80 86V34" stroke="var(--color-primary)" />
      <path d="M70 22h20v12H70z" stroke="var(--color-primary)" />
      <path d="M96 20c5 3 5 13 0 16M104 14c9 6 9 22 0 28" stroke="var(--color-primary)" stroke-width="2" />
      <path d="M44 78V62" stroke="var(--color-verde)" /><path d="M44 66c-6 0-10-4-11-10 6 0 10 4 11 10z" stroke="var(--color-verde)" />
      <path d="M120 78V64" stroke="var(--color-verde)" /><path d="M120 67c5 0 8-3 9-8-5 0-8 3-9 8z" stroke="var(--color-verde)" />
    </g>
  </svg>
</template>

<script setup>
// Dibujos sencillos para los estados vacíos, con los colores de la app.
defineProps({ tipo: { type: String, default: 'huerto' } })
</script>

<style scoped>
.ilustracion {
  display: block;
  width: 140px;
  max-width: 100%;
  height: auto;
}
</style>
