import { sensorArchiveView } from '../game/chaco-sensor-view.js';
import { comparisonCase } from '../game/chaco-comparison.js';

/** Sharp animated archive frames; not a georeferenced view of the map marker. */
export class SatelliteSensor {
  constructor(canvas, design, onReady, onError) {
    this.canvas = canvas;
    this.quality = design.camera === 'detail' ? 2 : 1;
    this.ready = false;
    canvas.width = sensorArchiveView(0, this.quality).outputWidth;
    canvas.height = canvas.width * 9 / 16;
    this.context = canvas.getContext('2d');
    this.images = new Map();
    for (const source of [comparisonCase.before, comparisonCase.after]) {
      const image = new Image();
      image.src = `${import.meta.env.BASE_URL}${source}`;
      this.images.set(source,image);
    }
    Promise.all([...this.images.values()].map(image => image.decode())).then(() => {
      if (this.destroyed) return;
      this.ready = true;
      this.update(0);
      onReady();
    }).catch(() => { if (!this.destroyed) onError?.('No se pudieron preparar las imágenes del Chaco. Recargá la página para reintentar.'); });
  }
  update(progress, { clouds = 0, adjustment = 0, time = 0 } = {}) {
    if (!this.ready) return;
    this.frame = sensorArchiveView(progress,this.quality,adjustment);
    const image = this.images.get(this.frame.source), crop = this.frame.crop;
    this.context.imageSmoothingEnabled = true;
    this.context.imageSmoothingQuality = 'high';
    this.context.drawImage(image, crop.x*image.width, crop.y*image.height,
      crop.width*image.width, crop.height*image.height, 0, 0, this.canvas.width, this.canvas.height);

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

  }
  capture(phase) {
    if (!this.ready) throw new Error('La cámara todavía está preparando la vista. Esperá un momento.');
    return {
      phase, quality: this.quality,
      image: this.canvas.toDataURL('image/jpeg', .88),
      year: this.frame.year, source: this.frame.source, archive: true
    };
  }
  destroy() { this.destroyed = true; this.images.clear(); }
}
