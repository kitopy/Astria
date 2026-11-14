import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initialFlight, startFlight } from '../src/game/chaco-flight.js';
import { beginReframe, chooseObstacle, CLOUD_PROGRESS, cloudCover, drawObstacle, initialVisibility, OBSTACLES, REFRAME_ENERGY, tickVisibility } from '../src/game/chaco-visibility.js';
import { advance, capture, initialDesign, launch, stats, transmit } from '../src/game/model.js';

const catalog = JSON.parse(readFileSync(new URL('../src/game/parts.json', import.meta.url), 'utf8'));

test('El sorteo permite cada alternativa y excluye siempre el obstáculo anterior', () => {
  const kinds = Object.keys(OBSTACLES);
  assert.deepEqual([0,.4,.9].map(value => chooseObstacle(null, () => value)), kinds);
  for (const previous of kinds) {
    const drawn = new Set([0,.49,.5,.99].map(value => chooseObstacle(previous, () => value)));
    assert.deepEqual([...drawn], kinds.filter(kind => kind !== previous));
  }
});

test('El historial persiste entre intentos y recargas, sin imponer una ronda fija', () => {
  const data = new Map(), storage = { getItem: key => data.get(key), setItem: (key,value) => data.set(key,value) };
  const draws = [0,0,0,.99,.99,0].map(value => drawObstacle(storage, undefined, () => value));
  assert.deepEqual(draws.slice(0,3), ['clouds','camera','clouds']);
  draws.slice(1).forEach((kind,i) => assert.notEqual(kind,draws[i]));
  assert.equal(new Set(draws).size, 3);
  const blockedStorage = { getItem(){throw new Error('blocked');}, setItem(){throw new Error('blocked');} };
  assert.notEqual(drawObstacle(blockedStorage, 'clouds', () => 0), 'clouds');
  const staleStorage = { getItem: () => 'clouds', setItem(){throw new Error('quota');} };
  assert.notEqual(drawObstacle(staleStorage, 'camera', () => .99), 'camera');
});

for (const kind of Object.keys(OBSTACLES)) {
  test(`La misión completa funciona con ${kind}, un único gasto y el evento en su tramo`, () => {
    const s = stats(catalog, initialDesign);
    let mission = launch(s), flight = initialFlight(), visibility = initialVisibility(kind), encounters = 0;
    for (let step = 0; step < 7 && flight.gate < 3; step++) {
      const before = flight.gate;
      const next = tickVisibility(startFlight(flight), visibility, 100);
      flight = next.flight; visibility = next.visibility;
      if (visibility.status === 'blocked') {
        encounters++;
        assert.equal(flight.progress, OBSTACLES[kind].progress);
        assert.equal(flight.gate, kind === 'signal' ? 2 : 1);
        assert.equal(cloudCover(flight, visibility), kind === 'clouds' ? 1 : 0);
        const energy = mission.energy;
        const adjusting = beginReframe(mission, visibility);
        mission = adjusting.mission;
        assert.equal(mission.energy, energy - REFRAME_ENERGY);
        assert.throws(() => beginReframe(mission, adjusting.visibility));
        ({ flight, visibility } = tickVisibility(flight, adjusting.visibility, 2));
        assert.equal(visibility.kind, kind);
        continue;
      }
      if (flight.gate !== before) {
        mission = advance(mission, s);
        if (flight.gate < 3) mission = capture(mission, s);
      }
    }
    mission = transmit(mission, s);
    assert.equal(encounters, 1);
    assert.equal(mission.delivered, 2);
    assert.equal(mission.energy, 14);
  });
}

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
