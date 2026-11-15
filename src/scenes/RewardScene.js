import Phaser from 'phaser';
import { feedback, stats } from '../game/model.js';
import { catalog, readDesign } from '../game/design.js';
import { actionButton, addArt, mount, preloadArt } from '../ui/mission-ui.js';
import { centerDesignArea } from '../ui/layout.js';
import { comparisonCase } from '../game/chaco-comparison.js';

const BASE = import.meta.env.BASE_URL;

// Step 3: what happened in the mission and what to improve.
export class RewardScene extends Phaser.Scene {
  constructor() {
    super('Reward');
  }

  init(data = {}) {
    this.design = readDesign(data.design);
    this.mission = data.mission ?? null;
    this.captures=(data.captures??[]).filter(shot=>typeof shot.image==='string'&&shot.image.startsWith('data:image/jpeg;base64,'));
  }

  preload() {
    preloadArt(this);
  }

  create() {
    centerDesignArea(this);
    if (!this.mission) {
      this.scene.start('Build', { design: this.design });
      return;
    }

    addArt(this, this.design);
    const m = this.mission;
    const s = stats(catalog, this.design);
    const success = m.delivered >= 2;
    const ui = mount(this);

    ui.area('left').innerHTML = `
      <h2 class="ws-title">Resultados</h2>
      <div class="ws-stats">
        <div><strong>${m.captured.length}/2</strong><span>fotos tomadas</span></div>
        <div><strong>${m.delivered}/2</strong><span>llegaron a la Tierra</span></div>
      </div>
      <ul class="ws-feedback">${feedback(m, s).map((line) => `<li>${line}</li>`).join('')}</ul>
      <details class="ws-details"><summary>Bitácora de la misión</summary><ol>${m.log.map((line) => `<li>${line}</li>`).join('')}</ol></details>`;

    ui.area('center').innerHTML = `
      <h1 class="ws-headline">${success ? '¡Misión cumplida!' : 'Cada prueba enseña algo'}</h1>
      <p>${success ? 'Diseñaste. Probaste. Descubriste.' : 'Tu próxima idea puede cambiar el resultado.'}</p>`;

    const right=ui.area('right');
    right.innerHTML=`<h2 class="ws-title">El Chaco: antes y después</h2>
      <div class="saved-sensor-photos historical-sensor-photos">
        <figure><img src="${BASE}${comparisonCase.before}" alt="Antes: Chaco paraguayo en ${comparisonCase.beforeYear}" data-year="${comparisonCase.beforeYear}"><figcaption>Antes · ${comparisonCase.beforeYear}</figcaption></figure>
        <figure><img src="${BASE}${comparisonCase.after}" alt="Después: el mismo sector en ${comparisonCase.afterYear}" data-year="${comparisonCase.afterYear}"><figcaption>Después · ${comparisonCase.afterYear}</figcaption></figure>
      </div><p class="ws-story">El mismo sector, cuarenta años después. Son imágenes de archivo Landsat / NASA: tu misión recrea la observación.</p>`;

    // After a successful mission the photos were already analyzed (Observe), so this is the last step.
    ui.area('actions').innerHTML = success
      ? actionButton('improve', 'Volver al taller') + actionButton('finish', 'Terminar ›', true)
      : actionButton('improve', 'Mejorar mi satélite ›', true);

    ui.bind({
      improve: () => this.scene.start('Build', { design: this.design, focus: 'review' }),
      finish: () => this.scene.start('Finale'),
    });

    ui.say(success
      ? '¡Lo lograste! Las dos fotos llegaron a la Tierra.'
      : 'Los resultados nos ayudan a diseñar mejor. Guardé tus piezas para que puedas ajustar tu satélite.');
  }
}
