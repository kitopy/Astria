import Phaser from 'phaser';
import { addButton } from '../ui/button.js';

// Launch test: shows what happens with the parts chosen. (Logic comes in a later step.)
export class TestScene extends Phaser.Scene {
  constructor() {
    super('Test');
  }

  create() {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, 200, 'Test — does the satellite work?', {
        fontFamily: 'sans-serif',
        fontSize: '56px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    addButton(this, width / 2, height - 200, 'Next', () => {
      this.scene.start('Reward');
    });
  }
}
