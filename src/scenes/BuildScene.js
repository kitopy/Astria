import Phaser from 'phaser';
import { initialDesign, kinds, selected, stats } from '../game/model.js';
import { catalog, readDesign, saveDesign } from '../game/design.js';
import { actionButton, addArt, mount, preloadArt, resources } from '../ui/mission-ui.js';

export class BuildScene extends Phaser.Scene {
  constructor() { super('Build'); }
  init(data = {}) { this.design = readDesign(data.design ?? this.registry.get('satelliteDesign')); }
  preload() { preloadArt(this); }
  create() {
    this.art = addArt(this);
    this.ui = mount(this, 'Tu satélite. <span>Tu misión.</span>', 'Construí, probá y descubrí qué cambia en la Tierra.', 0);
    this.ui.bind({
      launch: () => { if (stats(catalog, this.design).valid) this.scene.start('Test', { design: { ...this.design } }); },
      reset: () => { this.design = { ...initialDesign }; this.persist(); this.render(); this.ui.say('Volvimos a las piezas iniciales. Probá otra combinación.'); },
      menu: () => this.scene.start('Menu')
    });
    this.ui.root.addEventListener('change', e => {
      if (e.target.matches('input[type="radio"]')) this.choose(e.target.name, e.target.value);
    });
    this.ui.root.addEventListener('dragstart', e => {
      const part = e.target.closest('[data-kind]');
      if (part) e.dataTransfer.setData('text/plain', JSON.stringify({ kind: part.dataset.kind, id: part.dataset.part }));
    });
    const drop = this.ui.root.querySelector('.assembly-zone');
    drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('dragging'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('dragging'));
    drop.addEventListener('drop', e => {
      e.preventDefault(); drop.classList.remove('dragging');
      try { const { kind, id } = JSON.parse(e.dataTransfer.getData('text/plain')); this.choose(kind, id); } catch { /* Datos externos. */ }
    });
    this.render(); this.ui.say('Tu misión: obtené y enviá dos imágenes de un bosque. Cada pieza tiene ventajas y sacrificios. Encontrá una combinación que funcione.');
  }
  persist() { saveDesign(this.design); this.registry.set('satelliteDesign', { ...this.design }); }
  choose(kind, id) {
    if (!kinds.includes(kind)) return;
    const part = catalog[kind].options.find(option => option.id === id);
    if (!part) return;
    this.design[kind] = id; this.persist(); this.render();
    this.ui.root.querySelector(`input[name="${kind}"]:checked`)?.focus({ preventScroll: true });
    this.ui.say(`${part.name}: ${part.benefit.toLowerCase()}, pero ${part.tradeoff.toLowerCase()}. ${stats(catalog, this.design).valid ? 'Probá cómo se combina con las otras piezas.' : 'Revisá los límites antes de lanzar.'}`);
  }
  render() {
    const s = stats(catalog, this.design);
    this.ui.area('left').innerHTML = `<h2>Taller del satélite</h2><p class="panel-intro">Elegí una pieza por tipo. Cada ventaja tiene un desafío.</p>${kinds.map(kind => `<fieldset class="part-group"><legend>${catalog[kind].label}</legend><div class="part-options">${catalog[kind].options.map(part => `<label class="part-choice ${this.design[kind] === part.id ? 'selected' : ''}" draggable="true" data-kind="${kind}" data-part="${part.id}"><span class="part-title"><input type="radio" name="${kind}" value="${part.id}" ${this.design[kind] === part.id ? 'checked' : ''}>${part.name}</span><span class="part-benefit">+ ${part.benefit}</span><span class="part-tradeoff">− ${part.tradeoff}</span><small>${part.cost} créditos · ${part.mass} kg</small></label>`).join('')}</div></fieldset>`).join('')}`;
    resources(this.ui, s);
    this.ui.area('actions').innerHTML = actionButton('menu', 'Menú') + actionButton('reset', 'Reiniciar') + actionButton('launch', 'Probar mi satélite →', true, !s.valid);
    const p = selected(catalog, this.design);
    this.ui.area('caption-detail').textContent = `${p.camera.name} · Paneles ${p.solar.name.toLowerCase()} · Batería ${p.battery.name.toLowerCase()}`;
    const width = this.design.solar === 'large' ? 720 : 650;
    this.art.setDisplaySize(width, width * 2 / 3);
  }
}
