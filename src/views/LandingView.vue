<template>
  <div class="landing">
    <header class="nav">
      <div class="brand">GrowHub 🌱</div>
      <div class="nav-actions">
        <router-link to="/login" class="btn-ghost">Iniciar sesión</router-link>
        <router-link to="/register" class="btn-solid">Registrarse</router-link>
      </div>
    </header>

    <section class="hero">
      <div class="hero-inner">
        <span class="eyebrow">🌿 Gestión inteligente de huertos</span>
        <h1>Cultiva mejor con <span>GrowHub</span></h1>
        <p class="tagline">
          Controla tus huertos, cultivos y sensores desde un solo lugar.
          Datos en tiempo real, tareas de riego y un cuaderno de campo colaborativo.
        </p>
        <div class="hero-cta">
          <router-link to="/register" class="btn-solid big">Empezar gratis</router-link>
          <router-link to="/login" class="btn-ghost big">Ya tengo cuenta</router-link>
        </div>
      </div>
      <div class="hero-blob"></div>
    </section>

    <section class="features">
      <article class="feature">
        <span class="f-ic" style="--bg:#e0f2fe">🌱</span>
        <h3>Gestión de huertos</h3>
        <p>Organiza tus huertos y cultivos, con ubicación en el mapa y fichas detalladas.</p>
      </article>
      <article class="feature">
        <span class="f-ic" style="--bg:#dcfce7">📡</span>
        <h3>Sensores en tiempo real</h3>
        <p>Temperatura, humedad y luz con histórico y gráficas claras de cada sensor.</p>
      </article>
      <article class="feature">
        <span class="f-ic" style="--bg:#fef3c7">✅</span>
        <h3>Tareas de riego</h3>
        <p>Planifica el riego, marca tareas completadas y no te pierdas nada.</p>
      </article>
      <article class="feature">
        <span class="f-ic" style="--bg:#ede9fe">📖</span>
        <h3>Cuaderno de campo</h3>
        <p>Comparte actualizaciones, notas y fotos con tu equipo o tu comunidad.</p>
      </article>
    </section>

    <section class="cta-band">
      <h2>¿Listo para empezar?</h2>
      <p>Crea tu cuenta y registra tu primer huerto en menos de un minuto.</p>
      <router-link to="/register" class="btn-solid big">Crear mi cuenta</router-link>
    </section>

    <footer class="foot">
      <p>© 2026 GrowHub · Gestión inteligente de huertos</p>
    </footer>
  </div>
</template>

<script setup>
// Página pública de entrada. Los usuarios ya logueados se redirigen al
// dashboard desde el guard del router.
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
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--color-text);
}
.nav-actions {
  display: flex;
  gap: 10px;
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
  position: relative;
  max-width: 1120px;
  margin: 0 auto;
  padding: 72px 28px 60px;
  overflow: hidden;
}
.hero-inner {
  position: relative;
  z-index: 2;
  max-width: 640px;
}
.eyebrow {
  display: inline-block;
  background: var(--color-primary-soft);
  color: var(--color-primary-dark);
  font-weight: 600;
  font-size: 0.85rem;
  padding: 6px 14px;
  border-radius: 999px;
}
.hero h1 {
  font-size: 3rem;
  margin: 18px 0 14px;
  line-height: 1.1;
}
.hero h1 span {
  color: var(--color-primary);
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
.hero-blob {
  position: absolute;
  top: -80px;
  right: -120px;
  width: 460px;
  height: 460px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #bae6fd, transparent 70%),
    radial-gradient(circle at 70% 70%, #bbf7d0, transparent 70%);
  filter: blur(10px);
  opacity: 0.8;
  z-index: 1;
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
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 26px;
}
.f-ic {
  display: inline-flex;
  width: 52px;
  height: 52px;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  background: var(--bg);
  font-size: 1.5rem;
  margin-bottom: 14px;
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
  background: linear-gradient(120deg, var(--color-primary), var(--color-secondary));
  color: #fff;
  text-align: center;
  padding: 56px 28px;
}
.cta-band h2 {
  margin: 0 0 8px;
  font-size: 1.8rem;
}
.cta-band p {
  margin: 0 0 22px;
  color: #e0f2fe;
}
.cta-band .btn-solid {
  background: #fff;
  color: var(--color-primary-dark);
}
.foot {
  text-align: center;
  padding: 26px;
  color: var(--color-text-soft);
  font-size: 0.88rem;
}
@media (max-width: 640px) {
  .hero h1 {
    font-size: 2.2rem;
  }
}
</style>
