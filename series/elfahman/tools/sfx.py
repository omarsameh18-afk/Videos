# Synthesized SFX library for the الفهمان series (free, no credits). Writes public/elfahman/sfx/*.wav
# usage: python3 series/elfahman/tools/sfx.py   (from repo root)
import numpy as np, wave, os
SR = 48000; rng = np.random.default_rng(7)
OUT = os.path.join(os.path.dirname(__file__), '../../../public/elfahman/sfx/')
def save(name, x):
    x = x / (np.abs(x).max() + 1e-9) * 10 ** (-1 / 20)
    with wave.open(OUT + name + '.wav', 'wb') as f:
        f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR)
        f.writeframes((x * 32767).astype(np.int16).tobytes())
def t(d): return np.arange(int(SR * d)) / SR
def lp(x, a):
    y = np.zeros_like(x); s = 0.0
    for i, v in enumerate(x): s += a * (v - s); y[i] = s
    return y
def sweep(f, tt): return np.sin(2 * np.pi * np.cumsum(f) / SR)
# pop
tt = t(0.09); save('pop', sweep(900*np.exp(-tt*30)+250, tt)*np.exp(-tt*45))
# whoosh
tt = t(0.55); n = rng.normal(0, 1, len(tt)); save('whoosh', (lp(n, .18)-lp(n, .03))*np.sin(np.pi*np.clip(tt/.55, 0, 1))**2)
# swish (short)
tt = t(0.25); n = rng.normal(0, 1, len(tt)); save('swish', (lp(n, .35)-lp(n, .08))*np.sin(np.pi*tt/.25)**3)
# boing
tt = t(0.6); f = 180+260*np.exp(-tt*6); save('boing', np.sin(2*np.pi*np.cumsum(f*(1+.08*np.sin(2*np.pi*14*tt)))/SR)*np.exp(-tt*5)*(1-np.exp(-tt*300)))
# thud
tt = t(0.35); th = sweep(110*np.exp(-tt*8)+45, tt)*np.exp(-tt*12); th[:200] += lp(rng.normal(0,1,200),.2)*np.linspace(1,0,200); save('thud', th)
# squish (throat squeeze)
tt = t(0.4); n = lp(rng.normal(0,1,len(tt)), .06); save('squish', n*np.sin(np.pi*tt/.4)*(1+.5*np.sin(2*np.pi*30*tt)))
# ding (bell)
tt = t(1.0); save('ding', (np.sin(2*np.pi*1568*tt)+.5*np.sin(2*np.pi*3136*tt)+.25*np.sin(2*np.pi*4704*tt))*np.exp(-tt*4))
# tremble: fast wobbling glassy rattle
tt = t(0.7); save('tremble', (np.sin(2*np.pi*620*tt)+.5*np.sin(2*np.pi*1240*tt))*(0.5+0.5*np.sign(np.sin(2*np.pi*22*tt)))*np.exp(-tt*2.5)*np.minimum(1, tt*40))
# step: soft footstep tick
tt = t(0.08); save('step', lp(rng.normal(0,1,len(tt)), .25)*np.exp(-tt*70) + .4*np.sin(2*np.pi*240*tt)*np.exp(-tt*60))
# stinger: dramatic hit for "استنى" = low boom + bright cymbal-ish noise
tt = t(1.4); boom = sweep(70*np.exp(-tt*2)+38, tt)*np.exp(-tt*2.8); n = rng.normal(0,1,len(tt)); cym = (n-lp(n,.4))*np.exp(-tt*3.5)*.35
save('stinger', boom + cym)
# alarm: two-tone warning beep x2
tt = t(0.7); f = np.where((tt*4).astype(int) % 2 == 0, 880, 660); save('alarm', np.sign(np.sin(2*np.pi*np.cumsum(f)/SR))*.4*(tt<.68))
# bubbles: soap washing, many tiny rising blips
tt = t(1.2); x = np.zeros_like(tt)
for k in range(26):
    s0 = rng.uniform(0, 1.05); i0 = int(s0*SR); d = t(0.06); fb = rng.uniform(500, 1300)
    seg = np.sin(2*np.pi*np.cumsum(fb*(1+d*12))/SR)*np.exp(-d*60); x[i0:i0+len(seg)] += seg[:len(x)-i0]
save('bubbles', x)
# sparkle: shimmering rising arpeggio (vaccine shield)
tt = t(0.9); x = np.zeros_like(tt)
for k, fr in enumerate([1318, 1568, 1976, 2637, 3136]):
    i0 = int(k*0.07*SR); d = t(0.6); seg = np.sin(2*np.pi*fr*d)*np.exp(-d*7); x[i0:i0+len(seg)] += seg[:len(x)-i0]
save('sparkle', x)
# click: UI tap (share button)
tt = t(0.05); save('click', np.sin(2*np.pi*2400*tt)*np.exp(-tt*120) + lp(rng.normal(0,1,len(tt)),.5)*np.exp(-tt*200)*.5)
# gulp: descending bloop
tt = t(0.22); save('gulp', sweep(520*np.exp(-tt*9)+120, tt)*np.sin(np.pi*tt/.22))
# tick: wink twinkle
tt = t(0.35); save('twinkle', (np.sin(2*np.pi*2093*tt)+.6*np.sin(2*np.pi*3136*tt))*np.exp(-tt*12))
print('sfx ok')
