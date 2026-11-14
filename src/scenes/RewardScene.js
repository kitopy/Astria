import Phaser from 'phaser';
import { addButton } from '../ui/button.js';

// Mission complete: celebration and what was learned.
export class RewardScene extends Phaser.Scene {
  constructor() {
    super('Reward');
  }

  create() {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, 200, 'Reward — mission complete!', {
        fontFamily: 'sans-serif',
        fontSize: '56px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    addButton(this, width / 2, height - 200, 'Menu', () => {
      this.scene.start('Menu');
    });
  }
}
