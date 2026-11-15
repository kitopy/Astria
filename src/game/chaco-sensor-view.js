import { comparisonCase } from './chaco-comparison.js';

// An animated archive view, deliberately separate from the illustrative map route.
export function sensorArchiveView(progress, quality = 1, adjustment = 0) {
  const p = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  const width = quality === 2 ? 1 / 1.18 : 1 / 1.10;
  const margin = 1 - width;
  const pan = Math.max(0, Math.min(1, .5 + Math.sin(p * Math.PI * 2) * .4 + adjustment * .2));
  const before = p < .5;
  return {
    year: before ? comparisonCase.beforeYear : comparisonCase.afterYear,
    source: before ? comparisonCase.before : comparisonCase.after,
    outputWidth: quality === 2 ? 960 : 640,
    crop: { x: margin * pan, y: margin * (.5 + Math.cos(p * Math.PI * 2) * .3), width, height: width }
  };
}
