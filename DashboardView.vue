<template>
  <div class="dashboard">

    <h1>🌱 Dashboard</h1>

    <div class="cards">
      <div class="card">
        <h2>🌿 Mis Huertos</h2>
        <p>Gestiona tus huertos fácilmente</p>
        <button @click="$router.push('/huertos')">Entrar</button>
      </div>

      <div class="card">
        <h2>🌼 Plantas</h2>
        <p>Consulta tus cultivos</p>
        <button @click="$router.push('/plantas')">Entrar</button>
      </div>

      <div class="card">
        <h2>📡 Sensores</h2>
        <p>Datos en tiempo real</p>
        <button @click="$router.push('/sensores')">Entrar</button>
      </div>
    </div>

  </div>
</template>

<style>
.dashboard {
  padding: 40px;
  background: #f0f2f5;
  min-height: 100vh;
}

.cards {
  display: flex;
  gap: 20px;
}

.card {
  background: white;
  padding: 20px;
  flex: 1;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  text-align: center;
}

.card h2 {
  margin-bottom: 10px;
}

.card p {
  color: gray;
  margin-bottom: 20px;
}

button {
  padding: 10px;
  background: #4CAF50;
  color: white;
  border: none;
  cursor: pointer;
  border-radius: 6px;
}
</style>