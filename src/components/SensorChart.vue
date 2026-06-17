<template>
  <div class="chart-wrap">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler,
} from 'chart.js'

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler,
)

const props = defineProps({
  // [{ valor, createdAt }] en orden cronológico ascendente
  lecturas: { type: Array, default: () => [] },
  label: { type: String, default: 'Valor' },
  color: { type: String, default: '#4a90d9' },
})

const canvas = ref(null)
let chart = null

function fmtTime(r) {
  const d = r.createdAt?.toDate ? r.createdAt.toDate() : new Date()
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function build() {
  if (!canvas.value) return
  const data = {
    labels: props.lecturas.map(fmtTime),
    datasets: [
      {
        label: props.label,
        data: props.lecturas.map((r) => r.valor),
        borderColor: props.color,
        backgroundColor: props.color + '22',
        fill: true,
        tension: 0.3,
        pointRadius: 2,
      },
    ],
  }
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: false } },
  }
  if (chart) {
    chart.data = data
    chart.update()
  } else {
    chart = new Chart(canvas.value, { type: 'line', data, options })
  }
}

onMounted(build)
watch(() => props.lecturas, build, { deep: true })
onBeforeUnmount(() => chart?.destroy())
</script>

<style scoped>
.chart-wrap {
  position: relative;
  height: 220px;
  width: 100%;
}
</style>
