import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { answerComparison, comparisonCase, initialComparison, markComparisonChange, MIN_BRUSH_LENGTH } from '../src/game/chaco-comparison.js';

test('The brush needs two separate findings before the question opens', () => {
  const start = initialComparison();
  assert.deepEqual(markComparisonChange(start, { x: .35, y: .42 }, .01), start);
  const first = markComparisonChange(start, { x: .35, y: .42 }, MIN_BRUSH_LENGTH);
  assert.equal(first.phase, 'explore');
  assert.equal(first.findings.length, 1);
  const close = markComparisonChange(first, { x: .38, y: .45 }, .2);
  assert.equal(close.misses, 1);
  assert.equal(close.findings.length, 1);
  const second = markComparisonChange(close, { x: .27, y: .66 }, .2);
  assert.equal(second.phase, 'interpret');
  assert.equal(second.findings.length, 2);
  assert.deepEqual(markComparisonChange(second, { x: .9, y: .9 }, .2), second);
});
test('Invalid points do not create findings and interpretation can be retried', () => {
  const start = initialComparison();
  assert.deepEqual(markComparisonChange(start, { x: -1, y: .5 }, .2), start);
  assert.deepEqual(markComparisonChange(start, { x: Infinity, y: .5 }, .2), start);
  const first = markComparisonChange(start, { x: .35, y: .42 }, .2);
  const ready = markComparisonChange(first, { x: .27, y: .66 }, .2);
  const wrong = answerComparison(ready, 'water');
  assert.equal(wrong.phase, 'interpret');
  const complete = answerComparison(wrong, 'vegetation');
  assert.equal(complete.phase, 'complete');
  assert.deepEqual(answerComparison(complete, 'growth'), complete);
});
test('Los fotogramas conservan su procedencia, fechas y hashes de archivo', () => {
  const meta=JSON.parse(readFileSync(new URL('../public/data/sources.json',import.meta.url),'utf8')).comparison;
  assert.equal(meta.sourcePage,comparisonCase.source);
  assert.equal(meta.status,'preliminary-frames-final-image-review-pending');
  for (const [side,year] of [['before',1985],['after',2025]]) {
    const frame=meta[side];
    const bytes=readFileSync(new URL(`../public/${frame.file}`,import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),frame.sha256);
    assert.equal(frame.year,year);
    assert.ok(frame.videoSecond>=0 && frame.videoSecond<7.4);
  }
  assert.notEqual(meta.before.sha256,meta.after.sha256);
});
