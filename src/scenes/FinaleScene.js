import Phaser from 'phaser';
import { speakIfEnabled } from '../ui/noahVoice.js';
import { DESIGN, addCoverBackground, centerDesignArea, visibleArea } from '../ui/layout.js';
import { COLORS, CSS } from '../ui/palette.js';
import { addNeonButton } from '../ui/neonButton.js';
import { sfx } from '../ui/sfx.js';

// What the player practiced, so they feel proud of it: one short sentence each.
const ACHIEVEMENTS = [
  { title: 'DISEÑASTE', text: 'Elegiste las piezas\nde tu satélite' },
  { title: 'PROBASTE', text: 'Cuidaste la energía\nen el viaje' },
  { title: 'DESCUBRISTE', text: 'Encontraste cómo\ncambió el bosque' },
];

const NOAH_LINE = '¡Gracias, explorador! Vos también podés explorar el universo.';

// The end of a successful mission (right after analyzing the photos): the original art's celebration,
// with what the player practiced, falling golden stars and a fanfare.
export class FinaleScene extends Phaser.Scene {
  constructor() {
    super('Finale');
  }

  create() {
    centerDesignArea(this);
    const { width } = DESIGN;

    addCoverBackground(this, 'bg-station');
    this.addFallingStars();

    this.add
      .text(width / 2, 150, '¡MISIÓN COMPLETA!', {
        fontFamily: 'Cinzel',
        fontSize: '110px',
        fontStyle: 'bold',
        color: '#f5c7e7',
      })
      .setOrigin(0.5)
      .setShadow(0, 4, '#3b1d63', 12);

    ACHIEVEMENTS.forEach((item, i) => this.addCard(width / 2 + (i - 1) * 520, 410, item, i));
    sfx.success();

    // NOAH's goodbye: one line in the dialog panel of the original art.
    this.add.image(width / 2, 660, 'panel-dialog').setDisplaySize(1100, 220);
    this.add
      .text(width / 2, 660, NOAH_LINE, { fontFamily: 'Quicksand', fontSize: '34px', fontStyle: 'bold', color: '#ffffff', align: 'center', wordWrap: { width: 900 } })
      .setOrigin(0.5);
    speakIfEnabled(this, NOAH_LINE);

    addNeonButton(this, width / 2, 880, 'JUGAR DE NUEVO', () => this.scene.start('Menu'), { width: 620, height: 110, fontSize: 38 });

    // Credits of the real data used in the mission, small, at the very end.
    this.add
      .text(width / 2, 1030, 'Imágenes: NASA Landsat · Mapa: NASA GIBS y Natural Earth (MapLibre) · Recorrido simulado', {
        fontFamily: 'Quicksand', fontSize: '18px', color: '#e9defc',
      })
      .setOrigin(0.5)
      .setShadow(0, 1, '#000000', 4);
  }

  // One achievement card. Cards appear one after the other (delay grows with index).
  addCard(x, y, { title, text }, index) {
    const bg = this.add.rectangle(0, 0, 460, 200, COLORS.panel, 0.85).setStrokeStyle(4, COLORS.orchid);
    const titleText = this.add
      .text(0, -50, title, { fontFamily: 'Audiowide', fontSize: '40px', color: CSS.gold })
      .setOrigin(0.5);
    const body = this.add
      .text(0, 30, text, { fontFamily: 'Quicksand', fontSize: '28px', fontStyle: 'bold', color: '#ffffff', align: 'center', lineSpacing: 4 })
      .setOrigin(0.5);

    const card = this.add.container(x, y + 40, [bg, titleText, body]).setAlpha(0);
    this.tweens.add({ targets: card, alpha: 1, y, duration: 500, delay: 300 + index * 350, ease: 'Back.out' });
    // Then each card glows once, like a medal being awarded, and the gold title keeps a soft pulse.
    this.tweens.add({ targets: card, scale: 1.08, duration: 180, yoyo: true, delay: 900 + index * 350, ease: 'Sine.out' });
    this.tweens.add({ targets: titleText, alpha: 0.65, duration: 900, yoyo: true, repeat: -1, delay: 1400 + index * 200 });
  }

  // Celebration: small golden stars (the "anomaly" art) falling and spinning across the screen.
  addFallingStars() {
    // Starts above the top of the visible area, which can be above y=0 on taller windows.
    const top = visibleArea(this).y;
    this.add.particles(0, top - 40, 'star-anomaly', {
      x: { min: -400, max: DESIGN.width + 400 }, // wider than 1920 to cover wide windows
      lifespan: 6000,
      speedY: { min: 120, max: 260 },
      speedX: { min: -40, max: 40 },
      scale: { min: 0.04, max: 0.1 },
      rotate: { start: 0, end: 360 },
      alpha: { start: 1, end: 0.2 },
      frequency: 90,
      blendMode: 'ADD', // glowing look over the dark background
    });
  }
}
