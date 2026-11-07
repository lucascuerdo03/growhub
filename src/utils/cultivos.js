import { entradaDeCultivo, MESES_LARGOS } from '../data/cropsLibrary'
import { diasEntre, hoyISO, mesActual } from './fechas'

export const ETAPAS = {
  'sin-fecha': 'Sin fecha de siembra',
  sembrado: 'Sembrado',
  creciendo: 'Creciendo',
  listo: 'Listo para cosechar',
}

// Días hasta la cosecha: los de la biblioteca o, en un cultivo personalizado, los
// que haya indicado el usuario.
function diasHastaCosecha(cultivo, entrada) {
  if (entrada) return Math.round((entrada.diasCosecha[0] + entrada.diasCosecha[1]) / 2)
  return Number(cultivo.diasCosecha) > 0 ? Number(cultivo.diasCosecha) : null
}

// Próximo mes de cosecha, para las plantas perennes que ya producen.
function proximoMesCosecha(entrada, mes) {
  for (let i = 1; i <= 12; i++) {
    const m = ((mes - 1 + i) % 12) + 1
    if (entrada.cosecha.includes(m)) return MESES_LARGOS[m - 1]
  }
  return ''
}

// Etapa y progreso de un cultivo según su fecha de siembra.
// { etapa, pct (0-100, o null si no se puede calcular), texto }
export function estadoCultivo(cultivo, hoy = hoyISO(), mes = mesActual()) {
  const entrada = entradaDeCultivo(cultivo)
  if (!cultivo?.fechaSiembra) {
    return { etapa: 'sin-fecha', pct: null, restantes: null, texto: ETAPAS['sin-fecha'] }
  }
  const total = diasHastaCosecha(cultivo, entrada)
  const pasados = Math.max(0, diasEntre(cultivo.fechaSiembra, hoy))
  if (!total) {
    const etapa = pasados < 14 ? 'sembrado' : 'creciendo'
    return { etapa, pct: null, restantes: null, texto: `Sembrado hace ${pasados} ${pasados === 1 ? 'día' : 'días'}` }
  }
  const pct = Math.min(100, Math.round((pasados / total) * 100))
  const restantes = total - pasados
  if (restantes > 0) {
    const anos = restantes >= 365 ? Math.round((restantes / 365) * 10) / 10 : null
    return {
      etapa: pct < 20 ? 'sembrado' : 'creciendo',
      pct,
      restantes,
      texto: anos ? `Faltan ${String(anos).replace('.', ',')} años` : `Faltan ${restantes} ${restantes === 1 ? 'día' : 'días'}`,
    }
  }
  // Una perenne ya adulta solo está lista en sus meses de cosecha.
  if (entrada?.perenne && !entrada.cosecha.includes(mes)) {
    // Sin días restantes concretos: en "Próximas cosechas" va detrás de las anuales.
    return { etapa: 'creciendo', pct: 100, restantes: Infinity, texto: `Próxima cosecha en ${proximoMesCosecha(entrada, mes)}` }
  }
  return { etapa: 'listo', pct: 100, restantes: 0, texto: ETAPAS.listo }
}
