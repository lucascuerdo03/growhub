// Biblioteca de cultivos de huerto habituales en España.
//
// Los datos son orientativos, para clima mediterráneo-continental: en zonas frías
// conviene retrasar las siembras unas semanas y en zonas cálidas se pueden adelantar.
// Las asociaciones favorables y desfavorables siguen la práctica tradicional de
// huerto: son una guía, no una regla estricta.
//
// Las fotos y sus créditos vienen de cropsPhotos.json (ver scripts/verificar-fotos.mjs).
import FOTOS from './cropsPhotos.json'
import { frecuenciaDeRiego } from '../utils/tareas'

// Plagas y enfermedades, con un tratamiento ecológico.
const P = {
  pulgon: { nombre: 'Pulgón', tratamiento: 'Jabón potásico o aceite de neem; favorecer a las mariquitas' },
  aranaRoja: { nombre: 'Araña roja', tratamiento: 'Azufre mojable y mantener húmedo el ambiente' },
  moscaBlanca: { nombre: 'Mosca blanca', tratamiento: 'Trampas cromáticas amarillas y jabón potásico' },
  tuta: { nombre: 'Tuta absoluta', tratamiento: 'Bacillus thuringiensis y trampas de feromonas' },
  mildiu: { nombre: 'Mildiu', tratamiento: 'Caldo bordelés preventivo y evitar mojar las hojas' },
  oidio: { nombre: 'Oídio', tratamiento: 'Azufre mojable o bicarbonato potásico' },
  botritis: { nombre: 'Botritis', tratamiento: 'Ventilar, retirar partes afectadas y aplicar Trichoderma' },
  caracoles: { nombre: 'Caracoles y babosas', tratamiento: 'Fosfato férrico y barreras de ceniza' },
  orugas: { nombre: 'Orugas', tratamiento: 'Bacillus thuringiensis var. kurstaki' },
  pulguilla: { nombre: 'Pulguilla', tratamiento: 'Malla antiinsectos y mantener el suelo húmedo' },
  moscaCebolla: { nombre: 'Mosca de la cebolla', tratamiento: 'Malla antiinsectos y rotación de cultivos' },
  moscaZanahoria: { nombre: 'Mosca de la zanahoria', tratamiento: 'Malla antiinsectos y asociar con cebolla' },
  roya: { nombre: 'Roya', tratamiento: 'Azufre o purín de cola de caballo; retirar hojas afectadas' },
  nematodos: { nombre: 'Nematodos', tratamiento: 'Solarización del suelo y rotación con tagetes' },
  escarabajo: { nombre: 'Escarabajo de la patata', tratamiento: 'Retirada manual y Bacillus thuringiensis tenebrionis' },
  taladro: { nombre: 'Taladro', tratamiento: 'Bacillus thuringiensis y destruir los restos tras la cosecha' },
  gusanoAlambre: { nombre: 'Gusano de alambre', tratamiento: 'Rotación y trampas de patata enterradas' },
  trips: { nombre: 'Trips', tratamiento: 'Trampas cromáticas azules y jabón potásico' },
  fusarium: { nombre: 'Fusarium', tratamiento: 'Rotación larga, Trichoderma y evitar encharcar' },
  hernia: { nombre: 'Hernia de la col', tratamiento: 'Encalar suelos ácidos y rotación de al menos 4 años' },
  mariposaCol: { nombre: 'Mariposa de la col', tratamiento: 'Bacillus thuringiensis y malla antiinsectos' },
  cochinilla: { nombre: 'Cochinilla', tratamiento: 'Aceite de parafina y jabón potásico' },
  negrilla: { nombre: 'Negrilla', tratamiento: 'Controlar la cochinilla y lavar con jabón potásico' },
  moscaFruta: { nombre: 'Mosca de la fruta', tratamiento: 'Trampas de atracción y recoger la fruta caída' },
  carpocapsa: { nombre: 'Carpocapsa', tratamiento: 'Trampas de feromonas y virus de la granulosis' },
  lepra: { nombre: 'Lepra del melocotonero', tratamiento: 'Cobre en caída de hoja y al hinchar las yemas' },
  monilia: { nombre: 'Monilia', tratamiento: 'Retirar frutos momificados y cobre en invierno' },
  moteado: { nombre: 'Moteado', tratamiento: 'Cobre en invierno y variedades resistentes' },
  repilo: { nombre: 'Repilo', tratamiento: 'Cobre en primavera y otoño; podar para ventilar' },
  prays: { nombre: 'Polilla del olivo', tratamiento: 'Bacillus thuringiensis en floración' },
  mosquito: { nombre: 'Mosquito verde', tratamiento: 'Jabón potásico y aceite de neem' },
  drosophila: { nombre: 'Drosophila suzukii', tratamiento: 'Trampas de vinagre y cosechar a menudo' },
  pajaros: { nombre: 'Pájaros', tratamiento: 'Malla protectora durante la maduración' },
  minador: { nombre: 'Minador de hojas', tratamiento: 'Retirar hojas afectadas y aceite de neem' },
  gusanoGris: { nombre: 'Gusano gris', tratamiento: 'Bacillus thuringiensis y revisar el cuello de la planta' },
  podredumbre: { nombre: 'Podredumbre de raíz', tratamiento: 'Mejorar el drenaje y reducir el riego' },
}

