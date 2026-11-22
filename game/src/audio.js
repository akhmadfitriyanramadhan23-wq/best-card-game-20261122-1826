// Synthesised WebAudio sounds — no audio files. The context is created
// on the first user gesture (browsers block audio before that) and the
// mute toggle silences everything.

let context = null;
let muted = false;

function ensureContext() {
  if (context === null) {
    const Ctor = window.AudioContext ?? window.webkitAudioContext;
    if (Ctor === undefined) return null;
    context = new Ctor();
  }
  if (context.state === 'suspended') void context.resume();
  return context;
}

/** A short oscillator blip with a pitch slide and a volume envelope. */
function tone(freq, endFreq, duration, type, gainValue, delay) {
  if (muted) return;
  const ctx = ensureContext();
  if (ctx === null) return;
  const start = ctx.currentTime + (delay ?? 0);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

/** Create the sound board. Call `unlock()` from a user gesture first. */
export function createAudio() {
  return {
    /** Create/resume the context: call from a click or keypress. */
    unlock() {
      ensureContext();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    /** A card snapping onto the table. */
    play() {
      tone(520, 340, 0.09, 'triangle', 0.16);
      tone(780, 620, 0.07, 'sine', 0.1, 0.04);
    },
    /** A hit landing: a low thud. */
    hit() {
      tone(180, 60, 0.22, 'sawtooth', 0.22);
      tone(90, 40, 0.26, 'square', 0.14, 0.02);
    },
    /** A heal or shield: a soft rising chime. */
    heal() {
      tone(440, 660, 0.18, 'sine', 0.14);
      tone(660, 880, 0.2, 'sine', 0.1, 0.08);
    },
    /** A click on a button. */
    click() {
      tone(700, 700, 0.05, 'square', 0.06);
    },
    /** Victory fanfare. */
    win() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.28, 'triangle', 0.16, i * 0.11));
    },
    /** Defeat: a slow falling line. */
    lose() {
      [392, 330, 262, 196].forEach((f, i) => tone(f, f * 0.9, 0.3, 'sine', 0.14, i * 0.14));
    },
  };
}
