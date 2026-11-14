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
        <p>La Tierra del fondo es real: imagen Blue Marble de NASA/Goddard Scientific Visualization Studio.</p>
        <a href="${BASE}FUENTES.md" target="_blank" rel="noopener">Fuentes y reglas</a>
      </details>`;

    ui.area('center').innerHTML = `
      <h1 class="ws-headline">${success ? '¡Misión cumplida!' : 'Cada prueba enseña algo'}</h1>
      <p>${success ? 'Diseñaste. Probaste. Descubriste.' : 'Tu próxima idea puede cambiar el resultado.'}</p>`;

    if(this.captures.length){
      const right=ui.area('right');
      right.innerHTML='<h2 class="ws-title">Lo que capturó tu cámara</h2><div class="saved-sensor-photos"></div><p class="ws-story">Estas fotos guardan la vista de tu sensor sobre el mosaico de archivo de NASA. No representan fechas distintas ni demuestran cambios reales del bosque.</p>';
      const tray=right.querySelector('.saved-sensor-photos');
      this.captures.forEach((shot,i)=>{const figure=document.createElement('figure'),img=document.createElement('img'),caption=document.createElement('figcaption');img.src=shot.image;img.alt=`Captura ${i+1} del visor`;caption.textContent=`Foto ${i+1} · ${shot.delivered?'recibida en Tierra':'a bordo'}`;figure.append(img,caption);tray.append(figure);});
    }

    // The saved frames are shown above; Observe remains a separate comparison exercise.
    ui.area('actions').innerHTML = success
      ? actionButton('improve', 'Volver al taller') + actionButton('observe', 'Investigar el Chaco ›', true)
      : actionButton('improve', 'Mejorar mi satélite ›', true);

    ui.bind({
      improve: () => this.scene.start('Build', { design: this.design, focus: 'review' }),
      observe: () => this.scene.start('Observe', { design: this.design, mission: this.mission, captures: this.captures }),
    });

    ui.say(success
      ? this.captures.length
        ? '¡Lo lograste! Las dos fotos llegaron a la Tierra. Revisalas y después practicá cómo comparar imágenes.'
        : '¡Lo lograste! Tu satélite tomó y envió las dos fotos. Vamos a ver qué descubriste.'
      : 'Los resultados nos ayudan a diseñar mejor. Guardé tus piezas para que puedas ajustar tu satélite.');
  }
}
