// Tighten a voice-over: cut every silence between words down to maxGap, then speed it up
// (atempo keeps pitch). Returns the new WAV and the character alignment remapped to it.
import { execFileSync } from 'node:child_process';
import { alignmentToWords } from './timing.mjs';

export function editVoice(inFile, alignment, outFile, { maxGap = 0.15, speed = 1.1, lead = 0.04, tail = 0.12 } = {}) {
  const words = alignmentToWords(alignment);
  const dur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', inFile]).toString());

  // intervals to remove: [a, b] in source seconds
  const cuts = [];
  if (words[0].start > lead) cuts.push([0, words[0].start - lead]);
  for (let i = 0; i + 1 < words.length; i++) {
    const gap = words[i + 1].start - words[i].end;
    if (gap > maxGap) cuts.push([words[i].end + maxGap / 2, words[i + 1].start - maxGap / 2]);
  }
  const lastEnd = words[words.length - 1].end;
  if (dur - lastEnd > tail) cuts.push([lastEnd + tail, dur]);

  // keep = complement of cuts
  const keep = [];
  let t = 0;
  for (const [a, b] of cuts) {
    if (a > t) keep.push([t, a]);
    t = b;
  }
  if (t < dur) keep.push([t, dur]);

  const parts = keep.map(([a, b], i) => `[0:a]atrim=${a.toFixed(4)}:${b.toFixed(4)},asetpts=PTS-STARTPTS,afade=t=in:d=0.006,afade=t=out:st=${(b - a - 0.006).toFixed(4)}:d=0.006[k${i}]`);
  const filter = `${parts.join(';')};${keep.map((_, i) => `[k${i}]`).join('')}concat=n=${keep.length}:v=0:a=1,atempo=${speed}[out]`;
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', inFile, '-filter_complex', filter, '-map', '[out]', '-ar', '48000', '-ac', '1', outFile]);

  // source time -> edited time
  const map = (x) => {
    let removed = 0;
    for (const [a, b] of cuts) {
      if (x >= b) removed += b - a;
      else if (x > a) {
        removed += x - a;
        break;
      } else break;
    }
    return (x - removed) / speed;
  };
  const out = {
    characters: alignment.characters,
    character_start_times_seconds: alignment.character_start_times_seconds.map(map),
    character_end_times_seconds: alignment.character_end_times_seconds.map(map),
  };
  const removed = cuts.reduce((s, [a, b]) => s + (b - a), 0);
  return { alignment: out, sourceSec: dur, editedSec: (dur - removed) / speed, removedSec: removed };
}
