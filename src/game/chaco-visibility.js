import { pauseFlight, tickFlight } from './chaco-flight.js';

export const CLOUD_PROGRESS = .45;
export const REFRAME_ENERGY = 6;
const REFRAME_SECONDS = 2;
const HISTORY_KEY = 'astria:last-obstacle';

export const OBSTACLES = {
  clouds: {
    short: 'Las nubes tapan el bosque.', // one line for the warning dialog
    progress: CLOUD_PROGRESS, warning: .36, label: 'Nubes sobre el terreno',
    title: '¡La vista está cubierta!', action: 'Buscar un claro', working: 'Buscando un claro…',
    message: 'Pausamos el viaje. Ajustá el encuadre y reservá energía para tus fotos.',
    explanation: 'La cámara cambia de orientación. Las nubes siguen sobre el terreno.',
    resolved: '¡Visibilidad recuperada! El nuevo encuadre está listo.', log: 'Nubes en el trayecto: reencuadre del sensor'
  },
  camera: {
    short: 'La cámara se mueve y la foto sale borrosa.', // one line for the warning dialog
    progress: .45, warning: .36, label: 'Cámara inestable',
    title: '¡La imagen está temblando!', action: 'Estabilizar cámara', working: 'Estabilizando cámara…',
    message: 'El sensor necesita estabilizarse antes de la próxima foto. Ajustalo para recuperar una imagen firme.',
    explanation: 'Los controles de orientación estabilizan el sensor. Mirá cómo deja de temblar la imagen.',
    resolved: '¡Cámara estable! Ya podés seguir hacia la segunda foto.', log: 'Cámara inestable: estabilización del sensor'
  },
  signal: {
    short: 'La antena no encuentra la estación.', // one line for the warning dialog
    progress: .9, warning: .82, label: 'Señal débil',
    title: '¡La señal está muy baja!', action: 'Alinear antena', working: 'Alineando antena…',
    message: 'Estamos cerca del contacto terrestre. Reorientá la antena para preparar el envío de tus fotos.',
    explanation: 'La antena busca la estación terrestre. Las barras muestran cómo mejora la señal.',
    resolved: '¡Señal recuperada!', log: 'Señal débil: alineación de la antena'
  }
};

export function obstacleInfo(visibility) { return OBSTACLES[visibility.kind] ?? OBSTACLES.clouds; }

export function chooseObstacle(previous, random = Math.random) {
  const choices = Object.keys(OBSTACLES).filter(kind => kind !== previous);
  return choices[Math.min(choices.length - 1, Math.floor(Math.max(0, random()) * choices.length))];
}

// Persist only the last draw, so reloading does not restart a fixed sequence.
export function drawObstacle(storage, fallback, random = Math.random) {
  let previous = fallback;
  if (!Object.hasOwn(OBSTACLES, previous)) {
    try { previous = storage?.getItem(HISTORY_KEY) ?? previous; } catch { /* Registry fallback when storage is blocked. */ }
  }
  const kind = chooseObstacle(previous, random);
  try { storage?.setItem(HISTORY_KEY, kind); } catch { /* The scene registry still remembers this attempt. */ }
  return kind;
}

export function initialVisibility(kind = 'clouds') {
  return { kind: Object.hasOwn(OBSTACLES, kind) ? kind : 'clouds', status: 'approaching', adjustment: 0 };
}

// Stop between observations, even at ×2 or after a long frame.
export function tickVisibility(flight, visibility, seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return { flight, visibility };
  if (visibility.status === 'blocked') return { flight: pauseFlight(flight), visibility };
  if (visibility.status === 'adjusting') {
    const adjustment = Math.min(1, visibility.adjustment + seconds / REFRAME_SECONDS);
    return {
      flight: pauseFlight(flight),
      visibility: { ...visibility, status: adjustment === 1 ? 'clear' : 'adjusting', adjustment }
    };
  }
  const next = tickFlight(flight, seconds);
  if (visibility.status === 'approaching' && next.progress >= obstacleInfo(visibility).progress) {
    return {
      flight: { ...next, progress: obstacleInfo(visibility).progress, gate: flight.gate, running: false },
      visibility: { ...visibility, status: 'blocked', adjustment: 0 }
    };
  }
  return { flight: next, visibility };
}

export function beginReframe(mission, visibility) {
  if (visibility.status !== 'blocked') throw new Error('Este imprevisto ya está resuelto o todavía no necesita un ajuste.');
  if (mission.energy < REFRAME_ENERGY) throw new Error('Falta energía para el ajuste. Volvé al taller y revisá la batería.');
  return {
    mission: {
      ...mission, energy: mission.energy - REFRAME_ENERGY,
      log: [...mission.log, `${obstacleInfo(visibility).log}, −${REFRAME_ENERGY} de energía.`]
    },
    visibility: { ...visibility, status: 'adjusting', adjustment: 0 }
  };
}

export function obstacleIntensity(flight, visibility) {
  if (visibility.status === 'clear') return 0;
  if (visibility.status === 'adjusting') return 1 - visibility.adjustment;
  const { warning, progress } = obstacleInfo(visibility);
  return Math.max(0, Math.min(1, (flight.progress - warning) / (progress - warning)));
}

export function cloudCover(flight, visibility) {
  return !visibility.kind || visibility.kind === 'clouds' ? obstacleIntensity(flight, visibility) : 0;
}
