export interface Part {
  id: string; name: string; benefit: string; tradeoff: string; cost: number; mass: number;
  power?: number; quality?: number; data?: number; generation?: number; capacity?: number; rate?: number;
}
export type Kind = 'camera' | 'solar' | 'battery' | 'antenna';
export type Catalog = Record<Kind, { label: string; options: Part[] }>;
export type Design = Record<Kind, string>;
export const initialDesign: Design = { camera: 'simple', solar: 'small', battery: 'light', antenna: 'basic' };
export const kinds: Kind[] = ['camera', 'solar', 'battery', 'antenna'];
export const limits = { budget: 100, mass: 12 };
export const phases = [
  { title: 'Despegue y recarga', label: 'Con luz solar', sun: true, task: 'Tu satélite está en órbita y la batería está cargada. Avanzá hacia el bosque.' },
  { title: 'Primera observación', label: 'Sobre el bosque · con luz', sun: true, task: 'Tomá una imagen de referencia. Cada foto consume energía y ocupa datos.' },
  { title: 'Segunda observación', label: 'Paso posterior · satélite en sombra', sun: false, task: 'En esta escena simplificada, el satélite está en sombra y observa una zona iluminada. Usá la batería para obtener la segunda imagen.' },
  { title: 'Contacto con la Tierra', label: 'Ventana de comunicación · con luz', sun: true, task: 'Transmití las imágenes. Tenés una oportunidad de envío antes de cerrar la misión.' }
];
export function selected(catalog: Catalog, design: Design): Record<Kind, Part> {
  return Object.fromEntries(kinds.map(k => [k, catalog[k].options.find(p => p.id === design[k]) ?? catalog[k].options[0]])) as Record<Kind, Part>;
}
export function stats(catalog: Catalog, design: Design) {
  const p = selected(catalog, design);
  const cost = 10 + kinds.reduce((n, k) => n + p[k].cost, 0);
  const mass = 2 + kinds.reduce((n, k) => n + p[k].mass, 0);
  return { cost, mass, valid: cost <= limits.budget && mass <= limits.mass,
    capacity: p.battery.capacity!, generation: p.solar.generation!, cameraPower: p.camera.power!,
    antennaPower: p.antenna.power!, rate: p.antenna.rate!, data: p.camera.data!, quality: p.camera.quality! };
}
export type Specs = ReturnType<typeof stats>;
export interface Photo { phase: number; quality: number; remaining: number; }
export interface Mission { phase: number; energy: number; photos: Photo[]; delivered: number; detail: number; captured: number[]; sent: boolean; log: string[]; }
export function launch(s: Specs): Mission {
  if (!s.valid) throw new Error('El diseño supera los límites de lanzamiento.');
  return { phase: 0, energy: s.capacity, photos: [], delivered: 0, detail: 0, captured: [], sent: false, log: ['Lanzamiento completo. Batería cargada.'] };
}
export function capture(m: Mission, s: Specs): Mission {
  if (![1, 2].includes(m.phase) || m.captured.includes(m.phase)) throw new Error('Esta observación ya terminó o todavía no está disponible.');
  if (m.energy < s.cameraPower) throw new Error('Falta energía para la cámara. Podés avanzar y revisar tu diseño al terminar.');
  return { ...m, energy: m.energy - s.cameraPower,
    photos: [...m.photos, { phase: m.phase, quality: s.quality, remaining: s.data }], captured: [...m.captured, m.phase],
    log: [...m.log, `Observación ${m.phase}: −${s.cameraPower} de energía, +${s.data} bloques de datos.`] };
}
export function advance(m: Mission, s: Specs): Mission {
  if (m.phase >= 3) throw new Error('La misión ya está en la última etapa.');
  const phase = m.phase + 1;
  const gain = phases[phase].sun ? s.generation : 0;
  const energy = Math.min(s.capacity, Math.max(0, m.energy - 4) + gain);
  return { ...m, phase, energy, log: [...m.log, `${phases[phase].title}: consumo base de hasta 4; recarga ${gain}.`] };
}
export function transmit(m: Mission, s: Specs): Mission {
  if (m.phase !== 3 || m.sent) throw new Error('La ventana de transmisión no está disponible.');
  if (!m.photos.length) throw new Error('Todavía no hay imágenes para transmitir. Podés cerrar la misión y volver al taller.');
  if (m.energy < s.antennaPower) throw new Error('Falta energía para transmitir. Cerrá la misión para revisar qué mejorar.');
  let left = s.rate, delivered = m.delivered, detail = m.detail;
  const photos: Photo[] = [];
  for (const photo of m.photos) {
    const amount = Math.min(left, photo.remaining); left -= amount;
    const remaining = photo.remaining - amount;
    if (remaining === 0) { delivered++; detail += photo.quality; }
    else photos.push({ ...photo, remaining });
  }
  return { ...m, energy: m.energy - s.antennaPower, sent: true, delivered, detail, photos,
    log: [...m.log, `Transmisión: ${delivered} imagen(es) completas recibidas en Tierra.`] };
}
export function feedback(m: Mission, s: Specs): string[] {
  const items: string[] = [];
  if (m.captured.length < 2) items.push('Faltó una observación: probá una cámara de menor consumo o una batería con más reserva.');
  if (m.photos.length) items.push('Quedaron datos a bordo: una antena de mayor capacidad o imágenes más livianas pueden ayudar.');
  if (!m.sent) items.push('La misión necesita enviar sus imágenes: reservá energía y usá la ventana de comunicación.');
  if (m.delivered >= 2) items.push('Tu diseño obtuvo y entregó las dos observaciones. Lograste el objetivo de la misión.');
  if (m.delivered >= 2 && s.quality === 1) items.push('Un nuevo desafío: intentá enviar imágenes con más detalle sin superar masa y presupuesto.');
  return items;
}
