import { routePosition } from '../game/chaco-flight.js';

const NORTH = -12, SOUTH = -35, WEST = -75, EAST = -43;
const mercator = lat => Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));

/** Simulated optical viewport over the local, georeferenced NASA archive mosaic. */
export class SatelliteSensor {
  constructor(canvas, design, onReady) {
    this.canvas = canvas;
    this.quality = design.camera === 'detail' ? 2 : 1;
    this.ready = false;
    canvas.width = this.quality === 2 ? 640 : 320;
    canvas.height = canvas.width * 9 / 16;
    this.context = canvas.getContext('2d');
    this.image = new Image();
    this.image.onload = () => {
      this.ready = true;
      this.update(0);
      onReady();
    };
    this.image.src = `${import.meta.env.BASE_URL}data/paraguay-bluemarble.jpg`;
  }
  update(progress) {
    if (!this.ready) return;
    const center = routePosition(progress);
    const x = (center[0] - WEST) / (EAST - WEST) * this.image.width;
    const y = (mercator(NORTH) - mercator(center[1])) / (mercator(NORTH) - mercator(SOUTH)) * this.image.height;
    const width = this.image.width * (this.quality === 2 ? 1.6 : 2.6) / (EAST - WEST);
    const height = width * 9 / 16;
    const left = Math.max(0, Math.min(this.image.width - width, x - width / 2));
    const top = Math.max(0, Math.min(this.image.height - height, y - height / 2));
    this.context.imageSmoothingEnabled = this.quality === 2;
    this.context.drawImage(this.image, left, top, width, height, 0, 0, this.canvas.width, this.canvas.height);

    // The source image uses Web Mercator, matching the map's georeferencing.
    const lon = px => WEST + px / this.image.width * (EAST - WEST);
    const lat = py => {
      const m = mercator(NORTH) - py / this.image.height * (mercator(NORTH) - mercator(SOUTH));
      return (2 * Math.atan(Math.exp(m)) - Math.PI / 2) * 180 / Math.PI;
    };
    this.footprint = [
      [lon(left), lat(top)], [lon(left + width), lat(top)],
      [lon(left + width), lat(top + height)], [lon(left), lat(top + height)],
      [lon(left), lat(top)]
    ];
  }
  capture(phase) {
    if (!this.ready) throw new Error('La cámara todavía está preparando la vista. Esperá un momento.');
    return {
      phase, quality: this.quality,
      image: this.canvas.toDataURL('image/jpeg', .88),
      footprint: this.footprint.map(point => [...point])
    };
  }
  destroy() { this.image.onload = null; }
}
