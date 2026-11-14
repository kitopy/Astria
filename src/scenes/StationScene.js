import Phaser from 'phaser';
import { addCoverBackground, centerDesignArea } from '../ui/layout.js';
import { speakIfEnabled } from '../ui/noahVoice.js';

// NOAH presents the mission, one line per "CONTINUAR".
// Adapted from the GDevelop scene "ESTACION PRINCIPAL" to the forest mission.
const LINES = [
  'NOAH // CONEXIÓN ESTABLECIDA\nBienvenida a bordo, exploradora.\nSoy NOAH, tu asistente de misión.',
  'NOAH // ALERTA DESDE PARAGUAY\nEl bosque del Chaco paraguayo está cambiando.\nDesde el espacio podemos investigar qué ocurre.',
  'NOAH // TU MISIÓN\nVas a diseñar un satélite que tome dos fotos del bosque\ny las envíe a la Tierra.',
  'NOAH // ¿ESTÁS LISTA?\nCada pieza del satélite tiene ventajas y desafíos.\nVamos al taller a construir el tuyo.',
];

const TYPE_SPEED_MS = 28; // delay between letters in the typewriter effect

export class StationScene extends Phaser.Scene {
  constructor() {
    super('Station');
  }

  create() {
    centerDesignArea(this);
    this.lineIndex = 0;

    addCoverBackground(this, 'bg-station');

    // Big NOAH panel, like in GDevelop.
    this.add.image(960, 560, 'panel-dialog').setDisplaySize(1700, 567);
    this.message = this.add.text(250, 445, '', {
      fontFamily: 'Audiowide',
      fontSize: '38px',
      color: '#ffffff',
      lineSpacing: 18,
    });

    this.continueButton = this.add
      .text(1640, 735, '', { fontFamily: 'Audiowide', fontSize: '36px', color: '#b9f566' })
      .setOrigin(1, 1)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.advance());

    this.addVoiceToggle();

    // Keyboard shortcut: Space or Enter also advance.
    this.input.keyboard.on('keydown-SPACE', () => this.advance());
    this.input.keyboard.on('keydown-ENTER', () => this.advance());

    this.showLine();
  }

  // Shows LINES[lineIndex] letter by letter, and reads it aloud if the voice is on.
  showLine() {
    const text = LINES[this.lineIndex];
    const isLast = this.lineIndex === LINES.length - 1;

    this.continueButton.setText(isLast ? 'IR AL TALLER ›' : 'CONTINUAR ›');
    this.message.setText('');
    speakIfEnabled(this, text);

    this.typing?.remove();
    this.typing = this.time.addEvent({
      delay: TYPE_SPEED_MS,
      repeat: text.length - 1,
      callback: () => this.message.setText(text.slice(0, this.message.text.length + 1)),
    });
  }

  advance() {
    // First click while typing: show the whole line at once.
    if (this.typing && this.typing.getRepeatCount() > 0) {
      this.typing.remove();
      this.message.setText(LINES[this.lineIndex]);
      return;
    }

    this.lineIndex += 1;
    if (this.lineIndex < LINES.length) {
      this.showLine();
    } else {
      this.scene.start('Build');
    }
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
      if (on) speakIfEnabled(this, LINES[this.lineIndex]);
      else window.speechSynthesis?.cancel();
    });
  }
}
