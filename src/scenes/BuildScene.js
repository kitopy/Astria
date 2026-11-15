import Phaser from 'phaser';
import { initialDesign, kinds, limits, stats } from '../game/model.js';
import { catalog, readDesign, saveDesign } from '../game/design.js';
import { actionButton, addArt, meter, mount, partThumb, preloadArt } from '../ui/mission-ui.js';
import { centerDesignArea } from '../ui/layout.js';
import { showDialog } from '../ui/dialog.js';
import { COLORS, CSS } from '../ui/palette.js';
import { contentBounds } from '../ui/satellite.js';
import { mountLine, partIntro, reviewLine } from '../game/noah-lines.js';
import { REFRAME_ENERGY } from '../game/chaco-visibility.js';

const REVIEW = kinds.length; // step index of the final review (after the 4 parts)

// Layout (in the 1920x1080 design area)
const SATELLITE = { x: 960, y: 555, scale: 1, reviewX: 720 };
const OPTION_X = [330, 1590]; // the two options float left and right of the satellite
const SNAP_DISTANCE = 300; // dropping a piece closer than this to the satellite mounts it
const AUTO_NEXT_MS = 1500; // after mounting a part for the first time, go to the next one by itself
const OPTION_SLIDE = 140; // how far (px) the options slide in from / out to the sides between steps

