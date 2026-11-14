import Phaser from 'phaser';

export class SpaceScene extends Phaser.Scene {
  private satellite?: Phaser.GameObjects.Image;
  private background?: Phaser.GameObjects.Image;
  private route?: Phaser.GameObjects.Graphics;
  private desiredPhase = -1;
  constructor() { super('space'); }
  preload() {
    this.load.image('earth', `${import.meta.env.BASE_URL}assets/earth.png`);
    this.load.image('satellite', `${import.meta.env.BASE_URL}assets/satellite.png`);
  }
  create() {
    this.background = this.add.image(0, 0, 'earth').setOrigin(.5);
    this.route = this.add.graphics();
    this.satellite = this.add.image(0, 0, 'satellite');
    this.layout();
    this.scale.on('resize', this.layout, this);
    this.setPhase(this.desiredPhase);
  }
  private layout() {
    const w = this.scale.width, h = this.scale.height;
    if (!this.background || !this.satellite) return;
    this.background.setPosition(w / 2, h / 2).setDisplaySize(Math.max(w, h * 1.5), Math.max(h, w / 1.5));
    this.satellite.setDisplaySize(Math.min(w * .88, 580), Math.min(w * .88, 580) * 2 / 3).setPosition(w * .5, h * .43);
    this.route?.clear().lineStyle(1, 0xb9f566, .36).strokeEllipse(w / 2, h * .7, w * 1.15, h * .48);
    this.setPhase(this.desiredPhase);
  }
  setPhase(phase: number) {
    this.desiredPhase = phase;
    if (!this.satellite) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.tweens.killTweensOf(this.satellite);
    const w = this.scale.width, h = this.scale.height;
    const x = phase < 0 ? w / 2 : w * [.42, .53, .62, .48][phase];
    this.tweens.add({ targets: this.satellite, x, y: h * (phase === 2 ? .48 : .41), angle: phase === 2 ? 7 : -5,
      duration: reduce ? 0 : 650, ease: 'Sine.easeInOut' });
    this.satellite.setTint(phase === 2 ? 0xabb7e0 : 0xffffff);
  }
}
export function createSpace(parent: HTMLElement) {
  const scene = new SpaceScene();
  const game = new Phaser.Game({ type: Phaser.AUTO, parent, transparent: true,
    scale: { mode: Phaser.Scale.RESIZE, width: parent.clientWidth, height: parent.clientHeight },
    scene: [scene], render: { antialias: true }, audio: { noAudio: true },
    callbacks: { postBoot: game => { game.canvas.setAttribute('aria-hidden', 'true'); } } });
  return { game, scene };
}
