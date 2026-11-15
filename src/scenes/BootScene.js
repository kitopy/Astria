import Phaser from 'phaser';
import { DESIGN, centerDesignArea } from '../ui/layout.js';
import { prepareEarth } from '../ui/earth3d.js';

const VOICE_KEY = 'astria-noah-voice';

// localStorage can fail (private window, blocked storage): then the voice just starts on.
function readVoicePreference() {
  try {
    return localStorage.getItem(VOICE_KEY) !== 'off';
  } catch {
    return true;
  }
}
function saveVoicePreference(on) {
  try {
    localStorage.setItem(VOICE_KEY, on ? 'on' : 'off');
  } catch {
    /* Saving is optional. */
  }
}

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
    this.load.image('panel-dialog', 'images/panel-dialog.png');

    // For fonts, the key is the font-family name used later in text styles.
    this.load.font('Cinzel', 'fonts/Cinzel-VariableFont_wght.ttf');
    this.load.font('Quicksand', 'fonts/Quicksand-VariableFont_wght.ttf');
    this.load.font('Audiowide', 'fonts/Audiowide-Regular.ttf');
  }

  create() {
    prepareEarth(); // starts loading the 3D Earth in the background; it's ready by the workshop
    // NOAH's voice starts ON: it helps players who read more slowly. The toggle can turn it off,
    // and that choice is remembered after reloading the page.
    if (this.registry.get('noahVoice') === undefined) this.registry.set('noahVoice', readVoicePreference());
    // Every voice switch (station, workshop, flight, investigation) changes this registry value,
    // so saving here covers all of them.
    this.registry.events.on('changedata-noahVoice', (_parent, value) => saveVoicePreference(value));
    const localHost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
    this.scene.start(localHost && new URLSearchParams(window.location.search).get('dev') === '1' ? 'DevTools' : 'Menu');
  }
}
