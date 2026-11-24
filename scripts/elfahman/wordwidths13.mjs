// Measures every caption word of episode 12 in Cairo Black at 100 px (headless Chromium) -> src/elfahman/videos/phone.wordw.json
import {createRequire} from 'node:module';
import fs from 'node:fs';
const {chromium} = createRequire('/')('playwright');
const clean = (w) => w.replace(/\.\.\.|…/g, '').replace(/[.،,:]$/g, '');
const ws = JSON.parse(fs.readFileSync('src/elfahman/videos/phone.words.json', 'utf8')).map((w) => clean(w.w));
const extra = ['لو', 'قفلت', 'نت', 'موبايلك', 'أسبوعين…', 'أسبوعين', 'مخك', 'هيحصله', 'إيه؟', ' '];
const uniq = [...new Set([...ws, ...extra])];
const b64 = (p) => fs.readFileSync(p).toString('base64');
const css = `@font-face{font-family:Cairo;font-weight:900;src:url(data:font/woff2;base64,${b64('public/elfahman/fonts/cairo-arabic-900-normal.woff2')}) format('woff2');unicode-range:U+0600-06FF,U+0750-077F,U+08A0-08FF,U+200C-200E,U+FB50-FDFF,U+FE70-FEFC}
@font-face{font-family:Cairo;font-weight:900;src:url(data:font/woff2;base64,${b64('public/elfahman/fonts/cairo-latin-900-normal.woff2')}) format('woff2');unicode-range:U+0000-00FF,U+2000-206F}`;
const br = await chromium.launch();
const pg = await br.newPage();
await pg.setContent(`<style>${css}</style><svg width="4000" height="300"><text id="t" x="2000" y="150" text-anchor="middle" direction="rtl" font-family="Cairo" font-weight="900" font-size="100" style="white-space:pre"></text></svg>`);
await pg.evaluate(() => Promise.all([document.fonts.load('900 100px Cairo', 'اب'), document.fonts.load('900 100px Cairo', 'Ab')]));
const out = await pg.evaluate((u) => Object.fromEntries(u.map((s) => { const t = document.getElementById('t'); t.textContent = s === ' ' ? 'ا ا' : s; let w = t.getComputedTextLength(); if (s === ' ') { t.textContent = 'اا'; w -= t.getComputedTextLength(); } return [s, Math.round(w * 10) / 10]; })), uniq);
await br.close();
fs.writeFileSync('src/elfahman/videos/phone.wordw.json', JSON.stringify(out));
console.log(Object.keys(out).length, 'words; space', out[' ']);
