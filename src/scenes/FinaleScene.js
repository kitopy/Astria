import Phaser from 'phaser';
import { speakIfEnabled } from '../ui/noahVoice.js';
import { DESIGN, addCoverBackground, centerDesignArea, visibleArea } from '../ui/layout.js';

// What the player did, and which real job does that work.
const ACHIEVEMENTS = [
  { title: 'DISEÑASTE', text: 'Elegiste las piezas de tu satélite,\ncomo una ingeniera espacial.' },
  { title: 'PROBASTE', text: 'Pusiste tu diseño a prueba\ny cuidaste la energía.' },
  { title: 'DESCUBRISTE', text: 'Comparaste fotos de la Tierra,\ncomo una científica.' },
];

const NOAH_LINE =
  'NOAH // ¡GRACIAS, EXPLORADORA!\nDetrás de cada misión hay personas que diseñan, prueban y descubren.\nVos también podés construir, descubrir y explorar el universo.';

// Closing celebration after the Observe scene.
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

    this.add
      .text(width / 2, 260, 'Tu satélite llegó a la órbita y sus fotos llegaron a la Tierra.', {
        fontFamily: 'Quicksand',
        fontSize: '40px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setShadow(0, 2, '#000000', 8);

    ACHIEVEMENTS.forEach((item, i) => this.addCard(width / 2 + (i - 1) * 540, 480, item, i));

    // NOAH dialog box, same position as in the Observe scene.
    this.add.image(362, 683, 'panel-dialog').setOrigin(0).setDisplaySize(1189, 274);
    this.add.text(458, 745, NOAH_LINE, {
      fontFamily: 'Audiowide',
      fontSize: '24px',
      color: '#ffffff',
      lineSpacing: 10,
    });
    speakIfEnabled(this, NOAH_LINE);

    this.add
      .text(1450, 905, 'VOLVER AL INICIO ›', { fontFamily: 'Audiowide', fontSize: '30px', color: '#b9f566' })
      .setOrigin(1, 1)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.scene.start('Menu'));
  }

  // One achievement card. Cards appear one after the other (delay grows with index).
  addCard(x, y, { title, text }, index) {
    const bg = this.add.rectangle(0, 0, 480, 230, 0x1d1036, 0.85).setStrokeStyle(4, 0xb98cff);
    const titleText = this.add
      .text(0, -60, title, { fontFamily: 'Audiowide', fontSize: '40px', color: '#b9f566' })
      .setOrigin(0.5);
    const body = this.add
      .text(0, 30, text, { fontFamily: 'Quicksand', fontSize: '28px', fontStyle: 'bold', color: '#ffffff', align: 'center' })
      .setOrigin(0.5);

    const card = this.add.container(x, y + 40, [bg, titleText, body]).setAlpha(0);
    this.tweens.add({ targets: card, alpha: 1, y, duration: 500, delay: 300 + index * 350, ease: 'Back.out' });
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
