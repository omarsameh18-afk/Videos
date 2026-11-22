// Final audio: edited voice + music bed (~20 dB under the voice) + SFX on events,
// loudness-normalised to -14 LUFS integrated (two-pass loudnorm), true peak <= -1.5 dBTP.
import { execFileSync, spawnSync } from 'node:child_process';

const ffmpegJson = (args) => {
  const r = spawnSync('ffmpeg', args, { encoding: 'utf8', maxBuffer: 1 << 26 });
  const m = r.stderr.match(/\{[\s\S]*?"input_i"[\s\S]*?\}/);
  if (!m) throw new Error(`loudnorm analysis failed: ${r.stderr.slice(-400)}`);
  return JSON.parse(m[0]);
};
export const measureLufs = (file) => Number(ffmpegJson(['-hide_banner', '-i', file, '-af', 'loudnorm=print_format=json', '-f', 'null', '-']).input_i);

export const SFX = { whoosh: 'assets/audio/whoosh.wav', pop: 'assets/audio/pop.wav' };
export const MUSIC = 'assets/audio/music-bed.wav';

/**
 * @param voice   edited voice wav
 * @param events  [{ t: seconds, sfx: 'whoosh'|'pop' }]
 * @param durSec  total video length
 */
export function mixAudio({ voice, events, durSec, out, musicDb = -20, whooshDb = -9, popDb = -7, target = -14 }) {
  const vL = measureLufs(voice);
  const mL = measureLufs(MUSIC);
  const musicGain = vL + musicDb - mL; // dB applied to the music file
  const inputs = ['-i', voice, '-stream_loop', '-1', '-i', MUSIC];
  const sfxFiles = [...new Set(events.map((e) => e.sfx))];
  sfxFiles.forEach((s) => inputs.push('-i', SFX[s]));
  const idx = (s) => 2 + sfxFiles.indexOf(s);
  const sfxGain = { whoosh: whooshDb, pop: popDb };

  const f = [];
  f.push(`[0:a]aresample=48000,apad=whole_dur=${durSec}[v]`);
  f.push(`[1:a]aresample=48000,volume=${musicGain.toFixed(2)}dB,atrim=0:${durSec},afade=t=in:d=0.25,afade=t=out:st=${Math.max(0, durSec - 0.4)}:d=0.4[m]`);
  // split each SFX source for as many events as use it
  sfxFiles.forEach((s) => {
    const n = events.filter((e) => e.sfx === s).length;
    f.push(`[${idx(s)}:a]aresample=48000,volume=${sfxGain[s]}dB,asplit=${n}${Array.from({ length: n }, (_, k) => `[${s}${k}]`).join('')}`);
  });
  const used = {};
  const labels = events.map((e, i) => {
    const k = (used[e.sfx] = (used[e.sfx] ?? -1) + 1);
    const ms = Math.max(0, Math.round(e.t * 1000));
    f.push(`[${e.sfx}${k}]adelay=${ms}|${ms}[e${i}]`);
    return `[e${i}]`;
  });
  f.push(`[v][m]${labels.join('')}amix=inputs=${2 + labels.length}:normalize=0:duration=first,atrim=0:${durSec}[mix]`);
  const pre = out.replace(/\.wav$/, '.pre.wav');
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', f.join(';'), '-map', '[mix]', '-ac', '2', '-ar', '48000', pre]);

  // two-pass loudnorm to the target
  const m = ffmpegJson(['-hide_banner', '-i', pre, '-af', `loudnorm=I=${target}:TP=-1.5:LRA=11:print_format=json`, '-f', 'null', '-']);
  const ln = `loudnorm=I=${target}:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', pre, '-af', `${ln},aresample=48000`, '-ar', '48000', out]);
  return { voiceLufs: vL, musicGainDb: musicGain, finalLufs: measureLufs(out) };
}
