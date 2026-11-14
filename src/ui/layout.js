// The game is designed for a 1920x1080 area. With Scale.EXPAND (see main.js) the canvas grows
// to fill any desktop window, so there may be extra space around that area.
// These helpers keep the design area centered and let backgrounds fill the extra space.

export const DESIGN = { width: 1920, height: 1080 };

// Runs fn now and every time the window is resized, until the scene ends.
function onResize(scene, fn) {
  fn();
  scene.scale.on('resize', fn);
  scene.events.once('shutdown', () => scene.scale.off('resize', fn));
}

// Points the camera at the middle of the design area, so all fixed
// coordinates (x: 0..1920, y: 0..1080) stay centered on screen.
export function centerDesignArea(scene) {
  onResize(scene, () => scene.cameras.main.centerOn(DESIGN.width / 2, DESIGN.height / 2));
}

// Full-screen background image that always covers the whole window (like CSS "background-size: cover").
export function addCoverBackground(scene, key) {
  const bg = scene.add.image(DESIGN.width / 2, DESIGN.height / 2, key);
  onResize(scene, () => {
    bg.setScale(Math.max(scene.scale.width / bg.width, scene.scale.height / bg.height));
  });
  return bg;
}
