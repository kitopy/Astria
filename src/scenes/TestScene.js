import Phaser from 'phaser';
import { advance, capture, launch, stats, transmit } from '../game/model.js';
import { catalog, readDesign } from '../game/design.js';
import { atGate, changeSpeed, initialFlight, pauseFlight, startFlight } from '../game/chaco-flight.js';
import { beginReframe, cloudCover, drawObstacle, initialVisibility, obstacleInfo, REFRAME_ENERGY, tickVisibility } from '../game/chaco-visibility.js';
import { preloadArt } from '../ui/mission-ui.js';
import { createChacoHUD, satellitePreview } from '../ui/chaco-hud.js';
import { ChacoMap } from '../ui/chaco-map.js';
import { SatelliteSensor } from '../ui/satellite-sensor.js';
import { centerDesignArea } from '../ui/layout.js';

const DEBUG_SCENARIOS = {
  'first-observation': { gate: 1, progress: .25, phase: 1, captured: [], photoPhases: [], energy: 'full' },
  'second-observation': { gate: 2, progress: .75, phase: 2, captured: [1], photoPhases: [1], energy: 'full' },
  'return-low-battery': { gate: 2, progress: .75, phase: 2, captured: [1], photoPhases: [1], energy: 0 },
  transmission: { gate: 3, progress: 1, phase: 3, captured: [1, 2], photoPhases: [1, 2], energy: 'full' },
};

