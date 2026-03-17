<template>
  <div class="login-container">

    <div class="login-card">

      <h1>GrowHub 🌱</h1>
      <p>Gestión inteligente de huertos</p>

      <input v-model="email" placeholder="Email">

      <input
        v-model="password"
        type="password"
        placeholder="Contraseña"
      >

      <button @click="login">
        Iniciar sesión
      </button>

    </div>

  </div>
</template>

<script>
export default {
  data() {
    return {
      email: '',
      password: ''
    }
  },
  methods: {
    login() {
      this.$router.push('/dashboard')
    }
  }
}
</script>

<style>

.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f4f6f8;
}

.login-card {
  background: white;
  padding: 40px;
  border-radius: 10px;
  width: 350px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  text-align: center;
}

.login-card h1 {
  margin-bottom: 10px;
}

.login-card p {
  color: gray;
  margin-bottom: 20px;
}

.login-card input {
  width: 100%;
  padding: 10px;
  margin: 8px 0;
}

.login-card button {
  width: 100%;
  padding: 10px;
  margin-top: 10px;
  background-color: #4CAF50;
  border: none;
  color: white;
  cursor: pointer;
}

.login-card button:hover {
  background-color: #45a049;
}

</style>