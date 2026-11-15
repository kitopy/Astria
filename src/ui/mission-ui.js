import { SatelliteAssembly, frames } from './satellite.js';
import { hideEarth, showEarth } from './earth3d.js';
import { noahSpeak, noahStop } from './noahVoice.js';
import { addShootingStars } from './starfield.js';

// Shared screen layout for the three mission steps (Build, Test, Reward).
// Phaser draws the background and the satellite; this module puts an HTML layer on top
// with the panels, NOAH and the buttons. Styles are in workshop.css.
//
//   ┌──────────────────────────────────────────────────────── top bar: Voz de NOAH ───┐
//   │ [left panel]               satellite (Phaser)                     [right panel] │
//   │                            [center: meters / caption]                           │
//   └──────────── NOAH message ─────────────────────────────────── [action buttons] ───┘

const BASE = import.meta.env.BASE_URL;

export function preloadArt(scene) {
  for (const key of ['satellite-modules']) {
    if (!scene.textures.exists(key)) scene.load.image(key, `${BASE}assets/${key}.png`);
  }
}

// The real rotating Earth (behind the game) + the satellite floating in the middle.
export function addArt(scene, design) {
  showEarth();
  scene.events.once('shutdown', hideEarth);
  // Lots of shooting stars in the sky above the Earth.
  // every: [shortest, longest] wait between two of them, in milliseconds (1000 = 1 second).
  addShootingStars(scene, { every: [300, 900] });
  return new SatelliteAssembly(scene, 960, 450, design);
}

// Thumbnail of one part, cut from the satellite atlas (classic CSS "sprite" technique:
// an element exactly the size of the part, showing the big image scaled and shifted).
// The outer box keeps every thumbnail the same size; the inner one is the part itself.
export function partThumb(kind, id, width = 120, height = 80) {
  const [x, y, w, h] = frames[`${kind}-${id}`];
  const s = Math.min(width / w, height / h); // atlas coordinates are normalized to 1280px
  const style = [
    `width:${(w * s).toFixed(1)}px`,
    `height:${(h * s).toFixed(1)}px`,
    `background-image:url(${BASE}assets/satellite-modules.png)`,
    `background-size:${1280 * s}px`,
    `background-position:${(-x * s).toFixed(1)}px ${(-y * s).toFixed(1)}px`,
  ].join(';');
  return `<span class="ws-thumb" style="width:${width}px;height:${height}px"><i style="${style}"></i></span>`;
}

// Horizontal bar with a label and "value / max". Turns red when value > max.
export function meter(label, value, max, unit = '') {
  const over = value > max;
  const percent = Math.min(100, (value / max) * 100);
  return `<div class="ws-meter ${over ? 'over' : ''}">
    <div class="ws-meter-head"><span>${label}</span><strong>${value}<small> / ${max}${unit}</small></strong></div>
    <div class="ws-meter-bar" role="progressbar" aria-label="${label}" aria-valuenow="${value}" aria-valuemax="${max}"><i style="width:${percent}%"></i></div>
  </div>`;
}

export function actionButton(action, label, primary = false, disabled = false) {
  return `<button data-action="${action}" class="ws-btn ${primary ? 'ws-primary' : ''}" ${disabled ? 'disabled' : ''}>${label}</button>`;
}

// Builds the HTML layer of a mission screen and returns helpers:
//   ui.area(name)   → the element to fill: 'left' | 'right' | 'center' | 'actions'
//   ui.say(text)    → NOAH message (read aloud if the voice is on)
//   ui.bind({...})  → click handlers by data-action
// options.wizard: step-by-step layout (narrow summary on the left, the current task on the right).
export function mount(scene, options = {}) {
  const root = document.createElement('div');
  root.className = options.wizard ? 'ws ws--wizard' : 'ws';
  root.innerHTML = `
    <header class="ws-top">
      <button class="ws-btn ws-small" data-action="voice" aria-pressed="false"></button>
    </header>
    <section class="ws-panel ws-left" data-area="left"></section>
    <section class="ws-panel ws-right" data-area="right"></section>
    <div class="ws-center" data-area="center"></div>
    <footer class="ws-footer">
      <div class="ws-noah">
        <span class="ws-noah-name">NOAH</span>
        <p data-area="noah" role="status" aria-live="polite"></p>
        <button class="ws-listen" data-action="listen">Escuchar</button>
      </div>
      <div class="ws-actions" data-area="actions"></div>
    </footer>`;

  // Phaser places the HTML over the canvas and scales it with the game.
  const dom = scene.add.dom(0, 0, root).setOrigin(0);
  // Phaser forces pointer-events:auto on DOM elements it manages. 'none' lets clicks and drags on
  // empty areas reach the game canvas; panels and buttons turn it back on in workshop.css.
  dom.pointerEvents = 'none';

  const voiceButton = root.querySelector('[data-action="voice"]');
  const hasSpeech = 'speechSynthesis' in window;

  const ui = {
    root,
    message: '',
    voice: !!scene.registry.get('noahVoice'),
    area: (name) => root.querySelector(`[data-area="${name}"]`),

    // silent: show the text without reading it aloud (e.g. hover details).
    say(text, { silent = false } = {}) {
      this.message = text;
      this.area('noah').textContent = text;
      // Replay the small "pop" animation so a new message is noticed (used by the speech bubble).
      const box = root.querySelector('.ws-noah');
      box.classList.remove('pop');
      void box.offsetWidth; // forces the browser to restart the CSS animation
      box.classList.add('pop');
      if (this.voice && !silent) this.speak();
    },

    speak() {
      if (hasSpeech) noahSpeak(this.message);
    },

    updateVoiceButton() {
      voiceButton.setAttribute('aria-pressed', String(this.voice));
      voiceButton.textContent = `Voz de NOAH: ${this.voice ? 'sí' : 'no'}`;
    },

    bind(handlers) {
      const all = handlers;
      root.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-action]');
        if (!button || button.disabled) return;
        const action = button.dataset.action;
        if (action === 'voice') {
          this.voice = !this.voice;
          scene.registry.set('noahVoice', this.voice);
          this.updateVoiceButton();
          if (this.voice) this.speak();
          else noahStop();
        } else if (action === 'listen') {
          this.speak();
        } else {
          all[action]?.(button); // the button is passed so handlers can read data-* attributes
        }
      });
    },
  };

  ui.updateVoiceButton();
  if (!hasSpeech) root.querySelectorAll('[data-action="voice"], [data-action="listen"]').forEach((el) => (el.disabled = true));

  scene.events.once('shutdown', () => {
    noahStop();
    dom.destroy();
  });
  return ui;
}
