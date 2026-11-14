import Phaser from 'phaser';
import { addButton } from '../ui/button.js';
import { DESIGN, centerDesignArea } from '../ui/layout.js';

// Space station: NOAH introduces the mission. (Dialog comes in a later step.)
export class StationScene extends Phaser.Scene {
  constructor() {
    super('Station');
  }

  create() {
    centerDesignArea(this);
    const { width, height } = DESIGN;

    this.add
      .text(width / 2, 200, 'Station — NOAH presents the mission', {
        fontFamily: 'sans-serif',
        fontSize: '56px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    addButton(this, width / 2, height - 200, 'Next', () => {
      this.scene.start('Build');
    });
  }
}