// Datos comunes de cada especie. Los meses van de 1 (enero) a 12 (diciembre).
const ESPECIES = {
  tomate: { cultivo: 'Tomate', especie: 'Solanum lycopersicum', familia: 'Solanáceas', tipo: 'hortaliza', siembra: [2, 3, 4], trasplante: [4, 5], cosecha: [7, 8, 9, 10], diasCosecha: [75, 95], riego: 'Cada 2-3 días', notaRiego: 'Riego regular al pie; la irregularidad agrieta el fruto', sol: 'Pleno sol', tempIdeal: '20–28 °C', marco: '60 × 50 cm', dificultad: 'Media', plagas: ['tuta', 'mildiu', 'moscaBlanca', 'aranaRoja'], favorables: ['albahaca', 'zanahoria', 'cebolla', 'perejil', 'lechuga'], desfavorables: ['patata', 'col', 'hinojo', 'pepino'], extras: [{ titulo: 'Entutorar', dias: 25 }, { titulo: 'Quitar chupones', dias: 40 }] },
  pimiento: { cultivo: 'Pimiento', especie: 'Capsicum annuum', familia: 'Solanáceas', tipo: 'hortaliza', siembra: [2, 3], trasplante: [4, 5], cosecha: [7, 8, 9, 10], diasCosecha: [80, 110], riego: 'Cada 2-3 días', notaRiego: 'Sin encharcar; le afecta la falta de agua en floración', sol: 'Pleno sol', tempIdeal: '20–28 °C', marco: '50 × 45 cm', dificultad: 'Media', plagas: ['pulgon', 'aranaRoja', 'trips', 'oidio'], favorables: ['albahaca', 'cebolla', 'zanahoria', 'tomate'], desfavorables: ['hinojo', 'judia', 'col'], extras: [{ titulo: 'Colocar tutor', dias: 30 }] },
  berenjena: { cultivo: 'Berenjena', especie: 'Solanum melongena', familia: 'Solanáceas', tipo: 'hortaliza', siembra: [2, 3], trasplante: [4, 5], cosecha: [7, 8, 9, 10], diasCosecha: [90, 120], riego: 'Cada 2-3 días', notaRiego: 'Abundante en verano, siempre sin mojar las hojas', sol: 'Pleno sol', tempIdeal: '22–30 °C', marco: '70 × 60 cm', dificultad: 'Media', plagas: ['aranaRoja', 'escarabajo', 'moscaBlanca', 'pulgon'], favorables: ['judia', 'albahaca', 'pimiento'], desfavorables: ['hinojo', 'patata'], extras: [{ titulo: 'Colocar tutor', dias: 30 }] },
  calabacin: { cultivo: 'Calabacín', especie: 'Cucurbita pepo', familia: 'Cucurbitáceas', tipo: 'hortaliza', siembra: [3, 4, 5, 6], trasplante: [4, 5, 6], cosecha: [6, 7, 8, 9], diasCosecha: [45, 60], riego: 'Cada 2-3 días', notaRiego: 'Abundante, al pie, evitando mojar flores y hojas', sol: 'Pleno sol', tempIdeal: '18–25 °C', marco: '100 × 100 cm', dificultad: 'Fácil', plagas: ['oidio', 'moscaBlanca', 'pulgon'], favorables: ['judia', 'maiz', 'cebolla'], desfavorables: ['patata', 'pepino'], extras: [] },
  pepino: { cultivo: 'Pepino', especie: 'Cucumis sativus', familia: 'Cucurbitáceas', tipo: 'hortaliza', siembra: [3, 4, 5], trasplante: [4, 5, 6], cosecha: [6, 7, 8, 9], diasCosecha: [50, 70], riego: 'Cada 2-3 días', notaRiego: 'Constante: la falta de agua amarga el fruto', sol: 'Pleno sol', tempIdeal: '20–28 °C', marco: '100 × 50 cm', dificultad: 'Media', plagas: ['aranaRoja', 'oidio', 'mildiu', 'moscaBlanca'], favorables: ['judia', 'lechuga', 'maiz', 'guisante'], desfavorables: ['tomate', 'patata', 'albahaca'], extras: [{ titulo: 'Guiar por la malla', dias: 25 }] },
  calabaza: { cultivo: 'Calabaza', especie: 'Cucurbita spp.', familia: 'Cucurbitáceas', tipo: 'hortaliza', siembra: [4, 5, 6], trasplante: [5, 6], cosecha: [9, 10, 11], diasCosecha: [100, 140], riego: 'Semanal', notaRiego: 'Profundo; reducir cuando el fruto empieza a madurar', sol: 'Pleno sol', tempIdeal: '20–28 °C', marco: '200 × 150 cm', dificultad: 'Fácil', plagas: ['oidio', 'moscaBlanca', 'pulgon'], favorables: ['maiz', 'judia'], desfavorables: ['patata'], extras: [] },
  melon: { cultivo: 'Melón', especie: 'Cucumis melo', familia: 'Cucurbitáceas', tipo: 'hortaliza', siembra: [3, 4, 5], trasplante: [4, 5, 6], cosecha: [7, 8, 9], diasCosecha: [85, 110], riego: 'Cada 2-3 días', notaRiego: 'Reducir al madurar para concentrar el azúcar', sol: 'Pleno sol', tempIdeal: '22–30 °C', marco: '150 × 100 cm', dificultad: 'Media', plagas: ['oidio', 'pulgon', 'aranaRoja', 'fusarium'], favorables: ['maiz', 'rabano'], desfavorables: ['patata', 'pepino'], extras: [{ titulo: 'Despuntar guías', dias: 30 }] },
  sandia: { cultivo: 'Sandía', especie: 'Citrullus lanatus', familia: 'Cucurbitáceas', tipo: 'hortaliza', siembra: [3, 4, 5], trasplante: [4, 5, 6], cosecha: [7, 8, 9], diasCosecha: [80, 110], riego: 'Cada 2-3 días', notaRiego: 'Abundante; reducir al madurar', sol: 'Pleno sol', tempIdeal: '22–30 °C', marco: '200 × 150 cm', dificultad: 'Media', plagas: ['oidio', 'pulgon', 'moscaBlanca', 'fusarium'], favorables: ['maiz', 'rabano'], desfavorables: ['patata'], extras: [] },
  judia: { cultivo: 'Judía', especie: 'Phaseolus vulgaris', familia: 'Fabáceas', tipo: 'hortaliza', siembra: [4, 5, 6, 7], trasplante: [], cosecha: [6, 7, 8, 9, 10], diasCosecha: [60, 80], riego: 'Cada 2-3 días', notaRiego: 'Regular, sin encharcar, sobre todo en floración', sol: 'Pleno sol', tempIdeal: '18–27 °C', marco: '50 × 30 cm', dificultad: 'Fácil', plagas: ['aranaRoja', 'moscaBlanca', 'pulgon', 'roya'], favorables: ['maiz', 'zanahoria', 'pepino', 'calabacin', 'patata'], desfavorables: ['cebolla', 'ajo', 'puerro', 'hinojo'], extras: [{ titulo: 'Colocar cañas o malla', dias: 15 }] },
  guisante: { cultivo: 'Guisante', especie: 'Pisum sativum', familia: 'Fabáceas', tipo: 'hortaliza', siembra: [1, 2, 10, 11], trasplante: [], cosecha: [3, 4, 5, 6], diasCosecha: [90, 110], riego: 'Semanal', notaRiego: 'Moderado; más en floración y llenado de vaina', sol: 'Sol o semisombra', tempIdeal: '13–18 °C', marco: '50 × 10 cm', dificultad: 'Fácil', plagas: ['pulgon', 'oidio', 'pajaros'], favorables: ['zanahoria', 'rabano', 'pepino', 'maiz'], desfavorables: ['cebolla', 'ajo', 'puerro'], extras: [{ titulo: 'Colocar malla de sujeción', dias: 15 }] },
  haba: { cultivo: 'Haba', especie: 'Vicia faba', familia: 'Fabáceas', tipo: 'hortaliza', siembra: [10, 11, 12, 1], trasplante: [], cosecha: [3, 4, 5], diasCosecha: [120, 170], riego: 'Semanal', notaRiego: 'Poco en invierno; regular desde la floración', sol: 'Pleno sol', tempIdeal: '10–20 °C', marco: '60 × 20 cm', dificultad: 'Fácil', plagas: ['pulgon', 'roya', 'mildiu'], favorables: ['patata', 'lechuga', 'espinaca'], desfavorables: ['cebolla', 'ajo'], extras: [{ titulo: 'Despuntar para frenar el pulgón', dias: 90 }] },
  lechuga: { cultivo: 'Lechuga', especie: 'Lactuca sativa', familia: 'Asteráceas', tipo: 'hortaliza', siembra: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], trasplante: [2, 3, 4, 5, 6, 7, 8, 9, 10], cosecha: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], diasCosecha: [45, 70], riego: 'Cada 2-3 días', notaRiego: 'Ligero y constante; diario con calor', sol: 'Sol o semisombra', tempIdeal: '15–20 °C', marco: '30 × 30 cm', dificultad: 'Fácil', plagas: ['pulgon', 'caracoles', 'mildiu', 'gusanoGris'], favorables: ['zanahoria', 'rabano', 'cebolla', 'tomate', 'fresa'], desfavorables: ['perejil', 'apio'], extras: [] },
  escarola: { cultivo: 'Escarola', especie: 'Cichorium endivia', familia: 'Asteráceas', tipo: 'hortaliza', siembra: [6, 7, 8, 9], trasplante: [7, 8, 9, 10], cosecha: [9, 10, 11, 12, 1, 2], diasCosecha: [70, 100], riego: 'Cada 2-3 días', notaRiego: 'Regular; atar el cogollo para blanquear', sol: 'Sol o semisombra', tempIdeal: '15–20 °C', marco: '35 × 35 cm', dificultad: 'Fácil', plagas: ['pulgon', 'caracoles', 'mildiu'], favorables: ['zanahoria', 'cebolla', 'col'], desfavorables: ['perejil'], extras: [{ titulo: 'Atar para blanquear', dias: 70 }] },
  rucula: { cultivo: 'Rúcula', especie: 'Eruca vesicaria', familia: 'Brasicáceas', tipo: 'hortaliza', siembra: [2, 3, 4, 5, 8, 9, 10], trasplante: [], cosecha: [3, 4, 5, 6, 9, 10, 11, 12], diasCosecha: [30, 45], riego: 'Cada 2-3 días', notaRiego: 'Ligero y frecuente; sin agua se espiga y pica más', sol: 'Sol o semisombra', tempIdeal: '10–20 °C', marco: '15 × 5 cm', dificultad: 'Fácil', plagas: ['pulguilla', 'pulgon'], favorables: ['lechuga', 'cebolla', 'zanahoria'], desfavorables: ['col'], extras: [] },
  canonigos: { cultivo: 'Canónigos', especie: 'Valerianella locusta', familia: 'Caprifoliáceas', tipo: 'hortaliza', siembra: [8, 9, 10, 11], trasplante: [], cosecha: [10, 11, 12, 1, 2, 3], diasCosecha: [50, 80], riego: 'Semanal', notaRiego: 'Mantener el suelo fresco, sin exceso', sol: 'Semisombra', tempIdeal: '10–18 °C', marco: '15 × 5 cm', dificultad: 'Fácil', plagas: ['caracoles', 'mildiu'], favorables: ['cebolla', 'puerro', 'col'], desfavorables: [], extras: [] },
  espinaca: { cultivo: 'Espinaca', especie: 'Spinacia oleracea', familia: 'Amarantáceas', tipo: 'hortaliza', siembra: [1, 2, 3, 9, 10, 11], trasplante: [], cosecha: [1, 2, 3, 4, 5, 10, 11, 12], diasCosecha: [40, 55], riego: 'Cada 2-3 días', notaRiego: 'Ligero y frecuente; con calor se espiga', sol: 'Sol o semisombra', tempIdeal: '10–18 °C', marco: '30 × 15 cm', dificultad: 'Fácil', plagas: ['mildiu', 'pulgon', 'minador'], favorables: ['fresa', 'col', 'haba', 'rabano'], desfavorables: ['acelga', 'remolacha'], extras: [] },
  acelga: { cultivo: 'Acelga', especie: 'Beta vulgaris var. cicla', familia: 'Amarantáceas', tipo: 'hortaliza', siembra: [2, 3, 4, 5, 6, 7, 8, 9, 10], trasplante: [3, 4, 5, 9, 10], cosecha: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], diasCosecha: [50, 70], riego: 'Cada 2-3 días', notaRiego: 'Regular; cosechar las hojas exteriores', sol: 'Sol o semisombra', tempIdeal: '15–22 °C', marco: '40 × 30 cm', dificultad: 'Fácil', plagas: ['pulgon', 'caracoles', 'minador'], favorables: ['cebolla', 'col', 'zanahoria', 'lechuga'], desfavorables: ['espinaca', 'remolacha'], extras: [] },
  col: { cultivo: 'Col', especie: 'Brassica oleracea', familia: 'Brasicáceas', tipo: 'hortaliza', siembra: [3, 4, 5, 6, 7, 8], trasplante: [5, 6, 7, 8, 9], cosecha: [9, 10, 11, 12, 1, 2, 3], diasCosecha: [90, 130], riego: 'Cada 2-3 días', notaRiego: 'Constante; no dejar secar el suelo', sol: 'Pleno sol', tempIdeal: '13–20 °C', marco: '60 × 50 cm', dificultad: 'Media', plagas: ['mariposaCol', 'pulgon', 'pulguilla', 'hernia'], favorables: ['patata', 'cebolla', 'apio', 'remolacha', 'lechuga'], desfavorables: ['tomate', 'fresa', 'rucula'], extras: [{ titulo: 'Aporcar', dias: 30 }] },
  cebolla: { cultivo: 'Cebolla', especie: 'Allium cepa', familia: 'Amarilidáceas', tipo: 'hortaliza', siembra: [9, 10, 11, 12, 1, 2], trasplante: [1, 2, 3, 4], cosecha: [5, 6, 7, 8], diasCosecha: [120, 150], riego: 'Semanal', notaRiego: 'Moderado; cortar un mes antes de la cosecha', sol: 'Pleno sol', tempIdeal: '13–24 °C', marco: '25 × 12 cm', dificultad: 'Fácil', plagas: ['moscaCebolla', 'mildiu', 'trips'], favorables: ['zanahoria', 'lechuga', 'tomate', 'remolacha', 'fresa', 'col'], desfavorables: ['judia', 'guisante', 'haba'], extras: [] },
  cebolleta: { cultivo: 'Cebolleta', especie: 'Allium fistulosum', familia: 'Amarilidáceas', tipo: 'hortaliza', siembra: [2, 3, 4, 8, 9, 10], trasplante: [3, 4, 5, 9, 10], cosecha: [1, 2, 3, 4, 5, 6, 10, 11, 12], diasCosecha: [70, 100], riego: 'Cada 2-3 días', notaRiego: 'Regular y ligero', sol: 'Pleno sol', tempIdeal: '13–24 °C', marco: '20 × 8 cm', dificultad: 'Fácil', plagas: ['moscaCebolla', 'trips'], favorables: ['zanahoria', 'lechuga', 'tomate', 'fresa'], desfavorables: ['judia', 'guisante'], extras: [] },
  puerro: { cultivo: 'Puerro', especie: 'Allium ampeloprasum', familia: 'Amarilidáceas', tipo: 'hortaliza', siembra: [2, 3, 4, 5], trasplante: [5, 6, 7, 8], cosecha: [9, 10, 11, 12, 1, 2, 3], diasCosecha: [120, 150], riego: 'Semanal', notaRiego: 'Regular; aporcar para blanquear el tallo', sol: 'Pleno sol', tempIdeal: '13–24 °C', marco: '30 × 12 cm', dificultad: 'Fácil', plagas: ['moscaCebolla', 'roya', 'trips'], favorables: ['zanahoria', 'apio', 'fresa', 'tomate'], desfavorables: ['judia', 'guisante'], extras: [{ titulo: 'Aporcar', dias: 45 }] },
  ajo: { cultivo: 'Ajo', especie: 'Allium sativum', familia: 'Amarilidáceas', tipo: 'hortaliza', siembra: [10, 11, 12, 1], trasplante: [], cosecha: [5, 6, 7], diasCosecha: [180, 220], riego: 'Solo en sequía', notaRiego: 'Escaso; suspender un mes antes de cosechar', sol: 'Pleno sol', tempIdeal: '13–24 °C', marco: '25 × 12 cm', dificultad: 'Fácil', plagas: ['roya', 'nematodos', 'trips'], favorables: ['fresa', 'tomate', 'zanahoria', 'remolacha'], desfavorables: ['judia', 'guisante', 'haba', 'col'], extras: [] },
  zanahoria: { cultivo: 'Zanahoria', especie: 'Daucus carota', familia: 'Apiáceas', tipo: 'hortaliza', siembra: [2, 3, 4, 5, 6, 7, 8], trasplante: [], cosecha: [5, 6, 7, 8, 9, 10, 11, 12], diasCosecha: [80, 110], riego: 'Cada 2-3 días', notaRiego: 'Constante y uniforme para que no se rajen', sol: 'Pleno sol', tempIdeal: '15–21 °C', marco: '25 × 5 cm', dificultad: 'Media', plagas: ['moscaZanahoria', 'nematodos', 'pulgon'], favorables: ['cebolla', 'puerro', 'lechuga', 'tomate', 'guisante', 'romero'], desfavorables: ['eneldo', 'hinojo'], extras: [{ titulo: 'Aclarar plantas', dias: 25 }] },
  remolacha: { cultivo: 'Remolacha', especie: 'Beta vulgaris', familia: 'Amarantáceas', tipo: 'hortaliza', siembra: [3, 4, 5, 6, 7, 8], trasplante: [], cosecha: [6, 7, 8, 9, 10, 11], diasCosecha: [70, 100], riego: 'Cada 2-3 días', notaRiego: 'Regular para evitar que se endurezca', sol: 'Pleno sol', tempIdeal: '15–22 °C', marco: '30 × 10 cm', dificultad: 'Fácil', plagas: ['pulgon', 'minador'], favorables: ['cebolla', 'col', 'lechuga', 'ajo'], desfavorables: ['espinaca', 'acelga'], extras: [{ titulo: 'Aclarar plantas', dias: 25 }] },
  rabano: { cultivo: 'Rábano', especie: 'Raphanus sativus', familia: 'Brasicáceas', tipo: 'hortaliza', siembra: [2, 3, 4, 5, 8, 9, 10], trasplante: [], cosecha: [3, 4, 5, 6, 9, 10, 11, 12], diasCosecha: [25, 40], riego: 'Cada 2-3 días', notaRiego: 'Ligero y frecuente; si falta agua, pica y se ahueca', sol: 'Sol o semisombra', tempIdeal: '10–18 °C', marco: '15 × 5 cm', dificultad: 'Fácil', plagas: ['pulguilla', 'orugas'], favorables: ['lechuga', 'zanahoria', 'guisante', 'espinaca', 'melon'], desfavorables: ['hinojo'], extras: [] },
  nabo: { cultivo: 'Nabo', especie: 'Brassica rapa', familia: 'Brasicáceas', tipo: 'hortaliza', siembra: [3, 4, 8, 9, 10], trasplante: [], cosecha: [5, 6, 10, 11, 12, 1], diasCosecha: [50, 80], riego: 'Semanal', notaRiego: 'Regular; con sequía se vuelve fibroso', sol: 'Sol o semisombra', tempIdeal: '10–20 °C', marco: '30 × 12 cm', dificultad: 'Fácil', plagas: ['pulguilla', 'mariposaCol'], favorables: ['guisante', 'cebolla'], desfavorables: ['patata'], extras: [{ titulo: 'Aclarar plantas', dias: 25 }] },
  chirivia: { cultivo: 'Chirivía', especie: 'Pastinaca sativa', familia: 'Apiáceas', tipo: 'hortaliza', siembra: [3, 4, 5, 6], trasplante: [], cosecha: [10, 11, 12, 1, 2], diasCosecha: [120, 180], riego: 'Semanal', notaRiego: 'Regular; suelo profundo y suelto', sol: 'Sol o semisombra', tempIdeal: '10–20 °C', marco: '35 × 12 cm', dificultad: 'Media', plagas: ['moscaZanahoria', 'pulgon'], favorables: ['cebolla', 'ajo', 'rabano'], desfavorables: ['zanahoria', 'apio'], extras: [{ titulo: 'Aclarar plantas', dias: 30 }] },
  patata: { cultivo: 'Patata', especie: 'Solanum tuberosum', familia: 'Solanáceas', tipo: 'hortaliza', siembra: [2, 3, 4], trasplante: [], cosecha: [6, 7, 8, 9], diasCosecha: [90, 130], riego: 'Semanal', notaRiego: 'Regular desde la floración; cortar antes de cosechar', sol: 'Pleno sol', tempIdeal: '15–20 °C', marco: '70 × 30 cm', dificultad: 'Fácil', plagas: ['escarabajo', 'mildiu', 'gusanoAlambre'], favorables: ['judia', 'haba', 'col', 'maiz'], desfavorables: ['tomate', 'calabacin', 'pepino'], extras: [{ titulo: 'Aporcar', dias: 35 }] },
  boniato: { cultivo: 'Boniato', especie: 'Ipomoea batatas', familia: 'Convolvuláceas', tipo: 'hortaliza', siembra: [3, 4], trasplante: [5, 6], cosecha: [9, 10, 11], diasCosecha: [110, 150], riego: 'Semanal', notaRiego: 'Moderado; suspender antes de cosechar', sol: 'Pleno sol', tempIdeal: '22–30 °C', marco: '80 × 35 cm', dificultad: 'Media', plagas: ['gusanoAlambre', 'moscaBlanca'], favorables: ['judia', 'tomillo'], desfavorables: ['calabaza'], extras: [] },
  apio: { cultivo: 'Apio', especie: 'Apium graveolens', familia: 'Apiáceas', tipo: 'hortaliza', siembra: [2, 3, 4, 5], trasplante: [4, 5, 6, 7], cosecha: [8, 9, 10, 11, 12], diasCosecha: [110, 150], riego: 'Cada 2-3 días', notaRiego: 'Abundante: sin agua queda fibroso', sol: 'Sol o semisombra', tempIdeal: '15–21 °C', marco: '40 × 30 cm', dificultad: 'Difícil', plagas: ['pulgon', 'minador', 'caracoles'], favorables: ['puerro', 'col', 'tomate', 'judia'], desfavorables: ['lechuga', 'perejil', 'chirivia'], extras: [{ titulo: 'Aporcar para blanquear', dias: 70 }] },
  hinojo: { cultivo: 'Hinojo', especie: 'Foeniculum vulgare', familia: 'Apiáceas', tipo: 'hortaliza', siembra: [6, 7, 8], trasplante: [7, 8, 9], cosecha: [9, 10, 11, 12], diasCosecha: [80, 110], riego: 'Cada 2-3 días', notaRiego: 'Regular para que engorde el bulbo', sol: 'Pleno sol', tempIdeal: '15–22 °C', marco: '40 × 25 cm', dificultad: 'Media', plagas: ['pulgon', 'caracoles'], favorables: ['lechuga', 'pepino'], desfavorables: ['tomate', 'judia', 'zanahoria', 'pimiento', 'berenjena', 'rabano'], extras: [{ titulo: 'Aporcar el bulbo', dias: 50 }] },
  alcachofa: { cultivo: 'Alcachofa', especie: 'Cynara scolymus', familia: 'Asteráceas', tipo: 'hortaliza', perenne: true, siembra: [], trasplante: [7, 8, 9], cosecha: [11, 12, 1, 2, 3, 4, 5], diasCosecha: [150, 210], riego: 'Semanal', notaRiego: 'Regular en otoño y primavera', sol: 'Pleno sol', tempIdeal: '13–20 °C', marco: '100 × 80 cm', dificultad: 'Media', plagas: ['pulgon', 'caracoles', 'oidio'], favorables: ['haba', 'lechuga'], desfavorables: [], extras: [] },
  esparrago: { cultivo: 'Espárrago', especie: 'Asparagus officinalis', familia: 'Asparagáceas', tipo: 'hortaliza', perenne: true, siembra: [], trasplante: [2, 3, 4], cosecha: [3, 4, 5, 6], diasCosecha: [730, 1095], riego: 'Semanal', notaRiego: 'Regular el primer año; luego poco', sol: 'Pleno sol', tempIdeal: '15–25 °C', marco: '120 × 40 cm', dificultad: 'Difícil', plagas: ['roya', 'pulgon'], favorables: ['tomate', 'perejil', 'albahaca'], desfavorables: ['ajo', 'cebolla'], extras: [] },
  maiz: { cultivo: 'Maíz', especie: 'Zea mays', familia: 'Poáceas', tipo: 'hortaliza', siembra: [4, 5, 6], trasplante: [], cosecha: [7, 8, 9, 10], diasCosecha: [80, 110], riego: 'Cada 2-3 días', notaRiego: 'Abundante en floración y llenado de la mazorca', sol: 'Pleno sol', tempIdeal: '20–30 °C', marco: '70 × 25 cm', dificultad: 'Fácil', plagas: ['taladro', 'pulgon', 'gusanoAlambre'], favorables: ['judia', 'calabaza', 'pepino', 'melon', 'patata'], desfavorables: ['tomate'], extras: [{ titulo: 'Aporcar', dias: 30 }] },

  albahaca: { cultivo: 'Albahaca', especie: 'Ocimum basilicum', familia: 'Lamiáceas', tipo: 'aromatica', siembra: [3, 4, 5, 6], trasplante: [4, 5, 6], cosecha: [6, 7, 8, 9, 10], diasCosecha: [50, 70], riego: 'Cada 2-3 días', notaRiego: 'Frecuente y sin encharcar; despuntar para que ramifique', sol: 'Pleno sol', tempIdeal: '20–28 °C', marco: '30 × 25 cm', dificultad: 'Fácil', plagas: ['pulgon', 'botritis', 'caracoles'], favorables: ['tomate', 'pimiento', 'berenjena', 'esparrago'], desfavorables: ['pepino', 'salvia'], extras: [{ titulo: 'Despuntar flores', dias: 40 }] },
  perejil: { cultivo: 'Perejil', especie: 'Petroselinum crispum', familia: 'Apiáceas', tipo: 'aromatica', siembra: [2, 3, 4, 5, 6, 7, 8, 9], trasplante: [], cosecha: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], diasCosecha: [70, 90], riego: 'Cada 2-3 días', notaRiego: 'Regular; tarda en germinar', sol: 'Sol o semisombra', tempIdeal: '15–22 °C', marco: '20 × 15 cm', dificultad: 'Fácil', plagas: ['pulgon', 'mildiu'], favorables: ['tomate', 'esparrago', 'cebolla'], desfavorables: ['lechuga', 'apio', 'menta'], extras: [] },
  cilantro: { cultivo: 'Cilantro', especie: 'Coriandrum sativum', familia: 'Apiáceas', tipo: 'aromatica', siembra: [2, 3, 4, 9, 10], trasplante: [], cosecha: [4, 5, 6, 10, 11, 12], diasCosecha: [40, 60], riego: 'Cada 2-3 días', notaRiego: 'Regular; con calor se espiga rápido', sol: 'Sol o semisombra', tempIdeal: '15–22 °C', marco: '20 × 10 cm', dificultad: 'Fácil', plagas: ['pulgon', 'oidio'], favorables: ['espinaca', 'tomate', 'lechuga'], desfavorables: ['hinojo'], extras: [] },
  eneldo: { cultivo: 'Eneldo', especie: 'Anethum graveolens', familia: 'Apiáceas', tipo: 'aromatica', siembra: [3, 4, 5, 6, 9], trasplante: [], cosecha: [5, 6, 7, 8, 10, 11], diasCosecha: [40, 70], riego: 'Semanal', notaRiego: 'Moderado; no tolera bien el trasplante', sol: 'Pleno sol', tempIdeal: '15–25 °C', marco: '30 × 20 cm', dificultad: 'Fácil', plagas: ['pulgon'], favorables: ['col', 'lechuga', 'cebolla', 'pepino'], desfavorables: ['zanahoria', 'tomate'], extras: [] },
  romero: { cultivo: 'Romero', especie: 'Salvia rosmarinus', familia: 'Lamiáceas', tipo: 'aromatica', perenne: true, siembra: [], trasplante: [3, 4, 9, 10], cosecha: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], diasCosecha: [180, 365], riego: 'Solo en sequía', notaRiego: 'Muy poco: teme el encharcamiento', sol: 'Pleno sol', tempIdeal: '15–30 °C', marco: '80 × 60 cm', dificultad: 'Fácil', plagas: ['cochinilla', 'podredumbre'], favorables: ['col', 'zanahoria', 'salvia'], desfavorables: [], extras: [{ titulo: 'Podar tras la floración', dias: 120 }] },
  tomillo: { cultivo: 'Tomillo', especie: 'Thymus vulgaris', familia: 'Lamiáceas', tipo: 'aromatica', perenne: true, siembra: [3, 4], trasplante: [3, 4, 9, 10], cosecha: [4, 5, 6, 7, 8, 9, 10], diasCosecha: [120, 240], riego: 'Solo en sequía', notaRiego: 'Muy poco; suelo bien drenado', sol: 'Pleno sol', tempIdeal: '15–30 °C', marco: '30 × 30 cm', dificultad: 'Fácil', plagas: ['podredumbre', 'aranaRoja'], favorables: ['col', 'fresa', 'tomate', 'boniato'], desfavorables: [], extras: [] },
  oregano: { cultivo: 'Orégano', especie: 'Origanum vulgare', familia: 'Lamiáceas', tipo: 'aromatica', perenne: true, siembra: [3, 4], trasplante: [3, 4, 9, 10], cosecha: [5, 6, 7, 8, 9], diasCosecha: [90, 180], riego: 'Solo en sequía', notaRiego: 'Poco; mejor en suelo seco', sol: 'Pleno sol', tempIdeal: '15–28 °C', marco: '40 × 30 cm', dificultad: 'Fácil', plagas: ['pulgon', 'podredumbre'], favorables: ['col', 'pimiento', 'tomate'], desfavorables: [], extras: [] },
  menta: { cultivo: 'Menta', especie: 'Mentha spicata', familia: 'Lamiáceas', tipo: 'aromatica', perenne: true, siembra: [3, 4], trasplante: [3, 4, 5, 9, 10], cosecha: [4, 5, 6, 7, 8, 9, 10], diasCosecha: [60, 90], riego: 'Cada 2-3 días', notaRiego: 'Abundante; mejor en maceta, porque invade', sol: 'Sol o semisombra', tempIdeal: '15–25 °C', marco: '40 × 30 cm', dificultad: 'Fácil', plagas: ['roya', 'pulgon'], favorables: ['col', 'tomate'], desfavorables: ['perejil'], extras: [] },
  salvia: { cultivo: 'Salvia', especie: 'Salvia officinalis', familia: 'Lamiáceas', tipo: 'aromatica', perenne: true, siembra: [3, 4], trasplante: [3, 4, 9, 10], cosecha: [5, 6, 7, 8, 9, 10], diasCosecha: [120, 240], riego: 'Solo en sequía', notaRiego: 'Poco; teme el encharcamiento', sol: 'Pleno sol', tempIdeal: '15–28 °C', marco: '60 × 50 cm', dificultad: 'Fácil', plagas: ['oidio', 'podredumbre'], favorables: ['romero', 'col', 'zanahoria'], desfavorables: ['albahaca'], extras: [] },
  lavanda: { cultivo: 'Lavanda', especie: 'Lavandula angustifolia', familia: 'Lamiáceas', tipo: 'aromatica', perenne: true, siembra: [], trasplante: [3, 4, 9, 10], cosecha: [6, 7, 8], diasCosecha: [365, 730], riego: 'Solo en sequía', notaRiego: 'Muy poco; atrae polinizadores', sol: 'Pleno sol', tempIdeal: '15–30 °C', marco: '80 × 60 cm', dificultad: 'Fácil', plagas: ['podredumbre', 'cochinilla'], favorables: ['fresa', 'romero'], desfavorables: [], extras: [{ titulo: 'Podar tras la floración', dias: 300 }] },
  cebollino: { cultivo: 'Cebollino', especie: 'Allium schoenoprasum', familia: 'Amarilidáceas', tipo: 'aromatica', perenne: true, siembra: [3, 4, 5], trasplante: [4, 5, 9, 10], cosecha: [3, 4, 5, 6, 7, 8, 9, 10, 11], diasCosecha: [60, 90], riego: 'Cada 2-3 días', notaRiego: 'Regular; cortar a ras para que rebrote', sol: 'Sol o semisombra', tempIdeal: '13–24 °C', marco: '20 × 20 cm', dificultad: 'Fácil', plagas: ['trips', 'roya'], favorables: ['zanahoria', 'tomate', 'fresa'], desfavorables: ['judia', 'guisante'], extras: [] },
  laurel: { cultivo: 'Laurel', especie: 'Laurus nobilis', familia: 'Lauráceas', tipo: 'aromatica', perenne: true, siembra: [], trasplante: [3, 4, 10, 11], cosecha: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], diasCosecha: [730, 1095], riego: 'Semanal', notaRiego: 'Moderado; algo más en maceta', sol: 'Sol o semisombra', tempIdeal: '15–28 °C', marco: '200 × 200 cm', dificultad: 'Fácil', plagas: ['cochinilla', 'negrilla'], favorables: [], desfavorables: [], extras: [] },

  fresa: { cultivo: 'Fresa', especie: 'Fragaria × ananassa', familia: 'Rosáceas', tipo: 'frutal', perenne: true, siembra: [], trasplante: [9, 10, 11], cosecha: [4, 5, 6, 7], diasCosecha: [150, 210], riego: 'Cada 2-3 días', notaRiego: 'Frecuente y ligero; acolchar para no mojar el fruto', sol: 'Pleno sol', tempIdeal: '15–22 °C', marco: '40 × 30 cm', dificultad: 'Media', plagas: ['aranaRoja', 'botritis', 'caracoles', 'pajaros'], favorables: ['ajo', 'cebolla', 'espinaca', 'lechuga', 'tomillo', 'lavanda'], desfavorables: ['col'], extras: [{ titulo: 'Acolchar con paja', dias: 90 }] },
  frambuesa: { cultivo: 'Frambuesa', especie: 'Rubus idaeus', familia: 'Rosáceas', tipo: 'frutal', perenne: true, siembra: [], trasplante: [11, 12, 1, 2], cosecha: [6, 7, 8, 9], diasCosecha: [365, 730], riego: 'Cada 2-3 días', notaRiego: 'Regular en verano; mejor por goteo', sol: 'Sol o semisombra', tempIdeal: '15–25 °C', marco: '150 × 50 cm', dificultad: 'Media', plagas: ['drosophila', 'botritis', 'pulgon'], favorables: ['ajo'], desfavorables: ['patata', 'tomate'], extras: [{ titulo: 'Podar las cañas viejas', dias: 300 }] },
  mora: { cultivo: 'Mora', especie: 'Rubus fruticosus', familia: 'Rosáceas', tipo: 'frutal', perenne: true, siembra: [], trasplante: [11, 12, 1, 2], cosecha: [7, 8, 9], diasCosecha: [365, 730], riego: 'Semanal', notaRiego: 'Moderado; más durante la fructificación', sol: 'Pleno sol', tempIdeal: '15–28 °C', marco: '250 × 100 cm', dificultad: 'Fácil', plagas: ['drosophila', 'botritis', 'pulgon'], favorables: ['ajo'], desfavorables: [], extras: [{ titulo: 'Guiar las cañas', dias: 120 }] },
  arandano: { cultivo: 'Arándano', especie: 'Vaccinium corymbosum', familia: 'Ericáceas', tipo: 'frutal', perenne: true, siembra: [], trasplante: [10, 11, 2, 3], cosecha: [6, 7, 8], diasCosecha: [730, 1095], riego: 'Cada 2-3 días', notaRiego: 'Regular con agua poco calcárea; suelo ácido', sol: 'Sol o semisombra', tempIdeal: '15–25 °C', marco: '150 × 100 cm', dificultad: 'Difícil', plagas: ['pajaros', 'drosophila', 'botritis'], favorables: ['fresa'], desfavorables: [], extras: [{ titulo: 'Acolchar con corteza de pino', dias: 30 }] },
  grosella: { cultivo: 'Grosella', especie: 'Ribes rubrum', familia: 'Grosulariáceas', tipo: 'frutal', perenne: true, siembra: [], trasplante: [11, 12, 1, 2], cosecha: [6, 7, 8], diasCosecha: [730, 1095], riego: 'Semanal', notaRiego: 'Regular; prefiere suelo fresco', sol: 'Sol o semisombra', tempIdeal: '13–22 °C', marco: '150 × 120 cm', dificultad: 'Media', plagas: ['pulgon', 'oidio', 'pajaros'], favorables: ['ajo'], desfavorables: [], extras: [{ titulo: 'Poda de invierno', dias: 300 }] },
  higuera: { cultivo: 'Higuera', especie: 'Ficus carica', familia: 'Moráceas', tipo: 'frutal', perenne: true, siembra: [], trasplante: [11, 12, 1, 2, 3], cosecha: [6, 8, 9, 10], diasCosecha: [730, 1460], riego: 'Solo en sequía', notaRiego: 'Muy resistente; regar los primeros años', sol: 'Pleno sol', tempIdeal: '18–30 °C', marco: '500 × 500 cm', dificultad: 'Fácil', plagas: ['cochinilla', 'moscaFruta', 'pajaros'], favorables: [], desfavorables: [], extras: [{ titulo: 'Poda de invierno', dias: 300 }] },
  limonero: { cultivo: 'Limonero', especie: 'Citrus × limon', familia: 'Rutáceas', tipo: 'frutal', perenne: true, siembra: [], trasplante: [3, 4, 5], cosecha: [1, 2, 3, 4, 5, 10, 11, 12], diasCosecha: [1095, 1460], riego: 'Semanal', notaRiego: 'Regular en verano; le perjudica el encharcamiento', sol: 'Pleno sol', tempIdeal: '15–30 °C', marco: '400 × 400 cm', dificultad: 'Media', plagas: ['cochinilla', 'pulgon', 'minador', 'negrilla'], favorables: [], desfavorables: [], extras: [{ titulo: 'Abonar en primavera', dias: 180 }] },
  naranjo: { cultivo: 'Naranjo', especie: 'Citrus × sinensis', familia: 'Rutáceas', tipo: 'frutal', perenne: true, siembra: [], trasplante: [3, 4, 5], cosecha: [11, 12, 1, 2, 3, 4], diasCosecha: [1095, 1825], riego: 'Semanal', notaRiego: 'Regular en verano; sensible a las heladas', sol: 'Pleno sol', tempIdeal: '15–30 °C', marco: '500 × 400 cm', dificultad: 'Media', plagas: ['cochinilla', 'pulgon', 'minador', 'moscaFruta'], favorables: [], desfavorables: [], extras: [{ titulo: 'Abonar en primavera', dias: 180 }] },
  manzano: { cultivo: 'Manzano', especie: 'Malus domestica', familia: 'Rosáceas', tipo: 'frutal', perenne: true, siembra: [], trasplante: [11, 12, 1, 2], cosecha: [8, 9, 10], diasCosecha: [1095, 1825], riego: 'Semanal', notaRiego: 'Regular en verano los primeros años', sol: 'Pleno sol', tempIdeal: '15–24 °C', marco: '500 × 400 cm', dificultad: 'Media', plagas: ['carpocapsa', 'pulgon', 'moteado', 'oidio'], favorables: ['cebollino'], desfavorables: ['patata'], extras: [{ titulo: 'Poda de invierno', dias: 300 }] },
  peral: { cultivo: 'Peral', especie: 'Pyrus communis', familia: 'Rosáceas', tipo: 'frutal', perenne: true, siembra: [], trasplante: [11, 12, 1, 2], cosecha: [7, 8, 9, 10], diasCosecha: [1095, 1825], riego: 'Semanal', notaRiego: 'Regular en verano los primeros años', sol: 'Pleno sol', tempIdeal: '15–24 °C', marco: '500 × 400 cm', dificultad: 'Media', plagas: ['carpocapsa', 'moteado', 'pulgon'], favorables: [], desfavorables: [], extras: [{ titulo: 'Poda de invierno', dias: 300 }] },
  melocotonero: { cultivo: 'Melocotonero', especie: 'Prunus persica', familia: 'Rosáceas', tipo: 'frutal', perenne: true, siembra: [], trasplante: [11, 12, 1, 2], cosecha: [6, 7, 8, 9], diasCosecha: [730, 1095], riego: 'Semanal', notaRiego: 'Regular, sobre todo al engordar el fruto', sol: 'Pleno sol', tempIdeal: '16–26 °C', marco: '500 × 400 cm', dificultad: 'Difícil', plagas: ['lepra', 'pulgon', 'moscaFruta', 'monilia'], favorables: ['ajo'], desfavorables: [], extras: [{ titulo: 'Aclarar frutos', dias: 150 }] },
  albaricoquero: { cultivo: 'Albaricoquero', especie: 'Prunus armeniaca', familia: 'Rosáceas', tipo: 'frutal', perenne: true, siembra: [], trasplante: [11, 12, 1, 2], cosecha: [5, 6, 7], diasCosecha: [1095, 1460], riego: 'Semanal', notaRiego: 'Moderado; resiste bien la sequía una vez asentado', sol: 'Pleno sol', tempIdeal: '16–28 °C', marco: '500 × 500 cm', dificultad: 'Media', plagas: ['monilia', 'pulgon', 'moscaFruta'], favorables: [], desfavorables: [], extras: [{ titulo: 'Poda de verano', dias: 240 }] },
  ciruelo: { cultivo: 'Ciruelo', especie: 'Prunus domestica', familia: 'Rosáceas', tipo: 'frutal', perenne: true, siembra: [], trasplante: [11, 12, 1, 2], cosecha: [6, 7, 8, 9], diasCosecha: [1095, 1460], riego: 'Semanal', notaRiego: 'Moderado; más al engordar el fruto', sol: 'Pleno sol', tempIdeal: '15–26 °C', marco: '500 × 400 cm', dificultad: 'Fácil', plagas: ['pulgon', 'monilia', 'moscaFruta'], favorables: [], desfavorables: [], extras: [{ titulo: 'Poda de invierno', dias: 300 }] },
  cerezo: { cultivo: 'Cerezo', especie: 'Prunus avium', familia: 'Rosáceas', tipo: 'frutal', perenne: true, siembra: [], trasplante: [11, 12, 1, 2], cosecha: [5, 6, 7], diasCosecha: [1460, 1825], riego: 'Semanal', notaRiego: 'Regular los primeros años; sin encharcar', sol: 'Pleno sol', tempIdeal: '15–24 °C', marco: '600 × 500 cm', dificultad: 'Media', plagas: ['pajaros', 'pulgon', 'monilia', 'drosophila'], favorables: [], desfavorables: [], extras: [{ titulo: 'Poda de verano', dias: 240 }] },
  almendro: { cultivo: 'Almendro', especie: 'Prunus dulcis', familia: 'Rosáceas', tipo: 'frutal', perenne: true, siembra: [], trasplante: [11, 12, 1, 2], cosecha: [8, 9], diasCosecha: [1095, 1460], riego: 'Solo en sequía', notaRiego: 'Muy resistente; agradece riegos de apoyo en verano', sol: 'Pleno sol', tempIdeal: '15–30 °C', marco: '600 × 500 cm', dificultad: 'Fácil', plagas: ['pulgon', 'monilia'], favorables: [], desfavorables: [], extras: [{ titulo: 'Poda de invierno', dias: 300 }] },
  olivo: { cultivo: 'Olivo', especie: 'Olea europaea', familia: 'Oleáceas', tipo: 'frutal', perenne: true, siembra: [], trasplante: [2, 3, 4], cosecha: [10, 11, 12, 1], diasCosecha: [1095, 1825], riego: 'Solo en sequía', notaRiego: 'Muy resistente; regar los primeros años', sol: 'Pleno sol', tempIdeal: '15–30 °C', marco: '700 × 600 cm', dificultad: 'Fácil', plagas: ['repilo', 'prays', 'cochinilla', 'moscaFruta'], favorables: [], desfavorables: [], extras: [{ titulo: 'Poda de formación', dias: 300 }] },
  vid: { cultivo: 'Vid', especie: 'Vitis vinifera', familia: 'Vitáceas', tipo: 'frutal', perenne: true, siembra: [], trasplante: [12, 1, 2, 3], cosecha: [8, 9, 10], diasCosecha: [730, 1095], riego: 'Solo en sequía', notaRiego: 'Poco; regar el primer año', sol: 'Pleno sol', tempIdeal: '18–30 °C', marco: '250 × 150 cm', dificultad: 'Media', plagas: ['oidio', 'mildiu', 'mosquito', 'botritis'], favorables: ['salvia'], desfavorables: ['col'], extras: [{ titulo: 'Poda de invierno', dias: 300 }] },
  granado: { cultivo: 'Granado', especie: 'Punica granatum', familia: 'Litráceas', tipo: 'frutal', perenne: true, siembra: [], trasplante: [11, 12, 1, 2, 3], cosecha: [9, 10, 11], diasCosecha: [1095, 1460], riego: 'Semanal', notaRiego: 'Moderado; riego regular evita que se raje el fruto', sol: 'Pleno sol', tempIdeal: '18–32 °C', marco: '400 × 400 cm', dificultad: 'Fácil', plagas: ['pulgon', 'moscaFruta'], favorables: [], desfavorables: [], extras: [{ titulo: 'Quitar chupones', dias: 180 }] },
  kiwi: { cultivo: 'Kiwi', especie: 'Actinidia deliciosa', familia: 'Actinidiáceas', tipo: 'frutal', perenne: true, siembra: [], trasplante: [11, 12, 1, 2, 3], cosecha: [10, 11], diasCosecha: [1095, 1825], riego: 'Cada 2-3 días', notaRiego: 'Abundante en verano; necesita planta macho y hembra', sol: 'Sol o semisombra', tempIdeal: '15–25 °C', marco: '400 × 300 cm', dificultad: 'Difícil', plagas: ['cochinilla', 'botritis'], favorables: [], desfavorables: [], extras: [{ titulo: 'Guiar por la pérgola', dias: 90 }] },
  nispero: { cultivo: 'Níspero', especie: 'Eriobotrya japonica', familia: 'Rosáceas', tipo: 'frutal', perenne: true, siembra: [], trasplante: [3, 4, 5, 10], cosecha: [4, 5, 6], diasCosecha: [1095, 1825], riego: 'Semanal', notaRiego: 'Regular en verano; florece en otoño', sol: 'Pleno sol', tempIdeal: '15–28 °C', marco: '500 × 400 cm', dificultad: 'Fácil', plagas: ['moscaFruta', 'pulgon', 'moteado'], favorables: [], desfavorables: [], extras: [{ titulo: 'Aclarar frutos', dias: 150 }] },
}

