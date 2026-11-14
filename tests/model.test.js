import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { advance, capture, initialDesign, launch, stats, transmit } from '../src/game/model.js';
const catalog = JSON.parse(readFileSync(new URL('../src/game/parts.json', import.meta.url), 'utf8'));
test('El diseño inicial completa las dos observaciones y su envío', () => {
    const s = stats(catalog, initialDesign);
    let m = launch(s);
    m = capture(advance(m, s), s);
    m = capture(advance(m, s), s);
    m = transmit(advance(m, s), s);
    assert.equal(m.delivered, 2);
    assert.equal(m.photos.length, 0);
    assert.ok(m.energy >= 0 && m.energy <= s.capacity);
});
test('La cámara detallada puede fallar con batería ligera y completarse al rediseñar', () => {
    const s = stats(catalog, { ...initialDesign, camera: 'detail', antenna: 'fast' });
    let m = capture(advance(launch(s), s), s);
    m = advance(m, s);
    assert.throws(() => capture(m, s), /Falta energía/);
    const improved = stats(catalog, { ...initialDesign, camera: 'detail', battery: 'long', antenna: 'fast' });
    assert.ok(improved.valid);
    let n = capture(advance(launch(improved), improved), improved);
    n = capture(advance(n, improved), improved);
    n = transmit(advance(n, improved), improved);
    assert.equal(n.delivered, 2);
    assert.equal(n.detail, 4);
});
test('El límite de datos impide contar una imagen parcialmente enviada', () => {
    const s = stats(catalog, { ...initialDesign, camera: 'detail', battery: 'long' });
    let m = capture(advance(launch(s), s), s);
    m = capture(advance(m, s), s);
    m = transmit(advance(m, s), s);
    assert.equal(m.delivered, 0);
    assert.equal(m.photos[0].remaining, 1);
    assert.throws(() => transmit(m, s), /no está disponible/);
});
test('No hay lanzamiento fuera de límites ni fotos duplicadas ni acciones fuera de fase', () => {
    const invalid = stats(catalog, { camera: 'detail', solar: 'large', battery: 'long', antenna: 'fast' });
    assert.equal(invalid.valid, false);
    assert.throws(() => launch(invalid), /límites/);
    const s = stats(catalog, initialDesign), m = launch(s);
    assert.throws(() => capture(m, s));
    assert.throws(() => transmit(m, s));
    const observed = capture(advance(m, s), s);
    assert.throws(() => capture(observed, s));
    assert.equal(m.photos.length, 0);
});
