// Creates a simple clickable button (rectangle + label) inside a scene.
// Works with mouse and touch: Phaser treats both as "pointer" events.
export function addButton(scene, x, y, label, onClick) {
  const bg = scene.add
    .rectangle(0, 0, 360, 100, 0x6b3fa0)
    .setStrokeStyle(4, 0xd9b8ff);

  const text = scene.add
    .text(0, 0, label, { fontFamily: 'sans-serif', fontSize: '40px', color: '#ffffff' })
    .setOrigin(0.5);

  // A container groups objects so they move/scale together.
  const button = scene.add.container(x, y, [bg, text]);

  bg.setInteractive({ useHandCursor: true });
  bg.on('pointerover', () => bg.setFillStyle(0x8a5cc4));
  bg.on('pointerout', () => bg.setFillStyle(0x6b3fa0));
  bg.on('pointerup', onClick);

  return button;
}
