// Foto genérica de huerto: pantallas de acceso y huertos sin foto ni cultivos.
export const FOTO_HUERTO = {
  url: '/huerto.jpg',
  autor: 'Angela Llop',
  licencia: 'CC BY-SA 2.0',
  licenciaUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
  pagina: 'https://commons.wikimedia.org/wiki/File:Horts_de_Torrelles_de_Foix.jpg',
}

// Momento de alta del cultivo; lo recién creado (aún sin hora del servidor) va al final.
const alta = (c) => c.createdAt?.toMillis?.() ?? Number.MAX_SAFE_INTEGER

// Foto que se muestra de un huerto: la que ha subido el usuario; si no hay, la
// del cultivo más antiguo que tenga foto; y si tampoco, la genérica. `url` sirve
// además de reserva por si la foto guardada no se puede cargar.
export function fotoDeHuerto(huerto, cultivos = []) {
  if (huerto?.fotoId || huerto?.imagen) {
    return {
      origen: 'propia',
      orchardId: huerto.id,
      fotoId: huerto.fotoId || '',
      url: huerto.imagen || FOTO_HUERTO.url,
    }
  }
  const primero = cultivos.filter((c) => c.fotoId || c.foto).sort((a, b) => alta(a) - alta(b))[0]
  if (primero) {
    return {
      origen: 'cultivo',
      cultivo: primero.nombre,
      orchardId: huerto?.id || '',
      fotoId: primero.fotoId || '',
      url: primero.foto || FOTO_HUERTO.url,
    }
  }
  return { origen: 'generica', orchardId: '', fotoId: '', url: FOTO_HUERTO.url }
}
