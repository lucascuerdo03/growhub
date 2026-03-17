<template>
  <div>
    <h1>Gestión de Huertos</h1>

    <input v-model="nuevoHuerto" placeholder="Nombre del huerto">
    <button @click="agregarHuerto">Agregar</button>

    <ul>
      <li v-for="huerto in huertos" :key="huerto">
        {{ huerto }}
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  data() {
    return {
      nuevoHuerto: '',
      huertos: []
    }
  },
  methods: {
    agregarHuerto() {
      if (this.nuevoHuerto !== '') {
        this.huertos.push(this.nuevoHuerto)
        this.nuevoHuerto = ''
      }
    }
  }
}
</script>