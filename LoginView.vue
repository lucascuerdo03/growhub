<template>
  <div class="login-container">
    
    <!-- LADO IZQUIERDO (IMAGEN) -->
    <div class="login-image"></div>

    <!-- LADO DERECHO (FORMULARIO) -->
    <div class="login-card">
      <h1>🌱 GrowHub</h1>
      <p>Gestión inteligente de huertos</p>

      <input v-model="email" placeholder="Email" />
      <input v-model="password" type="password" placeholder="Contraseña" />

      <button @click="login">Iniciar sesión</button>
      <button @click="register" class="secondary">Crear cuenta</button>
    </div>

  </div>
</template>

<script>
import { loginUser, registerUser } from '../services/authService'

export default {
  data() {
    return {
      email: '',
      password: ''
    }
  },
  methods: {
    async login() {
      try {
        await loginUser(this.email, this.password)
        this.$router.push('/dashboard')
      } catch (error) {
        alert(error.message)
      }
    },
    async register() {
      try {
        await registerUser(this.email, this.password)
        alert("Usuario creado")
      } catch (error) {
        alert(error.message)
      }
    }
  }
}
</script>

<style>
.login-container {
  display: flex;
  height: 100vh;
}

/* IMAGEN */
.login-image {
  flex: 1;
  background: url('https://images.unsplash.com/photo-1464226184884-fa280b87c399') center/cover no-repeat;
}

/* FORMULARIO */
.login-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 40px;
  background: #f5f5f5;
}

.login-card h1 {
  font-size: 32px;
  margin-bottom: 10px;
}

.login-card p {
  margin-bottom: 20px;
  color: gray;
}

input {
  padding: 12px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
}

button {
  padding: 12px;
  margin-top: 10px;
  background: #4CAF50;
  color: white;
  border: none;
  cursor: pointer;
  border-radius: 6px;
}

button.secondary {
  background: #2196F3;
}
</style>