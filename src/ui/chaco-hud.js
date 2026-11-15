import { noahSpeak, noahStop } from './noahVoice.js';
import { showDialog } from './dialog.js';
import { frames } from './satellite.js';
import { phases } from '../game/model.js';
import { atGate } from '../game/chaco-flight.js';
import { cloudCover, obstacleInfo, obstacleIntensity, REFRAME_ENERGY } from '../game/chaco-visibility.js';
import './chaco.css';

const base = import.meta.env.BASE_URL;
const partRect = frames; // same atlas rectangles as the workshop (ui/satellite.js)
function part(frame, className) {
  return `<svg class="${className}" viewBox="${partRect[frame].join(' ')}" aria-hidden="true"><image href="${base}assets/satellite-modules.png" width="1280" height="1280"/></svg>`;
}
export function satellitePreview(design) {
  const wing = `solar-${design.solar}`;
  return `<div class="flight-satellite ${design.solar === 'large' ? 'extended' : ''}">${part(wing,'preview-wing left')}${part(wing,'preview-wing right')}${part('body','preview-body')}${part(`camera-${design.camera}`,'preview-camera')}${part(`battery-${design.battery}`,'preview-battery')}${part(`antenna-${design.antenna}`,'preview-antenna')}</div>`;
}
// How a photo is named on screen: the old archive year, or "Hoy" for the recent one.
// The first pass shows the Chaco in 1985 and the second one today, so the two photos make a "before and after".
function photoLabel(year) {
  return year >= 2020 ? `Hoy · ${year}` : String(year);
}

// Energy an action uses, shown next to the action (not glued to its name): a battery icon and the number.
function energyCost(amount) {
  return `<span class="energy-cost" aria-label="usa ${amount} de batería"><i aria-hidden="true"></i>−${amount}</span>`;
}

// True when the satellite is stopped over the forest and can take this pass's photo.
export function canCapture(mission, specs, flight) {
  const phase = flight.gate;
  return atGate(flight) && [1, 2].includes(phase) && !mission.captured.includes(phase) && mission.energy >= specs.cameraPower;
}

