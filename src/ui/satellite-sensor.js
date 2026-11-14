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
  update(progress, { clouds = 0, adjustment = 0, time = 0 } = {}) {
    if (!this.ready) return;
    const center = routePosition(progress);
    // A small illustrative camera pan, not a change to the satellite's orbit.
    center[0] += .45 * adjustment;
    const x = (center[0] - WEST) / (EAST - WEST) * this.image.width;
    const y = (mercator(NORTH) - mercator(center[1])) / (mercator(NORTH) - mercator(SOUTH)) * this.image.height;
    const width = this.image.width * (this.quality === 2 ? 1.6 : 2.6) / (EAST - WEST);
    const height = width * 9 / 16;
    const left = Math.max(0, Math.min(this.image.width - width, x - width / 2));
    const top = Math.max(0, Math.min(this.image.height - height, y - height / 2));
    this.context.imageSmoothingEnabled = this.quality === 2;
    this.context.drawImage(this.image, left, top, width, height, 0, 0, this.canvas.width, this.canvas.height);

    if (clouds > 0) {
      const ctx = this.context, w = this.canvas.width, h = this.canvas.height;
      ctx.save();
      // Procedural game clouds move out of the field as the camera reframes.
      for (const [cx, cy, size] of [[.15,.3,.5],[.48,.6,.48],[.8,.25,.45],[.9,.8,.4]]) {
        const x = (cx - adjustment * 1.5 + Math.sin(time / 2200 + cy) * .025) * w;
        const y = cy * h, radius = size * w;
        const gradient = ctx.createRadialGradient(x,y,0,x,y,radius);
        gradient.addColorStop(0, `rgba(235,242,251,${.95 * clouds})`);
        gradient.addColorStop(.5, `rgba(216,229,244,${.8 * clouds})`);
        gradient.addColorStop(1, 'rgba(215,229,244,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x-radius,y-radius,radius*2,radius*2);
      }
      ctx.restore();
    }

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
