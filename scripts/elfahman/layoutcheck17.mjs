// Layout check for episode 17: stills at 0 s, 15 s, 40 s of #17 next to the same seconds of #14 v2 -> <out>/layout-check.png
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
const out = process.argv[2]; mkdirSync(out, {recursive: true});
const serveUrl = await bundle({entryPoint: 'src/index.ts'});
const browserExecutable = process.env.REMOTION_BROWSER;
const files = [];
for (const id of ['Elfahman14SkipperV2', 'Elfahman17Blackout']) {
  const composition = await selectComposition({serveUrl, id, browserExecutable});
  for (const s of [0, 15, 40]) {
    const output = `${out}/${id}-${s}.png`;
    await renderStill({serveUrl, composition, frame: s * 60, output, browserExecutable, scale: 0.5});
    files.push([output, `${id === 'Elfahman17Blackout' ? '#17' : '#14 v2'} ${s}s`]);
  }
}
// order: 0s #14, 0s #17, 15s #14, 15s #17, 40s #14, 40s #17
const order = [0, 3, 1, 4, 2, 5].map((i) => files[i]);
const guides = 'drawbox=x=0:y=20:w=540:h=2:color=cyan,drawbox=x=0:y=575:w=540:h=2:color=cyan,drawbox=x=20:y=0:w=2:h=960:color=cyan,drawbox=x=520:y=0:w=2:h=960:color=cyan,drawbox=x=0:y=625:w=540:h=2:color=yellow,drawbox=x=0:y=750:w=540:h=2:color=yellow,drawbox=x=0:y=775:w=540:h=2:color=red';
execFileSync('ffmpeg', ['-v', 'error', '-y', ...order.flatMap(([f]) => ['-i', f]), '-filter_complex',
  `${order.map(([, l], i) => `[${i}:v]${guides},drawtext=text='${l}':x=10:y=930:fontsize=26:fontcolor=red[v${i}]`).join(';')};${order.map((_, i) => `[v${i}]`).join('')}xstack=inputs=6:layout=0_0|540_0|1080_0|1620_0|2160_0|2700_0`, `${out}/layout-check.png`]);
console.log('ok');