export function createChacoHUD(scene, design, onAction) {
  const root = document.createElement('section'); root.className = 'chaco-game'; root.setAttribute('aria-label','Guardianes del Chaco: operación del satélite');
  root.innerHTML = `<div class="chaco-map" aria-label="Mapa geográfico de Paraguay"></div><div class="chaco-shadow"></div><div class="weather-fog" aria-hidden="true"></div>
  <div class="chaco-top-actions"><button data-flight="voice" aria-pressed="false">Voz de NOAH: apagada</button></div>
  <aside class="chaco-status hud-panel" aria-label="Estado de la misión">
    <div class="status-battery">
      <span class="status-battery-icon" aria-hidden="true"></span>
      <span class="status-battery-bar"><i data-hud="battery-fill"></i></span>
      <strong data-hud="energy"></strong>
    </div>
    <div class="status-photos" data-hud="photos" aria-label="Fotos">
      <span class="photo-slot"></span><span class="photo-slot"></span>
      <span class="status-sun" data-hud="sun" title="Luz del Sol"></span>
    </div>
  </aside>
  <aside class="sensor-panel hud-panel" aria-label="Visor de la cámara"><div class="sensor-heading"><h2>Cámara del satélite</h2></div><div class="sensor-window"><canvas aria-label="Vista recreada del Chaco con imágenes de archivo"></canvas><div class="sensor-crosshair"></div><div class="sensor-scan"></div><span class="sensor-record" data-hud="sensor-year">ARCHIVO · 1985</span></div><div class="sensor-thumbnails" aria-label="Capturas guardadas"></div></aside>
  <div class="photo-pop hud-panel" aria-live="polite" hidden></div>
  <section class="flight-action-menu hud-panel" aria-label="Ventana de observación" hidden>
    <h2 data-hud="action-title">El Chaco está a la vista</h2>
    <div class="flight-action-choices">
      <button data-flight-choice="capture" class="flight-action-choice primary">
        <span class="flight-action-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M4 8h3l1.5-2h7L17 8h3v10H4V8Z"/><circle cx="12" cy="13" r="3"/></svg></span>
        <span class="flight-action-copy"><strong>Tomar foto</strong></span>
        <span class="flight-action-cost" data-hud="action-cost"></span>
      </button>
    </div>
  </section>
  <aside class="visibility-challenge hud-panel" aria-label="Imprevisto" hidden>
    <h2 data-hud="weather-title"></h2>
    <canvas class="obstacle-view" width="320" height="180" aria-hidden="true"></canvas>
    <p data-hud="weather-message"></p>
    <button data-flight="reframe" class="flight-primary fix-button"></button>
    <progress data-hud="reframe-progress" max="1" value="0" aria-label="Avance del ajuste"></progress>
  </aside>
  <section class="chaco-bottom"><div class="chaco-noah hud-panel"><span class="chaco-noah-icon" aria-hidden="true">N</span><div><strong>NOAH</strong><p data-hud="noah" aria-live="polite"></p></div><button data-flight="listen" aria-label="Escuchar el mensaje de NOAH">Escuchar</button></div>
  <div class="chaco-controls orbital-console" aria-label="Panel de mando del satélite">
    <div class="orbital-console-actions">
      <button data-flight="finish" class="console-action" hidden><span class="console-icon" aria-hidden="true"></span><span class="console-label">Ver resultados</span></button>
    </div>
  </div></section>
`;
  document.body.append(root);
  const get = key => root.querySelector(`[data-hud="${key}"]`);
  // Welcome: the shared game dialog (ui/dialog.js). The flight waits until it's closed.
  let introOpen = true;
  root.classList.add('mission-intro-active'); // the map "arrives" behind the dialog
  showDialog(scene, {
    title: 'Guardianes del Chaco',
    text: 'Viajá sobre Paraguay, mirá cómo cambió el bosque y enviá dos fotos a la Tierra.',
    actions: [{ label: '¡Vamos!', value: 'go', primary: true }],
  }).then(() => {
    if (!scene.sys.isActive()) return; // the scene ended while the dialog was open
    introOpen = false;
    root.classList.remove('mission-intro-active');
    onAction('intro-closed');
  });

  // Sending the photos in Asunción: a dialog with the photos and a send bar under each one.
  // The player presses "Enviar" and the bars fill one after the other. The antenna can only send
  // `specs.rate` data blocks, so with a small antenna a bar stops halfway (same rule as model.js).
  let sendOpen = false, shotsShown = [];
  function openSend(mission, specs) {
    sendOpen = true;
    const photos = mission.photos.map((photo, i) => ({ blocks: photo.remaining, shot: shotsShown[i] }));
    const dialog = document.createElement('dialog');
    dialog.className = 'astrion-dialog send-dialog';
    dialog.innerHTML = `
      <h2>Enviar a la Tierra</h2>
      <div class="send-photos">${photos.map((photo, i) => `
        <figure>
          ${photo.shot?.image ? `<img src="${photo.shot.image}" alt="Foto ${i + 1}">` : `<span class="send-placeholder">Foto ${i + 1}</span>`}
          <div class="send-bar"><i></i></div>
          <figcaption>${photo.shot?.year ? photoLabel(photo.shot.year) : `Foto ${i + 1}`}</figcaption>
        </figure>`).join('')}
      </div>
      <div class="astrion-dialog-actions"><button type="button" class="primary" data-send>Enviar ${energyCost(specs.antennaPower)}</button></div>`;
    document.body.append(dialog);
    dialog.addEventListener('cancel', (event) => event.preventDefault()); // a choice is needed
    // If the browser forces it closed anyway (Escape twice in Chrome), it opens again.
    dialog.addEventListener('close', () => { if (dialog.isConnected) dialog.showModal(); });
    scene.events.once('shutdown', () => dialog.remove());
    dialog.showModal();
    const button = dialog.querySelector('[data-send]');
    button.focus({ preventScroll: true });

    button.addEventListener('click', () => {
      if (button.dataset.done) {
        dialog.remove();
        onAction('finish');
        return;
      }
      button.disabled = true;
      onAction('transmit');
      // Fill the bars in order, as far as the antenna's blocks reach.
      const figures = [...dialog.querySelectorAll('.send-photos figure')];
      const FILL_MS = 900;
      let budget = specs.rate, start = 300;
      const results = figures.map((figure, i) => {
        const sent = Math.min(budget, photos[i].blocks);
        budget -= sent;
        const share = photos[i].blocks ? sent / photos[i].blocks : 0;
        const fill = figure.querySelector('.send-bar i');
        fill.style.transitionDuration = `${FILL_MS * share}ms`;
        setTimeout(() => { fill.style.width = `${share * 100}%`; }, start);
        start += FILL_MS * share;
        return share === 1;
      });
      setTimeout(() => {
        if (!dialog.isConnected) return;
        figures.forEach((figure, i) => {
          const complete = results[i];
          figure.classList.add(complete ? 'arrived' : 'missing');
          figure.querySelector('figcaption').textContent = complete ? '¡Llegó!' : 'No llegó completa';
        });
        // Both photos arrived: next comes analyzing them; otherwise the results.
        button.textContent = results.every(Boolean) && results.length >= 2 ? 'Analizar las fotos' : 'Ver resultados';
        button.dataset.done = 'yes';
        button.disabled = false;
        button.focus({ preventScroll: true });
      }, start + 400); // after the last bar stops
    });
  }

  // What the satellite's camera sees during a surprise problem, copied from the (hidden) camera canvas.
  // Clouds are already painted by the camera; the shake is CSS (chaco.css); a weak signal is drawn here
  // as "pixel drop": missing blocks and shifted stripes, fewer as the signal comes back.
  const sensorCanvas = root.querySelector('.sensor-window canvas');
  const obstacleView = root.querySelector('.obstacle-view');
  function drawObstacleView(kind, strength) {
    const ctx = obstacleView.getContext('2d'), w = obstacleView.width, h = obstacleView.height;
    ctx.drawImage(sensorCanvas, 0, 0, w, h);
    if (kind !== 'signal' || strength <= 0) return;
    for (let i = 0; i < Math.round(strength * 6); i++) { // stripes shifted sideways
      const y = Math.random() * h, height = 4 + Math.random() * 14, shift = (Math.random() - .5) * 60 * strength;
      ctx.drawImage(obstacleView, 0, y, w, height, shift, y, w, height);
    }
    for (let i = 0; i < Math.round(strength * 28); i++) { // missing blocks
      const size = 8 + Math.random() * 22;
      ctx.fillStyle = Math.random() < .75 ? '#0b0618' : '#f0b0f0';
      ctx.fillRect(Math.floor(Math.random() * w / 8) * 8, Math.floor(Math.random() * h / 8) * 8, size, size * .6);
    }
  }

  let voice = !!scene.registry.get('noahVoice'), message = '';
  function speak() { noahSpeak(message); } // same voice as the rest of the game (ui/noahVoice.js)
  function voiceLabel() { const button=root.querySelector('[data-flight="voice"]');button.textContent=`Voz de NOAH: ${voice?'activada':'apagada'}`;button.setAttribute('aria-pressed',String(voice)); }
  voiceLabel();
  root.addEventListener('click', event => {
    const button=event.target.closest('button[data-flight],button[data-flight-choice]');if(!button||button.disabled)return;
    const action=button.dataset.flight??button.dataset.flightChoice;
    if(action==='voice'){voice=!voice;scene.registry.set('noahVoice',voice);voiceLabel();if(voice)speak();else noahStop();}
    else if(action==='listen')speak();
    else onAction(action);
  });
  if(!window.speechSynthesis)root.querySelectorAll('[data-flight="voice"],[data-flight="listen"]').forEach(button=>button.disabled=true);
  return {
    root, mapElement:root.querySelector('.chaco-map'), sensorCanvas:root.querySelector('.sensor-window canvas'), ready:false,
    get introOpen(){return introOpen;},
    setSensorYear(year){get('sensor-year').textContent=`ARCHIVO · ${year}`;},
    showShots(shots){shotsShown=shots;const tray=root.querySelector('.sensor-thumbnails');tray.replaceChildren();for(const [i,shot]of shots.entries()){const figure=document.createElement('figure'),img=document.createElement('img'),caption=document.createElement('figcaption');img.src=shot.image;img.alt=`Vista de archivo del Chaco, ${shot.year??`foto ${i+1}`}`;caption.textContent=`${shot.year??`Foto ${i+1}`}${shot.delivered?' · enviada':' · a bordo'}`;figure.append(img,caption);tray.append(figure);}},
    say(text){message=text;get('noah').textContent=text;if(voice)speak();},
    updateWeather(flight,visibility){
      const cover=cloudCover(flight,visibility), status=visibility.status;
      const info=obstacleInfo(visibility), intensity=obstacleIntensity(flight,visibility);
      root.style.setProperty('--cloud-cover',String(cover));
      root.style.setProperty('--obstacle-strength',String(intensity));
      root.dataset.visibility=status;
      root.dataset.obstacle=visibility.kind;
      // Surprise problem: a box on the map next to the satellite (positionActionMenu), no dialog, so the
      // effect on the map stays visible. Stopped: what happened + the fix button. Fixing: progress bar.
      const panel=root.querySelector('.visibility-challenge');
      const wasHidden=panel.hidden;
      panel.hidden=!(status==='blocked'||status==='adjusting');
      panel.dataset.status=status;
      get('weather-title').textContent=status==='adjusting'?info.working:info.title;
      get('reframe-progress').value=visibility.adjustment;
      if(!panel.hidden)drawObstacleView(visibility.kind,intensity);
      if(wasHidden&&!panel.hidden)this.positionActionMenu();
    },
    update(mission,specs,flight,visibility){
      const gate=atGate(flight), phase=flight.gate;
      const obstructed=['blocked','adjusting'].includes(visibility.status);
      this.updateWeather(flight,visibility);
      root.classList.toggle('panels-deployed',flight.progress>0||flight.running);
      // Status with few numbers: a battery bar with the current charge, two photo slots
      // (empty, taken, sent) and a sun that dims while the satellite is in the shadow.
      const charge=specs.capacity?mission.energy/specs.capacity:0;
      get('battery-fill').style.width=`${Math.round(charge*100)}%`;
      get('battery-fill').classList.toggle('low',charge<.3);
      get('energy').textContent=mission.energy;
      get('photos').querySelectorAll('.photo-slot').forEach((slot,i)=>{
        slot.classList.toggle('sent',i<mission.delivered);
        slot.classList.toggle('taken',i>=mission.delivered&&i<mission.captured.length);
      });
      get('photos').setAttribute('aria-label',`Fotos: ${mission.captured.length} tomadas, ${mission.delivered} enviadas`);
      get('sun').title=phases[mission.phase].sun?'Con luz del Sol':'En la sombra: sin recarga';
      root.classList.toggle('in-shadow',!phases[mission.phase].sun);
      const control=action=>root.querySelector(`[data-flight="${action}"]`);
      // Fix button of the surprise problem; without energy for it, back to the workshop instead.
      const canFix=mission.energy>=REFRAME_ENERGY, fixButton=root.querySelector('.fix-button'), problem=obstacleInfo(visibility);
      fixButton.dataset.flight=canFix?'reframe':'workshop';
      fixButton.innerHTML=canFix?`${problem.action} ${energyCost(REFRAME_ENERGY)}`:'Volver al taller';
      get('weather-message').textContent=canFix?problem.short:`${problem.short} No queda energía para arreglarlo.`;
      // The satellite flies by itself (TestScene). Only two moments ask the player to act:
      // over the forest, the photo menu next to the satellite; in Asunción, send and see the results.
      const actionAvailable = this.ready && !this.introOpen && !obstructed && canCapture(mission,specs,flight);
      const actionMenu = root.querySelector('.flight-action-menu');
      actionMenu.hidden = !actionAvailable;
      root.classList.toggle('action-menu-open', actionAvailable);
      root.querySelector('.map-satellite')?.classList.toggle('action-ready', actionAvailable);
      if (actionAvailable) {
        get('action-title').textContent = phase === 1 ? 'El Chaco en 1985' : 'El Chaco hoy';
        get('action-cost').innerHTML = energyCost(specs.cameraPower);
        this.positionActionMenu();
      }
      // In Asunción: the send dialog opens by itself. Without photos or energy to send, only "Ver resultados".
      const canSend=this.ready&&!this.introOpen&&gate&&phase===3&&!mission.sent&&mission.photos.length>0&&mission.energy>=specs.antennaPower;
      if(canSend&&!sendOpen&&!obstructed)openSend(mission,specs);
      control('finish').hidden=!(phase===3&&gate&&!canSend&&!sendOpen);
      const command=control('finish').hidden?'':'finish';
      root.dataset.command=command;
      root.querySelectorAll('.console-action').forEach(button=>button.classList.toggle('is-cued',button.dataset.flight===command));
    },
    // The photo that was just taken, in a box next to the satellite for a few seconds.
    // With the second photo, both appear side by side: the "before and after" the mission is about.
    showPhoto(shot, shots = [shot]){
      const pop=root.querySelector('.photo-pop');
      const pair=shots.length>=2;
      const shown=pair?shots.slice(0,2):[shot];
      // Each photo: a blurry low-quality layer, the sharp photo on top revealed by a scan line.
      pop.innerHTML=`<div class="photo-pop-row">${shown.map(()=>'<figure><div class="photo-frame"><img class="photo-low" alt=""><img class="photo-sharp" alt=""><span class="photo-scan"></span></div><figcaption></figcaption></figure>').join('')}</div>`;
      pop.querySelectorAll('figure').forEach((figure,i)=>{
        figure.querySelectorAll('img').forEach((img)=>{img.src=shown[i].image;});
        figure.querySelector('.photo-sharp').alt=`Foto del Chaco, ${shown[i].year}`;
        figure.querySelector('figcaption').textContent=photoLabel(shown[i].year);
        // Only the photo just taken is "rendered"; the earlier one is already there.
        figure.classList.toggle('rendering',shown[i]===shot);
      });
      pop.classList.toggle('is-pair',pair);
      pop.hidden=false;
      pop.classList.remove('is-new');void pop.offsetWidth;pop.classList.add('is-new'); // replay the entrance
      this.positionActionMenu();
      clearTimeout(this.photoTimer);
      this.photoTimer=setTimeout(()=>{pop.hidden=true;},pair?5500:4500);
    },
    // Keeps the boxes that belong to the satellite (photo menu, last photo) next to it while the map moves.
    positionActionMenu(){
      const satellite = root.querySelector('.map-satellite');
      if (!satellite || window.innerWidth <= 800) return;
      const marker = satellite.getBoundingClientRect();
      const bounds = root.getBoundingClientRect();
      const gap = 20;
      for (const box of root.querySelectorAll('.flight-action-menu, .photo-pop, .visibility-challenge')) {
        if (box.hidden) continue;
        const right = marker.right - bounds.left + gap;
        const left = right + box.offsetWidth <= bounds.width - gap
          ? right
          : marker.left - bounds.left - box.offsetWidth - gap;
        const top = Math.max(75, Math.min(marker.top - bounds.top - 25, bounds.height - box.offsetHeight - 175));
        box.style.left = `${Math.max(gap, left)}px`;
        box.style.top = `${top}px`;
      }
    },
    destroy(){clearTimeout(this.photoTimer);noahStop();root.remove();}
  };
}
