import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initialFlight, startFlight } from '../src/game/chaco-flight.js';
import { beginReframe, CLOUD_PROGRESS, cloudCover, initialVisibility, REFRAME_ENERGY, tickVisibility } from '../src/game/chaco-visibility.js';
import { advance, capture, initialDesign, launch, stats, transmit } from '../src/game/model.js';

const catalog = JSON.parse(readFileSync(new URL('../src/game/parts.json', import.meta.url), 'utf8'));

function reachClouds() {
  const firstPass = tickVisibility({ ...startFlight(initialFlight()), speed: 2 }, initialVisibility(), 100);
  assert.equal(firstPass.flight.gate, 1);
  assert.equal(firstPass.visibility.status, 'approaching');
  return tickVisibility(startFlight(firstPass.flight), firstPass.visibility, 100);
}

test('Las nubes detienen el viaje entre fotos y no se saltan con velocidad alta', () => {
  const next = reachClouds();
  assert.equal(next.flight.progress, CLOUD_PROGRESS);
  assert.equal(next.flight.gate, 1);
  assert.equal(next.flight.running, false);
  assert.equal(next.visibility.status, 'blocked');
  assert.equal(cloudCover(next.flight, next.visibility), 1);
  assert.deepEqual(tickVisibility(startFlight(next.flight), next.visibility, 100), next);
});

test('Reencuadrar cobra una sola vez, no permite energía negativa y conserva los datos', () => {
  const s = stats(catalog, initialDesign), mission = launch(s);
  const blocked = { status: 'blocked', adjustment: 0 };
  const adjusted = beginReframe(mission, blocked);
  assert.equal(adjusted.mission.energy, mission.energy - REFRAME_ENERGY);
  assert.deepEqual(adjusted.mission.photos, mission.photos);
  assert.equal(mission.energy, s.capacity);
  assert.throws(() => beginReframe(adjusted.mission, adjusted.visibility));
  assert.throws(() => beginReframe({ ...mission, energy: REFRAME_ENERGY - 1 }, blocked));
  assert.equal(beginReframe({ ...mission, energy: REFRAME_ENERGY }, blocked).mission.energy, 0);
});

test('El ajuste recupera la visibilidad sin avanzar la órbita ni descontar energía por segundo', () => {
  const stopped = reachClouds();
  const adjusting = beginReframe(launch(stats(catalog, initialDesign)), stopped.visibility);
  const midway = tickVisibility(stopped.flight, adjusting.visibility, 1);
  assert.equal(midway.visibility.adjustment, .5);
  assert.equal(cloudCover(midway.flight, midway.visibility), .5);
  const done = tickVisibility(midway.flight, midway.visibility, 1);
  assert.equal(done.visibility.status, 'clear');
  assert.equal(done.flight.progress, CLOUD_PROGRESS);
  assert.equal(cloudCover(done.flight, done.visibility), 0);
  assert.deepEqual(tickVisibility(done.flight, done.visibility, 100), done);
  assert.equal(tickVisibility(startFlight(done.flight), done.visibility, 100).flight.gate, 2);
  assert.deepEqual(tickVisibility(midway.flight, midway.visibility, 0), midway);
});

test('El diseño inicial conserva energía suficiente para resolver el desafío y enviar dos fotos', () => {
  const s = stats(catalog, initialDesign);
  let mission = capture(advance(launch(s), s), s);
  mission = beginReframe(mission, { status: 'blocked', adjustment: 0 }).mission;
  mission = capture(advance(mission, s), s);
  mission = transmit(advance(mission, s), s);
  assert.equal(mission.delivered, 2);
  assert.equal(mission.energy, 14);
  assert.match(mission.log.join('\n'), /reencuadre/);
});
