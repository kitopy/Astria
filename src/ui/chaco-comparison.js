import { answerComparison, comparisonCase as mission, initialComparison, markComparisonChange, requestComparisonHint, setComparisonSplit, startComparisonSearch } from '../game/chaco-comparison.js';
import { speakIfEnabled } from './noahVoice.js';
import './chaco-comparison.css';

const base = import.meta.env.BASE_URL;
export function createChacoComparison(scene, onAction) {
  const root = document.createElement('section');
  root.className = 'comparison-game';
  root.setAttribute('aria-label', 'Comparación histórica del Chaco paraguayo');
  root.innerHTML = `
    <header class="cmp-header"><strong>ASTRION</strong><button data-cmp="back">‹ Resultados</button><button data-cmp="voice" aria-pressed="false"></button></header>
    <div class="cmp-intro"><span class="cmp-eyebrow">PARAGUAY · ARCHIVO LANDSAT / NASA</span><h1>${mission.title}</h1><p>El mismo lugar. Cuarenta años de historia. ¿Qué cambió?</p></div>
    <ol class="cmp-steps" aria-label="Pasos de la investigación"><li>1 · Explorá</li><li>2 · Señalá</li><li>3 · Descubrí</li></ol>
    <main class="cmp-layout">
      <section class="cmp-viewer" aria-label="Comparador de imágenes">
        <div class="cmp-image-wrap"><button class="cmp-image-area" data-cmp="mark" aria-label="Marcá una zona de cambio; con teclado usá flechas y Enter" disabled>
          <img class="cmp-photo cmp-after" src="${base}${mission.after}" alt="Chaco paraguayo en ${mission.afterYear}, archivo Landsat de NASA" draggable="false">
          <img class="cmp-photo cmp-before" src="${base}${mission.before}" alt="El mismo sector del Chaco en ${mission.beforeYear}, archivo Landsat de NASA" draggable="false">
          <span class="cmp-year cmp-year-before">ANTES · ${mission.beforeYear}</span><span class="cmp-year cmp-year-after">DESPUÉS · ${mission.afterYear}</span>
          <span class="cmp-divider" aria-hidden="true"></span><span class="cmp-hint-area" aria-hidden="true" hidden></span><span class="cmp-marker" aria-hidden="true" hidden></span><span class="cmp-cursor" aria-hidden="true" hidden></span>
        </button></div>
        <div class="cmp-slider"><label for="cmp-split">Mové la barra para comparar los años</label><input id="cmp-split" type="range" min="0" max="100" value="50" aria-label="Comparar 1985 con 2025"><div><button data-cmp="after">Ver ${mission.afterYear}</button><span>Arrastrá o usá las flechas</span><button data-cmp="before">Ver ${mission.beforeYear}</button></div></div>
        <p class="cmp-caption">El mismo sector del Chaco en dos años. Tu misión recrea estas observaciones con imágenes históricas de NASA.</p>
      </section>
      <aside class="cmp-investigation" aria-label="Investigación guiada">
        <span class="cmp-eyebrow" data-cmp-step></span><h2 data-cmp-title></h2><p data-cmp-task></p>
        <div class="cmp-actions"><button data-cmp="search" class="cmp-primary" disabled>Listo para buscar</button><button data-cmp="hint" hidden>Pedir una pista</button></div>
        <fieldset class="cmp-question" hidden><legend>¿Qué observás en la zona que marcaste?</legend><button data-answer="vegetation">Hay menos bosque</button><button data-answer="water">Apareció un lago</button><button data-answer="growth">El bosque ocupa más terreno</button></fieldset>
        <div class="cmp-discovery" hidden><img src="${base}assets/images/star-anomaly.png" alt=""><strong>Guardián del Chaco</strong><p>Comparaste, encontraste un cambio y lo interpretaste.</p><p class="cmp-science">NASA documenta pérdida de bosque en esta serie. Las imágenes ayudan a reconocer el cambio; entender sus causas requiere más información.</p><button data-cmp="finish" class="cmp-primary">Completar misión ›</button></div>
        <div class="cmp-noah"><strong>NOAH · Tu compañera de investigación</strong><p data-cmp-feedback role="status" aria-live="polite"></p><button data-cmp="listen">Escuchar</button></div>
      </aside>
    </main>
    <footer class="cmp-credit"><span>NASA’s Goddard Space Flight Center · Ross K. Walter (SSAI) · Landsat, 1985–2025</span><a href="${mission.source}" target="_blank" rel="noopener">Ver el caso real de NASA</a></footer>`;
  document.body.append(root);
  const get = selector => root.querySelector(selector);
  const imageArea = get('.cmp-image-area'), slider = get('#cmp-split');
  let state = initialComparison(), ready = false, message = '', cursor = { x:.5,y:.5 };
  const phaseIndex = () => ['explore','select','interpret','complete'].indexOf(state.phase);
  function say(text) {
    message = text; get('[data-cmp-feedback]').textContent = text;
    speakIfEnabled(scene, text);
  }
  function voiceLabel() {
    const button = get('[data-cmp=voice]'), enabled = !!scene.registry.get('noahVoice');
    button.textContent = `Voz de NOAH: ${enabled ? 'activada' : 'apagada'}`;
    button.setAttribute('aria-pressed', String(enabled));
  }
  function render() {
    root.dataset.phase = state.phase;
    imageArea.style.setProperty('--split', `${state.split}%`);
    get('.cmp-before').style.clipPath = `inset(0 ${100-state.split}% 0 0)`;
    slider.value = state.split;
    slider.setAttribute('aria-valuetext', `${state.split}% de la vista de 1985`);
    imageArea.disabled = !ready || state.phase !== 'select';
    get('.cmp-year-before').hidden = state.split === 0;
    get('.cmp-year-after').hidden = state.split === 100;
    get('[data-cmp=search]').hidden = state.phase !== 'explore';
    get('[data-cmp=search]').disabled = !ready || !state.explored;
    get('[data-cmp=hint]').hidden = state.phase !== 'select';
    get('[data-cmp=hint]').textContent = state.hints < 3 ? 'Pedir una pista' : 'Repetir la pista';
    get('.cmp-question').hidden = state.phase !== 'interpret';
    get('.cmp-discovery').hidden = state.phase !== 'complete';
    get('[data-cmp-step]').textContent = ['PRIMER PASO','SEGUNDO PASO','TU INTERPRETACIÓN','INVESTIGACIÓN COMPLETA'][phaseIndex()];
    get('[data-cmp-title]').textContent = ['Hacé viajar el tiempo','Encontrá una zona de cambio','¿Qué te cuentan las imágenes?','¡Buen ojo, exploradora!'][phaseIndex()];
    get('[data-cmp-task]').textContent = ['Deslizá la barra y mirá cómo cambia el mismo lugar entre 1985 y 2025.','Tocá un claro del centro: una zona que era oscura y ahora se ve más clara.','Compará otra vez el lugar marcado y elegí qué cambió.','Tus observaciones ayudan a comprender por qué cuidamos el bosque.'][phaseIndex()];
    root.querySelectorAll('.cmp-steps li').forEach((item,i) => item.classList.toggle('active', i === Math.min(2,phaseIndex())));
    get('.cmp-hint-area').hidden = state.phase !== 'select' || state.hints < 2;
    const marker = get('.cmp-marker'); marker.hidden = !state.point;
    if (state.point) { marker.style.left = `${state.point.x*100}%`; marker.style.top = `${state.point.y*100}%`; }
    get('.cmp-cursor').style.left = `${cursor.x*100}%`; get('.cmp-cursor').style.top = `${cursor.y*100}%`;
    root.querySelectorAll('[data-answer]').forEach(button => button.setAttribute('aria-pressed',String(state.answer === button.dataset.answer)));
  }
  function changeSplit(value) { state = setComparisonSplit(state,value); render(); }
  function mark(x,y) {
    const next = markComparisonChange(state,x,y);
    const found = next.phase === 'interpret' && state.phase === 'select';
    if (next.phase === 'interpret' && state.phase === 'select') say('¡Encontraste un sector que cambió! Ahora contame qué observás en el lugar marcado.');
    else if (next.misses > state.misses) say('Hay muchos detalles para explorar. Probemos los claros grandes del centro; también podés pedir una pista.');
    state = next; render();
    if (found) {
      get('[data-answer=vegetation]').focus({preventScroll:true});
      if (window.innerWidth <= 700) get('.cmp-investigation').scrollIntoView({block:'start'});
    }
  }
  slider.addEventListener('input', () => changeSplit(Number(slider.value)));
  imageArea.addEventListener('click', event => {
    if (imageArea.disabled) return;
    const box = imageArea.getBoundingClientRect();
    if (event.detail === 0) mark(cursor.x,cursor.y);
    else mark((event.clientX-box.left)/box.width,(event.clientY-box.top)/box.height);
  });
  imageArea.addEventListener('keydown', event => {
    const moves = { ArrowLeft:[-.025,0], ArrowRight:[.025,0], ArrowUp:[0,-.025], ArrowDown:[0,.025] };
    if (!moves[event.key]) return;
    event.preventDefault();
    cursor = { x:Math.max(0,Math.min(1,cursor.x+moves[event.key][0])), y:Math.max(0,Math.min(1,cursor.y+moves[event.key][1])) };
    get('.cmp-cursor').hidden = false; render();
  });
  imageArea.addEventListener('blur', () => { get('.cmp-cursor').hidden = true; });
  root.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    if (button.dataset.answer) {
      state = answerComparison(state,button.dataset.answer);
      say(state.phase === 'complete' ? '¡Así es! El bosque continuo dio lugar a claros y parcelas. Comparar años nos permite reconocer esos cambios.' : 'Mirá de nuevo la zona marcada. Compará el bosque oscuro con los sectores claros y probá otra respuesta.');
      render(); return;
    }
    const action = button.dataset.cmp;
    if (action === 'before' || action === 'after') changeSplit(action === 'before' ? 100 : 0);
    else if (action === 'search') { state = startComparisonSearch(state); say('Buscá un claro grande del centro y señalalo en la imagen. Podés seguir moviendo la barra.'); render(); imageArea.focus(); }
    else if (action === 'hint') {
      state = requestComparisonHint(state); say(mission.hints[state.hints-1]);
      if (state.hints >= 2) state = setComparisonSplit(state,0);
      if (state.hints === 3) { cursor = {...mission.focus}; get('.cmp-cursor').hidden = false; }
      render();
    } else if (action === 'voice') { scene.registry.set('noahVoice',!scene.registry.get('noahVoice')); voiceLabel(); if (scene.registry.get('noahVoice')) speakIfEnabled(scene,message); else window.speechSynthesis?.cancel(); }
    else if (action === 'listen') speakIfEnabled(scene,message,{force:true});
    else if (action === 'back' || action === 'finish') onAction(action);
  });
  const photos = [...root.querySelectorAll('.cmp-photo')];
  photos.forEach(photo => photo.addEventListener('error', () => { if (root.isConnected) say('No se pudieron cargar las imágenes. Volvé a resultados y probá otra vez.'); }));
  Promise.all(photos.map(photo => photo.decode())).then(() => {
    if (!root.isConnected) return;
    ready = true; render();
    say('Tu satélite logró enviar sus datos. Ahora investiguemos un caso histórico real del Chaco: mové la barra para comparar los dos años.');
  }).catch(() => { if (root.isConnected) say('No se pudieron preparar las imágenes. Podés volver a resultados y reintentar.'); });
  if (!('speechSynthesis' in window)) root.querySelectorAll('[data-cmp=voice],[data-cmp=listen]').forEach(button=>button.disabled=true);
  voiceLabel(); render();
  return { destroy(){ window.speechSynthesis?.cancel(); root.remove(); } };
}
