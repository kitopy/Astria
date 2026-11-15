import Phaser from 'phaser';
import { advance, capture, launch, stats, transmit } from '../game/model.js';
import { catalog, readDesign } from '../game/design.js';
import { atGate, changeSpeed, initialFlight, pauseFlight, startFlight } from '../game/chaco-flight.js';

const AUTO_FLY_MS = 1200; // pause before the satellite moves on by itself (time to see what happened)
import { beginReframe, cloudCover, drawObstacle, initialVisibility, obstacleInfo, tickVisibility } from '../game/chaco-visibility.js';
import { preloadArt } from '../ui/mission-ui.js';
import { canCapture, createChacoHUD, satellitePreview } from '../ui/chaco-hud.js';
import { ChacoMap } from '../ui/chaco-map.js';
import { SatelliteSensor } from '../ui/satellite-sensor.js';
import { centerDesignArea } from '../ui/layout.js';

// Dev picker (?dev=1): each scenario starts a little before its stop, so the arrival plays like in the
// normal game (the satellite flies in, the map follows it, the stop's menu or dialog opens).
const DEBUG_SCENARIOS = {
  'first-observation': { gate: 0, progress: .17, phase: 0, captured: [], photoPhases: [], energy: 'full' },
  'second-observation': { gate: 1, progress: .65, phase: 1, captured: [1], photoPhases: [1], energy: 'full' },
  'return-low-battery': { gate: 2, progress: .75, phase: 2, captured: [1], photoPhases: [1], energy: 0 },
  transmission: { gate: 2, progress: .92, phase: 2, captured: [1, 2], photoPhases: [1, 2], energy: 'full' },
};

export class TestScene extends Phaser.Scene {
  constructor() { super('Test'); }
  init(data = {}) {
    this.design = readDesign(data.design ?? this.registry.get('satelliteDesign'));
    this.specs = stats(catalog, this.design);
    this.mission = this.specs.valid ? launch(this.specs) : null;
    this.debugScenario = Object.hasOwn(DEBUG_SCENARIOS, data.debugScenario) ? data.debugScenario : null;
    this.flight = changeSpeed(initialFlight()); // always ×2
    this.mapClock = 0; this.autoFlyIn = null; this.sensorShots=[];
    let storage;
    try { storage = window.localStorage; } catch { /* Use the registry if storage is unavailable. */ }
    const kind = this.mission && !this.debugScenario ? drawObstacle(storage, this.registry.get('lastObstacle')) : 'clouds';
    if (this.mission && !this.debugScenario) this.registry.set('lastObstacle', kind);
    this.visibility = initialVisibility(kind);
    if (this.debugScenario && this.mission) {
      const scenario = DEBUG_SCENARIOS[this.debugScenario];
      this.flight = { progress: scenario.progress, gate: scenario.gate, running: false, speed: 2 };
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
    this.hud.say('Vamos a ver el bosque del Chaco en 1985 y hoy.');
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
    if (action === 'reframe' && this.hud.ready) {
      try {
        const next = beginReframe(this.mission, this.visibility);
        this.mission = next.mission; this.visibility = next.visibility;
        this.hud.say(obstacleInfo(this.visibility).explanation);
      } catch (error) { this.hud.say(error.message); }
    } else if (action === 'workshop') { this.scene.start('Build', { design: this.design }); return; }
    else if (action === 'finish' && this.flight.gate === 3) { this.scene.start('Reward', { design: this.design, mission: this.mission, captures:this.sensorShots, caseStudy: 'chaco-paraguay' }); return; }
    else if (['capture', 'transmit'].includes(action)) {
      if (!atGate(this.flight)) return;
      try {
        this.updateSensor();
        const shot=action==='capture'?this.sensor.capture(this.mission.phase):null;
        this.mission = action === 'capture' ? capture(this.mission, this.specs) : transmit(this.mission, this.specs);
        if(shot){this.sensorShots.push(shot);this.hud.showPhoto(shot,this.sensorShots);}
        this.sensorShots.forEach((photo,i)=>{photo.delivered=i<this.mission.delivered;});
        this.hud.showShots(this.sensorShots);
        if(shot){const panel=this.hud.root.querySelector('.sensor-window');panel.classList.remove('taking-photo');void panel.offsetWidth;panel.classList.add('taking-photo');}
        this.missionMap.effect(action, this.flight);
        this.hud.say(action === 'capture'
          ? '¡Foto guardada!'
          : this.mission.photos.length
            ? `Llegaron ${this.mission.delivered} de 2 fotos. La antena no alcanzó para enviar todo.`
            : '¡Llegaron las dos fotos!');
      } catch (error) { this.hud.say(error.message); }
    }
    this.render();
  }
  render() { this.hud?.update(this.mission, this.specs, this.flight, this.visibility); }
  // The satellite moves on by itself whenever there is nothing to do where it stopped:
  // at the start, after the photo (or when there is no battery for it), and after a surprise is fixed.
  // It only waits for the player over the forest (photo menu) and in Asunción (send, results).
  autoFly(delta) {
    const waiting = !this.flight.running && this.hud.ready && !this.hud.introOpen
      && this.visibility.status !== 'blocked' && this.visibility.status !== 'adjusting'
      && this.flight.gate < 3 && !canCapture(this.mission, this.specs, this.flight);
    if (!waiting || document.hidden) { this.autoFlyIn = null; return; }
    this.autoFlyIn = (this.autoFlyIn ?? AUTO_FLY_MS) - delta;
    if (this.autoFlyIn > 0) return;
    this.autoFlyIn = null;
    this.flight = startFlight(this.flight);
    this.render();
  }
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
    const next = tickVisibility(this.flight, this.visibility, document.hidden ? 0 : seconds);
    this.flight = next.flight; this.visibility = next.visibility;
    if (!document.hidden) this.sensorTime += delta;
    this.autoFly(delta);
    if (previousVisibility !== this.visibility.status) {
      this.updateSensor();
      this.hud.say(this.visibility.status === 'blocked'
        ? `${obstacleInfo(this.visibility).title} ${obstacleInfo(this.visibility).short}` // same words as the warning dialog
        : obstacleInfo(this.visibility).resolved);
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
            ? 'Segunda pasada, en la sombra: la cámara usa la batería.'
            : 'No queda batería para otra foto. Volvemos a Asunción.'
          : this.mission.energy >= this.specs.antennaPower
            ? 'Llegamos a Asunción. ¡Enviá tus fotos!'
            : 'Llegamos a Asunción, pero no queda energía para enviar.';
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
