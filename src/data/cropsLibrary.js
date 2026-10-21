// Biblioteca local de cultivos comunes en España.
// Cada cultivo incluye ficha básica para mostrar y para prerrellenar al
// añadirlo a un huerto. `emoji` se usa como imagen/placeholder visual.
export const CROPS_LIBRARY = [
  { id: 'tomate', nombre: 'Tomate', emoji: '🍅', familia: 'Solanáceas', epocaSiembra: 'Febrero – Mayo', riego: 'Frecuente, suelo húmedo', tempIdeal: '20–28 °C', plagas: 'Mosca blanca, pulgón, tuta', tiempoCosecha: '70–90 días' },
  { id: 'lechuga', nombre: 'Lechuga', emoji: '🥬', familia: 'Asteráceas', epocaSiembra: 'Todo el año', riego: 'Ligero y constante', tempIdeal: '15–20 °C', plagas: 'Pulgón, caracoles, mildiu', tiempoCosecha: '40–60 días' },
  { id: 'pimiento', nombre: 'Pimiento', emoji: '🫑', familia: 'Solanáceas', epocaSiembra: 'Febrero – Abril', riego: 'Regular, sin encharcar', tempIdeal: '20–28 °C', plagas: 'Pulgón, araña roja, oídio', tiempoCosecha: '80–110 días' },
  { id: 'cebolla', nombre: 'Cebolla', emoji: '🧅', familia: 'Amarilidáceas', epocaSiembra: 'Septiembre – Febrero', riego: 'Moderado, reducir al final', tempIdeal: '13–24 °C', plagas: 'Mosca de la cebolla, mildiu', tiempoCosecha: '120–150 días' },
  { id: 'zanahoria', nombre: 'Zanahoria', emoji: '🥕', familia: 'Apiáceas', epocaSiembra: 'Marzo – Julio', riego: 'Constante y uniforme', tempIdeal: '15–21 °C', plagas: 'Mosca de la zanahoria', tiempoCosecha: '70–100 días' },
  { id: 'calabacin', nombre: 'Calabacín', emoji: '🥒', familia: 'Cucurbitáceas', epocaSiembra: 'Abril – Junio', riego: 'Abundante y frecuente', tempIdeal: '18–25 °C', plagas: 'Oídio, mosca blanca', tiempoCosecha: '45–60 días' },
  { id: 'pepino', nombre: 'Pepino', emoji: '🥒', familia: 'Cucurbitáceas', epocaSiembra: 'Abril – Junio', riego: 'Frecuente, suelo húmedo', tempIdeal: '20–28 °C', plagas: 'Araña roja, oídio', tiempoCosecha: '50–70 días' },
  { id: 'berenjena', nombre: 'Berenjena', emoji: '🍆', familia: 'Solanáceas', epocaSiembra: 'Febrero – Abril', riego: 'Regular y abundante', tempIdeal: '22–30 °C', plagas: 'Escarabajo, araña roja', tiempoCosecha: '90–120 días' },
  { id: 'patata', nombre: 'Patata', emoji: '🥔', familia: 'Solanáceas', epocaSiembra: 'Febrero – Abril', riego: 'Moderado y regular', tempIdeal: '15–20 °C', plagas: 'Escarabajo de la patata, mildiu', tiempoCosecha: '90–120 días' },
  { id: 'ajo', nombre: 'Ajo', emoji: '🧄', familia: 'Amarilidáceas', epocaSiembra: 'Octubre – Diciembre', riego: 'Escaso', tempIdeal: '13–24 °C', plagas: 'Roya, nematodos', tiempoCosecha: '150–180 días' },
  { id: 'espinaca', nombre: 'Espinaca', emoji: '🥬', familia: 'Amarantáceas', epocaSiembra: 'Septiembre – Marzo', riego: 'Frecuente y ligero', tempIdeal: '10–18 °C', plagas: 'Mildiu, pulgón', tiempoCosecha: '40–50 días' },
  { id: 'acelga', nombre: 'Acelga', emoji: '🥬', familia: 'Amarantáceas', epocaSiembra: 'Todo el año', riego: 'Regular', tempIdeal: '15–22 °C', plagas: 'Pulgón, caracoles', tiempoCosecha: '50–70 días' },
  { id: 'brocoli', nombre: 'Brócoli', emoji: '🥦', familia: 'Brasicáceas', epocaSiembra: 'Julio – Septiembre', riego: 'Constante', tempIdeal: '15–20 °C', plagas: 'Oruga de la col, pulgón', tiempoCosecha: '80–100 días' },
  { id: 'coliflor', nombre: 'Coliflor', emoji: '🥦', familia: 'Brasicáceas', epocaSiembra: 'Junio – Agosto', riego: 'Abundante y regular', tempIdeal: '15–20 °C', plagas: 'Oruga de la col, mildiu', tiempoCosecha: '90–120 días' },
  { id: 'judia', nombre: 'Judía verde', emoji: '🫘', familia: 'Fabáceas', epocaSiembra: 'Abril – Julio', riego: 'Regular, sin encharcar', tempIdeal: '18–27 °C', plagas: 'Araña roja, mosca blanca', tiempoCosecha: '60–80 días' },
  { id: 'guisante', nombre: 'Guisante', emoji: '🫛', familia: 'Fabáceas', epocaSiembra: 'Octubre – Febrero', riego: 'Moderado', tempIdeal: '13–18 °C', plagas: 'Pulgón, oídio', tiempoCosecha: '90–110 días' },
  { id: 'fresa', nombre: 'Fresa', emoji: '🍓', familia: 'Rosáceas', epocaSiembra: 'Septiembre – Noviembre', riego: 'Frecuente y ligero', tempIdeal: '15–22 °C', plagas: 'Araña roja, botritis', tiempoCosecha: '90–120 días' },
  { id: 'maiz', nombre: 'Maíz', emoji: '🌽', familia: 'Poáceas', epocaSiembra: 'Abril – Junio', riego: 'Abundante', tempIdeal: '20–30 °C', plagas: 'Taladro, pulgón', tiempoCosecha: '90–120 días' },
  { id: 'calabaza', nombre: 'Calabaza', emoji: '🎃', familia: 'Cucurbitáceas', epocaSiembra: 'Abril – Junio', riego: 'Abundante', tempIdeal: '20–28 °C', plagas: 'Oídio, mosca blanca', tiempoCosecha: '100–140 días' },
  { id: 'rabano', nombre: 'Rábano', emoji: '🔴', familia: 'Brasicáceas', epocaSiembra: 'Todo el año', riego: 'Ligero y frecuente', tempIdeal: '10–18 °C', plagas: 'Pulguilla, oruga', tiempoCosecha: '25–40 días' },
  { id: 'puerro', nombre: 'Puerro', emoji: '🥬', familia: 'Amarilidáceas', epocaSiembra: 'Febrero – Mayo', riego: 'Regular', tempIdeal: '13–24 °C', plagas: 'Mosca del puerro, roya', tiempoCosecha: '120–150 días' },
  { id: 'perejil', nombre: 'Perejil', emoji: '🌿', familia: 'Apiáceas', epocaSiembra: 'Marzo – Septiembre', riego: 'Regular', tempIdeal: '15–22 °C', plagas: 'Pulgón, mildiu', tiempoCosecha: '70–90 días' },
  { id: 'albahaca', nombre: 'Albahaca', emoji: '🌿', familia: 'Lamiáceas', epocaSiembra: 'Abril – Junio', riego: 'Frecuente, suelo húmedo', tempIdeal: '20–28 °C', plagas: 'Pulgón, botritis', tiempoCosecha: '50–70 días' },
  { id: 'sandia', nombre: 'Sandía', emoji: '🍉', familia: 'Cucurbitáceas', epocaSiembra: 'Abril – Mayo', riego: 'Abundante, reducir al madurar', tempIdeal: '22–30 °C', plagas: 'Oídio, mosca blanca', tiempoCosecha: '80–110 días' },
]
