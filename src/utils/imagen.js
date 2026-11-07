// Prepara una imagen del dispositivo para guardarla en Firestore (plan Spark,
// sin Storage): la redimensiona y comprime en el navegador hasta que quepa en
// un documento. Firestore admite 1 MiB por documento y el base64 ocupa un 33 %
// más que el binario, de ahí el límite de 700 KB.
const LADO_MAX = 1280
const CALIDAD_INICIAL = 0.7
const CALIDAD_MIN = 0.4
export const BYTES_MAX = 700 * 1024

// Tamaño en bytes del binario que representa un data URL en base64.
export const bytesDeDataUrl = (dataUrl) =>
  Math.ceil(((dataUrl.length - dataUrl.indexOf(',') - 1) * 3) / 4)

function cargarImagen(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo leer la imagen. Prueba con otro archivo.'))
    }
    img.src = url
  })
}

function dibujar(img, ladoMax) {
  const escala = Math.min(1, ladoMax / Math.max(img.naturalWidth, img.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(img.naturalWidth * escala))
  canvas.height = Math.max(1, Math.round(img.naturalHeight * escala))
  const ctx = canvas.getContext('2d')
  // JPEG no tiene transparencia: sin fondo, un PNG transparente saldría negro.
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas
}

// Devuelve un data URL JPEG de como máximo BYTES_MAX. Baja primero la calidad
// y, si no basta, también el tamaño.
export async function comprimirImagen(file, { ladoMax = LADO_MAX, bytesMax = BYTES_MAX } = {}) {
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo seleccionado no es una imagen.')
  }
  const img = await cargarImagen(file)
  let lado = ladoMax
  while (lado >= Math.min(320, ladoMax)) {
    const canvas = dibujar(img, lado)
    for (let calidad = CALIDAD_INICIAL; calidad >= CALIDAD_MIN; calidad -= 0.1) {
      const dataUrl = canvas.toDataURL('image/jpeg', calidad)
      if (bytesDeDataUrl(dataUrl) <= bytesMax) return dataUrl
    }
    lado = Math.round(lado * 0.75)
  }
  throw new Error('La imagen es demasiado grande. Prueba con otra.')
}
