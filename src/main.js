import Phaser from 'phaser';
import './ui/workshop.css';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { StationScene } from './scenes/StationScene.js';
import { BuildScene } from './scenes/BuildScene.js';
import { TestScene } from './scenes/TestScene.js';
import { RewardScene } from './scenes/RewardScene.js';
import { ObserveScene } from './scenes/ObserveScene.js';
import { FinaleScene } from './scenes/FinaleScene.js';

new Phaser.Game({
  type: Phaser.AUTO, // WebGL if available, otherwise Canvas
  parent: 'game', // id of the div in index.html
  width: 1920, // the game is designed at 1920x1080...
  height: 1080,
  transparent: true, // lets the 3D Earth behind show through (scenes with images cover it anyway)
  dom: { createContainer: true }, // lets scenes place HTML elements over the canvas (used by the workshop UI)
  scale: {
    // ...always fully visible; the canvas expands to fill the rest of the window
    // (no black bars). Scenes center that area with centerDesignArea() in ui/layout.js.
    mode: Phaser.Scale.EXPAND,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  // The first scene in the list is the one that starts.
  scene: [BootScene, MenuScene, StationScene, BuildScene, TestScene, RewardScene, ObserveScene, FinaleScene],
});
