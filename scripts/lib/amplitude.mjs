// Per-frame loudness (0..1) of an audio file, used to drive Max's mouth.
import { spawnSync } from 'node:child_process';

const RATE = 16000;

export function decodeMono(file) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(RATE), '-f', 'f32le', '-'], {
    maxBuffer: 1 << 30,
  });
  if (r.status !== 0) throw new Error(`ffmpeg failed to decode ${file}: ${r.stderr}`);
  const buf = r.stdout;
  return new Float32Array(buf.buffer, buf.byteOffset, Math.floor(buf.length / 4));
}

export function computeAmplitude(file, fps = 30) {
  const pcm = decodeMono(file);
  const per = RATE / fps;
  const frames = Math.ceil(pcm.length / per);
  const rms = new Array(frames).fill(0);
  for (let f = 0; f < frames; f++) {
    const s = Math.floor(f * per);
    const e = Math.min(pcm.length, Math.floor((f + 1) * per));
    let sum = 0;
    for (let i = s; i < e; i++) sum += pcm[i] * pcm[i];
    rms[f] = Math.sqrt(sum / Math.max(1, e - s));
  }
  // normalise against the 95th percentile of voiced frames so quiet and loud voices behave the same
  const voiced = rms.filter((v) => v > 0.005).sort((a, b) => a - b);
  const ref = voiced.length ? voiced[Math.floor(voiced.length * 0.95)] : 1;
  // fast attack, slower release so the mouth doesn't flicker
  const out = [];
  let level = 0;
  for (const v of rms) {
    const x = Math.min(1, v / ref);
    level = x > level ? x : level * 0.55 + x * 0.45;
    out.push(Math.round(level * 1000) / 1000);
  }
  return { fps, durationSec: pcm.length / RATE, amplitude: out };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [file, fps] = process.argv.slice(2);
  process.stdout.write(JSON.stringify(computeAmplitude(file, Number(fps) || 30)));
}
