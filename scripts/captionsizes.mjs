// Caption sizes: measures every caption card in the real font (Cairo Black, headless Chromium) and writes the width of its
// widest line at 100 px into <captions.json> as "w100". Captions.tsx then sizes each card from the real width, not an estimate.
// usage: node scripts/captionsizes.mjs src/elfahman/videos/<topic>.words.json src/elfahman/videos/<topic>.captions.json
import {createRequire} from 'node:module';
import fs from 'node:fs';
const {chromium} = createRequire('/')('playwright');
const [wordsPath, capsPath] = process.argv.slice(2);
const words = JSON.parse(fs.readFileSync(wordsPath, 'utf8')).map((w) => w.w);
const caps = JSON.parse(fs.readFileSync(capsPath, 'utf8'));
const clean = (w) => w.replace(/\.\.\.|…/g, '').replace(/[.،,:]$/g, ''); // same as Captions.tsx clean()
const cards = []; let i = 0;
caps.sizes.forEach((n, k) => {
  const txt = caps.cards?.[k]?.text; // a hook card may show its own text over these words (episode 11)
  const ws = (txt ? txt.split(' ') : words.slice(i, i + n)).map(clean); i += n;
  const br = caps.cards?.[k]?.br;
  const cuts = [0, ...(br === undefined ? [] : [].concat(br)), ws.length];
  cards.push(cuts.slice(1).map((c, j) => ws.slice(cuts[j], c).join(' ')));
});
const b64 = (p) => fs.readFileSync(p).toString('base64');
const css = `@font-face{font-family:Cairo;font-weight:900;src:url(data:font/woff2;base64,${b64('public/elfahman/fonts/cairo-arabic-900-normal.woff2')}) format('woff2');unicode-range:U+0600-06FF,U+0750-077F,U+08A0-08FF,U+200C-200E,U+FB50-FDFF,U+FE70-FEFC}
@font-face{font-family:Cairo;font-weight:900;src:url(data:font/woff2;base64,${b64('public/elfahman/fonts/cairo-latin-900-normal.woff2')}) format('woff2');unicode-range:U+0000-00FF,U+2000-206F}`;
const br = await chromium.launch();
const pg = await br.newPage();
await pg.setContent(`<style>${css}</style><svg width="4000" height="300"><text id="t" x="2000" y="150" text-anchor="middle" direction="rtl" font-family="Cairo" font-weight="900" font-size="100"></text></svg>`);
await pg.evaluate(() => Promise.all([document.fonts.load('900 100px Cairo', 'اب'), document.fonts.load('900 100px Cairo', 'Ab')]));
caps.w100 = await pg.evaluate((cards) => cards.map((lines) => Math.max(...lines.map((s) => {
  const t = document.getElementById('t'); t.textContent = s; return Math.round(t.getComputedTextLength() * 10) / 10;
}))), cards);
await br.close();
// only the "w100" line of the file is rewritten; the rest stays as written by hand
const w100 = `  "w100": ${JSON.stringify(caps.w100).replace(/,/g, ', ')}`;
let txt = fs.readFileSync(capsPath, 'utf8').replace(/,\s*"w100":\s*\[[^\]]*\]/, '');
txt = txt.replace(/\s*\}\s*$/, `,\n${w100}\n}\n`);
JSON.parse(txt);
fs.writeFileSync(capsPath, txt);
cards.forEach((c, k) => console.log(String(caps.w100[k]).padStart(7), c.join('  /  ')));
