import Phaser from 'phaser';
import { feedback, stats } from '../game/model.js';
import { catalog, readDesign } from '../game/design.js';
import { actionButton, addArt, mount, preloadArt } from '../ui/mission-ui.js';
import { centerDesignArea } from '../ui/layout.js';

const BASE = import.meta.env.BASE_URL;

// Step 3: what happened in the mission and what to improve.
export class RewardScene extends Phaser.Scene {
  constructor() {
    super('Reward');
  }

  init(data = {}) {
    this.design = readDesign(data.design);
    this.mission = data.mission ?? null;
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
    const ui = mount(this, 2);

    ui.area('left').innerHTML = `
      <h2 class="ws-title">Resultados</h2>
      <div class="ws-stats">
        <div><strong>${m.captured.length}/2</strong><span>fotos tomadas</span></div>
        <div><strong>${m.delivered}/2</strong><span>llegaron a la Tierra</span></div>
      </div>
      <ul class="ws-feedback">${feedback(m, s).map((line) => `<li>${line}</li>`).join('')}</ul>
      <details class="ws-details"><summary>Bitácora de la misión</summary><ol>${m.log.map((line) => `<li>${line}</li>`).join('')}</ol></details>`;

    ui.area('right').innerHTML = `
      <h2 class="ws-title">${success ? 'Tu hallazgo' : 'Un nuevo intento'}</h2>
      <p class="ws-story">${success
        ? 'Tus fotos muestran que en una zona del bosque hay menos árboles. Detectar ese cambio es el comienzo de una investigación.'
        : 'El resultado depende de tus elecciones. Volvé al taller, cambiá una pieza y compará qué sucede.'}</p>
      <h3>Lo que aprendimos</h3>
      <p class="ws-story">La cámara necesita energía, la batería guarda una cantidad limitada y las fotos tienen que llegar a la Tierra. Las piezas trabajan juntas.</p>
      <details class="ws-details">
        <summary>¿Qué estamos simplificando?</summary>
        <p>La energía, el presupuesto y los datos usan unidades de juego. Las etapas no representan órbitas ni tiempos reales. El bosque y sus cambios son simulados.</p>
        <a href="${BASE}FUENTES.md" target="_blank" rel="noopener">Fuentes y reglas</a>
      </details>`;

    ui.area('center').innerHTML = `
      <h1 class="ws-headline">${success ? '¡Misión cumplida!' : 'Cada prueba enseña algo'}</h1>
      <p>${success ? 'Diseñaste. Probaste. Descubriste.' : 'Tu próxima idea puede cambiar el resultado.'}</p>`;

    // On success the photos reached Earth, so the player can go look at them.
    ui.area('actions').innerHTML = success
      ? actionButton('improve', 'Volver al taller') + actionButton('observe', 'Ver mis fotos ›', true)
      : actionButton('improve', 'Mejorar mi satélite ›', true);

    ui.bind({
      improve: () => this.scene.start('Build', { design: this.design }),
      observe: () => this.scene.start('Observe'),
    });

    ui.say(success
      ? '¡Lo lograste! Tu satélite tomó y envió las dos fotos. Vamos a ver qué descubriste.'
      : 'Los resultados nos ayudan a diseñar mejor. Guardé tus piezas para que puedas ajustar tu satélite.');
  }
}
