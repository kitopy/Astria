import Phaser from 'phaser';
import { initialDesign, kinds, limits, stats } from '../game/model.js';
import { catalog, readDesign, saveDesign } from '../game/design.js';
import { actionButton, addArt, meter, mount, partThumb, preloadArt } from '../ui/mission-ui.js';
import { centerDesignArea } from '../ui/layout.js';
import { COLORS, CSS } from '../ui/palette.js';

// What each part does in a space mission, with the name engineers use for it.
// The role is the subtitle on screen; the text is what NOAH says.
const PART_INFO = {
  camera: { role: 'Carga útil', text: 'La cámara es el instrumento de la misión: la parte que hace la ciencia. Tiene que fotografiar el bosque dos veces.' },
  solar: { role: 'Sistema de energía', text: 'Los paneles transforman la luz del Sol en electricidad y recargan la batería cuando hay luz.' },
  battery: { role: 'Almacenamiento de energía', text: 'La batería guarda energía para cuando el satélite pasa por la sombra de la Tierra.' },
  antenna: { role: 'Comunicaciones', text: 'La antena envía las fotos a la Tierra por ondas de radio.' },
};

const REVIEW = kinds.length; // step index of the final review (after the 4 parts)

// Layout (in the 1920x1080 design area)
const SATELLITE = { x: 960, y: 480, scale: 1.05, reviewX: 720 };
const OPTION_X = [330, 1590]; // the two options float left and right of the satellite
const SNAP_DISTANCE = 300; // dropping a piece closer than this to the satellite mounts it

// The number that matters for each part type, plus mass and cost (shown in NOAH's line on hover).
function partNumbers(kind, part) {
  const key = {
    camera: `usa ${part.power} de energía y ${part.data} ${part.data === 1 ? 'bloque' : 'bloques'} por foto`,
    solar: `recarga ${part.generation} de energía con luz`,
    battery: `guarda ${part.capacity} de energía`,
    antenna: `envía ${part.rate} bloques y usa ${part.power} de energía`,
  }[kind];
  return `${key}. ${part.mass} kg, ${part.cost} créditos.`;
}

// Step 1 of the mission: assemble the satellite one part at a time, then review.
export class BuildScene extends Phaser.Scene {
  constructor() {
    super('Build');
  }

  // data.focus: open a part ('camera'...) or 'review' (used when coming back from Test/Reward).
  // data.design: present when coming back, so the satellite is already fully assembled.
  init(data = {}) {
    this.design = readDesign(data.design ?? this.registry.get('satelliteDesign'));
    const focusIndex = data.focus === 'review' ? REVIEW : kinds.indexOf(data.focus);
    this.step = focusIndex >= 0 ? focusIndex : 0;
    this.placed = new Set(data.design ? kinds : []); // part types already mounted
    this.maxStep = data.design ? REVIEW : 0; // furthest step reached
  }

  preload() {
    preloadArt(this);
  }

  create() {
    centerDesignArea(this);

    this.art = addArt(this, this.design);
    this.art.setPosition(SATELLITE.x, SATELLITE.y).setScale(SATELLITE.scale).setPlaced(this.placed);
    this.input.dragDistanceThreshold = 8; // a click with a tiny wobble is still a click, not a drag
    this.slotMarker = this.add.graphics();
    this.tweens.add({ targets: this.slotMarker, alpha: 0.25, duration: 700, yoyo: true, repeat: -1 });

    this.title = this.add.text(960, 142, '', { fontFamily: 'Cinzel', fontSize: '60px', fontStyle: 'bold', color: CSS.pink }).setOrigin(0.5);
    this.subtitle = this.add.text(960, 194, '', { fontFamily: 'Quicksand', fontSize: '24px', fontStyle: 'bold', color: '#c4a9e4' }).setOrigin(0.5);
    this.options = [];

    this.ui = mount(this, 0, { wizard: true });
    this.ui.bind({
      next: () => this.goTo(this.step + 1),
      prev: () => this.goTo(this.step - 1),
      goto: (button) => this.goTo(button.dataset.kind === 'review' ? REVIEW : kinds.indexOf(button.dataset.kind)),
      launch: () => {
        if (stats(catalog, this.design).valid) this.scene.start('Test', { design: { ...this.design } });
      },
      reset: () => {
        this.design = { ...initialDesign };
        this.persist();
        this.placed.clear();
        this.maxStep = 0;
        this.goTo(0);
      },
    });

    this.showStep();
  }

  get kind() {
    return kinds[this.step]; // undefined on the review step
  }

  goTo(step) {
    if (step < 0 || step > this.maxStep) return;
    this.step = step;
    this.showStep();
  }

