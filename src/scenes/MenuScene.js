import Phaser from 'phaser';
import { DESIGN, addCoverBackground, centerDesignArea } from '../ui/layout.js';
import { addStarfield } from '../ui/starfield.js';
import { addNeonButton } from '../ui/neonButton.js';

// Title screen: the first thing the player sees.
// Layout and colors come from the GDevelop scene "MENU PRINCIPAL".
export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    centerDesignArea(this);
    const { width } = DESIGN;

    addCoverBackground(this, 'bg-menu');
    addStarfield(this); // drawn after the background, before the title, so it stays behind the text

    this.add
      .text(width / 2, 455, 'ASTRION', {
        fontFamily: 'Cinzel',
        fontSize: '170px',
        fontStyle: 'bold',
        color: '#f5c7e7',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 620, 'ECOS DEL UNIVERSO', {
        fontFamily: 'Quicksand',
        fontSize: '60px',
        color: '#f5c7e7',
      })
      .setOrigin(0.5);

    addNeonButton(this, width / 2, 845, 'COMENZAR MISIÓN', () => this.scene.start('Station'));
  }
}
