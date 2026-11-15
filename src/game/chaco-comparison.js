export const comparisonCase = {
  title: 'Detectives del Chaco', beforeYear: 1985, afterYear: 2025,
  before: 'data/chaco-compare-1985.jpg', after: 'data/chaco-compare-2025.jpg',
  source: 'https://svs.gsfc.nasa.gov/15026/',
  // NASA identifies the region, but does not give coordinates for this displayed crop.
};
export const MIN_BRUSH_LENGTH = .08;
const MIN_FINDING_DISTANCE = .18;
export function initialComparison() {
  return { phase: 'explore', findings: [], misses: 0, answer: null };
}
export function markComparisonChange(state, point, paintedLength) {
  // A finding records a place the player inspected, not an automatic land-cover classification.
  if (state.phase !== 'explore' || !Number.isFinite(paintedLength) || paintedLength < MIN_BRUSH_LENGTH) return state;
  if (!Number.isFinite(point?.x) || !Number.isFinite(point?.y)) return state;
  if (point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) return state;
  const previous = state.findings[0];
  if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) < MIN_FINDING_DISTANCE) {
    return { ...state, misses: state.misses + 1 };
  }
  const findings = [...state.findings, { x: point.x, y: point.y }];
  return { ...state, findings, phase: findings.length === 2 ? 'interpret' : 'explore' };
}
export function answerComparison(state, answer) {
  if (state.phase !== 'interpret' || !['vegetation','water','growth'].includes(answer)) return state;
  return { ...state, answer, phase: answer === 'vegetation' ? 'complete' : 'interpret' };
}
