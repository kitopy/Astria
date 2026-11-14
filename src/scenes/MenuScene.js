import Phaser from 'phaser';
import { DESIGN, addCoverBackground, centerDesignArea } from '../ui/layout.js';
import { addStarfield } from '../ui/starfield.js';

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

    this.addStartButton(width / 2, 845);
  }

  // Transparent neon button with cut corners (same shape as the GDevelop art).
  // On hover, purple fills it from the center out and it grows a little.
  addStartButton(x, y) {
    const w = 600;
    const h = 130;
    const cut = 34; // size of the cut corners

    // Outline of the shape, centered on (0, 0), as a list of points.
    const shape = [
      [-w / 2 + cut, -h / 2], [w / 2 - cut, -h / 2], [w / 2, -h / 2 + cut], [w / 2, h / 2 - cut],
      [w / 2 - cut, h / 2], [-w / 2 + cut, h / 2], [-w / 2, h / 2 - cut], [-w / 2, -h / 2 + cut],
    ].map(([px, py]) => new Phaser.Math.Vector2(px, py));

    // Fill layer: starts squashed to zero width (scaleX 0), grows to 1 on hover.
    const fill = this.add.graphics();
    fill.fillStyle(0x6b3fc4, 0.9).fillPoints(shape, true);
    fill.scaleX = 0;

    const border = this.add.graphics();
    border.lineStyle(10, 0xb98cff, 0.25).strokePoints(shape, true); // soft outer glow
    border.lineStyle(3, 0xe6d2ff, 1).strokePoints(shape, true); // sharp neon line

    const label = this.add
      .text(0, 0, 'COMENZAR MISIÓN', { fontFamily: 'Audiowide', fontSize: '44px', color: '#ffffff' })
      .setOrigin(0.5)
      .setLetterSpacing(3);

    const button = this.add.container(x, y, [fill, border, label]);
    button.setSize(w, h).setInteractive({ useHandCursor: true }); // a container needs a size to be clickable

    const animate = (hovered) => {
      this.tweens.add({ targets: fill, scaleX: hovered ? 1 : 0, duration: 280, ease: 'Cubic.out' });
      this.tweens.add({ targets: button, scale: hovered ? 1.05 : 1, duration: 200, ease: 'Sine.out' });
    };
    button.on('pointerover', () => animate(true));
    button.on('pointerout', () => animate(false));
    button.on('pointerup', () => this.scene.start('Station'));
  }
}
