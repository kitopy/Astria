// Coordenadas geográficas reales; recorrido, velocidad y oportunidades de juego simulados.
export const ASUNCION = [-57.635, -25.30];
export const CHACO_TARGET = [-60.6, -22.3];
export const ROUTE = [ASUNCION, [-59.3, -24.3], CHACO_TARGET, [-61.1, -21.6], [-60.1, -21.0], [-59.8, -21.8], CHACO_TARGET, [-59.2, -24.1], ASUNCION];
export const STOPS = [0, .25, .75, 1];
export const FLIGHT_SECONDS = 20; // whole route at ×1; the game plays at ×2, so about 10 s of flying in total

export function initialFlight() { return { progress: 0, gate: 0, running: false, speed: 1 }; }
export function startFlight(flight) { return flight.gate === 3 ? flight : { ...flight, running: true }; }
export function pauseFlight(flight) { return { ...flight, running: false }; }
export function changeSpeed(flight) { return { ...flight, speed: flight.speed === 1 ? 2 : 1 }; }
export function tickFlight(flight, seconds) {
  if (!flight.running || seconds <= 0 || !Number.isFinite(seconds)) return flight;
  const next = Math.min(3, flight.gate + 1);
  const progress = Math.min(STOPS[next], flight.progress + seconds * flight.speed / FLIGHT_SECONDS);
  return progress >= STOPS[next]
    ? { ...flight, progress: STOPS[next], gate: next, running: false }
    : { ...flight, progress };
}
export function routePosition(progress) {
  const offset = Math.max(0, Math.min(1, progress)) * (ROUTE.length - 1);
  const index = Math.min(ROUTE.length - 2, Math.floor(offset)), ratio = offset - index;
  return ROUTE[index].map((value, axis) => value + (ROUTE[index + 1][axis] - value) * ratio);
}
export function atGate(flight) { return !flight.running && Math.abs(flight.progress - STOPS[flight.gate]) < 1e-6; }
