import Phaser from 'phaser';
import { COLORS } from './palette.js';

// Where each part is in public/assets/satellite-modules.png, as [x, y, width, height] normalized to
// 1280 × 1280 (the atlas itself is 2048 × 2048; the code scales). The atlas packs the 9 separate
// pieces of the ASTRION art (chassis, 2 solar panels, 2 cameras, 2 battery modules, 2 antennas).
export const frames = {
  body: [5, 441.25, 406.25, 373.75],
  'solar-small': [513.75, 820, 403.75, 197.5], 'solar-large': [513.75, 1022.5, 546.25, 197.5],
  'camera-simple': [773.75, 441.25, 332.5, 336.25], 'camera-detail': [5, 820, 503.75, 322.5],
  'battery-light': [757.5, 5, 182.5, 385], 'battery-long': [416.25, 441.25, 352.5, 362.5],
  'antenna-basic': [5, 5, 245, 431.25], 'antenna-fast': [255, 5, 497.5, 417.5],
};

// How each part is drawn on the satellite (container coordinates, before scaling): center and size.
// Sizes keep each piece's own proportions. The body is in the middle; camera on its front,
// battery module below, antenna on top, one solar panel on each side.
const BODY = { width: 300, height: 276 };
const PART_LAYOUT = {
  'camera-simple': { x: 0, y: 8, width: 118, height: 119 },
  'camera-detail': { x: 0, y: 8, width: 176, height: 113 },
  'battery-light': { x: 0, y: 176, width: 62, height: 131 },
  'battery-long': { x: 0, y: 178, width: 126, height: 130 },
  'antenna-basic': { x: 0, y: -178, width: 72, height: 127 },
  'antenna-fast': { x: 0, y: -176, width: 156, height: 131 },
  'solar-small': { span: 234, width: 206, height: 101 },
  'solar-large': { span: 270, width: 279, height: 101 },
};
const SLOT_Y = { camera: 8, battery: 176, antenna: -177 };

// The rectangles above are loose: they include empty space and sometimes a sliver of the
// neighbouring part. contentBounds() finds where the part really is inside its frame, by reading
// the pixels once: the biggest block of non-transparent columns and rows (so a separate sliver
// at the edge is ignored). Returns { x, y, width, height } in frame pixels, plus cx/cy:
// how far the part's center is from the frame's center.
const boundsCache = {};
export function contentBounds(scene, frameName) {
  if (boundsCache[frameName]) return boundsCache[frameName];
  const frame = scene.textures.getFrame('satellite-modules', frameName);
  const w = frame.cutWidth;
  const h = frame.cutHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(frame.source.image, frame.cutX, frame.cutY, w, h, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  const cols = new Array(w).fill(0);
  const rows = new Array(h).fill(0);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 40) {
        cols[x]++;
        rows[y]++;
      }
    }
  }
  // Largest run of consecutive non-empty columns (or rows), weighted by how many pixels it has.
  const mainRun = (counts) => {
    let best = { start: 0, end: counts.length - 1, total: -1 };
    let start = -1;
    let total = 0;
    counts.forEach((count, i) => {
      if (count > 0) {
        if (start < 0) { start = i; total = 0; }
        total += count;
      }
      if (start >= 0 && (count === 0 || i === counts.length - 1)) {
        const end = count === 0 ? i - 1 : i;
        if (total > best.total) best = { start, end, total };
        start = -1;
      }
    });
    return best;
  };
  const cx = mainRun(cols);
  const cy = mainRun(rows);
  const bounds = { x: cx.start, y: cy.start, width: cx.end - cx.start + 1, height: cy.end - cy.start + 1 };
  bounds.cx = bounds.x + bounds.width / 2 - w / 2;
  bounds.cy = bounds.y + bounds.height / 2 - h / 2;
  boundsCache[frameName] = bounds;
  return bounds;
}

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
    this.body = image('body').setDisplaySize(BODY.width, BODY.height);
    this.components = { camera: image('camera-simple'), battery: image('battery-light'), antenna: image('antenna-basic') };
    this.highlight = scene.add.graphics();
    this.add([...this.wings, this.body, this.components.battery, this.components.camera, this.components.antenna, this.highlight]);
    this.applyDesign(design);
  }

  applyDesign(design, changedKind = null) {
    const wingFrame = `solar-${design.solar}`, wingLayout = PART_LAYOUT[wingFrame];
    this.wings.forEach((wing, i) => {
      this.scene.tweens.killTweensOf(wing);
      wing.setFrame(wingFrame).setDisplaySize(wingLayout.width, wingLayout.height)
        .setPosition(i ? wingLayout.span : -wingLayout.span, 0).setAlpha(1);
    });
    const layout = {};
    for (const kind of ['camera', 'battery', 'antenna']) {
      const frame = `${kind}-${design[kind]}`;
      layout[kind] = { frame, ...PART_LAYOUT[frame], size: PART_LAYOUT[frame].width };
      const part = this.components[kind];
      this.scene.tweens.killTweensOf(part);
      part.setFrame(frame).setDisplaySize(PART_LAYOUT[frame].width, PART_LAYOUT[frame].height)
        .setPosition(PART_LAYOUT[frame].x, PART_LAYOUT[frame].y).setAlpha(1);
    }
    this.setPlaced(this.placed ?? ['camera', 'solar', 'battery', 'antenna']);
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
    this.highlight.lineStyle(3, COLORS.glow, .9).strokeEllipse(spot.x, spot.y, spot.w, spot.h).setAlpha(1);
    this.scene.tweens.add({ targets: this.highlight, alpha: 0, duration: 650, ease: 'Sine.easeOut' });
  }

  // Which part types are mounted on the satellite. The body is always there; the others appear
  // only once placed (the workshop builds the satellite piece by piece). Default: all of them.
  setPlaced(kinds) {
    this.placed = new Set(kinds);
    this.wings.forEach(wing => wing.setVisible(this.placed.has('solar')));
    for (const [kind, part] of Object.entries(this.components)) part.setVisible(this.placed.has(kind));
    return this;
  }

  // Where a part type is mounted, in the satellite's own coordinates (before scaling).
  // Solar panels have two spots, one per wing. Used to draw the "empty slot" marker.
  slots(kind) {
    if (kind === 'solar') return this.wings.map(wing => ({ x: wing.x, y: 0, w: 200, h: 130 }));
    return [{ x: 0, y: SLOT_Y[kind], w: 150, h: 130 }];
  }

  setTint(value) {
    [...this.wings, this.body, ...Object.values(this.components)].forEach(part => part.setTint(value));
    return this;
  }
}
