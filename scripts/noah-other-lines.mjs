// NOAH's lines outside the workshop, for the voice generator (scripts/generate-noah-voice.mjs).
//
// These texts live in the scenes (which need Phaser and the browser, so Node can't import them).
// They are copied here: fixed lines as they are, and the ones that change with the satellite design
// or the random obstacle are expanded for every possible case (16 designs × 3 obstacles).
// If a scene changes a text, that line just falls back to the browser voice until this list is
// updated and `npm run voice` is run again — nothing breaks.
import { readFileSync } from 'node:fs';
import { kinds, stats } from '../src/game/model.js';
import { OBSTACLES, REFRAME_ENERGY } from '../src/game/chaco-visibility.js';

const catalog = JSON.parse(readFileSync(new URL('../src/game/parts.json', import.meta.url), 'utf8'));

// Every satellite design: one option per part type (2 × 2 × 2 × 2 = 16).
function allDesigns() {
  let designs = [{}];
  for (const kind of kinds) {
    designs = designs.flatMap((d) => catalog[kind].options.map((part) => ({ ...d, [kind]: part.id })));
  }
  return designs;
}

// StationScene (mission briefing)
const station = [
  'Hola, exploradores. Soy NOAH. El bosque del Chaco paraguayo está cambiando: vamos a construir un satélite para fotografiarlo desde el espacio.',
];

// TestScene + game logic errors (Cesar's flight over the Chaco)
const flight = [
  'Vamos a explorar el Chaco con imágenes de archivo de 1985 y 2025. El viaje recrea dos observaciones: cuidá la energía y enviá las dos fotos.',
  // ui/satellite-sensor.js (error messages, rare)
  'No se pudieron preparar las imágenes del Chaco. Recargá la página para reintentar.',
  'La cámara todavía está preparando la vista. Esperá un momento.',
  'No se pudo preparar una parte del mapa. Podés volver al taller o recargar la página.',
  '¡En marcha! Seguí tu satélite hasta el bosque del Chaco paraguayo.',
  'Seguimos el recorrido. Las observaciones se obtienen en pasos separados, con el tiempo acelerado para este juego.',
  'Vuelo en pausa. Podés revisar la batería y los datos con calma. Reanudá cuando quieras.',
  'Llegamos al bosque del Chaco. El recorrido se detuvo: activá Observar para obtener la primera imagen.',
  'Segunda pasada. En este paso ilustramos al satélite en sombra: no hay recarga solar. La cámara funciona con la batería.',
  'Llegamos a la segunda pasada, pero la batería no alcanza para esta cámara. Podés continuar hasta la estación y revisar el diseño al terminar.',
  'Estamos en la ventana de comunicación con nuestra estación ficticia de Asunción. Transmití las imágenes antes de ver los resultados.',
  'Llegamos al contacto terrestre, pero falta energía para la antena. Los resultados te ayudarán a mejorar el diseño.',
  'Este imprevisto ya está resuelto o todavía no necesita un ajuste.',
  'Falta energía para el ajuste. Volvé al taller y revisá la batería.',
  'Esta observación ya terminó o todavía no está disponible.',
  'Falta energía para la cámara. Podés avanzar y revisar tu diseño al terminar.',
  'La ventana de transmisión no está disponible.',
  'Todavía no hay imágenes para transmitir. Podés cerrar la misión y volver al taller.',
  'Falta energía para transmitir. Cerrá la misión para revisar qué mejorar.',
];
for (const info of Object.values(OBSTACLES)) {
  flight.push(
    `${info.explanation} El ajuste usa ${REFRAME_ENERGY} de energía.`,
    `${info.label}. ${info.message} Resolverlo cuesta ${REFRAME_ENERGY} de energía.`,
    `${info.resolved} El ajuste consumió ${REFRAME_ENERGY} de energía. Cuidá la reserva que queda.`,
  );
}
for (const design of allDesigns()) {
  const s = stats(catalog, design);
  flight.push(`¡Imagen obtenida! La cámara usó ${s.cameraPower} de energía y generó ${s.data} ${s.data === 1 ? 'bloque' : 'bloques'} de datos. Ahora necesitamos llevar esa información a la Tierra.`);
}
for (const delivered of [0, 1, 2]) {
  flight.push(
    `En Asunción recibimos ${delivered} imágenes completas. Quedaron datos a bordo. Una antena de mayor capacidad puede ayudar en otro intento.`,
    `En Asunción recibimos ${delivered} imágenes completas. ¡Lograste entregar tus observaciones!`,
  );
}

// RewardScene
const reward = [
  '¡Lo lograste! Las dos fotos llegaron a la Tierra.',
  'Los resultados nos ayudan a diseñar mejor. Guardé tus piezas para que puedas ajustar tu satélite.',
];

// ObserveScene brush investigation
const observe = [
  '¡Buen ojo! Primer hallazgo registrado. ¡Vamos por el segundo!',
  '¡Lo lograste! Los dos hallazgos están listos. ¿Qué descubriste?',
  'Podés pintar sin apuro. Elegí un sector que te llame la atención.',
  'Ya podés marcar este lugar como hallazgo.',
  'Buscá otro sector, más lejos del primero.',
  'Primer hallazgo marcado. Explorá otra parte de la imagen.',
  'Los dos lugares están listos. ¿Qué cambió entre 1985 y 2025?',
  'Mirá otra vez: ¿en qué año se ve más bosque continuo?',
  'El bosque de 1985 se ve más continuo. En 2025 aparecen claros y parcelas.',
  'No se pudieron cargar las imágenes. Volvé a resultados y probá otra vez.',
];

// FinaleScene
const finale = [
  '¡Gracias, explorador! Vos también podés explorar el universo.',
];

export const otherLines = [...station, ...flight, ...reward, ...observe, ...finale];
