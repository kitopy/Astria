import Phaser from 'phaser';
import { createChacoComparison } from '../ui/chaco-comparison.js';

// Investigate the historical NASA pair recreated during the mission.
export class ObserveScene extends Phaser.Scene {
  constructor() { super('Observe'); }
  init(data = {}) { this.result = data; }
  create() {
    const ui = createChacoComparison(this, action => {
      if (action === 'back') this.scene.start(this.result.mission ? 'Reward' : 'Menu', this.result);
      else if (action === 'finish') this.scene.start('Finale');
    });
    this.events.once('shutdown', () => ui.destroy());
  }
}
