// Builds the BrainPump channel art: profile.png (800x800), banner.png (2560x1440), preview.png.
// Text is rendered by Chromium from the project fonts (crisp), never by the image model.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { readFileSync } from 'node:fs';
const b64 = (p) => readFileSync(p).toString('base64');
const font = (p) => `data:font/woff2;base64,${b64(p)}`;
const FONTS = `
@font-face{font-family:Anton;src:url(${font('node_modules/@fontsource/anton/files/anton-latin-400-normal.woff2')})}
@font-face{font-family:Montserrat;font-weight:900;src:url(${font('node_modules/@fontsource/montserrat/files/montserrat-latin-900-normal.woff2')})}`;
const img = (p) => `data:image/png;base64,${b64(p)}`;
const NAVY = '#0B0C1C', LIME = '#B6FF2E';

const banner = `<html><head><style>${FONTS}
body{margin:0;width:2560px;height:1440px;position:relative;overflow:hidden;background:url(${img('branding/src/banner-bg.png')})}
.glow{position:absolute;left:380px;top:430px;width:1450px;height:580px;background:radial-gradient(ellipse at 50% 50%,rgba(11,12,28,.55),rgba(11,12,28,0) 70%)}
.title{position:absolute;left:575px;top:540px;font-family:Anton;font-size:232px;line-height:1;letter-spacing:4px;color:#fff;-webkit-text-stroke:16px ${NAVY};paint-order:stroke fill;text-shadow:0 12px 0 rgba(0,0,0,.35)}
.title span{color:${LIME}}
.tag{position:absolute;left:580px;top:800px;font-family:Montserrat;font-weight:900;font-size:50px;letter-spacing:3px;color:#fff;-webkit-text-stroke:9px ${NAVY};paint-order:stroke fill}
.tag b{color:${LIME}}
.max{position:absolute;left:1690px;top:515px;height:520px}
</style></head><body><div class="glow"></div>
<div class="title">BRAIN<span>PUMP</span></div>
<div class="tag">GYM SCIENCE. <b>EXPLAINED.</b> DAILY.</div>
<img class="max" src="${img('branding/src/banner-max-cutout.png')}"></body></html>`;

const profile = `<html><head><style>
body{margin:0;width:800px;height:800px;overflow:hidden;background:rgb(${process.env.LIMEBG})}
img{position:absolute;left:${(800 - 640) / 2}px;top:${800 - 640}px;width:640px;height:640px}
</style></head><body><img src="${img('branding/src/profile-fixed.png')}"></body></html>`;

const br = await chromium.launch();
const page = await br.newPage({ viewport: { width: 2560, height: 1440 } });
await page.setContent(banner);
await page.evaluate(() => document.fonts.ready);
const box = await page.evaluate(() => [...document.querySelectorAll('.title,.tag,.max')].map((e) => { const r = e.getBoundingClientRect(); return [e.className, Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]; }));
console.log(JSON.stringify(box));
await page.screenshot({ path: 'branding/banner.png' });
await page.setViewportSize({ width: 800, height: 800 });
await page.setContent(profile);
await page.screenshot({ path: 'branding/profile.png' });
await br.close();
