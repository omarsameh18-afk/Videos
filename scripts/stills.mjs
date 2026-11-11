// node scripts/stills.mjs out/sheet.png 0.3 1.0 4.6 ...   (bundles once into build/, renders stills, builds a grid)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const [out, ...times] = process.argv.slice(2);
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = fs.existsSync('build/index.html') && process.env.REBUNDLE !== '1' ? 'build' :
  await bundle({entryPoint: path.resolve('src/index.ts'), outDir: path.resolve('build')});
const composition = await selectComposition({serveUrl, id: 'Woodpecker', browserExecutable});
const files = [];
for (const t of times) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(parseFloat(t) * 60));
  const o = `out/stills/f${String(frame).padStart(4, '0')}.png`;
  fs.mkdirSync('out/stills', {recursive: true});
  await renderStill({serveUrl, composition, frame, output: o, scale: 0.25, browserExecutable});
  files.push([o, t]);
}
execFileSync('python3', ['-c', `
import sys; from PIL import Image, ImageDraw
fs=sys.argv[2:]; ims=[Image.open(p) for p in fs[0::2]]; w,h=ims[0].size; n=len(ims); cols=min(6,n); rows=(n+cols-1)//cols
g=Image.new('RGB',(cols*(w+6),rows*(h+28)),'white'); d=ImageDraw.Draw(g)
for i,(im,t) in enumerate(zip(ims,fs[1::2])):
  x=(i%cols)*(w+6); y=(i//cols)*(h+28); g.paste(im.convert('RGB'),(x,y+24)); d.text((x+4,y+4),t+'s',fill='black')
g.save(sys.argv[1])`, out, ...files.flat()]);
console.log('wrote', out);