  persist() {
    saveDesign(this.design);
    this.registry.set('satelliteDesign', { ...this.design });
  }

  // Mass and cost of what is mounted so far (structure included), so the bars grow while building.
  mountedTotals() {
    let mass = 2;
    let cost = 10;
    for (const kind of this.placed) {
      const part = catalog[kind].options.find((option) => option.id === this.design[kind]);
      mass += part.mass;
      cost += part.cost;
    }
    return { mass, cost };
  }

  // ---------- Screens ----------

  showStep() {
    this.options.forEach((option) => option.destroy());
    this.options = [];

    const kind = this.kind;
    const x = kind ? SATELLITE.x : SATELLITE.reviewX; // on review, the satellite moves left for the balance panel
    this.tweens.add({ targets: this.art, x, duration: 500, ease: 'Cubic.out', onUpdate: () => this.drawSlot() });

    if (kind) {
      this.title.setText(catalog[kind].label.toUpperCase());
      this.subtitle.setText(PART_INFO[kind].role);
      catalog[kind].options.forEach((part, i) => this.options.push(this.addOption(kind, part, OPTION_X[i], SATELLITE.y)));
      this.ui.say(this.placed.has(kind)
        ? `${PART_INFO[kind].text} Podés cambiarla por la otra opción.`
        : `${PART_INFO[kind].text} Arrastrá una de las dos al satélite.`);
    } else {
      this.title.setText('¿LISTA PARA DESPEGAR?');
      this.subtitle.setText('Revisá la cuenta antes del lanzamiento');
      this.ui.say(stats(catalog, this.design).valid
        ? 'Hacé la cuenta: ¿alcanza la energía para dos fotos y para enviarlas? La segunda foto se toma en la sombra, sin recarga.'
        : 'Tu satélite supera el límite del cohete. Tocá una pieza abajo y elegí una opción más liviana o más barata.');
    }

    this.drawSlot();
    this.renderHud();
  }

  // Pulsing outline where the current part goes, until it's mounted.
  drawSlot() {
    const g = this.slotMarker.clear();
    const kind = this.kind;
    if (!kind || this.placed.has(kind)) return;
    const s = this.art.scale;
    g.lineStyle(4, COLORS.glow, 1);
    for (const slot of this.art.slots(kind)) {
      g.strokeRoundedRect(this.art.x + (slot.x - slot.w / 2) * s, this.art.y + (slot.y - slot.h / 2) * s, slot.w * s, slot.h * s, 18);
    }
  }

  // One of the two options: picture, name and short benefit. Drag it to the satellite, or click it.
  addOption(kind, part, x, y) {
    const isChosen = this.placed.has(kind) && this.design[kind] === part.id;

    const ring = this.add.circle(0, -20, 150).setStrokeStyle(3, COLORS.glow, isChosen ? 1 : 0).setFillStyle(COLORS.panel, 0.55);
    const picture = this.add.image(0, -20, 'satellite-modules', `${kind}-${part.id}`);
    picture.setScale(Math.min(230 / picture.width, 190 / picture.height));
    const name = this.add.text(0, 160, part.name, { fontFamily: 'Audiowide', fontSize: '32px', color: '#ffffff' }).setOrigin(0.5);
    const benefit = this.add.text(0, 205, part.benefit, { fontFamily: 'Quicksand', fontSize: '22px', fontStyle: 'bold', color: '#e9defc' }).setOrigin(0.5);

    const option = this.add.container(x, y, [ring, picture, name, benefit]);
    option.setSize(320, 420).setInteractive({ useHandCursor: true, draggable: true });
    option.home = { x, y };

    option.on('pointerover', () => {
      this.tweens.add({ targets: option, scale: 1.05, duration: 150 });
      this.ui.say(`${part.name}: ${part.benefit.toLowerCase()}, pero ${part.tradeoff.toLowerCase()}. ${partNumbers(kind, part)}`, { silent: true });
    });
    option.on('pointerout', () => this.tweens.add({ targets: option, scale: 1, duration: 150 }));

    // Drag: follow the pointer; on release, mount it if it's close to the satellite.
    option.on('pointerdown', () => (option.dragged = false));
    option.on('drag', (pointer, dragX, dragY) => {
      option.dragged = true;
      option.setPosition(dragX, dragY);
    });
    option.on('dragend', () => {
      if (!option.dragged) return;
      if (Phaser.Math.Distance.Between(option.x, option.y, this.art.x, this.art.y) < SNAP_DISTANCE) this.mount(kind, part, option);
      else this.tweens.add({ targets: option, x: x, y: y, duration: 300, ease: 'Back.out' });
    });
    // A simple click (no drag) also mounts it.
    option.on('pointerup', () => {
      if (!option.dragged) this.mount(kind, part, option);
    });

    return option;
  }

