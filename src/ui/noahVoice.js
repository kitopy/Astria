// Reads a NOAH line aloud, only if the player turned on "Voz de NOAH".
// The "NOAH // TITLE" first line is skipped: it's a label, not something to say.
export function speakIfEnabled(scene, text) {
  if (!scene.registry.get('noahVoice') || !('speechSynthesis' in window)) return;

  speechSynthesis.cancel();
  const line = new SpeechSynthesisUtterance(text.replace(/^NOAH \/\/ .*\n/, ''));
  line.lang = 'es-ES';
  line.rate = 0.95;
  speechSynthesis.speak(line);
}
