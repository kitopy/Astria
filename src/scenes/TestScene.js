import Phaser from 'phaser';
import { advance, capture, launch, phases, stats, transmit } from '../game/model.js';
import { catalog, readDesign } from '../game/design.js';
import { actionButton, addArt, meter, mount, preloadArt } from '../ui/mission-ui.js';
import { centerDesignArea } from '../ui/layout.js';

// Satellite x position for each phase: it "travels" a little across the screen.
const ORBIT_X = [930, 970, 1020, 960];

// Step 2: fly the mission phase by phase, managing energy, photos and data.
export class TestScene extends Phaser.Scene {
  constructor() {
    super('Test');
  }

  init(data = {}) {
    this.design = readDesign(data.design ?? this.registry.get('satelliteDesign'));
    this.specs = stats(catalog, this.design);
    this.mission = this.specs.valid ? launch(this.specs) : null;
  }

  preload() {
    preloadArt(this);
  }

  create() {
    centerDesignArea(this);
    if (!this.mission) {
      this.scene.start('Build', { design: this.design });
      return;
    }

    this.art = addArt(this, this.design);
    this.ui = mount(this, 1);
    this.ui.bind({
      capture: () => this.perform('capture'),
      transmit: () => this.perform('transmit'),
      workshop: () => this.scene.start('Build', { design: this.design }),
      next: () => {
        if (this.mission.phase === 3) {
          this.scene.start('Reward', { design: this.design, mission: this.mission });
        } else {
          this.mission = advance(this.mission, this.specs);
          this.render();
          this.ui.say(phases[this.mission.phase].task);
        }
      },
    });

    this.render();
    this.ui.say(phases[0].task);
  }

  perform(action) {
    try {
      this.mission = action === 'capture' ? capture(this.mission, this.specs) : transmit(this.mission, this.specs);
      this.render();
      this.ui.say(
        action === 'capture'
          ? `¡Foto tomada! Usaste ${this.specs.cameraPower} de energía. Todavía hay que enviarla a la Tierra.`
          : `Llegaron ${this.mission.delivered} fotos completas a la Tierra. ${this.mission.photos.length ? 'Quedaron datos a bordo: veremos cómo mejorar el envío.' : '¡Tus observaciones llegaron!'}`,
      );
    } catch (error) {
      this.ui.say(error.message);
    }
  }

  // State of photo n (1 or 2): not taken yet, taken (on board), or received on Earth.
  photoSlot(n) {
    const m = this.mission;
    const taken = m.captured.includes(n);
    const sent = taken && m.sent && !m.photos.some((photo) => photo.phase === n);
    const state = sent ? 'sent' : taken ? 'taken' : '';
    const text = sent ? 'En la Tierra ✓' : taken ? 'A bordo' : 'Pendiente';
    return `<div class="ws-photo ${state}"><b>${sent ? '🌍' : taken ? '📷' : '·'}</b>Foto ${n}<br>${text}</div>`;
  }

  render() {
    const m = this.mission;
    const s = this.specs;
    const phase = phases[m.phase];
    const isPhotoPhase = [1, 2].includes(m.phase);
    const canCapture = isPhotoPhase && !m.captured.includes(m.phase) && m.energy >= s.cameraPower;
    const canTransmit = m.phase === 3 && !m.sent && m.photos.length > 0 && m.energy >= s.antennaPower;

    let taskButton = '';
    if (isPhotoPhase) {
      const label = m.captured.includes(m.phase) ? 'Foto tomada ✓' : `📷 Tomar foto · −${s.cameraPower}`;
      taskButton = actionButton('capture', label, true, !canCapture).replace('ws-btn', 'ws-btn ws-wide');
    } else if (m.phase === 3) {
      const label = m.sent ? 'Envío realizado ✓' : `📡 Enviar fotos · −${s.antennaPower}`;
      taskButton = actionButton('transmit', label, true, !canTransmit).replace('ws-btn', 'ws-btn ws-wide');
    }

    let hint = 'Tomar una foto y enviarla son dos acciones distintas.';
    if (isPhotoPhase && !m.captured.includes(m.phase) && !canCapture) hint = 'No alcanza la energía para la cámara. Podés seguir y mejorar el diseño al final.';
    if (m.phase === 3 && !m.sent && m.energy < s.antennaPower) hint = 'No alcanza la energía para enviar. Lo revisaremos en los resultados.';

    this.ui.area('left').innerHTML = `
      <h2 class="ws-title">Plan de vuelo</h2>
      <ol class="ws-phases">${phases
        .map((p, i) => `<li class="${i < m.phase ? 'done' : i === m.phase ? 'current' : ''}"><span>${i < m.phase ? '✓' : i + 1}</span>${p.title}</li>`)
        .join('')}</ol>
      <div class="ws-task">
        <span class="ws-chip">${phase.sun ? '☀️ Con luz del Sol' : '🌑 En sombra'}</span>
        <p>${phase.task}</p>
        ${taskButton}
        <p class="ws-hint">${hint}</p>
      </div>`;

    this.ui.area('right').innerHTML = `
      <h2 class="ws-title">Tu satélite</h2>
      ${meter('Energía', m.energy, s.capacity)}
      <div class="ws-photos">${this.photoSlot(1)}${this.photoSlot(2)}</div>
      <dl class="ws-specs">
        <div><dt>☀️ Recarga con luz</dt><dd>+${s.generation}</dd></div>
        <div><dt>📷 Cada foto usa</dt><dd>−${s.cameraPower}</dd></div>
        <div><dt>📡 Enviar usa</dt><dd>−${s.antennaPower}</dd></div>
      </dl>`;

    this.ui.area('center').innerHTML = `<div class="ws-caption"><strong>${phase.title}</strong>${m.captured.length}/2 fotos tomadas · ${m.delivered}/2 en la Tierra</div>`;

    this.ui.area('actions').innerHTML =
      actionButton('workshop', 'Volver al taller') +
      actionButton('next', m.phase === 3 ? 'Ver resultados ›' : 'Siguiente etapa ›', true);

    // In the shadow phase, darken the satellite and the Earth.
    const shade = phase.sun ? 0xffffff : 0x8a90c8;
    this.art.setTint(shade);
    this.background.setTint(phase.sun ? 0xffffff : 0x6a6fa8);

    this.tweens.killTweensOf(this.art);
    this.tweens.add({
      targets: this.art,
      x: ORBIT_X[m.phase],
      angle: m.phase === 2 ? 4 : -5,
      duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 450,
    });
  }
}
