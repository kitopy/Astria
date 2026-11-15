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

// TestScene (flight over the Chaco)
const flight = [
  'Vamos a ver el bosque del Chaco en 1985 y hoy.',
  'Llegamos al bosque del Chaco.',
  '¡Foto guardada!',
  'Segunda pasada, en la sombra: la cámara usa la batería.',
  'No queda batería para otra foto. Volvemos a Asunción.',
  'Llegamos a Asunción. ¡Enviá tus fotos!',
  'Llegamos a Asunción, pero no queda energía para enviar.',
  '¡Un imprevisto!',
  ...Object.values(OBSTACLES).map((o) => o.resolved), // the explanations are only shown (the fix is too short)
  '¡Llegaron las dos fotos!',
  'Llegaron 0 de 2 fotos. La antena no alcanzó para enviar todo.',
  'Llegaron 1 de 2 fotos. La antena no alcanzó para enviar todo.',
];

// Image analysis (Cesar's lens screen, ui/chaco-brush.js)
const observe = [
  '¡Buen ojo! ¡Vamos por el segundo!',
  '¡Lo lograste!',
  'Buscá otro sector, más lejos del primero.',
];

export const otherLines = [...station, ...flight, ...observe];
