<template>
  <div class="layout">

    <aside class="sidebar">
      <h2>GrowHub 🌱</h2>

      <router-link to="/dashboard">Dashboard</router-link>
      <router-link to="/huertos">Huertos</router-link>
      <router-link to="/plantas">Plantas</router-link>
      <router-link to="/sensores">Sensores</router-link>
    </aside>

    <main class="content">
      <router-view />
    </main>

  </div>
</template>

<style>

.layout {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 220px;
  background: #2f3e46;
  color: white;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.sidebar a {
  color: white;
  margin: 10px 0;
  text-decoration: none;
}

.sidebar a:hover {
  color: #90dbf4;
}

.content {
  flex: 1;
  padding: 30px;
  background: #f5f7fa;
}

</style>
