import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { ASUNCION, CHACO_TARGET, atGate, changeSpeed, initialFlight, pauseFlight, routePosition, startFlight, tickFlight } from '../src/game/chaco-flight.js';

test('El vuelo se detiene en cada oportunidad incluso con un salto grande de tiempo', () => {
  let flight = tickFlight(startFlight(initialFlight()), 100);
  assert.equal(flight.gate, 1); assert.equal(flight.progress, .25); assert.equal(flight.running, false);
  assert.deepEqual(routePosition(flight.progress), CHACO_TARGET);
  flight = tickFlight(startFlight(flight), 100);
  assert.equal(flight.gate, 2); assert.deepEqual(routePosition(flight.progress), CHACO_TARGET);
  flight = tickFlight(startFlight(flight), 100);
  assert.equal(flight.gate, 3); assert.deepEqual(routePosition(1), ASUNCION);
  assert.equal(startFlight(flight).running, false);
});
test('Pausar congela el recorrido y reanudar no salta ninguna oportunidad', () => {
  const moving = tickFlight(startFlight(initialFlight()), 2);
  const paused = pauseFlight(moving);
  assert.equal(atGate(paused), false);
  assert.deepEqual(tickFlight(paused, 100), paused);
  const resumed = tickFlight(startFlight(paused), 1);
  assert.ok(resumed.progress > paused.progress); assert.equal(resumed.gate, 0);
});
test('La velocidad visual no cambia el orden de etapas y las coordenadas se limitan', () => {
  const base = initialFlight();
  const faster = tickFlight(startFlight(changeSpeed(base)), 1);
  const normal = tickFlight(startFlight(base), 1);
  assert.equal(faster.progress, normal.progress * 2);
  assert.deepEqual(routePosition(-1), ASUNCION); assert.deepEqual(routePosition(2), ASUNCION);
  assert.deepEqual(tickFlight(base, NaN), base);
});

test('La zona de observación se encuentra dentro de Paraguay en la cartografía distribuida', () => {
  const data=JSON.parse(readFileSync(new URL('../public/data/paraguay-region.geojson',import.meta.url),'utf8'));
  const country=data.features.find(f=>f.properties.code==='PRY');assert.ok(country);
  const polygons=country.geometry.type==='MultiPolygon'?country.geometry.coordinates:[country.geometry.coordinates];
  const inside=ring=>{let hit=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const [xi,yi]=ring[i],[xj,yj]=ring[j],[x,y]=CHACO_TARGET;
    if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)hit=!hit;
  }return hit;};
  assert.ok(polygons.some(polygon=>inside(polygon[0])&&!polygon.slice(1).some(inside)));
});

test('Los recursos locales coinciden con los hashes de procedencia y los años del caso NASA', () => {
  const meta=JSON.parse(readFileSync(new URL('../public/data/sources.json',import.meta.url),'utf8'));
  for(const [file,source]of [['paraguay-region.geojson',meta.boundaries],['paraguay-bluemarble.jpg',meta.raster],['chaco-landsat-nasa.mp4',meta.caseStudy]]){
    const bytes=readFileSync(new URL(`../public/data/${file}`,import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),source.sha256,file);
  }
  assert.deepEqual(meta.caseStudy.years,[1985,2025]);
  assert.ok(meta.caseStudy.page.startsWith('https://svs.gsfc.nasa.gov/'));
});
