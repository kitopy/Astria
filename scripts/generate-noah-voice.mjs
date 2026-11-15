// Generates NOAH's pre-recorded voice with ElevenLabs.
//
//   npm run voice -- --voices     list the voices of your ElevenLabs account (to pick NOAH_VOICE_ID)
//   npm run voice -- --dry-run    show which lines would be generated and how many characters (credits)
//   npm run voice                 generate the missing MP3s into public/assets/voice/
//   npm run voice -- --prune      also delete the MP3s of lines the game no longer says
//
// Needs a .env.local file (never committed, see .gitignore) with:
//   ELEVENLABS_API_KEY=sk_...
//   NOAH_VOICE_ID=...            (optional: overrides NOAH's default voice below)
//
// Lines come from:
//   - game/noah-lines.js: every workshop line, for every satellite part;
//   - scripts/noah-other-lines.mjs: the other screens (briefing, flight, results, observation, finale);
//   - scripts/noah-harvest.json (optional): extra lines collected while playing in development mode
//     (in the browser console: copy(JSON.stringify([...window.__noahLines])) ).
// Lines that already have an MP3 are skipped, so running it again only spends credits on new lines.

import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { speechText, voiceKey, workshopLines } from '../src/game/noah-lines.js';
import { REFRAME_ENERGY } from '../src/game/chaco-visibility.js';
import { otherLines } from './noah-other-lines.mjs';

const API = 'https://api.elevenlabs.io/v1';
const OUT_DIR = new URL('../public/assets/voice/', import.meta.url);
const MANIFEST = new URL('manifest.json', OUT_DIR);
const HARVEST = new URL('./noah-harvest.json', import.meta.url);

const args = new Set(process.argv.slice(2));
const apiKey = process.env.ELEVENLABS_API_KEY;
// NOAH's voice: "Sarah" (ElevenLabs premade voice, chosen by the team; works on the free plan).
const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';
const voiceId = process.env.NOAH_VOICE_ID ?? DEFAULT_VOICE_ID;

if (!apiKey && !args.has('--dry-run') && !args.has('--prune')) {
  console.error('Falta ELEVENLABS_API_KEY en .env.local');
  process.exit(1);
}

// ---------- List voices ----------
if (args.has('--voices')) {
  const response = await fetch(`${API}/voices`, { headers: { 'xi-api-key': apiKey } });
  if (!response.ok) {
    console.error(`ElevenLabs respondió ${response.status}: ${await response.text()}`);
    process.exit(1);
  }
  const { voices } = await response.json();
  for (const v of voices) {
    const labels = Object.values(v.labels ?? {}).join(', ');
    console.log(`${v.voice_id}  ${v.name.padEnd(28)} ${labels}`);
  }
  process.exit(0);
}

// ---------- Collect lines ----------
const catalog = JSON.parse(readFileSync(new URL('../src/game/parts.json', import.meta.url), 'utf8'));
const harvested = existsSync(HARVEST) ? JSON.parse(readFileSync(HARVEST, 'utf8')) : [];
const lines = new Map(); // key -> spoken text
for (const text of [...workshopLines(catalog, REFRAME_ENERGY), ...otherLines, ...harvested]) {
  lines.set(voiceKey(text), speechText(text));
}

mkdirSync(OUT_DIR, { recursive: true });
const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : { lines: {} };
const missing = [...lines].filter(([key]) => !existsSync(new URL(`${key}.mp3`, OUT_DIR)));
const characters = missing.reduce((sum, [, text]) => sum + text.length, 0);

console.log(`${lines.size} líneas en total, ${missing.length} sin audio (${characters} caracteres ≈ créditos).`);

// ---------- Prune: MP3s of lines that are no longer in the game ----------
if (args.has('--prune')) {
  const unused = readdirSync(OUT_DIR).filter((file) => file.endsWith('.mp3') && !lines.has(file.slice(0, -4)));
  for (const file of unused) {
    unlinkSync(new URL(file, OUT_DIR));
    delete manifest.lines[file.slice(0, -4)];
  }
  console.log(`Borrados ${unused.length} audios que ya no se usan.`);
}

if (args.has('--dry-run')) {
  for (const [key, text] of missing) console.log(`  ${key}  ${text}`);
  process.exit(0);
}

// ---------- Generate ----------
for (const [i, [key, text]] of (apiKey ? missing : []).entries()) { // --prune without a key: only clean up
  const response = await fetch(`${API}/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      // Lower stability = more expressive; style adds intensity. Tuned for a confident, "epic" guide.
      voice_settings: { stability: 0.4, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true },
    }),
  });
  if (!response.ok) {
    console.error(`\nError en "${text}": ${response.status} ${await response.text()}`);
    break; // keep what was generated; the manifest below still gets saved
  }
  writeFileSync(new URL(`${key}.mp3`, OUT_DIR), Buffer.from(await response.arrayBuffer()));
  manifest.lines[key] = text;
  console.log(`[${i + 1}/${missing.length}] ${text}`);
}

// The manifest lists every line that has an MP3 (the game only tries those).
for (const [key, text] of lines) {
  if (existsSync(new URL(`${key}.mp3`, OUT_DIR))) manifest.lines[key] = text;
}
for (const key of Object.keys(manifest.lines)) {
  if (!existsSync(new URL(`${key}.mp3`, OUT_DIR))) delete manifest.lines[key];
}
manifest.voice = voiceId;
writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Listo: ${Object.keys(manifest.lines).length} líneas con audio.`);
