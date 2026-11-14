import Phaser from 'phaser';
import { preloadArt } from '../ui/mission-ui.js';
import { speakIfEnabled } from '../ui/noahVoice.js';
import { addCoverBackground, centerDesignArea } from '../ui/layout.js';
import { COLORS, CSS } from '../ui/palette.js';

// Region of earth.png used as the "photo" taken by the satellite (forest, river, mountain).
const PHOTO_CROP = { x: 420, y: 730, width: 454, height: 294 };

// Where the forest changed, as a fraction of the photo (0..1). Used to draw and to check clicks.
const CHANGE = { x: 0.64, y: 0.52, radius: 0.12 };

// Layout copied from the GDevelop scene "MISION_01".
const PANELS = [
  { title: 'OBSERVACIÓN A', frame: { x: 164, y: 96, w: 792, h: 614 }, photo: { x: 240, y: 209, w: 641, h: 415 } },
  { title: 'OBSERVACIÓN B', frame: { x: 981, y: 95, w: 786, h: 618 }, photo: { x: 1052, y: 206, w: 640, h: 421 } },
];

// What NOAH says, in order. Each "CONTINUAR" shows the next line.
const FOUND_LINES = [
  'NOAH // ¡CAMBIO ENCONTRADO!\n¡Buen ojo, exploradora! El río y la montaña quedaron iguales,\npero en la imagen B falta una parte del bosque.',
  'NOAH // ASÍ TRABAJAN LOS SATÉLITES\nLos satélites Landsat de la NASA fotografían el mismo lugar\nde la Tierra cada 16 días. Comparando fotos, se ven los cambios.',
];

// Mission step: compare the two images the satellite sent and find what changed.
export class ObserveScene extends Phaser.Scene {
  constructor() {
    super('Observe');
  }

  preload() {
    preloadArt(this); // loads 'earth' if no other scene did yet
  }

  create() {
    centerDesignArea(this);
    this.found = false;
    this.lineIndex = 0;

    addCoverBackground(this, 'bg-mission');

    PANELS.forEach((panel, i) => this.addPanel(panel, i === 1));

    // NOAH dialog box.
    this.add.image(362, 683, 'panel-dialog').setOrigin(0).setDisplaySize(1189, 274);
    this.message = this.add.text(458, 745, '', {
      fontFamily: 'Audiowide',
      fontSize: '26px',
      color: '#ffffff',
      lineSpacing: 10,
    });

    this.continueButton = this.add
      .text(1450, 905, 'CONTINUAR ›', { fontFamily: 'Audiowide', fontSize: '30px', color: CSS.glow })
      .setOrigin(1, 1)
      .setInteractive({ useHandCursor: true })
      .setVisible(false)
      .on('pointerup', () => this.nextLine());

    this.say('NOAH // ANÁLISIS EN CURSO\nEsta comparación representa dos observaciones. Las imágenes son simuladas.\n¿Qué cambió? Tocá el lugar donde veas la diferencia.');
  }

  // Draws one frame + photo. The second photo ("B") gets the forest change painted on it.
  addPanel(panel, isAfter) {
    const { frame, photo } = panel;

    // Show only a region of earth.png, scaled to fill the photo area.
    const scale = photo.w / PHOTO_CROP.width;
    this.add
      .image(photo.x - PHOTO_CROP.x * scale, photo.y - PHOTO_CROP.y * scale, 'earth')
      .setOrigin(0)
      .setScale(scale, photo.h / PHOTO_CROP.height)
      .setCrop(PHOTO_CROP.x, PHOTO_CROP.y, PHOTO_CROP.width, PHOTO_CROP.height);

    if (isAfter) this.drawClearedForest(photo);

    this.add.image(frame.x, frame.y, 'frame-observation').setOrigin(0).setDisplaySize(frame.w, frame.h);
    this.add
      .text(frame.x + frame.w / 2, frame.y + 55, panel.title, { fontFamily: 'Audiowide', fontSize: '26px', color: '#f5c7e7' })
      .setOrigin(0.5);

    // Invisible hit area over the photo: both A and B accept the answer.
    this.add
      .zone(photo.x, photo.y, photo.w, photo.h)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', (pointer) => this.checkClick(photo, pointer));
  }

  // A brown patch where trees were cut, with a couple of dirt roads.
  drawClearedForest(photo) {
    const cx = photo.x + CHANGE.x * photo.w;
    const cy = photo.y + CHANGE.y * photo.h;
    const g = this.add.graphics();

    g.fillStyle(0x9a7446, 0.92);
    g.fillPoints(
      [[-60, -30], [-10, -48], [45, -38], [70, -5], [55, 30], [10, 44], [-40, 36], [-72, 8]].map(
        ([x, y]) => new Phaser.Math.Vector2(cx + x, cy + y),
      ),
      true,
    );
    g.lineStyle(5, 0xc9a46b, 1);
    g.lineBetween(cx - 55, cy + 10, cx + 60, cy - 12);
    g.lineBetween(cx - 5, cy - 40, cx + 15, cy + 40);
  }

  checkClick(photo, pointer) {
    if (this.found) return;

    // worldX/worldY: position in game coordinates, taking the centered camera into account.
    const dx = (pointer.worldX - photo.x) / photo.w - CHANGE.x;
    const dy = (pointer.worldY - photo.y) / photo.h - CHANGE.y;
    const isHit = Math.hypot(dx, dy * (photo.h / photo.w)) <= CHANGE.radius;

    if (!isHit) {
      this.say('NOAH // SIGAMOS BUSCANDO\nCasi... Mirá con calma el bosque en las dos fotos.\nHay una zona que se ve distinta en la imagen B.');
      return;
    }

    this.found = true;
    PANELS.forEach(({ photo: p }) => this.highlightChange(p));
    this.nextLine();
  }

  // Pulsing green circle around the change, on both photos.
  highlightChange(photo) {
    const circle = this.add
      .circle(photo.x + CHANGE.x * photo.w, photo.y + CHANGE.y * photo.h, 95)
      .setStrokeStyle(6, COLORS.gold); // gold = discovery
    this.tweens.add({ targets: circle, scale: 1.12, duration: 600, yoyo: true, repeat: -1 });
  }

  nextLine() {
    if (this.lineIndex >= FOUND_LINES.length) {
      this.scene.start('Finale');
      return;
    }
    this.say(FOUND_LINES[this.lineIndex]);
    this.lineIndex += 1;
    this.continueButton.setVisible(true);
  }

  say(text) {
    this.message.setText(text);
    speakIfEnabled(this, text);
  }
}
