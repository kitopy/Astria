import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { answerComparison, comparisonCase, initialComparison, markComparisonChange, requestComparisonHint, setComparisonSplit, startComparisonSearch } from '../src/game/chaco-comparison.js';

const searching = () => startComparisonSearch(setComparisonSplit(initialComparison(),0));
test('Primero se explora la comparación; la barra tiene límites y no adelanta las respuestas', () => {
  const start = initialComparison();
  assert.deepEqual(startComparisonSearch(start),start);
  assert.equal(setComparisonSplit(start,1000).split,100);
  assert.equal(setComparisonSplit(start,-5).split,0);
  assert.deepEqual(setComparisonSplit(start,NaN),start);
  assert.equal(searching().phase,'select');
  assert.equal(markComparisonChange(start,.35,.42).phase,'explore');
  assert.equal(answerComparison(start,'vegetation').phase,'explore');
});
test('Se puede reintentar y pedir pistas sin bloquear la investigación', () => {
  let state = markComparisonChange(searching(),.96,.94);
  assert.equal(state.phase,'select'); assert.equal(state.misses,1);
  for (let i=0;i<8;i++) state=requestComparisonHint(state);
  assert.equal(state.hints,3);
  state=markComparisonChange(state,comparisonCase.focus.x,comparisonCase.focus.y);
  assert.equal(state.phase,'interpret');
  assert.deepEqual(state.point,comparisonCase.focus);
  const wrong=answerComparison(state,'water');
  assert.equal(wrong.phase,'interpret');
  const complete=answerComparison(wrong,'vegetation');
  assert.equal(complete.phase,'complete');
  assert.equal(complete.misses,1);
  assert.deepEqual(answerComparison(complete,'growth'),complete);
});
test('Las áreas didácticas aceptan más de un claro y rechazan puntos inválidos', () => {
  assert.equal(markComparisonChange(searching(),.35,.42).phase,'interpret');
  assert.equal(markComparisonChange(searching(),.27,.60).phase,'interpret');
  assert.equal(markComparisonChange(searching(),-.1,.4).phase,'select');
  const start=searching(); assert.deepEqual(markComparisonChange(start,Infinity,.4),start);
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
