export const comparisonCase = {
  title: 'Detectives del Chaco', beforeYear: 1985, afterYear: 2025,
  before: 'data/chaco-compare-1985.jpg', after: 'data/chaco-compare-2025.jpg',
  source: 'https://svs.gsfc.nasa.gov/15026/',
  // Manually selected teaching areas; image coordinates, not automatic detection.
  areas: [
    [[.29,.34],[.36,.32],[.43,.43],[.39,.51],[.31,.47]],
    [[.21,.54],[.31,.51],[.35,.61],[.27,.69],[.20,.61]]
  ],
  focus: { x: .35, y: .42 },
  hints: [
    'Buscá sectores que eran oscuros en 1985 y se ven más claros en 2025.',
    'Mirá el centro de la imagen, un poco hacia la izquierda. Allí aparecen claros grandes.',
    'La zona señalada es una buena pista. Compará cómo cambia el terreno en ese lugar.'
  ]
};
export function initialComparison() {
  return { phase: 'explore', split: 50, explored: false, hints: 0, misses: 0, point: null, answer: null };
}
export function setComparisonSplit(state, value) {
  if (!Number.isFinite(value)) return state;
  const split = Math.max(0, Math.min(100, value));
  return { ...state, split, explored: state.explored || Math.abs(split - 50) >= 20 };
}
export function startComparisonSearch(state) {
  return state.phase === 'explore' && state.explored ? { ...state, phase: 'select' } : state;
}
function inPolygon(x, y, points) {
  let inside = false;
  for (let i=0,j=points.length-1;i<points.length;j=i++) {
    const [xi,yi]=points[i], [xj,yj]=points[j];
    if ((yi>y)!==(yj>y) && x<(xj-xi)*(y-yi)/(yj-yi)+xi) inside=!inside;
  }
  return inside;
}
export function markComparisonChange(state, x, y) {
  if (state.phase !== 'select' || !Number.isFinite(x) || !Number.isFinite(y)) return state;
  if (!comparisonCase.areas.some(area => inPolygon(x,y,area))) return { ...state, misses: state.misses + 1 };
  return { ...state, phase: 'interpret', point: { x,y }, answer: null };
}
export function requestComparisonHint(state) {
  return state.phase === 'select' ? { ...state, hints: Math.min(comparisonCase.hints.length, state.hints+1) } : state;
}
export function answerComparison(state, answer) {
  if (state.phase !== 'interpret' || !['vegetation','water','growth'].includes(answer)) return state;
  return { ...state, answer, phase: answer === 'vegetation' ? 'complete' : 'interpret' };
}
