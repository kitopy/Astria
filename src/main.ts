import './style.css';
import rawParts from './parts.json';
import { advance, capture, feedback, initialDesign, kinds, launch, limits, phases, stats, transmit } from './model';
import type { Catalog, Design, Kind, Mission } from './model';
import { createSpace } from './space';

const catalog = rawParts as Catalog;
const storageKey = 'astria-design-v1';
let design: Design = { ...initialDesign };
try {
  const stored = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
  if (stored && typeof stored === 'object') for (const k of kinds)
    if (catalog[k].options.some(p => p.id === stored[k])) design[k] = stored[k];
} catch { /* El juego también funciona si el almacenamiento está bloqueado. */ }
let mission: Mission | null = null;
let result = false;
let sound = false;
let message = 'Tu misión: obtené y enviá dos imágenes del bosque para investigar sus cambios. Elegí una pieza de cada tipo y probá tu diseño.';
const icons: Record<Kind, string> = {
  camera: '<rect x="3" y="7" width="18" height="14" rx="3"/><circle cx="12" cy="14" r="4"/><path d="m8 7 2-3h4l2 3"/>',
  solar: '<path d="m6 3 15 2-4 16-15-2Z M5 9l14 2M4 14l14 2M11 4 7 20M16 5l-4 15"/>',
  battery: '<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 1h6m-2 7-4 6h6l-4 5"/>',
  antenna: '<path d="M4 4c-1 10 6 17 16 16L4 4Zm8 8 7-7M9 20l-2 3h12M18 2a4 4 0 0 1 4 4"/>'
};
const icon = (k: Kind) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[k]}</svg>`;
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <header class="header"><a class="brand" href="./" aria-label="Astria, inicio">ASTRIA<span class="brand-star">✦</span></a><span class="game-name">Guardianes de la Tierra</span><button id="sound" class="button quiet" aria-pressed="false">Voz de NOAH: apagada</button></header>
  <main><section class="intro"><div><h1>Tu satélite. <span>Tu misión.</span></h1><p>Construí, probá y descubrí qué cambia en la Tierra.</p></div><ol class="steps" aria-label="Etapas del juego"><li data-step="0">01 <b>Construir</b></li><li data-step="1">02 <b>Probar</b></li><li data-step="2">03 <b>Descubrir</b></li></ol></section>
  <div class="workspace"><section class="panel workshop" aria-labelledby="workshop-title"><div class="panel-heading"><h2 id="workshop-title">Taller del satélite</h2><p id="workshop-description">Elegí tus piezas. Cada ventaja tiene un desafío.</p></div><div id="parts"></div><div id="mission-controls" hidden></div></section>
  <section class="viewport" aria-label="Vista del satélite sobre la Tierra"><div id="space"></div><div class="scene-top"><span id="scene-status">Tu diseño está tomando forma</span><span class="scene-note">Simulación educativa</span></div><div id="assembly" class="assembly" aria-label="Zona de montaje. También podés seleccionar piezas con los botones."><span>Arrastrá una pieza aquí<br/>o elegila en el taller</span></div><div class="scene-caption"><span id="scene-caption">Explorá los cambios del bosque</span><p id="scene-detail">Objetivo: obtener y enviar 2 imágenes.</p></div></section>
  <aside class="panel resources" aria-labelledby="resource-title"><h2 id="resource-title">Recursos del satélite</h2><p class="resource-intro">Encontrá el equilibrio para tu misión.</p><div id="resources"></div><div id="design-summary"></div><details class="science"><summary>¿Qué estamos simplificando?</summary><p>La masa se expresa en kg. El presupuesto usa créditos ficticios y la energía y los datos usan unidades de juego. Los pasos representan momentos separados de una misión, sin tiempos ni órbitas a escala. No es una herramienta de predicción científica.</p><p>El satélite, el bosque y sus cambios son ilustraciones simuladas. Las imágenes no son observaciones reales de NASA.</p><a href="./FUENTES.md" target="_blank" rel="noopener">Ver fuentes y reglas</a></details></aside></div>
  <section class="bottom"><div class="noah"><div class="noah-orb" aria-hidden="true">N<span>•</span></div><div><strong>NOAH</strong><p id="noah-text" role="status" aria-live="polite"></p></div><button id="repeat" class="repeat" aria-label="Repetir mensaje de NOAH">Escuchar</button></div><div class="actions"><button id="reset" class="button quiet">Reiniciar</button><button id="primary" class="button primary">Probar mi satélite <span aria-hidden="true">→</span></button></div></section>
  <footer><span>ASTRIA · Primer borrador jugable</span><span>Construir. Experimentar. Descubrir.</span></footer></main>
  <dialog id="results" aria-labelledby="result-title"><div class="result-inner"><span class="result-symbol" aria-hidden="true">✦</span><h2 id="result-title"></h2><p id="result-subtitle"></p><div id="result-stats"></div><div id="result-feedback"></div><details><summary>Ver bitácora de la misión</summary><ol id="log"></ol></details><p class="result-note">Dos observaciones permiten detectar cambios aparentes. Explicar su causa requiere más evidencias. Esta misión utiliza un bosque simulado.</p><button id="back" class="button primary">Volver al taller y mejorar <span aria-hidden="true">→</span></button></div></dialog>`;
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const { scene } = createSpace($('space'));
function speak() {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = 'es-ES'; utterance.rate = .95;
  speechSynthesis.speak(utterance);
}
function say(text: string) { message = text; $('noah-text').textContent = text; if (sound) speak(); }
function save() { try { localStorage.setItem(storageKey, JSON.stringify(design)); } catch { /* Opcional. */ } }
function choose(kind: Kind, id: string) {
  if (mission) return;
  const part = catalog[kind].options.find(p => p.id === id);
  if (!part) return;
  design[kind] = id; save(); render();
  const s = stats(catalog, design);
  say(`${part.name}: ${part.benefit.toLowerCase()}, pero ${part.tradeoff.toLowerCase()}. ${!s.valid ? 'Revisá los límites de masa y presupuesto antes de lanzar.' : 'Probá cómo se combina con las otras piezas.'}`);
}
function meter(label: string, value: number, max: number, unit: string, hint: string, bad = false) {
  return `<div class="meter ${bad ? 'over' : ''}"><div class="meter-label"><h3>${label}</h3><strong>${value}<small> / ${max}${unit}</small></strong></div><div class="track" role="meter" aria-label="${label}" aria-valuemin="0" aria-valuemax="${Math.max(max, value)}" aria-valuenow="${value}" aria-valuetext="${value} de ${max}${unit}"><i style="width:${Math.min(value / max * 100, 100)}%"></i></div><p>${hint}</p></div>`;
}
function render() {
  const s = stats(catalog, design);
  document.querySelectorAll<HTMLElement>('[data-step]').forEach(el => { const active = Number(el.dataset.step) === (result ? 2 : mission ? 1 : 0); el.classList.toggle('active', active); if (active) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current'); });
  $('parts').hidden = !!mission; $('mission-controls').hidden = !mission; $('assembly').hidden = !!mission;
  $('workshop-title').textContent = mission ? 'Centro de misión' : 'Taller del satélite';
  $('workshop-description').textContent = mission ? 'Poné a prueba tus decisiones, paso a paso.' : 'Elegí tus piezas. Cada ventaja tiene un desafío.';
  if (!mission) {
    $('parts').innerHTML = kinds.map(k => `<fieldset class="part-group"><legend>${icon(k)}${catalog[k].label}</legend><div class="options">${catalog[k].options.map(part => `<label class="part ${design[k] === part.id ? 'selected' : ''}" draggable="true" data-kind="${k}" data-part="${part.id}"><input type="radio" name="${k}" value="${part.id}" ${design[k] === part.id ? 'checked' : ''}/><span class="part-name">${part.name}</span><span class="benefit">+ ${part.benefit}</span><span class="tradeoff">− ${part.tradeoff}</span><span class="part-values">${part.cost} créditos · ${part.mass} kg</span></label>`).join('')}</div></fieldset>`).join('');
    $('parts').querySelectorAll<HTMLInputElement>('input').forEach(input => input.addEventListener('change', () => {
      const focusKind = input.name; choose(focusKind as Kind, input.value);
      $('parts').querySelector<HTMLInputElement>(`input[name="${focusKind}"][value="${input.value}"]`)?.focus();
    }));
    $('parts').querySelectorAll<HTMLElement>('[draggable]').forEach(el => el.addEventListener('dragstart', e => { (e as DragEvent).dataTransfer?.setData('text/plain', JSON.stringify({ kind: el.dataset.kind, id: el.dataset.part })); }));
  }
  $('resources').innerHTML = meter('Presupuesto', s.cost, limits.budget, ' créditos', 'Incluye 10 créditos de estructura.', s.cost > limits.budget)
    + meter('Masa', s.mass, limits.mass, ' kg', 'Incluye 2 kg de estructura.', s.mass > limits.mass)
    + meter('Energía', mission ? mission.energy : s.capacity, s.capacity, '', mission ? 'Energía que queda en la batería.' : 'Batería cargada al comenzar la misión.');
  $('design-summary').innerHTML = `<div class="specs"><p><span>Recarga con luz</span><b>+${s.generation} / paso</b></p><p><span>Por observación</span><b>−${s.cameraPower} energía</b></p><p><span>Datos por imagen</span><b>${s.data} ${s.data === 1 ? 'bloque' : 'bloques'}</b></p><p><span>Envío por contacto</span><b>${s.rate} bloques</b></p></div><p class="limit-message ${!s.valid ? 'error' : ''}">${s.valid ? '✓ Dentro de los límites de lanzamiento' : 'Superás los límites. Cambiá alguna pieza.'}</p>`;
  const primary = $<HTMLButtonElement>('primary'); primary.disabled = !mission && !s.valid;
  primary.textContent = mission ? mission.phase === 3 ? 'Ver resultados →' : 'Siguiente etapa →' : 'Probar mi satélite →';
  $('scene-status').textContent = mission ? phases[mission.phase].label : 'Tu diseño está tomando forma';
  $('scene-caption').textContent = mission ? phases[mission.phase].title : 'Explorá los cambios del bosque';
  $('scene-detail').textContent = mission ? `${mission.captured.length} imágenes obtenidas · ${mission.delivered} recibidas en Tierra` : 'Objetivo: obtener y enviar 2 imágenes.';
  if (mission) {
    const m = mission;
    $('mission-controls').innerHTML = `<div class="phase-list">${phases.map((phase, i) => `<div class="phase ${i === m.phase ? 'current' : ''} ${i < m.phase ? 'done' : ''}"><span>${i < m.phase ? '✓' : `0${i + 1}`}</span><p>${phase.title}</p></div>`).join('')}</div><p class="task">${phases[m.phase].task}</p><div class="task-actions">${[1, 2].includes(m.phase) ? `<button id="capture" class="button primary" ${m.captured.includes(m.phase) || m.energy < s.cameraPower ? 'disabled' : ''}>${m.captured.includes(m.phase) ? 'Imagen obtenida ✓' : `Observar · −${s.cameraPower} energía`}</button>` : ''}${m.phase === 3 ? `<button id="transmit" class="button primary" ${m.sent || !m.photos.length || m.energy < s.antennaPower ? 'disabled' : ''}>${m.sent ? 'Transmisión realizada ✓' : `Transmitir · −${s.antennaPower} energía`}</button>` : ''}</div><p class="mission-tip">${[1,2].includes(m.phase) && !m.captured.includes(m.phase) && m.energy < s.cameraPower ? 'La cámara necesita más energía de la que queda. Podés avanzar y mejorar tu diseño al terminar.' : m.phase === 3 && m.photos.length && m.energy < s.antennaPower ? 'No queda energía suficiente para la antena. Revisaremos el diseño al terminar.' : 'La simulación avanza cuando vos decidís. No hay cuenta regresiva.'}</p>`;
    $('capture')?.addEventListener('click', () => action('capture'));
    $('transmit')?.addEventListener('click', () => action('transmit'));
  }
  scene.setPhase(mission?.phase ?? -1);
  $('noah-text').textContent = message;
}
function action(type: 'capture' | 'transmit') {
  if (!mission) return;
  try {
    const s = stats(catalog, design);
    mission = type === 'capture' ? capture(mission, s) : transmit(mission, s);
    render(); say(type === 'capture' ? `Imagen obtenida. Usaste ${s.cameraPower} de energía. Ahora necesitamos que llegue a la Tierra.` : `Recibimos ${mission.delivered} imágenes completas. ${mission.photos.length ? 'Quedaron datos a bordo: revisaremos cómo mejorar el envío.' : '¡Los datos ya están en Tierra!'}`);
  } catch (error) { say((error as Error).message); }
}
function showResults() {
  if (!mission) return;
  result = true; render(); const m = mission, s = stats(catalog, design);
  $('result-title').textContent = m.delivered >= 2 ? '¡Misión cumplida!' : 'Cada prueba enseña algo';
  $('result-subtitle').textContent = m.delivered >= 2 ? 'Tu satélite logró observar el bosque y entregar las dos imágenes.' : 'Tu diseño ya tiene una historia. Ahora podés hacerlo mejor.';
  $('result-stats').innerHTML = `<div><strong>${m.captured.length}/2</strong><span>Obtenidas</span></div><div><strong>${m.delivered}/2</strong><span>Recibidas</span></div><div><strong>${s.quality === 2 ? 'Alto' : 'General'}</strong><span>Detalle elegido</span></div>`;
  $('result-feedback').innerHTML = `<ul>${feedback(m, s).map(f => `<li>${f}</li>`).join('')}</ul>${m.delivered >= 2 ? '<div class="discovery"><strong>Tu hallazgo simulado</strong><p>Las dos observaciones muestran una zona con menor cobertura de árboles. Detectaste un cambio aparente; para saber su causa harían falta más observaciones y datos del terreno.</p></div>' : ''}`;
  $('log').replaceChildren(...m.log.map(line => { const li = document.createElement('li'); li.textContent = line; return li; }));
  $<HTMLDialogElement>('results').showModal();
}
$('primary').addEventListener('click', () => {
  const s = stats(catalog, design);
  try {
    if (!mission) { mission = launch(s); render(); say(phases[0].task); }
    else if (mission.phase < 3) { mission = advance(mission, s); render(); say(phases[mission.phase].task); }
    else showResults();
  } catch (e) { say((e as Error).message); }
});
function back() { $<HTMLDialogElement>('results').close(); mission = null; result = false; render(); say('Conservamos tus piezas. Cambiá lo que quieras y probá otra combinación para completar o mejorar tu misión.'); $('primary').focus(); }
$('back').addEventListener('click', back);
$<HTMLDialogElement>('results').addEventListener('cancel', e => { e.preventDefault(); back(); });
$('reset').addEventListener('click', () => { mission = null; result = false; design = { ...initialDesign }; save(); render(); say('Volvimos al diseño inicial. Podés empezar de nuevo con las piezas esenciales.'); });
$('sound').addEventListener('click', () => {
  sound = !sound; $('sound').setAttribute('aria-pressed', String(sound)); $('sound').textContent = `Voz de NOAH: ${sound ? 'activada' : 'apagada'}`;
  if (sound) speak(); else if ('speechSynthesis' in window) speechSynthesis.cancel();
});
$('repeat').addEventListener('click', speak);
if (!('speechSynthesis' in window)) { $<HTMLButtonElement>('sound').disabled = true; $<HTMLButtonElement>('repeat').disabled = true; $('sound').textContent = 'NOAH en texto'; }
$('assembly').addEventListener('dragover', e => { e.preventDefault(); $('assembly').classList.add('dragging'); });
$('assembly').addEventListener('dragleave', () => $('assembly').classList.remove('dragging'));
$('assembly').addEventListener('drop', e => {
  e.preventDefault(); $('assembly').classList.remove('dragging');
  try { const payload = JSON.parse((e as DragEvent).dataTransfer?.getData('text/plain') ?? '{}'); if (kinds.includes(payload.kind)) choose(payload.kind, payload.id); } catch { /* Ignorar texto externo que no sea una pieza. */ }
});
render();
