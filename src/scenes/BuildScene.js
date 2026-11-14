import Phaser from 'phaser';
import { initialDesign, kinds, limits, stats } from '../game/model.js';
import { catalog, readDesign, saveDesign } from '../game/design.js';
import { actionButton, addArt, meter, mount, partThumb, preloadArt } from '../ui/mission-ui.js';
import { centerDesignArea } from '../ui/layout.js';

// Which part types go in each side panel.
const LEFT_KINDS = ['camera', 'solar'];
const RIGHT_KINDS = ['battery', 'antenna'];

// Step 1: choose one option for each part of the satellite.
export class BuildScene extends Phaser.Scene {
  constructor() {
    super('Build');
  }

  init(data = {}) {
    this.design = readDesign(data.design ?? this.registry.get('satelliteDesign'));
  }

  preload() {
    preloadArt(this);
  }

  create() {
    centerDesignArea(this);
    this.art = addArt(this, this.design);
    this.ui = mount(this, 0);

    this.ui.bind({
      launch: () => {
        if (stats(catalog, this.design).valid) this.scene.start('Test', { design: { ...this.design } });
      },
      reset: () => {
        this.design = { ...initialDesign };
        this.persist();
        this.render();
        this.ui.say('Volvimos a las piezas iniciales. Probá otra combinación.');
      },
    });

    // Each option is a hidden radio input inside a card: changing it chooses that part.
    this.ui.root.addEventListener('change', (event) => {
      if (event.target.matches('input[type="radio"]')) this.choose(event.target.name, event.target.value);
    });

    this.render();
    this.ui.say('Tu misión: tomar dos fotos de un bosque y enviarlas a la Tierra. Elegí una pieza de cada tipo. ¡Ojo con el peso y el presupuesto!');
  }

  persist() {
    saveDesign(this.design);
    this.registry.set('satelliteDesign', { ...this.design });
  }

  choose(kind, id) {
    if (!kinds.includes(kind)) return;
    const part = catalog[kind].options.find((option) => option.id === id);
    if (!part) return;

    this.design[kind] = id;
    this.persist();
    this.render(kind);
    this.ui.root.querySelector(`input[name="${kind}"]:checked`)?.focus({ preventScroll: true });

    const valid = stats(catalog, this.design).valid;
    this.ui.say(`${part.name}: ${part.benefit.toLowerCase()}, pero ${part.tradeoff.toLowerCase()}. ${valid ? 'Probá cómo se combina con las otras piezas.' : 'Ahora tu satélite supera el límite.'}`);
  }

  // One card per part type, with its two options side by side.
  partCard(kind) {
    const options = catalog[kind].options
      .map((part) => {
        const isSelected = this.design[kind] === part.id;
        return `<label class="ws-option ${isSelected ? 'selected' : ''}">
          <input class="ws-sr" type="radio" name="${kind}" value="${part.id}" ${isSelected ? 'checked' : ''}>
          ${partThumb(kind, part.id)}
          <strong>${part.name}</strong>
          <span class="ws-plus">+ ${part.benefit}</span>
          <span class="ws-minus">− ${part.tradeoff}</span>
          <small>${part.mass} kg · ${part.cost} créditos</small>
        </label>`;
      })
      .join('');
    return `<fieldset class="ws-part"><legend>${catalog[kind].label}</legend><div class="ws-options">${options}</div></fieldset>`;
  }

  render(changedKind = null) {
    const s = stats(catalog, this.design);

    this.ui.area('left').innerHTML = LEFT_KINDS.map((kind) => this.partCard(kind)).join('');
    this.ui.area('right').innerHTML = RIGHT_KINDS.map((kind) => this.partCard(kind)).join('');

    this.ui.area('center').innerHTML = `
      <div class="ws-meters">${meter('Masa', s.mass, limits.mass, ' kg')}${meter('Presupuesto', s.cost, limits.budget)}</div>
      <p class="ws-status ${s.valid ? '' : 'over'}">${s.valid ? '✓ Listo para el lanzamiento' : 'Supera el límite: cambiá alguna pieza'}</p>`;

    this.ui.area('actions').innerHTML =
      actionButton('reset', 'Reiniciar') + actionButton('launch', 'Probar mi satélite ›', true, !s.valid);

    this.art.applyDesign(this.design, changedKind);
  }
}
