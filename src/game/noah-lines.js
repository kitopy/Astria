// NOAH's lines that depend on the satellite parts (the workshop), plus the helpers that link a
// line to its pre-recorded audio. Pure JavaScript (no Phaser, no browser): the voice generator
// script (scripts/generate-noah-voice.mjs) imports this file too.

// One sentence per part: what it does in the mission.
export const PART_TEXT = {
  camera: 'Esta cámara fotografía el Chaco desde el espacio. Sus imágenes nos ayudan a descubrir cómo cambia el bosque.',
  solar: 'Los paneles dan energía con la luz del Sol.',
  battery: 'La batería guarda energía para cuando no hay sol.',
  antenna: 'La antena envía las fotos a la Tierra.',
};

export function partIntro(kind, alreadyPlaced) {
  return `${PART_TEXT[kind]} ${alreadyPlaced ? 'Podés cambiarla por la otra.' : 'Arrastrá una al satélite.'}`;
}

export function mountLine(part, changed) {
  return `${changed ? '¡Cambiada!' : '¡Montada!'} ${part.name}: ${part.benefit.toLowerCase()}, pero ${part.tradeoff.toLowerCase()}.`;
}

export function reviewLine(valid, reframeEnergy) {
  return valid
    ? `Hacé la cuenta: ¿alcanza para dos fotos, resolver un imprevisto (−${reframeEnergy}) y el envío?`
    : 'Supera el límite del cohete. Tocá una pieza abajo para cambiarla.';
}

// Every workshop line that can ever be said, for every part (used by the voice generator).
export function workshopLines(catalog, reframeEnergy) {
  const lines = [reviewLine(true, reframeEnergy), reviewLine(false, reframeEnergy)];
  for (const kind of Object.keys(PART_TEXT)) {
    lines.push(partIntro(kind, false), partIntro(kind, true));
    for (const part of catalog[kind].options) lines.push(mountLine(part, false), mountLine(part, true));
  }
  return lines;
}

// ---------- Link between a line and its audio file ----------

// What is actually spoken: without the "NOAH // TITLE" label line and with tidy spaces.
export function speechText(text) {
  return text.replace(/^NOAH \/\/ .*\n/, '').replace(/\s+/g, ' ').trim();
}

// Short id for a line, computed from its spoken text (FNV-1a hash). The audio of a line is
// public/assets/voice/<key>.mp3, so changing a line's text simply makes it fall back to the
// browser voice until it is generated again.
export function voiceKey(text) {
  let hash = 0x811c9dc5;
  for (const char of speechText(text)) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}
