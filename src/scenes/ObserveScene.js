import Phaser from 'phaser';
import { createChacoComparison } from '../ui/chaco-brush.js';

// Investigate the historical NASA pair recreated during the mission. Comes right after a successful flight;
// the results screen (the end of the game) comes next. From the dev picker, without a mission, back to the menu.
export class ObserveScene extends Phaser.Scene {
  constructor() { super('Observe'); }
  init(data = {}) { this.result = data; }
  create() {
    const ui = createChacoComparison(this, action => {
      if (action === 'finish') this.scene.start(this.result.mission ? 'Reward' : 'Menu', this.result);
    });
    this.events.once('shutdown', () => ui.destroy());
  }
}
