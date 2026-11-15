import { answerComparison, comparisonCase, initialComparison, markComparisonChange, MIN_BRUSH_LENGTH } from '../game/chaco-comparison.js';
import { speakIfEnabled } from './noahVoice.js';
import { showDialog } from './dialog.js';
import { sfx } from './sfx.js';
import './chaco-brush.css';

const base = import.meta.env.BASE_URL;

export function createChacoComparison(scene, onAction) {
  const root = document.createElement('section');
  root.className = 'brush-game';
  root.setAttribute('aria-label', 'Investigación del Chaco paraguayo');
  root.innerHTML = `
    <header class="brush-header">
      <strong>ASTRION</strong>
      <button data-action="voice" aria-pressed="false">Voz de NOAH</button>
    </header>
    <div class="brush-intro">
      <div><h1>Investigá el Chaco</h1></div>
      <span>IMÁGENES LANDSAT / NASA</span>
    </div>
    <main class="brush-layout">
      <section class="brush-viewer" aria-label="Comparación interactiva de imágenes">
        <div class="brush-stage" aria-label="Lupa comparativa: imagen de 2025 con archivo de 1985">
          <img src="${base}${comparisonCase.after}" alt="Sector del Chaco paraguayo en 2025, imagen Landsat de NASA" draggable="false">
          <canvas class="brush-reveal" aria-label="Zonas de 1985 reveladas"></canvas>
          <span class="brush-region">SECTOR DE ESTUDIO · CHACO PARAGUAYO</span>
          <span class="brush-year brush-year-after"><b>2025</b><small>Tu misión · captura simulada</small></span>
          <span class="brush-year brush-year-before"><b>1985</b><small>Dentro de la lupa · archivo NASA</small></span>
          <span class="brush-analysis-toast" data-ui="toast" role="status" aria-live="polite"></span>
          <span class="brush-cursor" aria-hidden="true"><b>1985</b></span>
          <span class="brush-help">Mové la lupa · Tocá para registrar</span>
          <span class="brush-pins" aria-hidden="true"></span>
        </div>
        <div class="brush-viewer-bar"><span>Fuera de la lupa: 2025 · Dentro: 1985</span><button data-action="toggle-year">Ver 1985 completo</button></div>
      </section>
      <aside class="brush-panel" aria-label="Tu investigación">
        <div class="brush-panel-head"><span>ANÁLISIS</span></div>
        <div class="brush-location">
          <strong>Chaco paraguayo</strong>
          <div class="brush-mini-view" aria-label="Vista general de la imagen: el recuadro sigue la lupa">
            <img src="${base}${comparisonCase.after}" alt="Vista general del sector observado">
            <span class="brush-mini-target"></span>
          </div>
          <small>Tu lupa en la imagen</small>
        </div>
        <h2 data-ui="title">Buscá dos cambios</h2>
        <p data-ui="task">En 2025 aparecen grandes sectores claros. Pasá el pincel por uno y fijate qué había allí en 1985.</p>
        <div class="brush-findings"><div data-finding="0"><b>01</b><span>Por encontrar</span></div><div data-finding="1"><b>02</b><span>Por encontrar</span></div></div>
        <p class="brush-message" data-ui="message" role="status" aria-live="polite"></p>
        <button class="brush-primary" data-action="mark" disabled>Marcar este cambio</button>
        <button class="brush-secondary" data-action="reset">Empezar de nuevo</button>
        <fieldset class="brush-question" hidden><legend>¿Qué muestran las dos fechas?</legend><button data-answer="vegetation">Antes había más bosque continuo</button><button data-answer="growth">Ahora hay más bosque continuo</button><button data-answer="water">Apareció un lago</button></fieldset>
        <div class="brush-result" hidden><strong>Encontraste el cambio</strong><p>En esta serie, el bosque de 1985 se ve más continuo. En 2025 aparecen claros y parcelas. Las imágenes muestran el cambio; por sí solas no explican todas sus causas.</p><button class="brush-primary" data-action="finish">Ver resultados</button></div>
      </aside>
    </main>
    <footer class="brush-credit">Imágenes Landsat de 1985 y 2025 de <a href="${comparisonCase.source}" target="_blank" rel="noopener">NASA</a>. La captura de 2025 y el viaje son simulados en el juego.</footer>`;
  document.body.append(root);

  const find = selector => root.querySelector(selector);
  const stage = find('.brush-stage');
  stage.append(find('.brush-location'), find('.brush-findings'));
  stage.append(find('.brush-panel'));
  find('.brush-viewer-bar').append(find('[data-action="reset"]'));
  stage.style.backgroundImage = `url("${base}${comparisonCase.before}")`;
  const currentImage = find('.brush-stage img');
  const reveal = find('.brush-reveal');
  const revealContext = reveal.getContext('2d');
  const mask = document.createElement('canvas');
  const maskContext = mask.getContext('2d');
  const archiveImage = new Image();
  archiveImage.src = `${base}${comparisonCase.before}`;
  let state = initialComparison();
  let painting = false;
  let lastPoint = null;
  let paintedLength = 0;
  let samples = [];
  let ready = false;
  let message = '';
  let toastTimer;
  let lastLensPoint = { x: .5, y: .48 };

  function say(text) {
    message = text;
    find('[data-ui="message"]').textContent = text;
    const toast = find('[data-ui="toast"]');
    toast.textContent = text;
    toast.classList.remove('show');
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
    speakIfEnabled(scene, text);
  }

  function updateVoice() {
    const button = find('[data-action="voice"]');
    const enabled = !!scene.registry.get('noahVoice');
    button.textContent = `Voz de NOAH: ${enabled ? 'activada' : 'apagada'}`;
    button.setAttribute('aria-pressed', String(enabled));
  }

  async function showDiscoveryImpact() {
    const choice = await showDialog(scene, {
      title: '40 años de cambio',
      text: 'Donde había bosque, hoy hay claros.',
      body: `<div class="chaco-impact">
        <figure><figcaption><strong>1985</strong></figcaption><img src="${base}${comparisonCase.before}" alt="Chaco en 1985: bosque más continuo"></figure>
        <figure><figcaption><strong>Hoy</strong></figcaption><img src="${base}${comparisonCase.after}" alt="El mismo sector del Chaco en 2025: claros y parcelas entre el bosque"></figure>
      </div>`,
      actions: [{ label: 'Terminar misión', value: 'finish', primary: true }],
    });
    if (choice === 'finish' && root.isConnected) onAction('finish');
  }

  function pointFromEvent(event) {
    const bounds = stage.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)),
      y: Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height)),
    };
  }

  function revealArchive() {
    if (!ready) return;
    revealContext.clearRect(0, 0, reveal.width, reveal.height);
    revealContext.drawImage(archiveImage, 0, 0, reveal.width, reveal.height);
    revealContext.globalCompositeOperation = 'destination-in';
    revealContext.drawImage(mask, 0, 0);
    revealContext.globalCompositeOperation = 'source-over';
  }

  function paintAt(point) {
    lastLensPoint = point;
    const target = find('.brush-mini-target');
    target.style.left = `${point.x * 100}%`;
    target.style.top = `${point.y * 100}%`;
    const cursor = find('.brush-cursor');
    cursor.style.left = `${point.x * 100}%`;
    cursor.style.top = `${point.y * 100}%`;
    const x = point.x * mask.width;
    const y = point.y * mask.height;
    maskContext.clearRect(0, 0, mask.width, mask.height);
    maskContext.fillStyle = '#fff';
    maskContext.beginPath();
    // Match the circular HUD in screen space, even when the image is resized.
    maskContext.ellipse(x, y, mask.width * .12, mask.height * .12 * stage.clientWidth / stage.clientHeight, 0, 0, Math.PI * 2);
    maskContext.fill();
    paintedLength = MIN_BRUSH_LENGTH;
    samples = [point];
    lastPoint = point;
    stage.classList.add('has-paint');
    revealArchive();
    find('[data-action="mark"]').disabled = paintedLength < MIN_BRUSH_LENGTH;
  }

  function render() {
    root.dataset.phase = state.phase;
    find('.brush-panel-head').dataset.found = String(state.findings.length);
    find('[data-action="mark"]').hidden = state.phase !== 'explore';
    find('.brush-question').hidden = state.phase !== 'interpret';
    find('.brush-result').hidden = state.phase !== 'complete';
    const title = state.findings.length === 0 ? 'Buscá dos cambios'
      : state.phase === 'explore' ? 'Encontrá otro sector'
      : state.phase === 'interpret' ? '2 de 2 · Análisis listo' : 'Misión completada';
    find('[data-ui="title"]').textContent = title;
    find('[data-ui="task"]').textContent = state.findings.length === 0
      ? 'Tocá dos sectores para compararlos.'
      : state.phase === 'explore' ? 'Buscá otro claro y revelá cómo era ese lugar en 1985.'
      : state.phase === 'interpret' ? '¿Qué cambió en los sectores que comparaste?'
      : 'Encontraste dos lugares donde cambió el paisaje.';
    find('.brush-findings').querySelectorAll('[data-finding]').forEach((item, index) => {
      item.classList.toggle('found', index < state.findings.length);
      item.querySelector('span').textContent = index < state.findings.length
        ? 'Encontrado' : 'Por encontrar';
    });
    find('[data-action="mark"]').textContent = 'Marcar este cambio';
    const pins = find('.brush-pins');
    pins.replaceChildren();
    state.findings.forEach((point, index) => {
      const pin = document.createElement('span');
      pin.className = 'brush-pin';
      pin.textContent = String(index + 1).padStart(2, '0');
      pin.style.left = `${point.x * 100}%`;
      pin.style.top = `${point.y * 100}%`;
      pins.append(pin);
    });
  }

  function reset() {
    state = initialComparison();
    painting = false;
    lastPoint = null;
    paintedLength = 0;
    samples = [];
    maskContext.clearRect(0, 0, mask.width, mask.height);
    revealContext.clearRect(0, 0, reveal.width, reveal.height);
    stage.classList.remove('has-paint', 'painting', 'show-before');
    find('[data-action="toggle-year"]').textContent = 'Ver 1985 completo';
    find('[data-action="mark"]').disabled = true;
    render();
    paintAt({ x: .5, y: .48 });
    find('[data-ui="toast"]').classList.remove('show');
  }

  async function markFinding() {
    if (samples.length === 0 || paintedLength < MIN_BRUSH_LENGTH) return;
    const sum = samples.reduce((result, point) => ({ x: result.x + point.x, y: result.y + point.y }), { x: 0, y: 0 });
    const center = { x: sum.x / samples.length, y: sum.y / samples.length };
    const next = markComparisonChange(state, center, paintedLength);
    if (next.misses > state.misses) {
      say('Buscá otro sector, más lejos del primero.');
      return;
    }
    state = next;
    lastPoint = null;
    paintedLength = 0;
    samples = [];
    find('[data-action="mark"]').disabled = true;
    render();
    say(state.phase === 'interpret'
      ? '¡Lo lograste! Los dos hallazgos están listos. ¿Qué descubriste?'
      : '¡Buen ojo! Primer hallazgo registrado. ¡Vamos por el segundo!');
    if (state.phase === 'interpret') {
      find('.brush-question').hidden = true;
      find('[data-ui="toast"]').classList.remove('show');
      const acknowledged = await showDialog(scene, {
        title: '¡Encontraste los dos!',
        dismissable: false,
        autoCloseMs: 3000,
        showCountdown: false,
        body: '<span class="chaco-found-notice" hidden></span>',
        actions: [{ label: 'OK', value: 'ok', primary: true }],
      });
      if (acknowledged !== 'ok' || !root.isConnected) return;
      // A wrong answer is removed from the options and the title says so: the question never repeats
      // the same way, and after two tries only the right answer is left.
      const answers = [
        { label: 'Ahora hay más bosque', value: 'growth' },
        { label: 'Antes había más bosque', value: 'vegetation' },
        { label: 'Apareció un lago', value: 'water' },
      ];
      const wrong = new Set();
      while (state.phase === 'interpret' && root.isConnected) {
        const choice = await showDialog(scene, {
          title: wrong.size ? '¡Casi! Probá otra vez' : '¿Qué descubriste?',
          text: wrong.size ? 'Mirá las dos fotos: ¿cuándo había más bosque?' : '¿Qué le pasó al bosque?',
          body: `<div class="chaco-analysis-preview" aria-label="Comparación del mismo sector en dos fechas">
            <figure><img src="${base}${comparisonCase.before}" alt="Bosque del Chaco en 1985"><figcaption>1985</figcaption></figure>
            <figure><img src="${base}${comparisonCase.after}" alt="El mismo sector del Chaco en 2025"><figcaption>Hoy</figcaption></figure>
          </div>`,
          dismissable: false,
          // All answers look the same: highlighting one would give the answer away.
          actions: answers.filter((answer) => !wrong.has(answer.value)),
        });
        if (!choice || !root.isConnected) return;
        state = answerComparison(state, choice);
        if (state.phase === 'interpret') {
          wrong.add(choice);
          sfx.almost();
        }
      }
      if (root.isConnected && state.phase === 'complete') {
        render();
        sfx.done();
        showDiscoveryImpact();
      }
    }
  }

  stage.addEventListener('pointerdown', event => {
    if (!ready || state.phase !== 'explore' || stage.classList.contains('show-before')) return;
    stage.setPointerCapture(event.pointerId);
    painting = true;
    lastPoint = null;
    stage.classList.add('painting');
    const point = pointFromEvent(event);
    find('.brush-cursor').style.left = `${point.x * 100}%`;
    find('.brush-cursor').style.top = `${point.y * 100}%`;
    paintAt(point);
  });
  stage.addEventListener('pointermove', event => {
    const point = pointFromEvent(event);
    find('.brush-cursor').style.left = `${point.x * 100}%`;
    find('.brush-cursor').style.top = `${point.y * 100}%`;
    if (ready && !stage.classList.contains('show-before')) paintAt(point);
  });
  const stopPainting = () => {
    painting = false;
    lastPoint = null;
    stage.classList.remove('painting');
  };
  stage.addEventListener('pointerup', () => {
    if (painting) markFinding();
    stopPainting();
  });
  stage.addEventListener('pointercancel', stopPainting);

  root.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    if (button.dataset.answer) {
      state = answerComparison(state, button.dataset.answer);
      render();
      say(state.phase === 'complete'
        ? 'El bosque de 1985 se ve más continuo. En 2025 aparecen claros y parcelas.'
        : 'Mirá otra vez: ¿en qué año se ve más bosque continuo?');
      if (state.phase === 'complete') showDiscoveryImpact();
      return;
    }
    const action = button.dataset.action;
    if (action === 'mark') markFinding();
    else if (action === 'reset') reset();
    else if (action === 'toggle-year') {
      const showingArchive = stage.classList.toggle('show-before');
      find('.brush-year-before small').textContent = showingArchive ? 'Archivo histórico · NASA' : 'Dentro de la lupa · archivo NASA';
      button.textContent = showingArchive ? 'Volver a 2025' : 'Ver 1985 completo';
    } else if (action === 'voice') {
      scene.registry.set('noahVoice', !scene.registry.get('noahVoice'));
      updateVoice();
      if (scene.registry.get('noahVoice')) speakIfEnabled(scene, message);
      else window.speechSynthesis?.cancel();
    } else if (action === 'back' || action === 'finish') onAction(action);
  });

  Promise.all([currentImage.decode(), archiveImage.decode()]).then(() => {
    if (!root.isConnected) return;
    for (const canvas of [reveal, mask]) {
      canvas.width = currentImage.naturalWidth;
      canvas.height = currentImage.naturalHeight;
    }
    ready = true;
    reset();
    showDialog(scene, {
      title: 'Detectives del Chaco',
      text: 'La lupa muestra el bosque en 1985. Buscá dos lugares que cambiaron y tocalos.',
      actions: [{ label: 'Investigar', value: 'start', primary: true }],
    });
  }).catch(() => say('No se pudieron cargar las imágenes. Volvé a resultados y probá otra vez.'));

  const resizeObserver = new ResizeObserver(() => {
    if (ready) paintAt(lastLensPoint);
  });
  resizeObserver.observe(stage);

  updateVoice();
  render();
  return { destroy() {
    clearTimeout(toastTimer);
    resizeObserver.disconnect();
    window.speechSynthesis?.cancel();
    root.remove();
  } };
}
