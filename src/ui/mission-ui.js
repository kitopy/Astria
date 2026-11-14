import { limits } from '../game/model.js';

export function preloadArt(scene) {
  for (const key of ['earth', 'satellite']) {
    if (!scene.textures.exists(key)) scene.load.image(key, `${import.meta.env.BASE_URL}assets/${key}.png`);
  }
}
export function addArt(scene) {
  scene.add.image(1050, 550, 'earth').setDisplaySize(1000, 800);
  const satellite = scene.add.image(1050, 510, 'satellite').setDisplaySize(690, 460).setAngle(-5);
  return satellite;
}
export function mount(scene, title, subtitle, step) {
  const root = document.createElement('div'); root.className = 'mission-shell';
  root.innerHTML = `<header class="mission-header"><span class="mission-brand">ASTRION<span>✦</span></span><span>Guardianes de la Tierra</span><button data-action="voice" aria-pressed="false">Voz de NOAH: apagada</button></header>
  <section class="mission-heading"><div><h1>${title}</h1><p>${subtitle}</p></div><ol class="mission-steps" aria-label="Etapas"><li ${step === 0 ? 'aria-current="step"' : ''}>01 Construir</li><li ${step === 1 ? 'aria-current="step"' : ''}>02 Probar</li><li ${step === 2 ? 'aria-current="step"' : ''}>03 Descubrir</li></ol></section>
  <main class="mission-columns"><section class="workshop-panel" data-area="left"></section><section class="mission-view" aria-label="Satélite ilustrado sobre la Tierra"><p class="simulation-label">Simulación educativa · ilustraciones</p><div class="assembly-zone" data-action="drop">Arrastrá una pieza aquí o elegila en el taller</div><div class="mission-caption"><h2 data-area="caption">Explorá los cambios del bosque</h2><p data-area="caption-detail">Objetivo: obtener y enviar 2 imágenes.</p></div></section><aside class="workshop-panel" data-area="right"></aside></main>
  <footer class="mission-footer"><div class="noah-panel"><span class="noah-emblem" aria-hidden="true">N</span><div><strong>NOAH</strong><p data-area="noah" role="status" aria-live="polite"></p></div><button data-action="listen">Escuchar</button></div><div class="mission-actions" data-area="actions"></div></footer>`;
  const dom = scene.add.dom(0, 0, root).setOrigin(0); dom.pointerEvents = 'none';
  const ui = { root, message: '', voice: !!scene.registry.get('noahVoice'),
    area: name => root.querySelector(`[data-area="${name}"]`),
    say(text) { this.message = text; this.area('noah').textContent = text; if (this.voice) this.speak(); },
    speak() {
      if (!('speechSynthesis' in window)) return;
      speechSynthesis.cancel(); const line = new SpeechSynthesisUtterance(this.message); line.lang = 'es-ES'; line.rate = .95; speechSynthesis.speak(line);
    },
    bind(handlers) {
      root.addEventListener('click', event => {
        const button = event.target.closest('button[data-action]');
        if (!button || button.disabled) return;
        const action = button.dataset.action;
        if (action === 'voice') {
          this.voice = !this.voice; scene.registry.set('noahVoice', this.voice); button.setAttribute('aria-pressed', String(this.voice)); button.textContent = `Voz de NOAH: ${this.voice ? 'activada' : 'apagada'}`;
          if (this.voice) this.speak(); else window.speechSynthesis?.cancel();
        } else if (action === 'listen') this.speak(); else handlers[action]?.();
      });
    }
  };
  const voiceButton = root.querySelector('[data-action="voice"]');
  voiceButton.setAttribute('aria-pressed', String(ui.voice));
  voiceButton.textContent = `Voz de NOAH: ${ui.voice ? 'activada' : 'apagada'}`;
  if (!('speechSynthesis' in window)) root.querySelectorAll('[data-action="voice"], [data-action="listen"]').forEach(el => { el.disabled = true; });
  scene.events.once('shutdown', () => { window.speechSynthesis?.cancel(); dom.destroy(); });
  return ui;
}
function meter(label, value, max, unit, note) {
  const over = value > max;
  return `<div class="resource-meter ${over ? 'over' : ''}"><div><h3>${label}</h3><strong>${value}<small> / ${max}${unit}</small></strong></div><progress aria-label="${label}" max="${Math.max(max, value)}" value="${value}"></progress><p>${note}</p></div>`;
}
export function resources(ui, specs, energy = specs.capacity) {
  ui.area('right').innerHTML = `<h2>Recursos del satélite</h2><p class="panel-intro">Encontrá el equilibrio para tu misión.</p>${meter('Presupuesto', specs.cost, limits.budget, ' créditos', 'Incluye 10 créditos de estructura.')}${meter('Masa', specs.mass, limits.mass, ' kg', 'Incluye 2 kg de estructura.')}${meter('Energía', energy, specs.capacity, '', 'Reserva de la batería, en unidades de juego.')}<dl class="spec-list"><div><dt>Recarga con luz</dt><dd>+${specs.generation} / paso</dd></div><div><dt>Por observación</dt><dd>−${specs.cameraPower} energía</dd></div><div><dt>Datos por imagen</dt><dd>${specs.data} bloques</dd></div><div><dt>Envío por contacto</dt><dd>${specs.rate} bloques</dd></div></dl><p class="launch-status ${specs.valid ? '' : 'over-text'}">${specs.valid ? '✓ Dentro de los límites de lanzamiento' : 'Superás los límites. Cambiá alguna pieza.'}</p><details class="science-note"><summary>¿Qué estamos simplificando?</summary><p>El presupuesto, la energía y los datos usan unidades de juego. Las etapas no representan órbitas ni tiempos a escala. El bosque y sus cambios son simulados.</p><a href="${import.meta.env.BASE_URL}FUENTES.md" target="_blank" rel="noopener">Fuentes y reglas</a></details>`;
}
export function actionButton(action, label, primary = false, disabled = false) {
  return `<button data-action="${action}" class="mission-button ${primary ? 'primary' : ''}" ${disabled ? 'disabled' : ''}>${label}</button>`;
}
