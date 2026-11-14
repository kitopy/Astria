import * as maplibregl from 'maplibre-gl';
import workerURL from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ASUNCION, CHACO_TARGET, ROUTE, routePosition } from '../game/chaco-flight.js';

const base = import.meta.env.BASE_URL;
// Vite debe emitir el worker como un recurso local, también en la compilación.
maplibregl.setWorkerUrl(workerURL);
maplibregl.setWorkerCount(1);
const line = coordinates => ({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } });

export class ChacoMap {
  constructor(container, onReady, onError, markerHTML) {
    this.ready = false; this.follow = true; this.markers = []; this.effectUntil = 0;
    const zoomForSize = () => Math.max(3.8, 5.25 + Math.log2(Math.min(1, container.clientHeight / 900, container.clientWidth / 1350)));
    this.baseZoom = zoomForSize();
    this.map = new maplibregl.Map({
      container, center: [-59.2, -23.3], zoom: this.baseZoom, pitch: 18, bearing: -8,
      minZoom: 3.5, maxZoom: 7, maxBounds: [[-75, -35], [-43, -12]],
      attributionControl: false, renderWorldCopies: false,
      style: { version: 8, sources: {
        terrain: { type: 'image', url: `${base}data/paraguay-bluemarble.jpg`, coordinates: [[-75, -12], [-43, -12], [-43, -35], [-75, -35]] },
        countries: { type: 'geojson', data: `${base}data/paraguay-region.geojson` },
        route: { type: 'geojson', data: line(ROUTE) },
        trail: { type: 'geojson', data: line([ASUNCION, ASUNCION]) },
        downlink: { type: 'geojson', data: line([ASUNCION, ASUNCION]) },
        footprint: { type: 'geojson', data: {type:'FeatureCollection',features:[]} }
      }, layers: [
        { id: 'background', type: 'background', paint: { 'background-color': '#142e30' } },
        { id: 'terrain', type: 'raster', source: 'terrain' },
        { id: 'region-fill', type: 'fill', source: 'countries', filter: ['==', ['get', 'code'], 'PRY'], paint: { 'fill-color': '#b9f566', 'fill-opacity': .06 } },
        { id: 'borders', type: 'line', source: 'countries', paint: { 'line-color': '#d7e5dd', 'line-opacity': .3, 'line-width': 1 } },
        { id: 'paraguay', type: 'line', source: 'countries', filter: ['==', ['get', 'code'], 'PRY'], paint: { 'line-color': '#b9f5c1', 'line-width': 2.5 } },
        { id: 'route', type: 'line', source: 'route', layout: { 'line-join': 'round' }, paint: { 'line-color': '#cfb5ff', 'line-width': 2.5, 'line-dasharray': [3, 2], 'line-opacity': .8 } },
        { id: 'trail', type: 'line', source: 'trail', layout: { 'line-join': 'round' }, paint: { 'line-color': '#b9f566', 'line-width': 3.5 } },
        { id: 'downlink', type: 'line', source: 'downlink', paint: { 'line-color': '#b9f566', 'line-width': 4, 'line-dasharray': [1, 2], 'line-opacity': 0 } },
        { id: 'sensor-fill', type:'fill',source:'footprint',paint:{'fill-color':'#f0b0f0','fill-opacity':.12}},
        { id: 'sensor-frame', type:'line',source:'footprint',paint:{'line-color':'#f0b0f0','line-width':2}}
      ] }
    });
    this.onResize = () => { this.baseZoom = zoomForSize(); if (this.follow) this.map.jumpTo({ zoom: this.baseZoom }); };
    window.addEventListener('resize', this.onResize);
    this.map.dragRotate.disable(); this.map.touchZoomRotate.disableRotation();
    this.map.on('dragstart', () => { this.follow = false; });
    this.map.on('error', event => onError?.(event.error?.message ?? 'No se pudo cargar el mapa.'));
    this.map.on('load', () => {
      this.ready = true;
      this.label([-58.0, -24.1], 'PARAGUAY', 'country-label main-country');
      this.label([-63.4, -20.5], 'BOLIVIA', 'country-label');
      this.label([-53.5, -22.1], 'BRASIL', 'country-label');
      this.label([-63, -26.8], 'ARGENTINA', 'country-label');
      this.label([-60.5, -23.9], 'CHACO PARAGUAYO', 'chaco-region-label');
      this.targetElement = this.label(CHACO_TARGET, '<span class="target-rings"></span><b>Bosque del Chaco</b>', 'map-target', true);
      this.stationElement = this.label(ASUNCION, '<span class="station-dot">⌁</span><b>ASUNCIÓN<small>Estación ficticia</small></b>', 'map-station', true);
      this.satelliteElement = document.createElement('div'); this.satelliteElement.className = 'map-satellite';
      this.satelliteElement.innerHTML = `${markerHTML ?? '<span class="satellite-dot">✦</span>'}<i></i>`;
      this.satelliteMarker = new maplibregl.Marker({ element: this.satelliteElement, offset: [0, -38] }).setLngLat(ASUNCION).addTo(this.map);
      this.markers.push(this.satelliteMarker);
      onReady();
    });
  }
  label(coordinates, text, className, html = false) {
    const element = document.createElement('div'); element.className = className;
    if (html) element.innerHTML = text; else element.textContent = text;
    const marker = new maplibregl.Marker({ element }).setLngLat(coordinates).addTo(this.map); this.markers.push(marker);
    return element;
  }
  update(flight) {
    if (!this.ready) return;
    const position = routePosition(flight.progress);
    if (this.lastProgress !== flight.progress) {
      this.lastProgress = flight.progress;
      this.satelliteMarker.setLngLat(position);
      const trail = [ROUTE[0], ...ROUTE.slice(1, Math.floor(flight.progress * (ROUTE.length - 1)) + 1), position];
      this.map.getSource('trail').setData(line(trail));
    }
    this.satelliteElement.classList.toggle('flying', flight.running);
    this.targetElement.classList.toggle('active', !flight.running && [1, 2].includes(flight.gate));
    this.stationElement.classList.toggle('active', flight.gate === 3);
    if (this.follow && flight.running) {
      const zoom=this.baseZoom+Math.min(1,flight.progress*5)*.75;
      this.map.jumpTo({ center: [-59.2 + (position[0] + 59.2) * .65, -23.3 + (position[1] + 23.3) * .65], zoom, bearing: -8 + flight.progress * 7 });
    }
    if (performance.now() > this.effectUntil && this.effectUntil) {
      this.effectUntil = 0; this.satelliteElement.classList.remove('capturing'); this.stationElement.classList.remove('transmitting');
      this.map.setPaintProperty('downlink', 'line-opacity', 0);
    }
  }
  effect(type, flight) {
    if (!this.ready) return;
    this.effectUntil = performance.now() + 1600;
    if (type === 'capture') {
      this.satelliteElement.classList.remove('capturing'); void this.satelliteElement.offsetWidth;
      this.satelliteElement.classList.add('capturing');
    } else {
      this.stationElement.classList.add('transmitting');
      // El enlace se dibuja desde la representación orbital hacia la estación terrestre.
      const point = routePosition(Math.max(0, flight.progress - .08));
      this.map.getSource('downlink').setData(line([point, ASUNCION]));
      this.map.setPaintProperty('downlink', 'line-opacity', 1);
    }
  }
  setFootprint(coordinates){if(this.ready&&coordinates)this.map.getSource('footprint').setData({type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[coordinates]}});}
  recenter() {
    this.follow = true;
    this.map.easeTo({ center: [-59.2, -23.3], zoom: this.baseZoom, pitch: 18, bearing: -8,
      duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 700 });
  }
  destroy() { window.removeEventListener('resize', this.onResize); this.markers.forEach(marker => marker.remove()); this.map.remove(); }
}
