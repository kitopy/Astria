import Phaser from 'phaser';
import { COLORS } from './palette.js';

// Transparent neon button with cut corners (same shape as the GDevelop art).
// On hover, purple fills it from the center out and it grows a little.
// Used by the menu ("COMENZAR MISIÓN") and the mission briefing ("CONSTRUIR MI SATÉLITE").
export function addNeonButton(scene, x, y, text, onClick, { width = 600, height = 130, fontSize = 44 } = {}) {
  const w = width;
  const h = height;
  const cut = 34; // size of the cut corners

  // Outline of the shape, centered on (0, 0), as a list of points.
  const shape = [
    [-w / 2 + cut, -h / 2], [w / 2 - cut, -h / 2], [w / 2, -h / 2 + cut], [w / 2, h / 2 - cut],
    [w / 2 - cut, h / 2], [-w / 2 + cut, h / 2], [-w / 2, h / 2 - cut], [-w / 2, -h / 2 + cut],
  ].map(([px, py]) => new Phaser.Math.Vector2(px, py));

  // Fill layer: starts squashed to zero width (scaleX 0), grows to 1 on hover.
  const fill = scene.add.graphics();
  fill.fillStyle(COLORS.violet, 0.9).fillPoints(shape, true);
  fill.scaleX = 0;

  const border = scene.add.graphics();
  border.lineStyle(10, COLORS.orchid, 0.3).strokePoints(shape, true); // soft outer glow
  border.lineStyle(3, COLORS.glow, 1).strokePoints(shape, true); // sharp neon line

  const label = scene.add
    .text(0, 0, text, { fontFamily: 'Audiowide', fontSize: `${fontSize}px`, color: '#ffffff' })
    .setOrigin(0.5)
    .setLetterSpacing(3);

  const button = scene.add.container(x, y, [fill, border, label]);
  button.setSize(w, h).setInteractive({ useHandCursor: true }); // a container needs a size to be clickable

  const animate = (hovered) => {
    scene.tweens.add({ targets: fill, scaleX: hovered ? 1 : 0, duration: 280, ease: 'Cubic.out' });
    scene.tweens.add({ targets: button, scale: hovered ? 1.05 : 1, duration: 200, ease: 'Sine.out' });
  };
  button.on('pointerover', () => animate(true));
  button.on('pointerout', () => animate(false));
  button.on('pointerup', onClick);

  return button;
}
