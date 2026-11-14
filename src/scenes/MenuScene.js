import Phaser from 'phaser';
import { addButton } from '../ui/button.js';

// Title screen: the first thing the player sees.
export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 150, 'ASTRION', {
        fontFamily: 'sans-serif',
        fontSize: '120px',
        color: '#d9b8ff',
      })
      .setOrigin(0.5);

    addButton(this, width / 2, height / 2 + 100, 'Play', () => {
      this.scene.start('Station');
    });
  }
}
