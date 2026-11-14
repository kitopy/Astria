import Phaser from 'phaser';
import { feedback, stats } from '../game/model.js';
import { catalog, readDesign } from '../game/design.js';
import { actionButton, addArt, mount, preloadArt } from '../ui/mission-ui.js';
import { centerDesignArea } from '../ui/layout.js';

export class RewardScene extends Phaser.Scene {
  constructor() { super('Reward'); }
  init(data = {}) { this.design = readDesign(data.design); this.mission = data.mission ?? null; }
  preload() { preloadArt(this); }
  create() {
    centerDesignArea(this);
    if (!this.mission) { this.scene.start('Build', { design: this.design }); return; }
    addArt(this, this.design);
    const m = this.mission, s = stats(catalog, this.design), success = m.delivered >= 2;
    const ui = mount(this, success ? '¡Misión <span>cumplida!</span>' : 'Cada prueba <span>enseña algo.</span>', 'Descubrí qué funcionó y cómo mejorar tu satélite.', 2);
    ui.root.querySelector('.assembly-zone').hidden = true;
    ui.area('left').innerHTML = `<h2>Tu misión, en resultados</h2><div class="result-numbers"><div><strong>${m.captured.length}/2</strong><span>Imágenes obtenidas</span></div><div><strong>${m.delivered}/2</strong><span>Recibidas en Tierra</span></div></div><ul class="feedback-list">${feedback(m, s).map(line => `<li>${line}</li>`).join('')}</ul><details class="science-note"><summary>Bitácora de la misión</summary><ol>${m.log.map(line => `<li>${line}</li>`).join('')}</ol></details>`;
    ui.area('right').innerHTML = `<h2>${success ? 'Tu hallazgo simulado' : 'Un nuevo intento'}</h2><p class="result-story">${success ? 'Las observaciones simuladas indican una zona con menor cobertura de árboles. Detectar ese cambio es el comienzo de una investigación.' : 'El resultado depende de tus elecciones. Podés volver al taller con el mismo diseño y cambiar una pieza para comparar qué sucede.'}</p><h3>Lo que aprendimos</h3><p class="result-story">La cámara necesita energía, la batería tiene una capacidad y las imágenes deben llegar a la Tierra. Las piezas trabajan juntas.</p><p class="science-note">Explicar la causa de un cambio requiere más evidencias. Este bosque y sus observaciones son ficticios.</p>`;
    ui.area('caption').textContent = success ? 'Diseñaste. Probaste. Descubriste.' : 'Tu siguiente idea puede cambiar el resultado';
    ui.area('caption-detail').textContent = `Detalle elegido: ${s.quality === 2 ? 'alto' : 'general'} · Diseño conservado para volver a probar`;
    // On success the images reached Earth, so the player can go look at them.
    ui.area('actions').innerHTML = success
      ? actionButton('menu', 'Menú') + actionButton('improve', 'Volver al taller') + actionButton('observe', 'Ver mis imágenes →', true)
      : actionButton('menu', 'Menú') + actionButton('improve', 'Volver al taller y mejorar →', true);
    ui.bind({
      menu: () => this.scene.start('Menu'),
      improve: () => this.scene.start('Build', { design: this.design }),
      observe: () => this.scene.start('Observe'),
    });
    ui.say(success ? '¡Lo lograste! Tu satélite obtuvo y entregó las dos imágenes. Si querés, intentá conseguir más detalle con otra combinación.' : 'Los resultados nos ayudan a diseñar mejor. Conservamos tus piezas para que puedas ajustar tu satélite.');
  }
}
