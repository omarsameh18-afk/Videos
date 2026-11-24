// Fix eleven_v3 word timings that smear over pauses: any word that starts inside a detected silence is moved to the
// silence end, and the word before it ends at the silence start. Uses the AUDIO (ffmpeg silencedetect), costs nothing.
// usage: node scripts/snap-to-silence.mjs <audio.mp3> <words.json> <out.json> [noiseDb=-38] [minSilence=0.2]
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
const [mp3, inF, outF, noiseArg, minArg] = process.argv.slice(2);
const err = execFileSync('bash', ['-c', `ffmpeg -hide_banner -i "${mp3}" -af silencedetect=noise=${noiseArg ?? -38}dB:d=${minArg ?? 0.2} -f null - 2>&1`], { encoding: 'utf8' });
const st = [...err.matchAll(/silence_start: ([\d.]+)/g)].map((m) => +m[1]);
const en = [...err.matchAll(/silence_end: ([\d.]+)/g)].map((m) => +m[1]);
const sil = st.map((s, i) => [s, en[i] ?? Infinity]);
const j = JSON.parse(readFileSync(inF, 'utf8'));
const ws = j.words ?? j;
let moved = 0;
for (const [s, e] of sil) {
  if (!isFinite(e)) continue;
  // the phrase-start word (previous word ends in . ? ! , …) whose start the alignment smeared into/over this pause
  let k = -1;
  ws.forEach((w, i) => {
    if (i > 0 && !w.snapped && /[.?!,…]$/.test(ws[i - 1].text) && w.start >= s - 0.6 && w.start < e + 0.05)
      if (k < 0 || Math.abs(w.start - s) < Math.abs(ws[k].start - s)) k = i;
  });
  if (k <= 0) continue;
  ws[k].snapped = true;
  const w = ws[k];
  if (w.start < e) {
    w.end = Math.max(w.end, e + 0.08);
    w.start = e;
    if (k + 1 < ws.length && ws[k + 1].start < w.end) w.end = Math.max(e + 0.06, ws[k + 1].start);
    moved++;
  }
  ws[k - 1].end = Math.min(ws[k - 1].end, s + 0.02);
}
writeFileSync(outF, JSON.stringify(j.words ? j : { words: ws }));
console.log(`${sil.length} silences, ${moved} words snapped`);
console.log(ws.map((w) => `${w.text}@${w.start.toFixed(2)}`).join(' '));