export class TestScene extends Phaser.Scene {
  constructor() { super('Test'); }
  init(data = {}) {
    this.design = readDesign(data.design ?? this.registry.get('satelliteDesign'));
    this.specs = stats(catalog, this.design);
    this.mission = this.specs.valid ? launch(this.specs) : null;
    this.debugScenario = Object.hasOwn(DEBUG_SCENARIOS, data.debugScenario) ? data.debugScenario : null;
    this.flight = initialFlight(); this.mapClock = 0; this.sensorShots=[];
    let storage;
    try { storage = window.localStorage; } catch { /* Use the registry if storage is unavailable. */ }
    const kind = this.mission && !this.debugScenario ? drawObstacle(storage, this.registry.get('lastObstacle')) : 'clouds';
    if (this.mission && !this.debugScenario) this.registry.set('lastObstacle', kind);
    this.visibility = initialVisibility(kind);
    if (this.debugScenario && this.mission) {
      const scenario = DEBUG_SCENARIOS[this.debugScenario];
      this.flight = { progress: scenario.progress, gate: scenario.gate, running: false, speed: 1 };
      const photos = scenario.photoPhases.map(phase => ({ phase, quality: this.specs.quality, remaining: this.specs.data }));
      this.mission = {
        ...this.mission,
        phase: scenario.phase,
        energy: scenario.energy === 'full' ? this.specs.capacity : scenario.energy,
        photos,
        captured: [...scenario.captured],
      };
      this.visibility = { ...this.visibility, status: 'clear' };
    }
    this.sensorTime = 0;
  }
  preload() { preloadArt(this); }
  create() {
    centerDesignArea(this);
    if (!this.mission) { this.scene.start('Build', { design: this.design }); return; }
    this.hud = createChacoHUD(this, this.design, action => this.handleAction(action));
    this.sensor=new SatelliteSensor(this.hud.sensorCanvas,this.design,()=>{if(this.hud){this.hud.ready=!!this.missionMap?.ready;this.render();}},message=>this.hud?.say(message));
    this.hud.say('Vamos a explorar el Chaco con imágenes de archivo de 1985 y 2025. El viaje recrea dos observaciones: cuidá la energía y enviá las dos fotos.');
    this.missionMap = new ChacoMap(this.hud.mapElement,
      () => { this.hud.ready = this.sensor.ready; this.render(); this.missionMap.update(this.flight); },
      () => { this.hud.say('No se pudo preparar una parte del mapa. Podés volver al taller o recargar la página.'); },
      satellitePreview(this.design));
    const visibility = () => { if (document.hidden) { this.flight = pauseFlight(this.flight); this.render(); } };
    document.addEventListener('visibilitychange', visibility);
    this.events.once('shutdown', () => {
      document.removeEventListener('visibilitychange', visibility);
      this.missionMap.destroy(); this.sensor.destroy();this.hud.destroy(); this.hud = null;
    });
    this.render();
  }
  handleAction(action) {
    if (action === 'intro-closed') { this.render(); return; }
    if (action === 'travel' && this.hud.ready && !['blocked','adjusting'].includes(this.visibility.status)) {
      const gate = this.flight.gate;
      this.flight = startFlight(this.flight);
      this.hud.say(gate === 0 ? '¡En marcha! Seguí tu satélite hasta el bosque del Chaco paraguayo.' : 'Seguimos el recorrido. Las observaciones se obtienen en pasos separados, con el tiempo acelerado para este juego.');
    } else if (action === 'reframe' && this.hud.ready) {
      try {
        const next = beginReframe(this.mission, this.visibility);
        this.mission = next.mission; this.visibility = next.visibility;
        this.hud.say(`${obstacleInfo(this.visibility).explanation} El ajuste usa ${REFRAME_ENERGY} de energía.`);
      } catch (error) { this.hud.say(error.message); }
    } else if (action === 'pause') {
      this.flight = pauseFlight(this.flight); this.hud.say('Vuelo en pausa. Podés revisar la batería y los datos con calma. Reanudá cuando quieras.');
    } else if (action === 'speed') this.flight = changeSpeed(this.flight);
    else if (action === 'recenter') this.missionMap.recenter();
    else if (action === 'case') { this.flight = pauseFlight(this.flight); this.hud.showCase(); }
    else if (action === 'close-case') this.hud.closeCase();
    else if (action === 'workshop') { this.scene.start('Build', { design: this.design }); return; }
    else if (action === 'finish' && this.flight.gate === 3) { this.scene.start('Reward', { design: this.design, mission: this.mission, captures:this.sensorShots, caseStudy: 'chaco-paraguay' }); return; }
    else if (['capture', 'transmit'].includes(action)) {
      if (!atGate(this.flight)) return;
      try {
        this.updateSensor();
        const shot=action==='capture'?this.sensor.capture(this.mission.phase):null;
        this.mission = action === 'capture' ? capture(this.mission, this.specs) : transmit(this.mission, this.specs);
        if(shot)this.sensorShots.push(shot);
        this.sensorShots.forEach((photo,i)=>{photo.delivered=i<this.mission.delivered;});
        this.hud.showShots(this.sensorShots);
        if(shot){const panel=this.hud.root.querySelector('.sensor-window');panel.classList.remove('taking-photo');void panel.offsetWidth;panel.classList.add('taking-photo');}
        this.missionMap.effect(action, this.flight);
        this.hud.say(action === 'capture'
          ? `¡Imagen obtenida! La cámara usó ${this.specs.cameraPower} de energía y generó ${this.specs.data} ${this.specs.data === 1 ? 'bloque' : 'bloques'} de datos. Ahora necesitamos llevar esa información a la Tierra.`
          : `En Asunción recibimos ${this.mission.delivered} imágenes completas. ${this.mission.photos.length ? 'Quedaron datos a bordo. Una antena de mayor capacidad puede ayudar en otro intento.' : '¡Lograste entregar tus observaciones!'}`);
      } catch (error) { this.hud.say(error.message); }
    }
    this.render();
  }
  render() { this.hud?.update(this.mission, this.specs, this.flight, this.visibility); }
  updateSensor() {
    this.sensor.update(this.flight.progress, {
      clouds: cloudCover(this.flight, this.visibility),
      adjustment: this.visibility.kind === 'clouds' ? this.visibility.adjustment : 0, time: this.sensorTime
    });
    if (this.sensor.frame) this.hud.setSensorYear(this.sensor.frame.year);
  }
  update(_time, delta) {
    if (!this.hud || !this.hud.ready) return;
    const before = this.flight.gate;
    const previousVisibility = this.visibility.status;
    const seconds = Math.min(delta / 1000, .08);
    const next = tickVisibility(this.flight, this.visibility, document.hidden || this.hud.caseOpen ? 0 : seconds);
    this.flight = next.flight; this.visibility = next.visibility;
    if (!document.hidden && !this.hud.caseOpen) this.sensorTime += delta;
    if (previousVisibility !== this.visibility.status) {
      this.updateSensor();
      this.hud.say(this.visibility.status === 'blocked'
        ? `${obstacleInfo(this.visibility).title} ${obstacleInfo(this.visibility).short}` // same words as the warning dialog
        : `${obstacleInfo(this.visibility).resolved} El ajuste consumió ${REFRAME_ENERGY} de energía. Cuidá la reserva que queda.`);
      this.render();
    }
    if (this.flight.gate !== before) {
      this.mission = advance(this.mission, this.specs);
      this.updateSensor();
      const phase = this.flight.gate;
      const message = phase === 1
        ? 'Llegamos al bosque del Chaco.' // the action menu next to the satellite shows what to do
        : phase === 2
          ? this.mission.energy >= this.specs.cameraPower
            ? 'Segunda pasada. En este paso ilustramos al satélite en sombra: no hay recarga solar. La cámara funciona con la batería.'
            : 'Llegamos a la segunda pasada, pero la batería no alcanza para esta cámara. Podés continuar hasta la estación y revisar el diseño al terminar.'
          : this.mission.energy >= this.specs.antennaPower
            ? 'Estamos en la ventana de comunicación con nuestra estación ficticia de Asunción. Transmití las imágenes antes de ver los resultados.'
            : 'Llegamos al contacto terrestre, pero falta energía para la antena. Los resultados te ayudarán a mejorar el diseño.';
      this.hud.say(message); this.render();
    }
    this.mapClock += delta;
    if (this.mapClock >= 45) {
      this.mapClock = 0;
      this.missionMap.update(this.flight);
      this.hud.positionActionMenu();
      this.updateSensor();
      this.hud.updateWeather(this.flight, this.visibility);
    }
  }
}
