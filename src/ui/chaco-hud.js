import { catalog } from '../game/design.js';
import { noahSpeak, noahStop } from './noahVoice.js';
import { showDialog } from './dialog.js';
import { phases } from '../game/model.js';
import { atGate } from '../game/chaco-flight.js';
import { cloudCover, obstacleInfo, obstacleIntensity, REFRAME_ENERGY } from '../game/chaco-visibility.js';
import './chaco.css';

const base = import.meta.env.BASE_URL;
const partRect = {
  body: [50,50,340,350], 'solar-small':[440,110,350,230], 'solar-large':[800,105,450,240],
  'camera-simple':[70,460,300,330], 'camera-detail':[425,470,395,320], 'battery-light':[900,470,240,320],
  'battery-long':[35,885,380,340], 'antenna-basic':[500,870,240,350], 'antenna-fast':[820,835,430,390]
};
function part(frame, className) {
  return `<svg class="${className}" viewBox="${partRect[frame].join(' ')}" aria-hidden="true"><image href="${base}assets/satellite-modules.png" width="1280" height="1280"/></svg>`;
}
export function satellitePreview(design) {
  const wing = `solar-${design.solar}`;
  return `<div class="flight-satellite ${design.solar === 'large' ? 'extended' : ''}">${part(wing,'preview-wing left')}${part(wing,'preview-wing right')}${part('body','preview-body')}${part(`camera-${design.camera}`,'preview-camera')}${part(`battery-${design.battery}`,'preview-battery')}${part(`antenna-${design.antenna}`,'preview-antenna')}</div>`;
}
export function createChacoHUD(scene, design, onAction) {
  const root = document.createElement('section'); root.className = 'chaco-game'; root.setAttribute('aria-label','Guardianes del Chaco: operación del satélite');
  root.innerHTML = `<div class="chaco-map" aria-label="Mapa geográfico de Paraguay"></div><div class="chaco-shadow"></div><div class="weather-fog" aria-hidden="true"></div>
  <header class="chaco-header"><strong>ASTRION<span>✦</span></strong><span>Guardianes del Chaco</span><button data-flight="case">Caso real NASA</button><button data-flight="voice" aria-pressed="false">Voz de NOAH: apagada</button></header>
  <div class="chaco-title"><h1>Tu misión <span>sobre Paraguay</span></h1><p>Observá el bosque. Cuidá la energía. Enviá tus descubrimientos.</p></div>
  <aside class="chaco-objective hud-panel"><h2>Dos imágenes del Chaco</h2><div><span>Obtenidas</span><strong data-hud="captured">0/2</strong></div><div><span>Enviadas</span><strong data-hud="delivered">0/2</strong></div><p data-hud="status" role="status">Preparando mapa…</p></aside>
  <aside class="chaco-telemetry hud-panel"><div><span>Batería</span><strong data-hud="energy"></strong><progress data-hud="battery" aria-label="Energía disponible"></progress></div><div><span>Datos a bordo</span><strong data-hud="data">0</strong></div><div><span data-hud="sun">Con luz solar</span><small>Energía por acción y por etapa</small></div></aside>
  <aside class="chaco-design hud-panel"><h2>Tu satélite</h2>${satellitePreview(design)}<p>${catalog.camera.options.find(p=>p.id===design.camera).name} · ${catalog.battery.options.find(p=>p.id===design.battery).name}</p></aside>
  <aside class="sensor-panel hud-panel" aria-label="Visor de la cámara"><div class="sensor-heading"><h2>Cámara del satélite</h2><span data-hud="sensor-state">Preparando</span></div><div class="sensor-window"><canvas aria-label="Vista recreada del Chaco con imágenes de archivo"></canvas><div class="sensor-crosshair"></div><div class="sensor-scan"></div><span class="sensor-record" data-hud="sensor-year">ARCHIVO · 1985</span></div><p>Archivo Landsat / NASA · observación recreada</p><div class="sensor-thumbnails" aria-label="Capturas guardadas"></div></aside>
  <div class="chaco-map-tools"><button data-flight="recenter" aria-label="Volver a centrar Paraguay">Centrar Paraguay</button><button data-flight="speed">Velocidad ×1</button></div>
  <section class="flight-action-menu hud-panel" aria-label="Elegí una acción de observación" hidden>
    <span class="flight-action-eyebrow">VENTANA DE OBSERVACIÓN</span>
    <h2 data-hud="action-title">El Chaco está a la vista</h2>
    <p data-hud="action-prompt">Elegí qué hacer con la cámara.</p>
    <div class="flight-action-choices">
      <button data-flight-choice="capture" class="flight-action-choice primary">
        <span class="flight-action-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M4 8h3l1.5-2h7L17 8h3v10H4V8Z"/><circle cx="12" cy="13" r="3"/></svg></span>
        <span class="flight-action-copy"><strong>Tomar foto</strong><small data-hud="action-capture-detail">Guardar una imagen del Chaco</small></span>
        <span class="flight-action-cost" data-hud="action-cost"></span>
      </button>
      <button data-flight-choice="travel" class="flight-action-choice">
        <span class="flight-action-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></span>
        <span class="flight-action-copy"><strong>Seguir sin foto</strong><small>Perdés esta vista y cuidás la batería</small></span>
      </button>
    </div>
  </section>
  <aside class="visibility-challenge hud-panel" aria-label="Imprevisto de la misión" hidden>
    <span class="weather-tag" data-hud="obstacle-tag">IMPREVISTO DEL TRAYECTO</span>
    <h2 data-hud="weather-title">Buscá un claro</h2>
    <p data-hud="weather-message">Las nubes tapan el terreno. Reorientá la cámara para recuperar la vista.</p>
    <div class="signal-bars" aria-label="Intensidad de la señal" hidden><span></span><span></span><span></span><span></span></div>
    <button data-flight="reframe" class="flight-primary">Buscar un claro · −${REFRAME_ENERGY} energía</button>
    <progress data-hud="reframe-progress" max="1" value="0" aria-label="Ajuste del encuadre" hidden></progress>
  </aside>
  <section class="chaco-bottom"><div class="chaco-noah hud-panel"><span class="chaco-noah-icon" aria-hidden="true">N</span><div><strong>NOAH</strong><p data-hud="noah" aria-live="polite"></p></div><button data-flight="listen" aria-label="Escuchar el mensaje de NOAH">Escuchar</button></div>
  <div class="chaco-controls orbital-console" aria-label="Panel de mando del satélite">
    <div class="orbital-console-head" data-hud="command-title">Preparando sistema</div>
    <div class="orbital-console-actions">
      <button data-flight="travel" class="console-action" disabled><span class="console-icon" aria-hidden="true"></span><span class="console-label">Rumbo al Chaco</span></button>
      <button data-flight="capture" class="console-action" disabled><span class="console-icon" aria-hidden="true"></span><span class="console-label">Tomar foto</span></button>
      <button data-flight="transmit" class="console-action" disabled><span class="console-icon" aria-hidden="true"></span><span class="console-label">Enviar fotos</span></button>
      <button data-flight="pause" class="console-action" disabled><span class="console-icon" aria-hidden="true"></span><span class="console-label">Pausar</span></button>
      <button data-flight="finish" class="console-action" hidden><span class="console-icon" aria-hidden="true"></span><span class="console-label">Ver resultados</span></button>
    </div>
  </div>
  <ol class="chaco-timeline"><li>Preparación</li><li>Primera pasada</li><li>Segunda pasada</li><li>Contacto terrestre</li></ol></section>
  <footer class="chaco-sources"><span>Mapa real · recorrido simulado</span><span>NASA GIBS · Natural Earth · MapLibre</span><button data-flight="workshop">Volver al taller</button></footer>
  <dialog class="chaco-case" aria-labelledby="chaco-case-title"><button data-flight="close-case" class="close-case">Cerrar</button><h2 id="chaco-case-title">Un caso real de nuestro país</h2><p>NASA documentó cambios del bosque en el Chaco paraguayo con imágenes Landsat de <strong>1985 a 2025</strong>.</p><video controls playsinline preload="metadata" src="${base}data/chaco-landsat-nasa.mp4" aria-label="Serie histórica Landsat del Chaco paraguayo"></video><p class="case-credit">NASA’s Goddard Space Flight Center · Ross K. Walter (SSAI).</p><p>Este video es real y de archivo. Tu satélite, el recorrido, las observaciones que obtenés jugando y la estación terrestre son simulados. La imagen base del mapa es un mosaico Blue Marble; no es una imagen en vivo.</p><a href="https://svs.gsfc.nasa.gov/15026/" target="_blank" rel="noopener">Ver la fuente de NASA</a></dialog>`;
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
  const dialog=root.querySelector('dialog');
  dialog.addEventListener('close',()=>root.querySelector('video').pause());
  if(!window.speechSynthesis)root.querySelectorAll('[data-flight="voice"],[data-flight="listen"]').forEach(button=>button.disabled=true);
  return {
    root, mapElement:root.querySelector('.chaco-map'), sensorCanvas:root.querySelector('.sensor-window canvas'), ready:false,
    get introOpen(){return introOpen;},
    get caseOpen(){return dialog.open;},
    setSensorYear(year){get('sensor-year').textContent=`ARCHIVO · ${year}`;},
    showShots(shots){const tray=root.querySelector('.sensor-thumbnails');tray.replaceChildren();for(const [i,shot]of shots.entries()){const figure=document.createElement('figure'),img=document.createElement('img'),caption=document.createElement('figcaption');img.src=shot.image;img.alt=`Vista de archivo del Chaco, ${shot.year??`foto ${i+1}`}`;caption.textContent=`${shot.year??`Foto ${i+1}`}${shot.delivered?' · enviada':' · a bordo'}`;figure.append(img,caption);tray.append(figure);}},
    say(text){message=text;get('noah').textContent=text;if(voice)speak();},
    showCase(){dialog.showModal();}, closeCase(){dialog.close();},
    updateWeather(flight,visibility){
      const cover=cloudCover(flight,visibility), status=visibility.status;
      const info=obstacleInfo(visibility), intensity=obstacleIntensity(flight,visibility);
      root.style.setProperty('--cloud-cover',String(cover));
      root.style.setProperty('--obstacle-strength',String(intensity));
      root.dataset.visibility=status;
      root.dataset.obstacle=visibility.kind;
      root.querySelector('.visibility-challenge').hidden=!(status==='blocked'||status==='adjusting'||intensity>.1);
      get('obstacle-tag').textContent=`IMPREVISTO SIMULADO · ${info.label.toUpperCase()}`;
      get('weather-title').textContent=status==='adjusting'?info.working:status==='blocked'?info.title:'NOAH detectó un imprevisto';
      get('weather-message').textContent=status==='adjusting'?info.explanation:info.message;
      const bars=root.querySelector('.signal-bars');
      bars.hidden=visibility.kind!=='signal';
      bars.querySelectorAll('span').forEach((bar,i)=>{bar.style.opacity=i<Math.round(1+3*(1-intensity))?'1':'.2';});
      get('reframe-progress').hidden=status!=='adjusting';
      get('reframe-progress').value=visibility.adjustment;
    },
    update(mission,specs,flight,visibility){
      const gate=atGate(flight), phase=flight.gate;
      const info=obstacleInfo(visibility);
      const obstructed=['blocked','adjusting'].includes(visibility.status);
      this.updateWeather(flight,visibility);
      get('sensor-state').textContent=obstructed&&visibility.kind!=='signal'?(visibility.status==='adjusting'?'Ajustando sensor':info.label):flight.running?'Explorando':gate&&[1,2].includes(phase)?'Sobre el bosque':'En espera';
      root.classList.toggle('panels-deployed',flight.progress>0||flight.running);
      get('captured').textContent=`${mission.captured.length}/2`;get('delivered').textContent=`${mission.delivered}/2`;
      get('energy').textContent=`${mission.energy}/${specs.capacity}`;get('battery').max=specs.capacity;get('battery').value=mission.energy;
      get('data').textContent=mission.photos.reduce((sum,p)=>sum+p.remaining,0);
      get('sun').textContent=phases[mission.phase].sun?'Con luz solar':'Satélite en sombra (simulada)';
      root.classList.toggle('in-shadow',!phases[mission.phase].sun);
      get('status').textContent=!this.ready?'Preparando mapa…':obstructed?`Imprevisto: ${info.label}`:flight.running?'En vuelo · seguimiento activo':gate?['Listo para salir','Oportunidad de observar','Segunda oportunidad de observar','Contacto con Asunción'][phase]:'Vuelo en pausa';
      const control=action=>root.querySelector(`[data-flight="${action}"]`);
      control('travel').hidden=phase===3||flight.running;control('travel').disabled=!this.ready||this.introOpen||obstructed;
      control('reframe').disabled=!this.ready||visibility.status!=='blocked'||mission.energy<REFRAME_ENERGY;
      control('reframe').textContent=visibility.status==='adjusting'?info.working:`${info.action} · −${REFRAME_ENERGY} energía`;
      control('travel').querySelector('.console-label').textContent=!gate?'Reanudar viaje':['Rumbo al Chaco','Siguiente pasada','Regreso a Asunción'][phase];
      control('pause').hidden=!flight.running;control('pause').disabled=!flight.running;
      control('capture').disabled=!this.ready||!gate||![1,2].includes(phase)||mission.captured.includes(phase)||mission.energy<specs.cameraPower;
      control('capture').hidden=!gate||![1,2].includes(phase)||mission.captured.includes(phase);
      control('capture').querySelector('.console-label').textContent=`Tomar foto · −${specs.cameraPower}`;
      const actionAvailable = this.ready && !this.introOpen && gate && [1, 2].includes(phase) && !mission.captured.includes(phase) && !obstructed;
      const actionMenu = root.querySelector('.flight-action-menu');
      actionMenu.hidden = !actionAvailable;
      root.classList.toggle('action-menu-open', actionAvailable);
      root.querySelector('.map-satellite')?.classList.toggle('action-ready', actionAvailable);
      if (actionAvailable) {
        get('action-title').textContent = phase === 1 ? 'Primera vista del Chaco' : 'Segunda vista del Chaco';
        get('action-prompt').textContent = phase === 1
          ? 'El bosque entra en el visor. ¿Tomamos la primera imagen?'
          : 'El satélite vuelve a cruzar la zona. ¿Hacemos otra captura?';
        get('action-capture-detail').textContent = phase === 1 ? 'Guardar esta vista del bosque' : 'Registrar una segunda vista';
        get('action-cost').textContent = `−${specs.cameraPower} energía`;
        const captureChoice = actionMenu.querySelector('[data-flight-choice="capture"]');
        const travelChoice = actionMenu.querySelector('[data-flight-choice="travel"]');
        captureChoice.disabled = control('capture').disabled;
        captureChoice.classList.toggle('primary', !captureChoice.disabled);
        travelChoice.classList.toggle('primary', captureChoice.disabled);
        this.positionActionMenu();
      }
      control('transmit').disabled=!this.ready||!gate||phase!==3||mission.sent||!mission.photos.length||mission.energy<specs.antennaPower;
      control('transmit').hidden=phase!==3||mission.sent;
      control('transmit').querySelector('.console-label').textContent=`Enviar fotos · −${specs.antennaPower}`;
      control('finish').hidden=phase!==3;control('finish').querySelector('.console-label').textContent=mission.sent?'Ver resultados':'Revisar resultados';
      const command=obstructed?'reframe':flight.running?'pause':phase===3?(control('transmit').disabled?'finish':'transmit'):!control('capture').hidden&&!control('capture').disabled?'capture':'travel';
      const titles={travel:'Ruta',capture:'Cámara',transmit:'Antena',finish:'Misión',reframe:'Ajuste',pause:'En vuelo'};
      root.dataset.command=command;
      get('command-title').textContent=!this.ready?'Preparando sistema':titles[command];
      root.querySelectorAll('.console-action').forEach(button=>button.classList.toggle('is-cued',button.dataset.flight===command&&!button.disabled));
      control('speed').textContent=`Velocidad ×${flight.speed}`;
      root.querySelectorAll('.chaco-timeline li').forEach((item,i)=>{item.classList.toggle('active',i===phase);item.classList.toggle('done',i<phase);});
    },
    positionActionMenu(){
      const menu = root.querySelector('.flight-action-menu');
      if (menu.hidden || window.innerWidth <= 800) return;
      const satellite = root.querySelector('.map-satellite');
      if (!satellite) return;
      const marker = satellite.getBoundingClientRect();
      const bounds = root.getBoundingClientRect();
      const gap = 20;
      const right = marker.right - bounds.left + gap;
      const left = right + menu.offsetWidth <= bounds.width - gap
        ? right
        : marker.left - bounds.left - menu.offsetWidth - gap;
      const top = Math.max(75, Math.min(marker.top - bounds.top - 25, bounds.height - menu.offsetHeight - 175));
      menu.style.left = `${Math.max(gap, left)}px`;
      menu.style.top = `${top}px`;
    },
    destroy(){noahStop();root.querySelector('video').pause();root.remove();}
  };
}
