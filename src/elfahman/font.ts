import '@fontsource/cairo/arabic-800.css';
import '@fontsource/cairo/arabic-900.css';
import '@fontsource/cairo/latin-900.css';
import { continueRender, delayRender } from 'remotion';
let started = false;
export const loadFont = () => {
  if (started || typeof document === 'undefined') return;
  started = true;
  const h = delayRender('cairo');
  Promise.all([document.fonts.load('900 80px Cairo', 'الفهمان'), document.fonts.load('800 40px Cairo', 'abc')])
    .then(() => continueRender(h))
    .catch(() => continueRender(h));
};