// The number that matters for each part type, plus mass and cost (shown under an option on hover).
function partNumbers(kind, part) {
  const key = {
    camera: `${part.power} de energía por foto`,
    solar: `+${part.generation} de energía con luz`,
    battery: `Guarda ${part.capacity} de energía`,
    antenna: `Envía ${part.rate} bloques`,
  }[kind];
  return `${key} · ${part.mass} kg · ${part.cost} créditos`;
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
    this.showBuildIntroOnStart = this.step === 0 && !data.design && data.focus == null;
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

    // Part name: the main thing on screen. Big, with a soft pink glow.
    this.title = this.add
      .text(960, 168, '', { fontFamily: 'Cinzel', fontSize: '92px', fontStyle: 'bold', color: CSS.pink })
      .setOrigin(0.5)
      .setPadding(48) // room for the glow, otherwise it gets cut into a visible box
      .setShadow(0, 0, CSS.glow, 28, false, true);
    this.options = [];

    this.ui = mount(this, 0, { wizard: true });
    this.ui.bind({
      next: () => this.goTo(this.nextStep()),
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

    this.addPartTooltips();

    // With the welcome dialog open, the first title waits and is typed once the dialog closes.
    this.titleOnHold = this.showBuildIntroOnStart;
    this.showStep();
    if (this.showBuildIntroOnStart) {
      showDialog(this, {
        title: 'Elegí qué pieza llevar',
        text: 'En cada paso vas a elegir entre dos opciones. Mirá qué aporta cada una y elegí la que prefieras para tu misión.',
      }).then(() => {
        if (!this.sys.isActive()) return; // the scene ended while the dialog was open
        this.titleOnHold = false;
        this.typeTitle(this.titleTarget);
      });
    }
  }

  // Hovering a part already on the satellite shows its name in a small box next to the pointer
  // and lights up its square in the parts strip; clicking it opens that part to change it.
  // Parts not mounted yet are hidden, and Phaser ignores hidden objects, so they show nothing.
  addPartTooltips() {
    const tip = document.createElement('div');
    tip.className = 'ws-part-tip';
    tip.hidden = true;
    this.ui.root.append(tip);

    const parts = [
      ...this.art.wings.map((image) => [image, 'solar']),
      [this.art.body, 'body'],
      ...Object.entries(this.art.components).map(([kind, image]) => [image, kind]),
    ];
    for (const [image, kind] of parts) {
      const editable = kind !== 'body';
      image.setInteractive({ useHandCursor: editable });
      image.on('pointerover', (pointer) => {
        if (pointer.isDown) return; // not while dragging a part onto the satellite
        tip.textContent = this.partName(kind);
        tip.hidden = false;
        this.linkSlot(kind);
      });
      image.on('pointerout', () => {
        tip.hidden = true;
        this.linkSlot(null);
      });
      if (!editable) continue;
      // Down and up on the same part: a click. A part dropped onto the satellite doesn't count.
      image.on('pointerdown', () => (this.pressedPart = kind));
      image.on('pointerup', () => {
        const step = kinds.indexOf(kind);
        if (this.pressedPart === kind && step !== this.step) {
          tip.hidden = true;
          this.goTo(step);
        }
        this.pressedPart = null;
      });
    }

    this.input.on('pointermove', (pointer) => {
      if (pointer.isDown) tip.hidden = true;
      tip.style.left = `${pointer.worldX + 18}px`;
      tip.style.top = `${pointer.worldY + 24}px`;
    });
  }

  // Highlights the square of a part type in the parts strip (null: none).
  linkSlot(kind) {
    this.linkedKind = kind;
    this.ui.root.querySelectorAll('.ws-slot[data-kind]').forEach((slot) => slot.classList.toggle('linked', slot.dataset.kind === kind));
  }

  // "Cámara esencial", "Batería de reserva"... or the body.
  partName(kind) {
    if (kind === 'body') return 'Estructura del satélite';
    const part = catalog[kind].options.find((option) => option.id === this.design[kind]);
    return `${catalog[kind].label} ${part.name.toLowerCase()}`;
  }

  // Where to go after the current part: the first part still missing, or the review if none is.
  nextStep() {
    const missing = kinds.findIndex((kind) => !this.placed.has(kind));
    return missing === -1 ? REVIEW : missing;
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

  // Changes from one step to the next as a short sequence, never all at once:
  // the old options slide out, the title swaps, then the new options slide in one after the other.
  showStep() {
    this.advancing = false;
    const leaving = this.options;
    this.options = [];
    for (const option of leaving) {
      option.disableInteractive();
      this.tweens.killTweensOf(option);
      this.tweens.add({
        targets: option,
        x: option.home.x + this.sideOf(option) * OPTION_SLIDE,
        alpha: 0,
        scale: 0.85,
        duration: 260,
        ease: 'Cubic.in',
        onComplete: () => option.destroy(),
      });
    }
    const enterAt = leaving.length ? 240 : 0; // new options wait until the old ones are gone

    const kind = this.kind;
    const x = kind ? SATELLITE.x : SATELLITE.reviewX; // on review, the satellite moves left for the balance panel
    this.tweens.add({ targets: this.art, x, duration: 500, ease: 'Cubic.out', onUpdate: () => this.drawSlot() });

    this.swapTitle(kind ? catalog[kind].label.toUpperCase() : '¿LISTA PARA DESPEGAR?');

    if (kind) {
      catalog[kind].options.forEach((part, i) => {
        const option = this.addOption(kind, part, OPTION_X[i], SATELLITE.y);
        this.options.push(option);
        // Enter from its own side; it can only be grabbed once it has arrived.
        option.disableInteractive();
        option.setAlpha(0).setScale(0.85).setX(option.home.x + this.sideOf(option) * OPTION_SLIDE);
        this.tweens.add({
          targets: option,
          x: option.home.x,
          alpha: 1,
          scale: 1,
          delay: enterAt + i * 120,
          duration: 420,
          ease: 'Back.out',
          onComplete: () => option.setInteractive(),
        });
      });
      this.ui.say(partIntro(kind, this.placed.has(kind)));
    } else {
      this.ui.say(reviewLine(stats(catalog, this.design).valid, REFRAME_ENERGY));
    }

    this.drawSlot();
    this.renderHud();
  }

  // -1 for the option on the left of the satellite, 1 for the one on the right.
  sideOf(option) {
    return option.home.x < SATELLITE.x ? -1 : 1;
  }

  // The current title fades up and out, then the new one is typed letter by letter,
  // so each new part gets a moment of its own.
  swapTitle(text) {
    const title = this.title;
    const previous = this.titleTarget;
    this.titleTarget = text;
    this.tweens.killTweensOf(title);
    this.titleTyping?.remove();
    if (this.titleOnHold) return; // typed when the welcome dialog closes
    if (previous && previous !== text) {
      this.tweens.add({ targets: title, alpha: 0, y: 150, duration: 200, ease: 'Cubic.in', onComplete: () => this.typeTitle(text) });
    } else {
      this.typeTitle(text);
    }
  }

  typeTitle(text) {
    const title = this.title;
    // Anchor the text by its left edge where the full title will start, so it grows to the right
    // instead of shifting while it's typed, and ends up centered.
    title.setOrigin(0.5).setText(text);
    const left = 960 - title.width / 2;
    title.setOrigin(0, 0.5).setPosition(left, 168).setAlpha(1).setText('');

    const letters = [...text]; // keeps accented letters (Á, Í) whole
    let shown = 0;
    this.titleTyping = this.time.addEvent({
      delay: Math.min(75, 900 / letters.length), // short titles type at a steady pace, long ones still finish in ~1 s
      repeat: letters.length - 1,
      callback: () => {
        shown++;
        title.setText(letters.slice(0, shown).join(''));
      },
    });
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

  // Picture of a part, centered on (x, y) by the part itself (not by its loose atlas rectangle),
  // cropped to hide empty space and slivers of neighbouring parts, and sized to fit ~200x170.
  partImage(kind, id, x, y) {
    const b = contentBounds(this, `${kind}-${id}`);
    const scale = Math.min(200 / b.width, 170 / b.height);
    return this.add
      .image(x - b.cx * scale, y - b.cy * scale, 'satellite-modules', `${kind}-${id}`)
      .setCrop(b.x, b.y, b.width, b.height)
      .setScale(scale);
  }

  // One of the two options: picture, name and short benefit. Drag it to the satellite, or click it.
  addOption(kind, part, x, y) {
    const isChosen = this.placed.has(kind) && this.design[kind] === part.id;

    const ring = this.add.circle(0, -20, 150).setStrokeStyle(3, COLORS.glow, isChosen ? 1 : 0).setFillStyle(COLORS.panel, 0.55);
    const picture = this.partImage(kind, part.id, 0, -20);
    // Dark shadow keeps the labels readable over the bright clouds of the Earth.
    const name = this.add.text(0, 160, part.name, { fontFamily: 'Audiowide', fontSize: '32px', color: '#ffffff' }).setOrigin(0.5).setPadding(10).setShadow(0, 2, '#0b0618', 10, false, true);
    const benefit = this.add.text(0, 205, part.benefit, { fontFamily: 'Quicksand', fontSize: '22px', fontStyle: 'bold', color: '#e9defc' }).setOrigin(0.5).setPadding(10).setShadow(0, 2, '#0b0618', 10, false, true);
    // Hidden until the pointer is over the option: the trade-off and the numbers.
    const details = this.add
      .text(0, 250, `Pero ${part.tradeoff.toLowerCase()}\n${partNumbers(kind, part)}`, {
        fontFamily: 'Quicksand', fontSize: '19px', fontStyle: 'bold', color: CSS.pink, align: 'center', lineSpacing: 6,
        wordWrap: { width: 380 },
        backgroundColor: 'rgba(28, 10, 51, 0.88)', // readable over the bright clouds of the Earth
        padding: { x: 16, y: 10 },
      })
      .setOrigin(0.5, 0)
      .setAlpha(0);

    const option = this.add.container(x, y, [ring, picture, name, benefit, details]);
    option.setSize(320, 420).setInteractive({ useHandCursor: true, draggable: true });
    option.home = { x, y };
    option.details = details;
    // While dragging, only the part itself is held: the circle and the texts stay behind (hidden).
    // The hover details are not brought back: they only show again with the pointer over the option.
    option.lift = (lifted) => {
      this.tweens.killTweensOf([ring, name, benefit, details]);
      if (lifted) details.setAlpha(0);
      this.tweens.add({ targets: [ring, name, benefit], alpha: lifted ? 0 : 1, duration: lifted ? 120 : 250 });
    };

    option.on('pointerover', () => {
      if (option.dragged) return;
      this.tweens.add({ targets: option, scale: 1.05, duration: 150 });
      this.tweens.add({ targets: details, alpha: 1, duration: 200 });
    });
    option.on('pointerout', () => {
      this.tweens.add({ targets: option, scale: 1, duration: 150 });
      this.tweens.add({ targets: details, alpha: 0, duration: 200 });
    });

    // Drag: follow the pointer; on release, mount it if it's close to the satellite.
    option.on('pointerdown', () => (option.dragged = false));
    option.on('drag', (pointer, dragX, dragY) => {
      if (!option.dragged) {
        option.dragged = true;
        option.lift(true);
      }
      option.setPosition(dragX, dragY);
    });
    option.on('dragend', () => {
      if (!option.dragged) return;
      if (Phaser.Math.Distance.Between(option.x, option.y, this.art.x, this.art.y) < SNAP_DISTANCE) {
        this.mount(kind, part, option);
      } else {
        option.lift(false);
        this.tweens.add({ targets: option, x: x, y: y, duration: 300, ease: 'Back.out' });
      }
    });
    // A simple click (no drag) also mounts it.
    option.on('pointerup', () => {
      if (!option.dragged) this.mount(kind, part, option);
    });

    return option;
  }

  // The piece flies into its slot, the satellite shows it with a small bump, and then the screen
  // moves on by itself: to the next part still missing, or to the review once all are mounted
  // (also after changing a part that was already there).
  mount(kind, part, option) {
    if (this.advancing) return;
    const changed = this.placed.has(kind);
    const slot = this.art.slots(kind)[0];
    const flying = this.partImage(kind, part.id, option.x, option.y - 20);
    this.tweens.killTweensOf(option);

    // The part has left its circle for good: hide that option and dim the other one.
    this.advancing = true;
    this.options.forEach((o) => o.disableInteractive());
    option.setAlpha(0);
    for (const other of this.options) {
      // Hover details would stay stuck: the pointer-out event no longer fires once input is off.
      this.tweens.killTweensOf(other.details);
      other.details.setAlpha(0);
      if (other !== option) this.tweens.add({ targets: other, alpha: 0.35, scale: 0.95, duration: 250 });
    }

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
        this.design[kind] = part.id;
        this.placed.add(kind);
        if (this.step === this.maxStep) this.maxStep = Math.min(REVIEW, this.step + 1);
        this.persist();
        this.art.setPlaced(this.placed);
        this.art.applyDesign(this.design, kind);
        // Small bump of the whole satellite: the part clicked into place.
        this.tweens.add({ targets: this.art, scale: SATELLITE.scale * 1.04, duration: 110, yoyo: true, ease: 'Sine.out' });
        this.drawSlot();
        this.options.forEach((o) => o.list[0].setStrokeStyle(3, COLORS.glow, o === option ? 1 : 0));
        this.renderHud();
        // Shown but not spoken: the next screen's spoken intro would cut it anyway.
        this.ui.say(mountLine(part, changed), { silent: true });
        const stepAtMount = this.step;
        this.time.delayedCall(AUTO_NEXT_MS, () => {
          if (this.step === stepAtMount) this.goTo(this.nextStep()); // unless she already moved on
        });
      },
    });
  }

  // ---------- HTML layer: parts strip, mass/budget, review balance, buttons ----------

  renderHud() {
    const totals = this.mountedTotals();
    const slots = kinds
      .map((kind, i) => {
        const current = [this.step === i ? 'current' : '', this.linkedKind === kind ? 'linked' : ''].join(' ');
        const content = this.placed.has(kind) ? partThumb(kind, this.design[kind], 56, 42) : '';
        return `<button class="ws-slot ${current}" data-action="goto" data-kind="${kind}" ${i > this.maxStep ? 'disabled' : ''} aria-label="${catalog[kind].label}">${content}</button>`;
      })
      .join('');
    const review = `<button class="ws-slot ws-slot-review ${this.step === REVIEW ? 'current' : ''}" data-action="goto" data-kind="review" ${REVIEW > this.maxStep ? 'disabled' : ''}>Revisar</button>`;

    let next = '';
    if (this.advancing) {
      next = ''; // it moves on by itself in a moment; a button appearing and vanishing would only distract
    } else if (this.kind && this.placed.has(this.kind)) {
      const target = this.nextStep();
      next = actionButton('next', target === REVIEW ? 'Revisar ›' : `Siguiente: ${catalog[kinds[target]].label} ›`, true);
    } else if (!this.kind) {
      next = actionButton('launch', 'Lanzar ›', true, !stats(catalog, this.design).valid);
    }

    this.ui.area('center').innerHTML = `
      <div class="ws-next">${next}</div>
      <div class="ws-strip">
        <div class="ws-slots">${slots}${review}</div>
        <div class="ws-mini-meters">${meter('Masa', totals.mass, limits.mass, ' kg')}${meter('Presupuesto', totals.cost, limits.budget)}</div>
      </div>`;

    this.ui.area('right').innerHTML = this.kind ? '' : this.reviewPanel();
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
        <div><dt>Resolver un imprevisto</dt><dd>−${REFRAME_ENERGY}</dd></div>
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
