import Phaser from 'phaser';
import { DESIGN, addCoverBackground, centerDesignArea } from '../ui/layout.js';

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

    // The start button is an image (the text "COMENZAR MISIÓN" is part of the art).
    const button = this.add.image(width / 2, 845, 'button-start');
    button.setScale(622 / button.width); // same on-screen width as in GDevelop
    const baseScale = button.scale;

    button.setInteractive({ useHandCursor: true });
    button.on('pointerover', () => button.setScale(baseScale * 1.05));
    button.on('pointerout', () => button.setScale(baseScale));
    button.on('pointerup', () => this.scene.start('Station'));
  }
}
