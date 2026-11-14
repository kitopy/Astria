import Phaser from 'phaser';

// A Scene is one "screen" of the game. For now there is only this one.
class HelloScene extends Phaser.Scene {
  constructor() {
    super('Hello'); // unique key used to start/switch scenes
  }

  // create() runs once when the scene starts: build what appears on screen here.
  create() {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2, 'ASTRION', {
        fontFamily: 'sans-serif',
        fontSize: '96px',
        color: '#d9b8ff',
      })
      .setOrigin(0.5); // anchor at the text's center instead of its top-left
  }
}

new Phaser.Game({
  type: Phaser.AUTO, // WebGL if available, otherwise Canvas
  parent: 'game', // id of the div in index.html
  width: 1920, // the game is designed at 1920x1080...
  height: 1080,
  backgroundColor: '#0b0618',
  scale: {
    mode: Phaser.Scale.FIT, // ...and scaled to fit any screen keeping proportions
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [HelloScene],
});
