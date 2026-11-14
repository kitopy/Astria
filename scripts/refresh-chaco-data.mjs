// Reproduce los recursos locales desde las URL registradas. Requiere conexión.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('../public/data/', import.meta.url);
const meta = JSON.parse(await readFile(new URL('sources.json', root), 'utf8'));
async function fetchBytes(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No se pudo descargar ${url}: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}
const countries = JSON.parse((await fetchBytes(meta.boundaries.url)).toString());
const keep = new Set(['PRY','BOL','BRA','ARG','URY','CHL']);
const region = { type: 'FeatureCollection', features: countries.features
  .filter(feature => keep.has(feature.properties.ADM0_A3))
  .map(feature => ({ type:'Feature', properties:{code:feature.properties.ADM0_A3,name:feature.properties.NAME_ES||feature.properties.NAME},geometry:feature.geometry })) };
if (!region.features.some(feature=>feature.properties.code==='PRY')) throw new Error('El recurso no contiene Paraguay.');
const raster = await fetchBytes(meta.raster.url);
if (raster[0]!==255 || raster[1]!==216) throw new Error('NASA GIBS no devolvió un JPEG válido.');
const video = await fetchBytes(meta.caseStudy.asset);
if (video.toString('ascii',4,8)!=='ftyp') throw new Error('NASA SVS no devolvió un MP4 válido.');
const files = [['paraguay-region.geojson',Buffer.from(JSON.stringify(region)),meta.boundaries],['paraguay-bluemarble.jpg',raster,meta.raster],['chaco-landsat-nasa.mp4',video,meta.caseStudy]];
for (const [file,bytes,source] of files) {
  await writeFile(new URL(file,root),bytes);
  source.sha256=createHash('sha256').update(bytes).digest('hex');
}
meta.retrievedAt=new Date().toISOString();
await writeFile(new URL('sources.json',root),JSON.stringify(meta,null,2));
console.log('Recursos del Chaco actualizados. Revisar diferencias, atribuciones y npm test antes de guardarlos.');
