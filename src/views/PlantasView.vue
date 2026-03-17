<template>
  <div>
    <h1>Gestión de Plantas</h1>

    <input v-model="nuevaPlanta" placeholder="Nombre de la planta">
    <button @click="agregarPlanta">Agregar</button>

    <ul>
      <li v-for="planta in plantas" :key="planta">
        {{ planta }}
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  data() {
    return {
      nuevaPlanta: "",
      plantas: []
    }
  },
  methods: {
    agregarPlanta() {
      if (this.nuevaPlanta !== "") {
        this.plantas.push(this.nuevaPlanta)
        this.nuevaPlanta = ""
      }
    }
  }
}
</script>
