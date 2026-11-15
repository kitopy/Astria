import Phaser from 'phaser';
import { addCoverBackground, centerDesignArea } from '../ui/layout.js';
import { noahStop, speakIfEnabled } from '../ui/noahVoice.js';
import { addNeonButton } from '../ui/neonButton.js';
import { CSS } from '../ui/palette.js';

// Mission briefing: one screen, one click. NOAH sums up who she is, the problem and the mission;
// the details of each part are explained later, inside the workshop.
const BRIEFING = 'Hola, exploradores. Soy NOAH. El bosque del Chaco paraguayo está cambiando: vamos a construir un satélite para fotografiarlo desde el espacio.';

const TYPE_SPEED_MS = 30; // delay between letters in the typewriter effect

export class StationScene extends Phaser.Scene {
  constructor() {
    super('Station');
  }

  create() {
    centerDesignArea(this);
    addCoverBackground(this, 'bg-station');

    const title = this.add
      .text(960, 260, 'MISIÓN CHACO', { fontFamily: 'Cinzel', fontSize: '120px', fontStyle: 'bold', color: CSS.pink })
      .setOrigin(0.5)
      .setPadding(48) // room for the shadow
      .setShadow(0, 4, '#2a0f4d', 30, false, true); // dark shadow: this background is bright, a pink glow would vanish
    const subtitle = this.add
      .text(960, 360, 'Paraguay · Observación de la Tierra', { fontFamily: 'Quicksand', fontSize: '32px', fontStyle: 'bold', color: '#ffffff' })
      .setOrigin(0.5)
      .setPadding(10)
      .setShadow(0, 2, '#1c0a33', 10, false, true);

    // NOAH's line, typed quickly. The button is available right away: no need to wait for it.
    this.add.image(960, 560, 'panel-dialog').setDisplaySize(1300, 300);
    const message = this.add
      .text(960, 560, '', {
        fontFamily: 'Quicksand', fontSize: '34px', fontStyle: 'bold', color: '#ffffff', align: 'center',
        lineSpacing: 10, wordWrap: { width: 1000 },
      })
      .setOrigin(0.5);
    let shown = 0;
    this.time.addEvent({
      delay: TYPE_SPEED_MS,
      repeat: BRIEFING.length - 1,
      callback: () => message.setText(BRIEFING.slice(0, ++shown)),
    });
    speakIfEnabled(this, BRIEFING);

    const start = () => this.scene.start('Build');
    const button = addNeonButton(this, 960, 820, 'CONSTRUIR MI SATÉLITE', start, { width: 720, fontSize: 40 });
    this.input.keyboard.once('keydown-ENTER', start);
    this.input.keyboard.once('keydown-SPACE', start);

    // Entrance: title, then subtitle, then the button.
    [title, subtitle, button].forEach((item, i) => {
      item.setAlpha(0);
      this.tweens.add({ targets: item, alpha: 1, duration: 450, delay: i * 200 });
    });

    this.addVoiceToggle();
  }

  // Top-right switch. Uses the same 'noahVoice' setting as the workshop screens.
  addVoiceToggle() {
    const label = () => `VOZ DE NOAH: ${this.registry.get('noahVoice') ? 'ACTIVADA' : 'APAGADA'}`;
    const toggle = this.add
      .text(1880, 50, label(), {
        fontFamily: 'Audiowide',
        fontSize: '24px',
        color: '#ffffff',
        backgroundColor: '#2a1650',
        padding: { x: 20, y: 12 },
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });

    toggle.on('pointerup', () => {
      const on = !this.registry.get('noahVoice');
      this.registry.set('noahVoice', on);
      toggle.setText(label());
      if (on) speakIfEnabled(this, BRIEFING);
      else noahStop();
    });
  }
}
