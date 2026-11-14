import { pauseFlight, tickFlight } from './chaco-flight.js';

export const CLOUD_PROGRESS = .45;
export const REFRAME_ENERGY = 6;
const REFRAME_SECONDS = 2;

export function initialVisibility() {
  return { status: 'approaching', adjustment: 0 };
}

// Stop between observations, even at ×2 or after a long frame.
export function tickVisibility(flight, visibility, seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return { flight, visibility };
  if (visibility.status === 'blocked') return { flight: pauseFlight(flight), visibility };
  if (visibility.status === 'adjusting') {
    const adjustment = Math.min(1, visibility.adjustment + seconds / REFRAME_SECONDS);
    return {
      flight: pauseFlight(flight),
      visibility: { status: adjustment === 1 ? 'clear' : 'adjusting', adjustment }
    };
  }
  const next = tickFlight(flight, seconds);
  if (visibility.status === 'approaching' && next.progress >= CLOUD_PROGRESS) {
    return {
      flight: { ...next, progress: CLOUD_PROGRESS, gate: flight.gate, running: false },
      visibility: { status: 'blocked', adjustment: 0 }
    };
  }
  return { flight: next, visibility };
}

export function beginReframe(mission, visibility) {
  if (visibility.status !== 'blocked') throw new Error('El encuadre ya está ajustado o todavía no necesita un cambio.');
  if (mission.energy < REFRAME_ENERGY) throw new Error('Falta energía para reencuadrar. Volvé al taller y revisá la batería.');
  return {
    mission: {
      ...mission, energy: mission.energy - REFRAME_ENERGY,
      log: [...mission.log, `Nubes en el trayecto: reencuadre del sensor, −${REFRAME_ENERGY} de energía.`]
    },
    visibility: { status: 'adjusting', adjustment: 0 }
  };
}

export function cloudCover(flight, visibility) {
  if (visibility.status === 'clear') return 0;
  if (visibility.status === 'adjusting') return 1 - visibility.adjustment;
  return Math.max(0, Math.min(1, (flight.progress - .36) / (CLOUD_PROGRESS - .36)));
}
