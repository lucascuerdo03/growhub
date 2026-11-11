<template>
  <div class="landing">
    <header class="nav">
      <div class="brand">GrowHub</div>
      <div v-if="conSesion" class="nav-actions">
        <router-link to="/dashboard" class="btn-solid">Ir a mi panel</router-link>
      </div>
      <div v-else class="nav-actions">
        <router-link to="/login" class="btn-ghost">Iniciar sesión</router-link>
        <router-link to="/register" class="btn-solid">Registrarse</router-link>
      </div>
    </header>

    <section class="hero">
      <div class="hero-inner">
        <h1>Tu huerto, al día</h1>
        <p class="tagline">
          Qué regar hoy, qué está a punto de cosecharse y qué toca sembrar este mes. Comparte el
          huerto con quien lo trabaja contigo y consulta más de cien cultivos con su calendario para España.
        </p>
        <div v-if="conSesion" class="hero-cta">
          <router-link to="/dashboard" class="btn-solid big">Ir a mi panel</router-link>
        </div>
        <div v-else class="hero-cta">
          <router-link to="/register" class="btn-solid big">Crear cuenta</router-link>
          <router-link to="/login" class="btn-ghost big">Iniciar sesión</router-link>
        </div>
      </div>
      <div class="hero-fotos" aria-hidden="true">
        <img v-for="f in FOTOS" :key="f" :src="f" alt="" width="800" height="600" />
      </div>
    </section>

    <section class="features">
      <article class="feature">
        <span class="f-ic"><Sprout :size="22" /></span>
        <h3>Gestión de huertos</h3>
        <p>Tus huertos y cultivos, con la etapa de cada planta y lo que le falta para la cosecha.</p>
      </article>
      <article class="feature">
        <span class="f-ic"><Radio :size="22" /></span>
        <h3>Sensores</h3>
        <p>Temperatura, humedad del suelo y luz de cada planta, con su histórico.</p>
      </article>
      <article class="feature">
        <span class="f-ic"><ListChecks :size="22" /></span>
        <h3>Tareas del día</h3>
        <p>Riego, abonado y cosecha, con aviso si se prevé lluvia en tu huerto.</p>
      </article>
      <article class="feature">
        <span class="f-ic"><BookOpen :size="22" /></span>
        <h3>Cuaderno de campo</h3>
        <p>Registra actualizaciones, notas y fotos de cada huerto.</p>
      </article>
    </section>

    <section v-if="!conSesion" class="cta-band">
      <h2>¿Listo para empezar?</h2>
      <p>Crea tu cuenta y registra tu primer huerto en menos de un minuto.</p>
      <router-link to="/register" class="btn-solid big">Crear mi cuenta</router-link>
    </section>

    <footer class="foot">
      <p>© 2026 GrowHub</p>
    </footer>
  </div>
</template>

<script setup>
// Página pública de entrada.
import { computed } from 'vue'
import { Sprout, Radio, ListChecks, BookOpen } from 'lucide-vue-next'
import { useAuth } from '../composables/useAuth'

// Con sesión solo se llega aquí con "atrás" desde la app (ver el guard del router).
const { user } = useAuth()
const conSesion = computed(() => !!user.value?.emailVerified)

const FOTOS = ['/biblioteca/tomate-corazon.jpg', '/biblioteca/berenjena-listada.jpg', '/biblioteca/lechuga-roble.jpg']
</script>

<style scoped>
.landing {
  min-height: 100vh;
  background: var(--color-bg);
}
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 28px;
  max-width: 1120px;
  margin: 0 auto;
}
.brand {
  font-family: var(--font-titulos);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-verde-oscuro);
}
.nav-actions {
  display: flex;
  gap: 8px;
}
.nav-actions a {
  white-space: nowrap;
}
.btn-ghost {
  color: var(--color-text);
  text-decoration: none;
  font-weight: 600;
  padding: 9px 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}
.btn-ghost:hover {
  background: var(--color-surface);
}
.btn-solid {
  background: var(--color-primary);
  color: #fff;
  text-decoration: none;
  font-weight: 700;
  padding: 9px 18px;
  border-radius: var(--radius-sm);
}
.btn-solid:hover {
  background: var(--color-primary-dark);
}
.big {
  padding: 13px 26px;
  font-size: 1.02rem;
}
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  gap: 40px;
  align-items: center;
  max-width: 1120px;
  margin: 0 auto;
  padding: 40px 28px 56px;
}
.hero-inner {
  min-width: 0;
}
.hero-fotos {
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 8px;
  min-width: 0;
}
.hero-fotos img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--radius-sm);
  background: var(--color-tierra-suave);
}
.hero-fotos img:first-child {
  grid-row: span 2;
}
.hero h1 {
  font-size: 3.4rem;
  margin: 0 0 14px;
  line-height: 1.1;
}
.tagline {
  font-size: 1.15rem;
  color: var(--color-text-soft);
  margin: 0 0 28px;
}
.hero-cta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.features {
  max-width: 1120px;
  margin: 0 auto;
  padding: 20px 28px 60px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 22px;
}
.feature {
  padding: 4px 0;
}
.f-ic {
  display: inline-flex;
  color: var(--color-verde-oscuro);
  margin-bottom: 8px;
}
.feature h3 {
  margin: 0 0 6px;
}
.feature p {
  margin: 0;
  color: var(--color-text-soft);
  font-size: 0.92rem;
}
.cta-band {
  background: var(--color-primary);
  color: #fff;
  text-align: center;
  padding: 56px 28px;
}
.cta-band h2 {
  margin: 0 0 8px;
  font-size: 1.8rem;
  color: #fff;
}
.cta-band p {
  margin: 0 0 22px;
  color: #eaf6ff;
}
.cta-band .btn-solid {
  background: #fff;
  color: var(--color-primary-dark);
}
.cta-band .btn-solid:hover {
  background: #eaf6ff;
}
.foot {
  text-align: center;
  padding: 26px;
  color: var(--color-text-soft);
  font-size: 0.88rem;
}
@media (max-width: 520px) {
  .nav {
    padding: 14px 16px;
  }
  .brand {
    font-size: 1.25rem;
  }
  .nav-actions a {
    padding: 8px 11px;
    font-size: 0.88rem;
  }
}
@media (max-width: 760px) {
  .hero {
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
    padding-top: 20px;
  }
  .hero h1 {
    font-size: 2.5rem;
  }
  .hero-fotos {
    aspect-ratio: 16 / 10;
  }
}
</style>
