import '@fontsource/anton/400.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/montserrat/900.css';
import { continueRender, delayRender } from 'remotion';

export const FONT_HEAD = 'Anton, Impact, sans-serif';
export const FONT_BODY = 'Montserrat, Arial, sans-serif';

let started = false;
export const waitForFonts = () => {
  if (started || typeof document === 'undefined') return;
  started = true;
  const h = delayRender('fonts');
  Promise.all([document.fonts.load('400 100px Anton'), document.fonts.load('900 60px Montserrat'), document.fonts.load('700 30px Montserrat')])
    .then(() => continueRender(h))
    .catch(() => continueRender(h));
};
