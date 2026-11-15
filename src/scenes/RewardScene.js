import Phaser from 'phaser';
import { stats } from '../game/model.js';
import { catalog, readDesign } from '../game/design.js';
import { actionButton, addArt, mount, preloadArt } from '../ui/mission-ui.js';
import { centerDesignArea } from '../ui/layout.js';
import { sfx } from '../ui/sfx.js';

// What went wrong, in one short sentence, and the part that fixes it (same order as the flight:
// photos first, then sending them).
function whatFailed(m) {
  if (m.captured.length < 2) return { text: 'La batería no alcanzó para las dos fotos.', part: 'battery' };
  if (!m.sent) return { text: 'No quedó energía para enviar las fotos.', part: 'battery' };
  return { text: 'La antena no pudo enviar todas las fotos.', part: 'antenna' };
}

// Last screen of the game. Success: the one celebration, with the two photos taken (already analyzed in
// Observe) and a button to play again. Failure: what was missing, the part to blame blinking on the
// satellite, and one button to fix it.
export class RewardScene extends Phaser.Scene {
  constructor() {
    super('Reward');
  }

  init(data = {}) {
    this.design = readDesign(data.design);
    this.mission = data.mission ?? null;
    this.captures = (data.captures ?? []).filter((shot) => typeof shot.image === 'string'); // camera photos (or archive images in dev)
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

    const art = addArt(this, this.design);
    const m = this.mission;
    const success = m.delivered >= 2;
    const ui = mount(this);
    ui.root.classList.add('ws--result');

    ui.area('center').innerHTML = `<h1 class="ws-headline ws-result-title">${success ? '¡Misión cumplida!' : '¡Casi!'}</h1>`;

    const below = document.createElement('div');
    below.className = 'ws-result-below';
    ui.root.append(below);

    if (success) sfx.success();
    else sfx.almost();

    if (success) {
      art.setPosition(960, 395).setScale(0.8); // a bit higher and smaller, to fit the cards around it
      // What the player practiced, so they feel proud: one card on each side of the satellite and,
      // below it, the discovery with the two photos of the mission as a trophy. Cards appear one by one.
      const card = (title, text, extra = '', delay = 0, side = '') =>
        `<div class="ws-achievement ${side}" style="animation-delay:${delay}s"><strong>${title}</strong><p>${text}</p>${extra}</div>`;
      const photos = this.captures.slice(0, 2).map((shot) => `
        <figure class="ws-result-photo">
          <img src="${shot.image}" alt="Foto del Chaco, ${shot.year}">
          <figcaption>${shot.year >= 2020 ? 'Hoy' : shot.year}</figcaption>
        </figure>`).join('');
      const sides = document.createElement('div');
      sides.innerHTML = card('DISEÑASTE', 'Elegiste las piezas<br>de tu satélite', '', 0.4, 'ws-achievement-left')
        + card('PROBASTE', 'Cuidaste la energía<br>en el viaje', '', 0.75, 'ws-achievement-right');
      ui.root.append(...sides.children);
      below.innerHTML = card('DESCUBRISTE', 'Encontraste cómo cambió el bosque', photos ? `<div class="ws-result-photos">${photos}</div>` : '', 1.1);
      // Credits of the real data used in the mission, small, at the very end (not during play).
      const credits = document.createElement('p');
      credits.className = 'ws-credits';
      credits.textContent = 'Imágenes: NASA Landsat · Mapa: NASA GIBS y Natural Earth (MapLibre) · Recorrido simulado';
      ui.root.append(credits);
      ui.area('actions').innerHTML = actionButton('again', 'Jugar de nuevo', true);
      ui.bind({ again: () => this.scene.start('Menu') });
    } else {
      const failed = whatFailed(m);
      below.innerHTML = `<p class="ws-result-reason">${failed.text}</p>`;
      ui.area('actions').innerHTML = actionButton('fix', `Cambiar ${catalog[failed.part].label.toLowerCase()} ›`, true);
      ui.bind({ fix: () => this.scene.start('Build', { design: this.design, focus: failed.part }) });
      // The part to change blinks on the satellite (the same "just mounted" highlight, repeated).
      const blink = () => art.applyDesign(this.design, failed.part);
      this.time.delayedCall(600, blink);
      this.time.addEvent({ delay: 2200, loop: true, callback: blink });
    }
  }
}
