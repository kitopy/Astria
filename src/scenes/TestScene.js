import Phaser from 'phaser';
import { advance, capture, launch, phases, stats, transmit } from '../game/model.js';
import { catalog, readDesign } from '../game/design.js';
import { actionButton, addArt, mount, preloadArt, resources } from '../ui/mission-ui.js';
import { centerDesignArea } from '../ui/layout.js';

export class TestScene extends Phaser.Scene {
  constructor() { super('Test'); }
  init(data = {}) {
    this.design = readDesign(data.design ?? this.registry.get('satelliteDesign'));
    this.specs = stats(catalog, this.design);
    this.mission = this.specs.valid ? launch(this.specs) : null;
  }
  preload() { preloadArt(this); }
  create() {
    centerDesignArea(this);
    if (!this.mission) { this.scene.start('Build', { design: this.design }); return; }
    this.art = addArt(this, this.design);
    this.ui = mount(this, 'Poné tu diseño <span>a prueba.</span>', 'Observá, administrá la energía y enviá tus descubrimientos.', 1);
    this.ui.root.querySelector('.assembly-zone').hidden = true;
    this.ui.bind({ capture: () => this.perform('capture'), transmit: () => this.perform('transmit'),
      workshop: () => this.scene.start('Build', { design: this.design }),
      next: () => {
        if (this.mission.phase === 3) this.scene.start('Reward', { design: this.design, mission: this.mission });
        else { this.mission = advance(this.mission, this.specs); this.render(); this.ui.say(phases[this.mission.phase].task); }
      }
    });
    this.render(); this.ui.say(phases[0].task);
  }
  perform(action) {
    try {
      this.mission = action === 'capture' ? capture(this.mission, this.specs) : transmit(this.mission, this.specs);
      this.render(); this.ui.say(action === 'capture' ? `Imagen obtenida. Usaste ${this.specs.cameraPower} de energía y generaste ${this.specs.data} bloques de datos. Todavía tenemos que enviarla a la Tierra.` : `Recibimos ${this.mission.delivered} imágenes completas. ${this.mission.photos.length ? 'Quedaron datos a bordo; revisaremos cómo mejorar el envío.' : '¡Tus observaciones ya llegaron a la Tierra!'}`);
    } catch (e) { this.ui.say(e.message); }
  }
  render() {
    const m = this.mission, s = this.specs;
    const canCapture = [1, 2].includes(m.phase) && !m.captured.includes(m.phase) && m.energy >= s.cameraPower;
    this.ui.area('left').innerHTML = `<h2>Centro de misión</h2><p class="panel-intro">Avanzá a tu ritmo. No hay cuenta regresiva.</p><ol class="phase-list">${phases.map((phase, i) => `<li class="${i === m.phase ? 'current' : ''}"><span>${i < m.phase ? '✓' : `0${i + 1}`}</span>${phase.title}</li>`).join('')}</ol><h3 class="task-title">${phases[m.phase].label}</h3><p class="task">${phases[m.phase].task}</p><div class="task-buttons">${[1, 2].includes(m.phase) ? actionButton('capture', m.captured.includes(m.phase) ? 'Imagen obtenida ✓' : `Observar · −${s.cameraPower} energía`, true, !canCapture) : ''}${m.phase === 3 ? actionButton('transmit', m.sent ? 'Transmisión realizada ✓' : `Transmitir · −${s.antennaPower} energía`, true, m.sent || !m.photos.length || m.energy < s.antennaPower) : ''}</div><p class="mission-hint">${[1, 2].includes(m.phase) && !m.captured.includes(m.phase) && !canCapture ? 'Falta energía para esta cámara. Podés avanzar y revisar el diseño al terminar.' : m.phase === 3 && !m.sent && m.energy < s.antennaPower ? 'Falta energía para transmitir. Revisaremos el diseño en los resultados.' : 'Obtener una imagen y enviarla son dos acciones distintas.'}</p>`;
    resources(this.ui, s, m.energy);
    this.ui.area('caption').textContent = phases[m.phase].title;
    this.ui.area('caption-detail').textContent = `${m.captured.length}/2 imágenes obtenidas · ${m.delivered}/2 recibidas en Tierra`;
    this.ui.area('actions').innerHTML = actionButton('workshop', 'Volver al taller') + actionButton('next', m.phase === 3 ? 'Ver resultados →' : 'Siguiente etapa →', true);
    this.art.setTint(m.phase === 2 ? 0xabb7e0 : 0xffffff);
    this.tweens.killTweensOf(this.art);
    this.tweens.add({ targets: this.art, x: [1020, 1060, 1110, 1050][m.phase], angle: m.phase === 2 ? 4 : -5, duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 450 });
  }
}
