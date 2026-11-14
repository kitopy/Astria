import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { StationScene } from './scenes/StationScene.js';
import { BuildScene } from './scenes/BuildScene.js';
import { TestScene } from './scenes/TestScene.js';
import { RewardScene } from './scenes/RewardScene.js';

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
  // The first scene in the list is the one that starts.
  scene: [BootScene, MenuScene,StationScene, BuildScene, TestScene, RewardScene],
});