  // The piece flies into its slot, then the satellite shows it.
  mount(kind, part, option) {
    const slot = this.art.slots(kind)[0];
    const flying = this.add.image(option.x, option.y - 20, 'satellite-modules', `${kind}-${part.id}`);
    flying.setScale(Math.min(230 / flying.width, 190 / flying.height));
    this.tweens.add({ targets: option, x: option.home.x, y: option.home.y, duration: 300 });

    this.tweens.add({
      targets: flying,
      x: this.art.x + (kind === 'solar' ? 0 : slot.x * this.art.scale),
      y: this.art.y + slot.y * this.art.scale,
      scale: flying.scale * 0.6,
      alpha: 0.4,
      duration: 380,
      ease: 'Cubic.in',
      onComplete: () => {
        flying.destroy();
        const wasPlaced = this.placed.has(kind);
        this.design[kind] = part.id;
        this.placed.add(kind);
        if (this.step === this.maxStep) this.maxStep = Math.min(REVIEW, this.step + 1);
        this.persist();
        this.art.setPlaced(this.placed);
        this.art.applyDesign(this.design, kind);
        this.drawSlot();
        this.options.forEach((o) => o.list[0].setStrokeStyle(3, COLORS.glow, o === option ? 1 : 0));
        this.renderHud();
        this.ui.say(`${wasPlaced ? 'Cambiaste a' : 'Montaste'} ${part.name}: ${part.benefit.toLowerCase()}, pero ${part.tradeoff.toLowerCase()}.`);
      },
    });
  }

  // ---------- HTML layer: parts strip, mass/budget, review balance, buttons ----------

  renderHud() {
    const totals = this.mountedTotals();
    const slots = kinds
      .map((kind, i) => {
        const current = this.step === i ? 'current' : '';
        const content = this.placed.has(kind) ? partThumb(kind, this.design[kind], 56, 42) : '';
        return `<button class="ws-slot ${current}" data-action="goto" data-kind="${kind}" ${i > this.maxStep ? 'disabled' : ''} aria-label="${catalog[kind].label}">${content}</button>`;
      })
      .join('');
    const review = `<button class="ws-slot ws-slot-review ${this.step === REVIEW ? 'current' : ''}" data-action="goto" data-kind="review" ${REVIEW > this.maxStep ? 'disabled' : ''}>Revisar</button>`;

    this.ui.area('center').innerHTML = `
      <div class="ws-strip">
        <div class="ws-slots">${slots}${review}</div>
        <div class="ws-mini-meters">${meter('Masa', totals.mass, limits.mass, ' kg')}${meter('Presupuesto', totals.cost, limits.budget)}</div>
      </div>`;

    this.ui.area('right').innerHTML = this.kind ? '' : this.reviewPanel();

    const back = this.step > 0 ? actionButton('prev', '‹ Anterior') : '';
    let forward;
    if (this.kind) {
      forward = actionButton('next', this.step === REVIEW - 1 ? 'Revisar ›' : 'Siguiente ›', true, !this.placed.has(this.kind));
    } else {
      forward = actionButton('launch', 'Lanzar ›', true, !stats(catalog, this.design).valid);
    }
    this.ui.area('actions').innerHTML = back + forward;
  }

  // Energy and data balance, so the player can predict whether the mission will work.
  reviewPanel() {
    const s = stats(catalog, this.design);
    return `
      <h2 class="ws-title">Energía</h2>
      <dl class="ws-specs">
        <div><dt>Batería al despegar</dt><dd>${s.capacity}</dd></div>
        <div><dt>Recarga con luz, por etapa</dt><dd>+${s.generation}</dd></div>
        <div><dt>Consumo fijo, por etapa</dt><dd>−4</dd></div>
        <div><dt>Cada foto</dt><dd>−${s.cameraPower}</dd></div>
        <div><dt>Enviar</dt><dd>−${s.antennaPower}</dd></div>
      </dl>
      <h2 class="ws-title ws-title-gap">Datos</h2>
      <dl class="ws-specs">
        <div><dt>Dos fotos</dt><dd>${s.data * 2} bloques</dd></div>
        <div><dt>La antena envía</dt><dd>${s.rate} bloques</dd></div>
      </dl>
      <p class="ws-status ${s.valid ? '' : 'over'}">${s.valid ? 'Entra en el cohete.' : 'Supera el límite del cohete.'}</p>`;
  }
}
