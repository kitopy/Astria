import Phaser from 'phaser';
import { visibleArea } from './layout.js';

// Three layers of stars drifting to the left. Closer layers are bigger, brighter and faster
// ("parallax"), which makes it feel like we're traveling through space.
// size = diameter in pixels of the glowing dot; speed = pixels per second.
const LAYERS = [
  { count: 80, size: 7, speed: 25, alpha: 0.6 }, // far
  { count: 40, size: 11, speed: 60, alpha: 0.85 }, // middle
  { count: 16, size: 16, speed: 130, alpha: 1 }, // near
];
const DOT_SIZE = 32; // size of the 'star-dot' texture

// Creates the small textures the starfield uses, drawn in code (no image files needed).
function makeTextures(scene) {
  if (!scene.textures.exists('star-dot')) {
    // Glowing dot: many circles stacked, faint and wide outside, bright and small in the middle.
    const g = scene.make.graphics({ add: false });
    const c = DOT_SIZE / 2;
    for (let r = c; r > 0; r -= 1) {
      const t = 1 - r / c; // 0 at the edge, 1 at the center
      g.fillStyle(0xffffff, 0.04 + t * t * 0.5);
      g.fillCircle(c, c, r);
    }
    g.generateTexture('star-dot', DOT_SIZE, DOT_SIZE);
    g.destroy();
  }

  // Shooting star: a bright head with a tail that fades out to the left.
  if (!scene.textures.exists('star-streak')) {
    const g = scene.make.graphics({ add: false });
    const length = 260;
    for (let x = 0; x < length; x += 4) {
      const t = x / length; // 0 at the tail, 1 at the head
      g.fillStyle(0xffffff, t * t);
      g.fillRect(x, 3 - t * 2, 4, 2 + t * 4); // tail gets thicker toward the head
    }
    g.fillStyle(0xffffff, 1).fillCircle(length, 3, 4);
    g.generateTexture('star-streak', length + 5, 8);
    g.destroy();
  }
}

export function addStarfield(scene) {
  makeTextures(scene);
  const stars = [];

  // Spread the stars over the visible area (which may be bigger than 1920x1080).
  const view = visibleArea(scene);
  for (const layer of LAYERS) {
    for (let i = 0; i < layer.count; i++) {
      const star = scene.add
        .image(
          Phaser.Math.Between(view.x, view.right),
          Phaser.Math.Between(view.y, view.bottom),
          'star-dot',
        )
        .setScale(layer.size / DOT_SIZE)
        .setAlpha(layer.alpha)
        .setBlendMode(Phaser.BlendModes.ADD);
      star.speed = layer.speed;
      stars.push(star);

      // Gentle twinkle, each star with its own rhythm.
      scene.tweens.add({
        targets: star,
        alpha: layer.alpha * 0.3,
        duration: Phaser.Math.Between(800, 2500),
        delay: Phaser.Math.Between(0, 2000),
        yoyo: true,
        repeat: -1,
      });
    }
  }

  // Every frame: move each star left; when it leaves the screen, put it back on the right.
  const onUpdate = (time, delta) => {
    const v = visibleArea(scene);
    for (const star of stars) {
      star.x -= (star.speed * delta) / 1000; // delta = ms since last frame
      if (star.x < v.x - 10) {
        star.x = v.right + 10;
        star.y = Phaser.Math.Between(v.y, v.bottom);
      }
    }
  };
  scene.events.on('update', onUpdate);
  scene.events.once('shutdown', () => scene.events.off('update', onUpdate));

  addShootingStars(scene);
}

// Shooting stars crossing the sky now and then, behind everything else in the scene.
// Used by the menu (with the starfield) and by the screens with the rotating Earth.
// options.every: [min, max] pause in ms between two shooting stars.
export function addShootingStars(scene, { every = [1200, 3000] } = {}) {
  makeTextures(scene);
  scheduleShootingStar(scene, every);
}

// Launches a shooting star, then schedules the next one after a random pause.
function scheduleShootingStar(scene, every) {
  scene.time.delayedCall(Phaser.Math.Between(every[0], every[1]), () => {
    const v = visibleArea(scene);
    const angle = Phaser.Math.Between(20, 35); // degrees below horizontal, moving down-right
    const startX = Phaser.Math.Between(v.x, v.x + v.width * 0.6);
    const startY = Phaser.Math.Between(v.y, v.y + v.height * 0.35);
    const distance = 900;
    const rad = Phaser.Math.DegToRad(angle);

    const streak = scene.add
      .image(startX, startY, 'star-streak')
      .setOrigin(1, 0.5) // the head leads the movement
      .setAngle(angle)
      .setScale(0.8)
      .setAlpha(0)
      // Normal blending: "add" is invisible where the game canvas is transparent (over the 3D Earth).
      .setDepth(-1); // behind the scene's other objects (satellite, parts)

    scene.tweens.add({
      targets: streak,
      x: startX + Math.cos(rad) * distance,
      y: startY + Math.sin(rad) * distance,
      duration: 1100,
      ease: 'Sine.easeIn',
      onComplete: () => streak.destroy(),
    });
    // Fade in quickly, then fade out before it ends.
    scene.tweens.add({ targets: streak, alpha: 1, duration: 200, yoyo: true, hold: 500 });

    scheduleShootingStar(scene, every);
  });
}
