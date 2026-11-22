// Procedurally generates royalty-free SFX + a music bed into assets/audio/ (deterministic).
// Swap in your own licensed files with the same names any time.
import { mkdirSync, writeFileSync } from 'node:fs';

const SR = 48000;
let seed = 12345;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;

function wav(file, data) {
  const buf = Buffer.alloc(44 + data.length * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + data.length * 2, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(data.length * 2, 40);
  let peak = 0;
  for (const v of data) peak = Math.max(peak, Math.abs(v));
  const g = peak > 0 ? 0.89 / peak : 1; // normalise to about -1 dBFS
  data.forEach((v, i) => buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v * g)) * 32767), 44 + i * 2));
  writeFileSync(file, buf);
}

// state-variable band-pass filter
const svf = () => {
  let low = 0, band = 0;
  return (x, f, q) => {
    const F = 2 * Math.sin((Math.PI * f) / SR);
    low += F * band;
    const high = x - low - q * band;
    band += F * high;
    return { low, band, high };
  };
};

// whoosh: noise through a band-pass sweeping up then down
function whoosh(sec = 0.42) {
  const n = Math.floor(sec * SR), out = new Float32Array(n), f = svf();
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const env = Math.sin(Math.PI * Math.pow(t, 0.7)) ** 2;
    const fc = 400 + 3200 * Math.sin(Math.PI * t);
    out[i] = f(rnd(), fc, 0.5).band * env;
  }
  return out;
}

// pop: short pitch-dropping blip
function pop(sec = 0.11) {
  const n = Math.floor(sec * SR), out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const fr = 280 + 900 * Math.exp(-t * 45);
    ph += (2 * Math.PI * fr) / SR;
    out[i] = Math.sin(ph) * Math.exp(-t * 38) + (i < 60 ? rnd() * 0.4 * (1 - i / 60) : 0);
  }
  return out;
}

// thud: low impact for a needle slam
function thud(sec = 0.35) {
  const n = Math.floor(sec * SR), out = new Float32Array(n), f = svf();
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    ph += (2 * Math.PI * (48 + 90 * Math.exp(-t * 30))) / SR;
    out[i] = Math.sin(ph) * Math.exp(-t * 11) + f(rnd(), 900, 0.8).low * Math.exp(-t * 40) * 0.8;
  }
  return out;
}

// music bed: 112 BPM, 8 bars, Am-F-C-G; kick, offbeat hats, bass, soft pad
function bed() {
  const bpm = 112, beat = 60 / bpm, bars = 8, n = Math.floor(bars * 4 * beat * SR);
  const out = new Float32Array(n);
  const roots = [57, 53, 48, 55]; // A3 F3 C3 G3 (midi)
  const chord = [[0, 3, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7]];
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const hp = svf(), lp = svf();
  for (let i = 0; i < n; i++) {
    const t = i / SR, b = t / beat, bi = Math.floor(b), bt = (b - bi) * beat, bar = Math.floor(bi / 4) % 4;
    // kick on every beat
    const kf = 45 + 80 * Math.exp(-bt * 30);
    const kick = Math.sin(2 * Math.PI * kf * bt) * Math.exp(-bt * 9) * 0.9;
    // hat on the off-beat
    const ot = ((b + 0.5) % 1) * beat;
    const hat = hp(rnd(), 8000, 0.7).high * Math.exp(-ot * 60) * 0.25;
    // bass: root, eighth-note pulse, low-passed saw
    const et = (b * 2 - Math.floor(b * 2)) * beat * 0.5;
    const saw = ((t * hz(roots[bar] - 12)) % 1) * 2 - 1;
    const bass = lp(saw, 420, 1.2).low * Math.exp(-et * 6) * 0.45;
    // pad: chord tones, slow tremolo
    let pad = 0;
    for (const iv of chord[bar]) pad += Math.sin(2 * Math.PI * hz(roots[bar] + 12 + iv) * t);
    pad *= 0.06 * (0.75 + 0.25 * Math.sin(2 * Math.PI * t * 0.5));
    out[i] = kick + hat + bass + pad;
  }
  // short fades so it loops cleanly
  for (let i = 0; i < 2000; i++) { out[i] *= i / 2000; out[n - 1 - i] *= i / 2000; }
  return out;
}

mkdirSync('assets/audio', { recursive: true });
wav('assets/audio/whoosh.wav', whoosh());
wav('assets/audio/pop.wav', pop());
wav('assets/audio/thud.wav', thud());
wav('assets/audio/music-bed.wav', bed());
console.log('assets/audio: whoosh.wav pop.wav thud.wav music-bed.wav');