// Variedades: [especie, id, variedad, datos propios que sustituyen a los de la especie].
const VARIEDADES = [
  ['tomate', 'tomate-cherry', 'Cherry', { diasCosecha: [60, 75] }],
  ['tomate', 'tomate-pera', 'Pera', { diasCosecha: [70, 85] }],
  ['tomate', 'tomate-corazon', 'Corazón de buey', { diasCosecha: [80, 95] }],
  ['tomate', 'tomate-raf', 'Raf', { diasCosecha: [90, 110], siembra: [8, 9], trasplante: [9, 10], cosecha: [12, 1, 2, 3, 4] }],
  ['tomate', 'tomate-rosa', 'Rosa de Barbastro', { diasCosecha: [85, 100] }],
  ['tomate', 'tomate-canario', 'Canario', { diasCosecha: [70, 90] }],
  ['tomate', 'tomate-negro', 'Negro de Crimea', { diasCosecha: [75, 90] }],
  ['pimiento', 'pimiento-italiano', 'Italiano', { diasCosecha: [70, 90] }],
  ['pimiento', 'pimiento-california', 'California', { diasCosecha: [85, 110] }],
  ['pimiento', 'pimiento-padron', 'Padrón', { diasCosecha: [60, 80] }],
  ['pimiento', 'pimiento-piquillo', 'Piquillo', { diasCosecha: [90, 120] }],
  ['pimiento', 'pimiento-guindilla', 'Guindilla', { diasCosecha: [70, 100] }],
  ['berenjena', 'berenjena-morada', 'Morada', {}],
  ['berenjena', 'berenjena-listada', 'Listada de Gandía', {}],
  ['berenjena', 'berenjena-blanca', 'Blanca', {}],
  ['calabacin', 'calabacin-verde', 'Verde', {}],
  ['calabacin', 'calabacin-amarillo', 'Amarillo', {}],
  ['calabacin', 'calabacin-redondo', 'Redondo', {}],
  ['pepino', 'pepino-espanol', 'Español', {}],
  ['pepino', 'pepino-holandes', 'Holandés', {}],
  ['pepino', 'pepino-pepinillo', 'Pepinillo', { diasCosecha: [45, 60] }],
  ['calabaza', 'calabaza-cacahuete', 'Cacahuete', {}],
  ['calabaza', 'calabaza-hokkaido', 'Hokkaido', { diasCosecha: [90, 110] }],
  ['calabaza', 'calabaza-espagueti', 'Cabello de ángel', {}],
  ['melon', 'melon-piel-de-sapo', 'Piel de sapo', {}],
  ['melon', 'melon-cantalupo', 'Cantalupo', { diasCosecha: [75, 95] }],
  ['melon', 'melon-galia', 'Galia', { diasCosecha: [75, 95] }],
  ['sandia', 'sandia-rayada', 'Rayada', {}],
  ['sandia', 'sandia-negra', 'Negra', {}],
  ['judia', 'judia-plana', 'Verde plana', {}],
  ['judia', 'judia-redonda', 'Verde redonda', {}],
  ['judia', 'judia-morada', 'Morada', {}],
  ['guisante', 'guisante-lagrima', 'Lágrima', {}],
  ['guisante', 'guisante-tirabeque', 'Tirabeque', { diasCosecha: [70, 90] }],
  ['haba', 'haba-muchamiel', 'Muchamiel', {}],
  ['lechuga', 'lechuga-romana', 'Romana', {}],
  ['lechuga', 'lechuga-iceberg', 'Iceberg', { diasCosecha: [60, 80] }],
  ['lechuga', 'lechuga-roble', 'Hoja de roble', { diasCosecha: [40, 55] }],
  ['lechuga', 'lechuga-maravilla', 'Maravilla', {}],
  ['lechuga', 'lechuga-lollo', 'Lollo rosso', { diasCosecha: [40, 55] }],
  ['escarola', 'escarola', '', {}],
  ['rucula', 'rucula', '', {}],
  ['canonigos', 'canonigos', '', {}],
  ['espinaca', 'espinaca', '', {}],
  ['acelga', 'acelga-blanca', 'Blanca', {}],
  ['acelga', 'acelga-roja', 'Roja', {}],
  ['col', 'col-repollo', 'Repollo', { cultivo: 'Repollo' }],
  ['col', 'col-lombarda', 'Lombarda', { cultivo: 'Lombarda' }],
  ['col', 'col-bruselas', 'de Bruselas', { diasCosecha: [120, 160] }],
  ['col', 'col-kale', 'Kale', { diasCosecha: [60, 90], cosecha: [10, 11, 12, 1, 2, 3, 4] }],
  ['col', 'brocoli', '', { cultivo: 'Brócoli', diasCosecha: [80, 100], siembra: [6, 7, 8, 9], trasplante: [7, 8, 9, 10], cosecha: [10, 11, 12, 1, 2, 3] }],
  ['col', 'coliflor', '', { cultivo: 'Coliflor', diasCosecha: [90, 120], siembra: [5, 6, 7, 8], trasplante: [7, 8, 9], cosecha: [10, 11, 12, 1, 2, 3], dificultad: 'Difícil' }],
  ['col', 'romanesco', '', { cultivo: 'Romanesco', diasCosecha: [90, 120], siembra: [5, 6, 7], trasplante: [7, 8, 9], cosecha: [10, 11, 12, 1, 2], dificultad: 'Difícil' }],
  ['cebolla', 'cebolla-blanca', 'Blanca', {}],
  ['cebolla', 'cebolla-morada', 'Morada', {}],
  ['cebolla', 'cebolla-chalota', 'Chalota', { cultivo: 'Chalota', siembra: [10, 11, 12, 1, 2], trasplante: [], diasCosecha: [120, 180] }],
  ['cebolleta', 'cebolleta', '', {}],
  ['puerro', 'puerro', '', {}],
  ['ajo', 'ajo-blanco', 'Blanco', {}],
  ['ajo', 'ajo-morado', 'Morado', {}],
  ['zanahoria', 'zanahoria-nantesa', 'Nantesa', {}],
  ['zanahoria', 'zanahoria-morada', 'Morada', {}],
  ['remolacha', 'remolacha', '', {}],
  ['rabano', 'rabano-redondo', 'Redondo', {}],
  ['rabano', 'rabano-daikon', 'Daikon', { diasCosecha: [50, 70], siembra: [8, 9, 10], cosecha: [10, 11, 12, 1] }],
  ['nabo', 'nabo', '', {}],
  ['chirivia', 'chirivia', '', {}],
  ['patata', 'patata-monalisa', 'Monalisa', {}],
  ['patata', 'patata-kennebec', 'Kennebec', {}],
  ['patata', 'patata-roja', 'Roja', { diasCosecha: [100, 130] }],
  ['boniato', 'boniato', '', {}],
  ['apio', 'apio', '', {}],
  ['hinojo', 'hinojo', '', {}],
  ['alcachofa', 'alcachofa', '', {}],
  ['esparrago', 'esparrago', '', {}],
  ['maiz', 'maiz-dulce', 'Dulce', {}],
  ['albahaca', 'albahaca-genovesa', 'Genovesa', {}],
  ['albahaca', 'albahaca-morada', 'Morada', {}],
  ['perejil', 'perejil-liso', 'Liso', {}],
  ['perejil', 'perejil-rizado', 'Rizado', {}],
  ['cilantro', 'cilantro', '', {}],
  ['eneldo', 'eneldo', '', {}],
  ['romero', 'romero', '', {}],
  ['tomillo', 'tomillo', '', {}],
  ['oregano', 'oregano', '', {}],
  ['menta', 'menta', '', {}],
  ['menta', 'hierbabuena', '', { cultivo: 'Hierbabuena', especie: 'Mentha × piperita' }],
  ['salvia', 'salvia', '', {}],
  ['lavanda', 'lavanda', '', {}],
  ['cebollino', 'cebollino', '', {}],
  ['laurel', 'laurel', '', {}],
  ['fresa', 'fresa-freson', 'Fresón', {}],
  ['fresa', 'fresa-silvestre', 'Silvestre', { especie: 'Fragaria vesca', cosecha: [5, 6, 7, 8, 9] }],
  ['frambuesa', 'frambuesa', '', {}],
  ['mora', 'mora', '', {}],
  ['arandano', 'arandano', '', {}],
  ['grosella', 'grosella', '', {}],
  ['higuera', 'higuera', '', {}],
  ['limonero', 'limonero', '', {}],
  ['naranjo', 'naranjo', '', {}],
  ['manzano', 'manzano', '', {}],
  ['peral', 'peral', '', {}],
  ['melocotonero', 'melocotonero', '', {}],
  ['albaricoquero', 'albaricoquero', '', {}],
  ['ciruelo', 'ciruelo', '', {}],
  ['cerezo', 'cerezo', '', {}],
  ['almendro', 'almendro', '', {}],
  ['olivo', 'olivo', '', {}],
  ['vid', 'vid', '', {}],
  ['granado', 'granado', '', {}],
  ['kiwi', 'kiwi', '', {}],
  ['nispero', 'nispero', '', {}],
]

