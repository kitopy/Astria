import { answerComparison, comparisonCase, initialComparison, markComparisonChange, MIN_BRUSH_LENGTH } from '../game/chaco-comparison.js';
import { speakIfEnabled } from './noahVoice.js';
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
      <div><h1>Descubrí qué cambió</h1><p>Pintá un sector claro de 2025 para revelar cómo se veía el mismo lugar en 1985.</p></div>
      <span>IMÁGENES LANDSAT / NASA</span>
    </div>
    <main class="brush-layout">
      <section class="brush-viewer" aria-label="Comparación interactiva de imágenes">
        <div class="brush-stage" aria-label="Pintá para revelar la imagen de 1985">
          <img src="${base}${comparisonCase.after}" alt="Sector del Chaco paraguayo en 2025, imagen Landsat de NASA" draggable="false">
          <canvas class="brush-reveal" aria-label="Zonas de 1985 reveladas"></canvas>
          <span class="brush-region">SECTOR DE ESTUDIO · CHACO PARAGUAYO</span>
          <span class="brush-year brush-year-after">VISTA DE TU MISIÓN · 2025<small>Captura simulada</small></span>
          <span class="brush-year brush-year-before">BAJO EL PINCEL · 1985<small>Archivo NASA</small></span>
          <span class="brush-cursor" aria-hidden="true"></span>
          <span class="brush-help">Arrastrá el pincel por un sector claro.</span>
          <span class="brush-pins" aria-hidden="true"></span>
        </div>
        <div class="brush-viewer-bar"><span>El pincel revela el mismo lugar, 40 años antes.</span><button data-action="toggle-year">Ver 1985 completo</button></div>
      </section>
      <aside class="brush-panel" aria-label="Tu investigación">
        <div class="brush-panel-head"><span>INVESTIGACIÓN</span><span data-ui="count">0 / 2 HALLAZGOS</span></div>
        <div class="brush-location">
          <svg viewBox="0 0 130 120" role="img" aria-label="Paraguay con la región occidental destacada">
            <defs><clipPath id="brush-paraguay-clip"><path data-map="clip"></path></clipPath></defs>
            <path data-map="shape" class="brush-country"></path>
            <g clip-path="url(#brush-paraguay-clip)"><rect x="0" y="0" width="72" height="120" class="brush-chaco"></rect></g>
            <path data-map="outline" class="brush-outline"></path>
          </svg>
          <div><span>¿DÓNDE MIRÁS?</span><strong>Chaco paraguayo</strong><small>Región occidental de Paraguay. NASA no indica una coordenada exacta para este recorte.</small></div>
        </div>
        <h2 data-ui="title">Buscá dos cambios</h2>
        <p data-ui="task">En 2025 aparecen grandes sectores claros. Pasá el pincel por uno y fijate qué había allí en 1985.</p>
        <div class="brush-findings"><div data-finding="0"><b>01</b><span>Primer sector por explorar</span></div><div data-finding="1"><b>02</b><span>Segundo sector por explorar</span></div></div>
        <p class="brush-message" data-ui="message" role="status" aria-live="polite"></p>
        <button class="brush-primary" data-action="mark" disabled>Marcar hallazgo</button>
        <button class="brush-secondary" data-action="reset">Empezar de nuevo</button>
        <fieldset class="brush-question" hidden><legend>¿Qué muestran las dos fechas?</legend><button data-answer="vegetation">Antes había más bosque continuo</button><button data-answer="growth">Ahora hay más bosque continuo</button><button data-answer="water">Apareció un lago</button></fieldset>
        <div class="brush-result" hidden><strong>Encontraste el cambio</strong><p>En esta serie, el bosque de 1985 se ve más continuo. En 2025 aparecen claros y parcelas. Las imágenes muestran el cambio; por sí solas no explican todas sus causas.</p><button class="brush-primary" data-action="finish">Ver resultados</button></div>
      </aside>
    </main>
    <footer class="brush-credit">Imágenes Landsat de 1985 y 2025 de <a href="${comparisonCase.source}" target="_blank" rel="noopener">NASA</a>. La captura de 2025 y el viaje son simulados en el juego.</footer>`;
  document.body.append(root);

  const find = selector => root.querySelector(selector);
  const stage = find('.brush-stage');
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

  function say(text) {
    message = text;
    find('[data-ui="message"]').textContent = text;
    speakIfEnabled(scene, text);
  }

  function updateVoice() {
    const button = find('[data-action="voice"]');
    const enabled = !!scene.registry.get('noahVoice');
    button.textContent = `Voz de NOAH: ${enabled ? 'activada' : 'apagada'}`;
    button.setAttribute('aria-pressed', String(enabled));
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
    const x = point.x * mask.width;
    const y = point.y * mask.height;
    const previous = lastPoint ?? point;
    maskContext.strokeStyle = '#fff';
    maskContext.lineWidth = mask.width * .077;
    maskContext.lineCap = 'round';
    maskContext.beginPath();
    maskContext.moveTo(previous.x * mask.width, previous.y * mask.height);
    maskContext.lineTo(x, y);
    maskContext.stroke();
    const wasReady = paintedLength >= MIN_BRUSH_LENGTH;
    paintedLength += Math.hypot(point.x - previous.x, point.y - previous.y);
    samples.push(point);
    lastPoint = point;
    stage.classList.add('has-paint');
    revealArchive();
    find('[data-action="mark"]').disabled = paintedLength < MIN_BRUSH_LENGTH;
    if (!wasReady && paintedLength >= MIN_BRUSH_LENGTH) say('Ya podés marcar este lugar como hallazgo.');
  }

  function render() {
    root.dataset.phase = state.phase;
    find('[data-ui="count"]').textContent = `${state.findings.length} / 2 HALLAZGOS`;
    find('[data-action="mark"]').hidden = state.phase !== 'explore';
    find('.brush-question').hidden = state.phase !== 'interpret';
    find('.brush-result').hidden = state.phase !== 'complete';
    const title = state.findings.length === 0 ? 'Buscá dos cambios'
      : state.phase === 'explore' ? 'Encontrá otro sector'
      : state.phase === 'interpret' ? 'Dos lugares investigados' : 'Misión completada';
    find('[data-ui="title"]').textContent = title;
    find('[data-ui="task"]').textContent = state.findings.length === 0
      ? 'En 2025 aparecen grandes sectores claros. Pasá el pincel por uno y fijate qué había allí en 1985.'
      : state.phase === 'explore' ? 'Buscá otro claro y revelá cómo era ese lugar en 1985.'
      : state.phase === 'interpret' ? 'Mirá los dos lugares que pintaste y elegí qué cambió.'
      : 'Encontraste dos lugares donde cambió el paisaje.';
    find('.brush-findings').querySelectorAll('[data-finding]').forEach((item, index) => {
      item.classList.toggle('found', index < state.findings.length);
      item.querySelector('span').textContent = index < state.findings.length
        ? `Sector ${index + 1} marcado` : `${index === 0 ? 'Primer' : 'Segundo'} sector por explorar`;
    });
    find('[data-action="mark"]').textContent = state.findings.length ? 'Marcar segundo hallazgo' : 'Marcar hallazgo';
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
    say('Podés pintar sin apuro. Elegí un sector que te llame la atención.');
  }

  function markFinding() {
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
      ? 'Los dos lugares están listos. ¿Qué cambió entre 1985 y 2025?'
      : 'Primer hallazgo marcado. Explorá otra parte de la imagen.');
    if (state.phase === 'interpret' && window.innerWidth <= 700) {
      find('.brush-panel').scrollIntoView({ block: 'start', behavior: 'smooth' });
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
    if (painting) paintAt(point);
  });
  const stopPainting = () => {
    painting = false;
    lastPoint = null;
    stage.classList.remove('painting');
  };
  stage.addEventListener('pointerup', stopPainting);
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
      return;
    }
    const action = button.dataset.action;
    if (action === 'mark') markFinding();
    else if (action === 'reset') reset();
    else if (action === 'toggle-year') {
      const showingArchive = stage.classList.toggle('show-before');
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
  }).catch(() => say('No se pudieron cargar las imágenes. Volvé a resultados y probá otra vez.'));

  fetch(`${base}data/paraguay-region.geojson`).then(response => response.json()).then(data => {
    if (!root.isConnected) return;
    const country = data.features.find(feature => feature.properties.code === 'PRY');
    const coordinates = country.geometry.coordinates[0];
    const longitudes = coordinates.map(point => point[0]);
    const latitudes = coordinates.map(point => point[1]);
    const west = Math.min(...longitudes);
    const north = Math.max(...latitudes);
    const scale = Math.min(106 / (Math.max(...longitudes) - west), 96 / (north - Math.min(...latitudes)));
    const path = coordinates.map(([longitude, latitude], index) =>
      `${index ? 'L' : 'M'}${(12 + (longitude - west) * scale).toFixed(1)},${(12 + (north - latitude) * scale).toFixed(1)}`
    ).join(' ') + ' Z';
    root.querySelectorAll('[data-map]').forEach(element => element.setAttribute('d', path));
  }).catch(() => {
    find('.brush-location small').textContent = 'Región occidental de Paraguay. Localizador no disponible.';
  });

  updateVoice();
  render();
  return { destroy() { window.speechSynthesis?.cancel(); root.remove(); } };
}
