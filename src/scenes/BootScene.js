import Phaser from 'phaser';
import { DESIGN, centerDesignArea } from '../ui/layout.js';
import { prepareEarth } from '../ui/earth3d.js';

// Loads every image and font once, before the game starts.
// Other scenes then just use the keys ('bg-menu', 'Cinzel', ...).
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  // preload() runs before create(): Phaser waits until everything here is loaded.
  preload() {
    centerDesignArea(this);
    const { width, height } = DESIGN;

    // Simple loading bar, so the player doesn't see a black screen.
    const bar = this.add.rectangle(width / 2 - 400, height / 2, 0, 16, 0xd9b8ff).setOrigin(0, 0.5);
    this.load.on('progress', (value) => {
      bar.width = 800 * value; // value goes from 0 to 1
    });

    // Paths are relative to public/ (Vite serves that folder at the site root).
    this.load.setPath('assets/');

    this.load.image('bg-menu', 'images/bg-menu.png');
    this.load.image('bg-station', 'images/bg-station.png');
    this.load.image('bg-mission', 'images/bg-mission.png');
    this.load.image('frame-observation', 'images/frame-observation.png');
    this.load.image('sky-observation', 'images/sky-observation.png');
    this.load.image('star-anomaly', 'images/star-anomaly.png');
    this.load.image('panel-dialog', 'images/panel-dialog.png');

    // For fonts, the key is the font-family name used later in text styles.
    this.load.font('Cinzel', 'fonts/Cinzel-VariableFont_wght.ttf');
    this.load.font('Quicksand', 'fonts/Quicksand-VariableFont_wght.ttf');
    this.load.font('Audiowide', 'fonts/Audiowide-Regular.ttf');
  }

  create() {
    prepareEarth(); // starts loading the 3D Earth in the background; it's ready by the workshop
    this.scene.start('Menu');
  }
}
