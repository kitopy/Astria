import Phaser from 'phaser';

// Rectángulos medidos en el atlas (coordenadas normalizadas a 1280 × 1280).
const frames = {
  body: [50, 50, 340, 350], 'solar-small': [440, 110, 350, 230], 'solar-large': [800, 105, 450, 240],
  'camera-simple': [70, 460, 300, 330], 'camera-detail': [425, 470, 395, 320], 'battery-light': [900, 470, 240, 320],
  'battery-long': [35, 885, 380, 340], 'antenna-basic': [500, 870, 240, 350], 'antenna-fast': [820, 835, 430, 390]
};

/** Modular art: one shared atlas, independent visual choices for each subsystem. */
export class SatelliteAssembly extends Phaser.GameObjects.Container {
  constructor(scene, x, y, design) {
    super(scene, x, y);
    scene.add.existing(this);
    const texture = scene.textures.get('satellite-modules');
    const source = texture.getSourceImage();
    Object.entries(frames).forEach(([name, rect]) => {
      if (texture.has(name)) return;
      const [x, y, w, h] = rect;
      texture.add(name, 0, Math.round(x * source.width / 1280), Math.round(y * source.height / 1280), Math.round(w * source.width / 1280), Math.round(h * source.height / 1280));
    });
    const image = frame => scene.add.image(0, 0, 'satellite-modules', frame);
    this.wings = [image('solar-small'), image('solar-small')];
    this.body = image('body').setDisplaySize(290, 300);
    this.components = { camera: image('camera-simple'), battery: image('battery-light'), antenna: image('antenna-basic') };
    this.highlight = scene.add.graphics();
    this.add([...this.wings, this.body, this.components.battery, this.components.camera, this.components.antenna, this.highlight]);
    this.applyDesign(design);
  }

  applyDesign(design, changedKind = null) {
    const extended = design.solar === 'large';
    const span = extended ? 210 : 175, size = extended ? 300 : 210;
    this.wings.forEach((wing, i) => {
      this.scene.tweens.killTweensOf(wing);
      wing.setFrame(extended ? 'solar-large' : 'solar-small').setDisplaySize(size, extended ? 160 : 138)
        .setPosition(i ? span : -span, 0).setAlpha(1);
    });
    const layout = {
      camera: { frame: `camera-${design.camera}`, x: 0, y: 25, size: design.camera === 'detail' ? 190 : 130, height: design.camera === 'detail' ? 154 : 143 },
      battery: { frame: `battery-${design.battery}`, x: 0, y: 160, size: design.battery === 'long' ? 165 : 90, height: design.battery === 'long' ? 148 : 120 },
      antenna: { frame: `antenna-${design.antenna}`, x: 0, y: -160, size: design.antenna === 'fast' ? 180 : 100, height: design.antenna === 'fast' ? 163 : 146 }
    };
    for (const [kind, config] of Object.entries(layout)) {
      const part = this.components[kind];
      this.scene.tweens.killTweensOf(part);
      part.setFrame(config.frame).setDisplaySize(config.size, config.height).setPosition(config.x, config.y).setAlpha(1);
    }
    this.scene.tweens.killTweensOf(this.highlight);
    this.highlight.clear().setAlpha(0);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!changedKind || reduce) return;
    const targets = changedKind === 'solar' ? this.wings : [this.components[changedKind]];
    targets.forEach(part => {
      const destination = part.y;
      part.setY(destination - 18).setAlpha(.35);
      this.scene.tweens.add({ targets: part, y: destination, alpha: 1, duration: 360, ease: 'Cubic.easeOut' });
    });
    const spot = changedKind === 'solar' ? { x: 0, y: 0, w: 730, h: 180 } : {
      x: layout[changedKind].x, y: layout[changedKind].y, w: layout[changedKind].size * .9, h: layout[changedKind].size * .85
    };
    this.highlight.lineStyle(3, 0xb9f566, .9).strokeEllipse(spot.x, spot.y, spot.w, spot.h).setAlpha(1);
    this.scene.tweens.add({ targets: this.highlight, alpha: 0, duration: 650, ease: 'Sine.easeOut' });
  }

  setTint(value) {
    [...this.wings, this.body, ...Object.values(this.components)].forEach(part => part.setTint(value));
    return this;
  }
}
