// Sizzle Station — tiny synthesised sound effects, no audio files.
// Everything is generated with the Web Audio API so the game ships zero assets
// and makes no network request. Every call is a no-op until the player has
// interacted once (browsers block audio before a gesture).

let ctx = null;
let muted = false;

export function unlockAudio() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    } catch {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function tone(freq, seconds, type = 'sine', volume = 0.12, when = 0) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + seconds);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + seconds + 0.02);
}

function noise(seconds, volume = 0.08, filterFreq = 1200) {
  if (!ctx || muted) return;
  const len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start();
}

// One chop of the knife on the board.
export function sfxChop() {
  noise(0.08, 0.14, 3000);
  tone(180, 0.06, 'square', 0.05);
}

// A patty or fries hitting a hot surface.
export function sfxSizzle() {
  noise(0.35, 0.07, 5000);
}

// A short happy ding when a dish is served.
export function sfxServe() {
  tone(660, 0.12, 'sine', 0.12);
  tone(880, 0.18, 'sine', 0.12, 0.09);
}

// Picking an ingredient up.
export function sfxPickup() {
  tone(440, 0.07, 'triangle', 0.08);
}

// Putting something down.
export function sfxPlace() {
  tone(300, 0.07, 'triangle', 0.08);
}

// A wrong move: no order wants this, or hands are full.
export function sfxError() {
  tone(140, 0.18, 'sawtooth', 0.07);
}

// An order just walked out.
export function sfxMiss() {
  tone(220, 0.25, 'sawtooth', 0.08);
  tone(165, 0.3, 'sawtooth', 0.08, 0.12);
}

// The last ten seconds of the shift.
export function sfxTick() {
  tone(980, 0.05, 'square', 0.05);
}
