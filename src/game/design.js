import catalog from './parts.json';
import { initialDesign, kinds } from './model.js';

const key = 'astria-design-v1';
export { catalog };
export function normalizeDesign(value) {
  return Object.fromEntries(kinds.map(kind => [kind,
    catalog[kind].options.some(part => part.id === value?.[kind]) ? value[kind] : initialDesign[kind]
  ]));
}
export function readDesign(value) {
  if (value) return normalizeDesign(value);
  try { return normalizeDesign(JSON.parse(localStorage.getItem(key))); }
  catch { return { ...initialDesign }; }
}
export function saveDesign(value) {
  try { localStorage.setItem(key, JSON.stringify(normalizeDesign(value))); }
  catch { /* La persistencia es opcional. */ }
}
