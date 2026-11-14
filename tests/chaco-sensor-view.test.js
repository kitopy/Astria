import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sensorArchiveView } from '../src/game/chaco-sensor-view.js';
import { comparisonCase } from '../src/game/chaco-comparison.js';

test('El visor y la galería usan el mismo antes y después, sin ampliar el mapa regional', () => {
  const first=sensorArchiveView(.25), second=sensorArchiveView(.75);
  assert.equal(first.source,comparisonCase.before); assert.equal(first.year,1985);
  assert.equal(second.source,comparisonCase.after); assert.equal(second.year,2025);
  assert.equal(first.outputWidth,640); assert.equal(sensorArchiveView(.75,2).outputWidth,960);
});
test('El paneo y reencuadre permanecen dentro de la imagen y conservan su proporción', () => {
  for (const quality of [1,2]) for (const adjustment of [0,.5,1]) for (let i=0;i<=100;i++) {
    const {crop,outputWidth}=sensorArchiveView(i/100,quality,adjustment);
    assert.ok(crop.x>=0 && crop.y>=0);
    assert.ok(crop.x+crop.width<=1.000001 && crop.y+crop.height<=1.000001);
    assert.equal(crop.width,crop.height);
    assert.ok(crop.width*1920>=outputWidth,'the source is downsampled, not enlarged from a handful of map pixels');
  }
  assert.notDeepEqual(sensorArchiveView(.1).crop,sensorArchiveView(.25).crop);
  assert.equal(sensorArchiveView(NaN).year,1985);
});
