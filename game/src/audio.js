// Ember Pact — tiny sounds, synthesized with WebAudio (no audio files, no network).
// Created lazily on the first user gesture; silent when audio is unavailable.
let ctx = null;

function ensure() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    return ctx;
  } catch {
    return null;
  }
}

function blip(freq, seconds, type = 'sine', gainValue = 0.06) {
  const audio = ensure();
  if (!audio) return;
  try {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(gainValue, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + seconds);
    osc.connect(gain).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + seconds);
  } catch {
    // Sound is garnish: never let it break the game.
  }
}

export const sfx = {
  play() { blip(520, 0.12, 'triangle'); },
  block() { blip(240, 0.15, 'sine'); },
  heal() { blip(660, 0.2, 'sine'); },
  hurt() { blip(160, 0.18, 'sawtooth', 0.04); },
  win() { blip(523, 0.15); setTimeout(() => blip(659, 0.15), 120); setTimeout(() => blip(784, 0.3), 240); },
  loss() { blip(330, 0.2, 'sine'); setTimeout(() => blip(220, 0.35, 'sine'), 160); },
};
