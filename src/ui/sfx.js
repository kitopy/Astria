// Short sound effects, made with the browser's Web Audio API (no audio files).
// Each action gets instant feedback: a part clicks into place, the camera shutter, a warning,
// data blips while sending, a fanfare when the mission succeeds.
//
//   import { sfx } from '../ui/sfx.js';
//   sfx.pop();

let audio = null;

// Browsers only allow sound after the player has clicked, so the audio context is created on first use.
function context() {
  if (!audio) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    audio = new AudioContext();
  }
  if (audio.state === 'suspended') audio.resume();
  return audio;
}

// One tone: frequency (Hz) that can slide to `to`, starting `delay` seconds from now.
function tone({ freq, to = freq, duration = 0.15, delay = 0, type = 'sine', volume = 0.12 }) {
  const ctx = context();
  if (!ctx) return;
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  osc.frequency.exponentialRampToValueAtTime(to, start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

// A short burst of noise (the "click" of a camera shutter).
function noise({ duration = 0.08, delay = 0, volume = 0.15 }) {
  const ctx = context();
  if (!ctx) return;
  const start = ctx.currentTime + delay;
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.buffer = buffer;
  gain.gain.value = volume;
  source.connect(gain).connect(ctx.destination);
  source.start(start);
}

export const sfx = {
  // A part clicks into place on the satellite.
  pop() {
    tone({ freq: 420, to: 880, duration: 0.12, type: 'triangle' });
    tone({ freq: 1320, duration: 0.08, delay: 0.08, volume: 0.06 });
  },
  // Camera shutter, then a rising "processing" sweep.
  shutter() {
    noise({ duration: 0.05 });
    noise({ duration: 0.05, delay: 0.09 });
    tone({ freq: 300, to: 1200, duration: 1.2, delay: 0.15, type: 'sine', volume: 0.04 });
  },
  // The photo finished rendering.
  done() {
    tone({ freq: 880, duration: 0.1, type: 'triangle' });
    tone({ freq: 1320, duration: 0.18, delay: 0.09, type: 'triangle' });
  },
  // A surprise problem: two low warning beeps.
  alert() {
    tone({ freq: 330, duration: 0.18, type: 'square', volume: 0.06 });
    tone({ freq: 262, duration: 0.25, delay: 0.22, type: 'square', volume: 0.06 });
  },
  // The problem was fixed.
  fixed() {
    tone({ freq: 523, duration: 0.1, type: 'triangle' });
    tone({ freq: 784, duration: 0.2, delay: 0.1, type: 'triangle' });
  },
  // One data blip while sending the photos.
  blip(step = 0) {
    tone({ freq: 660 + step * 60, duration: 0.07, type: 'square', volume: 0.04 });
  },
  // Mission accomplished: a short rising fanfare.
  success() {
    [523, 659, 784, 1047].forEach((freq, i) => tone({ freq, duration: 0.22, delay: i * 0.12, type: 'triangle', volume: 0.1 }));
  },
  // Something was missing: a soft falling tone (not a "fail" buzzer).
  almost() {
    tone({ freq: 523, to: 392, duration: 0.35, type: 'triangle', volume: 0.08 });
  },
};
