// Cut long silences out of a TTS recording by listening to the AUDIO (eleven_v3 timestamps smear words over
// pauses, so the timestamp-based gap cut in render.mjs can't see them) and remap the character timestamps.
// usage: node scripts/desilence.mjs <in.mp3> <in.timestamps.json> <out-id> [keepSec=0.25] [noiseDb=-38]
// writes voice/<out-id>.mp3 + voice/<out-id>.timestamps.json (render with `npm run render -- <script> voice/<out-id>.mp3`)
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const [inMp3, inTs, id, keepArg, noiseArg] = process.argv.slice(2);
const keep = Number(keepArg ?? 0.25);
const noise = Number(noiseArg ?? -38);
const err = execFileSync('bash', ['-c', `ffmpeg -hide_banner -i "${inMp3}" -af silencedetect=noise=${noise}dB:d=${keep + 0.05} -f null - 2>&1`], { encoding: 'utf8' });
const starts = [...err.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
const ends = [...err.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
const dur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', inMp3], { encoding: 'utf8' }));

// cuts: inside each silence keep `keep` seconds (half before, half after), drop the middle
const cuts = starts
  .map((s, i) => ({ s, e: ends[i] ?? dur }))
  .filter((c) => c.e - c.s > keep)
  .map((c) => ({ a: c.s + keep / 2, b: c.e - keep / 2 }));
const kept = [];
let t = 0;
for (const c of cuts) {
  if (c.a > t) kept.push([t, c.a]);
  t = c.b;
}
if (t < dur) kept.push([t, dur]);

// remap a time from the original to the cut audio
const remap = (x) => {
  let out = 0;
  for (const [a, b] of kept) {
    if (x <= a) return out;
    if (x <= b) return out + (x - a);
    out += b - a;
  }
  return out;
};

mkdirSync('voice', { recursive: true });
const filter = kept.map(([a, b], i) => `[0:a]atrim=${a.toFixed(4)}:${b.toFixed(4)},asetpts=PTS-STARTPTS[s${i}]`).join(';') + ';' + kept.map((_, i) => `[s${i}]`).join('') + `concat=n=${kept.length}:v=0:a=1[out]`;
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', inMp3, '-filter_complex', filter, '-map', '[out]', '-c:a', 'libmp3lame', '-b:a', '192k', `voice/${id}.mp3`]);

const j = JSON.parse(readFileSync(inTs, 'utf8'));
const al = j.alignment;
const st = al.character_start_times_seconds.map(remap);
const en = al.character_end_times_seconds.map(remap);
const out = { ...j, source: 'desilenced', alignment: { characters: al.characters, character_start_times_seconds: st, character_end_times_seconds: en } };
delete out.normalized_alignment;
writeFileSync(`voice/${id}.timestamps.json`, JSON.stringify(out, null, 1));
const total = kept.reduce((s, [a, b]) => s + b - a, 0);
console.log(`voice/${id}.mp3: ${dur.toFixed(2)}s -> ${total.toFixed(2)}s (${cuts.length} pauses cut to ${keep}s)`);
