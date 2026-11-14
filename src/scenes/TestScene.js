import Phaser from 'phaser';
import { advance, capture, launch, stats, transmit } from '../game/model.js';
import { catalog, readDesign } from '../game/design.js';
import { atGate, changeSpeed, initialFlight, pauseFlight, startFlight } from '../game/chaco-flight.js';
import { beginReframe, cloudCover, initialVisibility, tickVisibility } from '../game/chaco-visibility.js';
import { preloadArt } from '../ui/mission-ui.js';
import { createChacoHUD, satellitePreview } from '../ui/chaco-hud.js';
import { ChacoMap } from '../ui/chaco-map.js';
import { SatelliteSensor } from '../ui/satellite-sensor.js';
import { centerDesignArea } from '../ui/layout.js';

export class TestScene extends Phaser.Scene {
  constructor() { super('Test'); }
  init(data = {}) {
    this.design = readDesign(data.design ?? this.registry.get('satelliteDesign'));
    this.specs = stats(catalog, this.design);
    this.mission = this.specs.valid ? launch(this.specs) : null;
    this.flight = initialFlight(); this.mapClock = 0; this.sensorShots=[];this.sensorFootprintGate=-1;
    this.visibility = initialVisibility();
    this.sensorTime = 0;
  }
  preload() { preloadArt(this); }
  create() {
    centerDesignArea(this);
    if (!this.mission) { this.scene.start('Build', { design: this.design }); return; }
    this.hud = createChacoHUD(this, this.design, action => this.handleAction(action));
    this.sensor=new SatelliteSensor(this.hud.sensorCanvas,this.design,()=>{if(this.hud){this.hud.ready=!!this.missionMap?.ready;this.render();}});
    this.hud.say('Estamos en Paraguay. Prepará tu misión para observar dos veces una zona del Chaco. Al llegar al bosque, el vuelo se pausará para que puedas decidir.');
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
    if (action === 'travel' && this.hud.ready && !['blocked','adjusting'].includes(this.visibility.status)) {
      const gate = this.flight.gate;
      this.flight = startFlight(this.flight);
      this.hud.say(gate === 0 ? '¡En marcha! Seguí tu satélite hasta el bosque del Chaco paraguayo.' : 'Seguimos el recorrido. Las observaciones se obtienen en pasos separados, con el tiempo acelerado para este juego.');
    } else if (action === 'reframe' && this.hud.ready) {
      try {
        const next = beginReframe(this.mission, this.visibility);
        this.mission = next.mission; this.visibility = next.visibility;
        this.hud.say('Ajustando la cámara hacia un claro. Usamos 6 de energía para mover y estabilizar el encuadre.');
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
      adjustment: this.visibility.adjustment, time: this.sensorTime
    });
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
      this.missionMap.setFootprint(this.sensor.footprint);
      this.hud.say(this.visibility.status === 'blocked'
        ? '¡Nubes en la zona! Pausamos el recorrido. Buscá un claro: ajustar la cámara cuesta 6 de energía. Las nubes tapan el terreno, no golpean al satélite.'
        : '¡Visibilidad recuperada! El nuevo encuadre está listo. Te quedan menos reservas: cuidalas para las fotos y la transmisión. Podés continuar el recorrido.');
      this.render();
    }
    if (this.flight.gate !== before) {
      this.mission = advance(this.mission, this.specs);
      this.updateSensor();
      this.missionMap.setFootprint(this.sensor.footprint);
      const phase = this.flight.gate;
      const message = phase === 1
        ? 'Llegamos al bosque del Chaco. El recorrido se detuvo: activá Observar para obtener la primera imagen.'
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
      this.updateSensor();
      this.hud.updateWeather(this.flight, this.visibility);
      if (this.flight.running || this.visibility.status === 'adjusting' || this.sensorFootprintGate !== this.flight.gate) {
        this.sensorFootprintGate = this.flight.gate;
        this.missionMap.setFootprint(this.sensor.footprint);
      }
    }
  }
}
