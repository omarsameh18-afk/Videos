// node scripts/elfahman/stills.mjs <outdir> <frame...>  -> PNGs + contact sheet
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const [out, ...frames] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const serveUrl = await bundle({ entryPoint: 'src/index.ts' });
const browserExecutable = process.env.REMOTION_BROWSER;
const composition = await selectComposition({ serveUrl, id: 'ElFahman12', browserExecutable });
const files = [];
for (const fr of frames.map(Number)) {
  const output = `${out}/f${String(fr).padStart(4, '0')}.png`;
  await renderStill({ serveUrl, composition, frame: fr, output, browserExecutable, scale: 0.5 });
  files.push(output);
}
const cols = Math.min(6, files.length);
execFileSync('ffmpeg', ['-v', 'error', '-y', ...files.flatMap((f) => ['-i', f]), '-filter_complex', `${files.map((_, i) => `[${i}:v]drawtext=text='${frames[i]}':x=10:y=10:fontsize=36:fontcolor=red[v${i}]`).join(';')};${files.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${files.length}:layout=${files.map((_, i) => `${(i % cols) * 540}_${Math.floor(i / cols) * 960}`).join('|')}:fill=black`, `${out}/sheet.png`]);
console.log('ok', out);
