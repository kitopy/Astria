import Phaser from 'phaser';
import { readDesign } from '../game/design.js';

const PARTS = [
  ['camera', 'Cámara'],
  ['solar', 'Panel solar'],
  ['battery', 'Batería'],
  ['antenna', 'Antena'],
];

const FLIGHT_STAGES = [
  ['first-observation', 'Primera observación'],
  ['second-observation', 'Segunda observación'],
  ['return-low-battery', 'Regreso · batería en cero'],
  ['transmission', 'Transmisión en Asunción'],
];

export class DevToolsScene extends Phaser.Scene {
  constructor() { super('DevTools'); }

  create() {
    const root = document.createElement('main');
    root.className = 'ws-devtools';
    root.innerHTML = `
      <section class="ws-devtools-card" aria-labelledby="devtools-title">
        <span class="ws-devtools-kicker">ASTRION · SOLO EN ESTE EQUIPO</span>
        <h1 id="devtools-title">¿Qué querés probar?</h1>
        <p>Saltá directo a una parte del juego. Estos escenarios preparan la nave y la misión para que puedas repetir una pantalla sin empezar de cero.</p>
        <h2>Armar o ajustar una pieza</h2>
        <div class="ws-devtools-buttons">${PARTS.map(([part, label]) => `<button data-dev-part="${part}">${label}</button>`).join('')}</div>
        <h2>Probar un momento del viaje</h2>
        <div class="ws-devtools-buttons">${FLIGHT_STAGES.map(([stage, label]) => `<button data-dev-stage="${stage}">${label}</button>`).join('')}</div>
        <h2>Investigar el Chaco</h2>
        <div class="ws-devtools-buttons"><button data-dev-observe>Comparación de imágenes</button></div>
        <button class="ws-devtools-normal" data-dev-normal>Ir al juego normal</button>
      </section>`;
    document.body.append(root);

    root.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;
      if (button.hasAttribute('data-dev-normal')) {
        this.scene.start('Menu');
        return;
      }
      if (button.hasAttribute('data-dev-observe')) {
        this.scene.start('Observe');
        return;
      }
      const design = readDesign();
      if (button.dataset.devPart) {
        this.scene.start('Build', { design, focus: button.dataset.devPart });
      } else if (button.dataset.devStage) {
        this.scene.start('Test', { design, debugScenario: button.dataset.devStage });
      }
    });

    this.events.once('shutdown', () => root.remove());
  }
}