const construir = ([especieId, id, variedad, propios]) => {
  const base = { ...ESPECIES[especieId], ...propios }
  const foto = FOTOS[id]
  // Sin foto verificada no entra en la biblioteca: mejor menos entradas que una foto falsa.
  if (!foto) return null
  return {
    id,
    especieId,
    variedad,
    nombre: variedad && !propios.cultivo ? `${base.cultivo} ${variedad}` : base.cultivo,
    ...base,
    plagas: base.plagas.map((k) => P[k]),
    foto: foto.archivo,
    credito: foto,
  }
}

export const CROPS_LIBRARY = VARIEDADES.map(construir).filter(Boolean)

export const FAMILIAS = [...new Set(CROPS_LIBRARY.map((c) => c.familia))].sort((a, b) =>
  a.localeCompare(b, 'es'),
)
export const DIFICULTADES = ['Fácil', 'Media', 'Difícil']
export const TIPOS = { hortaliza: 'Hortalizas', aromatica: 'Aromáticas', frutal: 'Frutales' }
export const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
export const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

const porId = new Map(CROPS_LIBRARY.map((c) => [c.id, c]))
const porNombre = new Map(CROPS_LIBRARY.map((c) => [c.nombre.toLowerCase(), c]))

export const entradaPorId = (id) => porId.get(id) || null

