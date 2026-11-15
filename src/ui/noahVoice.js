// NOAH's voice. Every screen speaks through noahSpeak(), so the voice is the same everywhere.
//
// 1) Pre-recorded line (neural voice generated with scripts/generate-noah-voice.mjs):
//    public/assets/voice/<key>.mp3, played with a light "ship AI" effect (Web Audio).
// 2) Otherwise, the browser's speech synthesis with the best female Spanish voice installed.
//    So a line without a recording (new or changed text) still works, just with the plain voice.
import { speechText, voiceKey } from '../game/noah-lines.js';

const BASE = import.meta.env.BASE_URL;

// ---------- Pre-recorded lines ----------

// Keys of the lines that have an MP3. Loaded once; empty if there is no manifest yet.
let recorded = new Set();
fetch(`${BASE}assets/voice/manifest.json`)
  .then((response) => (response.ok ? response.json() : { lines: {} }))
  .then((manifest) => (recorded = new Set(Object.keys(manifest.lines ?? {}))))
  .catch(() => {});

let audio = null; // { ctx, input } created on first use (browsers need a click before playing sound)
let current = null; // the clip playing now
const buffers = new Map(); // decoded clips, so a repeated line plays instantly

// "Ship AI" effect: a bit more presence, a short metallic echo and a small room reverb.
function createAudio() {
  const ctx = new AudioContext();
  const input = ctx.createGain();

  const highpass = new BiquadFilterNode(ctx, { type: 'highpass', frequency: 120 });
  const presence = new BiquadFilterNode(ctx, { type: 'peaking', frequency: 3200, Q: 1, gain: 3 });
  input.connect(highpass).connect(presence);

  const out = ctx.createDynamicsCompressor();
  out.connect(ctx.destination);
  presence.connect(out); // dry voice

  // Metallic sheen: a very short echo that feeds back on itself (a "comb filter").
  const comb = new DelayNode(ctx, { delayTime: 0.011 });
  const feedback = new GainNode(ctx, { gain: 0.3 });
  presence.connect(comb).connect(feedback).connect(comb);
  comb.connect(new GainNode(ctx, { gain: 0.14 })).connect(out);

  // Small reverb: the voice "inside the ship". The echo shape is generated (decaying noise).
  const seconds = 0.7;
  const impulse = ctx.createBuffer(2, ctx.sampleRate * seconds, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3;
  }
  const reverb = new ConvolverNode(ctx, { buffer: impulse });
  presence.connect(reverb).connect(new GainNode(ctx, { gain: 0.18 })).connect(out);

  return { ctx, input };
}

async function playClip(key) {
  audio ??= createAudio();
  if (audio.ctx.state === 'suspended') await audio.ctx.resume();
  let buffer = buffers.get(key);
  if (!buffer) {
    const response = await fetch(`${BASE}assets/voice/${key}.mp3`);
    buffer = await audio.ctx.decodeAudioData(await response.arrayBuffer());
    buffers.set(key, buffer);
  }
  stopClip();
  current = new AudioBufferSourceNode(audio.ctx, { buffer });
  current.connect(audio.input);
  current.start();
}

function stopClip() {
  try {
    current?.stop();
  } catch {
    // already finished
  }
  current = null;
}

// ---------- Browser voice (fallback) ----------
// Each system ships different voices, so instead of a fixed name we score the installed ones:
// natural/neural and "enhanced" voices first, known female voices, then Spanish variants that use
// "vos" like the game (Paraguay first). Novelty and male voices are left out.

const SETTINGS = { rate: 0.98, pitch: 1.0 }; // a touch slower than default: clearer, more confident

const FEMALE_NAMES = [
  'paulina', 'mónica', 'monica', 'marisol', 'angélica', 'angelica', 'isabela', 'soledad', 'francisca',
  'sabina', 'helena', 'laura', 'elena', 'tania', 'dalia', 'paloma', 'elvira', 'valentina', 'ximena',
  'lucía', 'lucia', 'camila', 'catalina', 'google español',
];
const SKIP_NAMES = [
  // male voices
  'jorge', 'diego', 'juan', 'carlos', 'pablo', 'raúl', 'raul', 'álvaro', 'alvaro', 'enrique', 'jaime',
  'alonso', 'mario', 'tomas', 'tomás', 'gonzalo', 'jose', 'josé', 'alejandro',
  // macOS novelty voices
  'eddy', 'flo', 'grandma', 'grandpa', 'reed', 'rocko', 'sandy', 'shelley',
];

function score(voice) {
  const name = voice.name.toLowerCase();
  const lang = voice.lang.toLowerCase();
  if (!lang.startsWith('es') || SKIP_NAMES.some((n) => name.includes(n))) return -1;
  let points = 0;
  if (name.includes('natural') || name.includes('neural')) points += 100; // e.g. Edge "Online (Natural)" voices
  if (name.includes('premium') || name.includes('enhanced') || name.includes('mejorada')) points += 60;
  if (FEMALE_NAMES.some((n) => name.includes(n))) points += 40;
  if (/es[-_]py/.test(lang)) points += 35; // Paraguay first: the team and the mission are from there
  else if (/es[-_](ar|uy)/.test(lang)) points += 30; // same "vos" as the game's Spanish
  else if (/es[-_](419|mx|us)/.test(lang)) points += 20;
  else if (/es[-_]es/.test(lang)) points += 10;
  if (voice.localService === false) points += 5; // cloud voices tend to sound better
  return points;
}

let chosen; // cached choice; reset when the browser finishes loading its voice list
function pickVoice() {
  if (chosen !== undefined) return chosen;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null; // not loaded yet: try again next time
  chosen = voices.map((v) => ({ v, s: score(v) })).filter((x) => x.s >= 0).sort((a, b) => b.s - a.s)[0]?.v ?? null;
  console.info(`[NOAH] voz del navegador: ${chosen ? `${chosen.name} (${chosen.lang})` : 'por defecto'}`);
  return chosen;
}
if ('speechSynthesis' in window) {
  window.speechSynthesis.addEventListener?.('voiceschanged', () => (chosen = undefined));
}

function speakWithBrowser(text) {
  if (!('speechSynthesis' in window)) return;
  const line = new SpeechSynthesisUtterance(text);
  const voice = pickVoice();
  if (voice) line.voice = voice;
  line.lang = voice?.lang ?? 'es-ES';
  line.rate = SETTINGS.rate;
  line.pitch = SETTINGS.pitch;
  window.speechSynthesis.speak(line);
}

// ---------- Public API ----------

// In development, every line NOAH says is collected here, so scripts can list what needs recording.
if (import.meta.env.DEV) window.__noahLines = new Set();

// Says the text with NOAH's voice (stops whatever she was saying before).
// The "NOAH // TITLE" first line used on some screens is a label, so it isn't read.
export function noahSpeak(text) {
  noahStop();
  if (import.meta.env.DEV) window.__noahLines.add(speechText(text));
  const key = voiceKey(text);
  if (recorded.has(key)) {
    playClip(key).catch(() => speakWithBrowser(speechText(text))); // file missing/broken: plain voice
  } else {
    speakWithBrowser(speechText(text));
  }
}

// Stops NOAH (recorded clip or browser voice). Use it instead of speechSynthesis.cancel().
export function noahStop() {
  stopClip();
  window.speechSynthesis?.cancel();
}

// Speaks only if the player has NOAH's voice turned on (force: speak anyway).
export function speakIfEnabled(scene, text, { force = false } = {}) {
  if (force || scene.registry.get('noahVoice')) noahSpeak(text);
}
