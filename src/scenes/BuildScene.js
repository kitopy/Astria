import Phaser from 'phaser';
import { addButton } from '../ui/button.js';

// Satellite puzzle: drag parts into place. (Drag & drop comes in a later step.)
export class BuildScene extends Phaser.Scene {
  constructor() {
    super('Build');
  }

  create() {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, 200, 'Build — assemble the satellite', {
        fontFamily: 'sans-serif',
        fontSize: '56px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    addButton(this, width / 2, height - 200, 'Next', () => {
      this.scene.start('Test');
    });
  }
}
