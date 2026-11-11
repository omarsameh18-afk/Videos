import numpy as np, wave
SR = 48000; rng = np.random.default_rng(7)
def save(name, x):
    x = x / (np.abs(x).max() + 1e-9) * 10 ** (-1 / 20)
    with wave.open(f'../../public/woodpecker/sfx/{name}.wav', 'wb') as f:
        f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR)
        f.writeframes((x * 32767).astype(np.int16).tobytes())
def t(d): return np.arange(int(SR * d)) / SR
def lp(x, a):  # one-pole low-pass
    y = np.zeros_like(x); s = 0
    for i, v in enumerate(x): s += a * (v - s); y[i] = s
    return y
# tok: woody knock = two damped resonances + click
tt = t(0.12)
tok = (np.sin(2*np.pi*820*tt)*np.exp(-tt*55) + 0.6*np.sin(2*np.pi*1460*tt)*np.exp(-tt*80)
       + 0.4*np.sin(2*np.pi*430*tt)*np.exp(-tt*40))
tok[:120] += rng.normal(0, 1, 120) * np.linspace(1, 0, 120)
save('tok', tok)
# boing: pitch sweep with vibrato
tt = t(0.6); f = 180 + 260*np.exp(-tt*6) ; ph = 2*np.pi*np.cumsum(f*(1+0.08*np.sin(2*np.pi*14*tt)))/SR
save('boing', np.sin(ph)*np.exp(-tt*5)*(1-np.exp(-tt*300)))
# pop
tt = t(0.09); f = 900*np.exp(-tt*30)+250; ph = 2*np.pi*np.cumsum(f)/SR
save('pop', np.sin(ph)*np.exp(-tt*45))
# whoosh: band-limited noise swell
tt = t(0.55); n = rng.normal(0, 1, len(tt)); env = np.sin(np.pi*np.clip(tt/0.55, 0, 1))**2
save('whoosh', (lp(n, 0.18) - lp(n, 0.03)) * env)
# thud: low thump
tt = t(0.35); f = 110*np.exp(-tt*8)+45; ph = 2*np.pi*np.cumsum(f)/SR
th = np.sin(ph)*np.exp(-tt*12); th[:200] += lp(rng.normal(0,1,200),0.2)*np.linspace(1,0,200)
save('thud', th)
# squish: noisy low-passed wobble
tt = t(0.35); n = lp(rng.normal(0,1,len(tt)), 0.06); save('squish', n*np.sin(np.pi*tt/0.35)*(1+0.5*np.sin(2*np.pi*30*tt)))
# ding: bell
tt = t(1.0); save('ding', (np.sin(2*np.pi*1568*tt)+0.5*np.sin(2*np.pi*3136*tt)+0.25*np.sin(2*np.pi*4704*tt))*np.exp(-tt*4))
# beep: camera REC
tt = t(0.12); save('beep', np.sin(2*np.pi*2000*tt)*(tt<0.1)*np.minimum(1, (0.1-tt+1e-3)*200))
# swish: short fast whoosh
tt = t(0.25); n = rng.normal(0,1,len(tt)); save('swish', (lp(n,0.35)-lp(n,0.08))*np.sin(np.pi*tt/0.25)**3)
print('ok')
