<template>
  <div>
    <h1>🌱 Mis huertos</h1>

    <input v-model="nombre" placeholder="Nombre del huerto" />
    <input v-model="descripcion" placeholder="Descripción del huerto" />

    <button @click="crearHuerto">Crear huerto</button>

    <ul>
      <li v-for="h in huertos" :key="h.id">
        <strong>{{ h.nombre }}</strong>
        <p>{{ h.descripcion }}</p>

        <button @click="eliminarHuerto(h.id)">Eliminar</button>
      </li>
    </ul>

    <button @click="$router.push('/dashboard')">⬅ Volver</button>
  </div>
</template>

<script>
import { createHuerto, getHuertos, deleteHuerto } from '../services/firestoreService'

export default {
  data() {
    return {
      nombre: '',
      descripcion: '',
      huertos: []
    }
  },
  methods: {
    async crearHuerto() {
      if (!this.nombre || !this.descripcion) {
        alert("Completa todos los campos")
        return
      }

      await createHuerto(this.nombre, this.descripcion)

      this.nombre = ''
      this.descripcion = ''

      this.cargarHuertos()
    },

    async cargarHuertos() {
      this.huertos = await getHuertos()
    },
    async eliminarHuerto(id) {
      if (confirm("¿Seguro que quieres eliminar este huerto?")) {
      await deleteHuerto(id)
      this.cargarHuertos()
     }
    }
  },  

  mounted() {
    this.cargarHuertos()
  }
}
</script>