// Entrada de la biblioteca de un cultivo del huerto. Los añadidos antes de existir
// `libraryId` se reconocen por su nombre exacto.
export const entradaDeCultivo = (cultivo) =>
  (cultivo?.libraryId && porId.get(cultivo.libraryId)) ||
  porNombre.get((cultivo?.nombre || '').toLowerCase()) ||
  null

// Primera variedad de una especie, para enlazar las asociaciones.
export const entradaDeEspecie = (especieId) =>
  CROPS_LIBRARY.find((c) => c.especieId === especieId) || null

export const nombreEspecie = (especieId) => ESPECIES[especieId]?.cultivo || especieId

export const variedadesDe = (especieId) => CROPS_LIBRARY.filter((c) => c.especieId === especieId)

// Búsqueda sin distinguir mayúsculas ni tildes: "calabacin" encuentra "Calabacín".
const normalizar = (t) =>
  (t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
const textoBusqueda = new Map(
  CROPS_LIBRARY.map((c) => [c.id, normalizar([c.nombre, c.cultivo, c.variedad, c.familia, c.especie].join(' '))]),
)
export function buscarBiblioteca(texto) {
  const palabras = normalizar(texto).split(/\s+/).filter(Boolean)
  if (!palabras.length) return CROPS_LIBRARY
  return CROPS_LIBRARY.filter((c) => palabras.every((p) => textoBusqueda.get(c.id).includes(p)))
}

// Se puede empezar este mes: en siembra o, si se planta de plantel, en trasplante.
export const sePuedeSembrar = (c, mes) => c.siembra.includes(mes) || c.trasplante.includes(mes)

// "60–75 días", o en años para los frutales y plantas que tardan más.
export function textoCosecha(c) {
  const [min, max] = c.diasCosecha
  if (min >= 365) {
    const a = (d) => Math.round((d / 365) * 2) / 2
    return `${String(a(min)).replace('.', ',')}–${String(a(max)).replace('.', ',')} años`
  }
  return `${min}–${max} días`
}

// Tareas que se ofrecen al añadir un cultivo. `dias` es cuándo tocan desde la
// siembra y `frecuencia`, cada cuánto se repiten (ver utils/tareas.js).
export function tareasRecomendadas(c) {
  const lista = []
  if (c.riego !== 'Sin riego') {
    // Con frecuencia, el título no la repite: se muestra aparte y puede cambiarse.
    const frecuencia = frecuenciaDeRiego(c.riego)
    const titulo = frecuencia ? 'Regar' : `Regar: ${c.riego.toLowerCase()}`
    lista.push({ clave: 'riego', titulo, dias: 1, frecuencia })
  }
  lista.push({ clave: 'abonado', titulo: 'Abonar con compost', dias: c.perenne ? 60 : 21, frecuencia: c.perenne ? '' : 'mensual' })
  if (c.plagas[0]) {
    lista.push({ clave: 'plagas', titulo: `Revisar plagas: ${c.plagas[0].nombre.toLowerCase()}`, dias: 14, frecuencia: 'semanal' })
  }
  c.extras.forEach((e, i) => lista.push({ clave: `extra-${i}`, titulo: e.titulo, dias: e.dias }))
  if (!c.perenne) {
    lista.push({ clave: 'cosecha', titulo: 'Empezar a cosechar', dias: c.diasCosecha[0] })
  }
  return lista
}
