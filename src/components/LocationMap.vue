<template>
  <div ref="el" class="map"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

// Arregla las rutas de los iconos por defecto (se rompen con bundlers como Vite).
const defaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const props = defineProps({
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  editable: { type: Boolean, default: false },
  zoom: { type: Number, default: 13 },
})
const emit = defineEmits(['update'])

// Centro por defecto: Salamanca (USAL), si no hay coordenadas todavía.
const DEFAULT_CENTER = [40.9701, -5.6635]

const el = ref(null)
let map = null
let marker = null

function setMarker(lat, lng) {
  if (marker) {
    marker.setLatLng([lat, lng])
  } else {
    marker = L.marker([lat, lng], { icon: defaultIcon }).addTo(map)
  }
}

onMounted(() => {
  const hasCoords = props.lat != null && props.lng != null
  const center = hasCoords ? [props.lat, props.lng] : DEFAULT_CENTER
  map = L.map(el.value).setView(center, props.zoom)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map)

  if (hasCoords) setMarker(props.lat, props.lng)

  if (props.editable) {
    map.on('click', (e) => {
      setMarker(e.latlng.lat, e.latlng.lng)
      emit('update', { lat: e.latlng.lat, lng: e.latlng.lng })
    })
  }

  // Leaflet necesita recalcular tamaño cuando el contenedor ya está visible.
  setTimeout(() => map.invalidateSize(), 100)
})

// Si las coordenadas cambian desde fuera, recoloca el marcador.
watch(
  () => [props.lat, props.lng],
  ([lat, lng]) => {
    if (map && lat != null && lng != null) {
      setMarker(lat, lng)
      map.setView([lat, lng])
    }
  },
)

onBeforeUnmount(() => map?.remove())
</script>

<style scoped>
.map {
  height: 320px;
  width: 100%;
  border-radius: 10px;
  z-index: 0;
}
</style>
