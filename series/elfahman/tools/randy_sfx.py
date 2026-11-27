# Episode 16 sound effects, synthesized (0 credits): tick, coinspin, trombone, fizz, shower, knock, cheer, hum, pinball,
# chalk, clink, snore, flash, bookthud.
# usage: python3 series/elfahman/tools/randy_sfx.py  -> public/elfahman/randy/sfx/*.wav (48 kHz mono, peak -3 dBFS)
import os, wave, numpy as np
SR = 48000; OUT = 'public/elfahman/randy/sfx/'; os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(16)
T = lambda d: np.arange(int(d * SR)) / SR
def save(n, x):
    x = x / (np.abs(x).max() + 1e-9) * 0.7
    with wave.open(OUT + n + '.wav', 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes())
def noise(d): return rng.standard_normal(int(d * SR))
def bp(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X[(f < lo) | (f > hi)] = 0; return np.fft.irfft(X, len(x))
def place(buf, x, at):
    i = int(at * SR); buf[i:i + len(x)] += x[:max(0, len(buf) - i)]
def fade(x, a=0.01, b=0.05):
    n = len(x); e = np.ones(n); ia, ib = int(a * SR), int(b * SR)
    if ia: e[:ia] = np.linspace(0, 1, ia)
    if ib: e[-ib:] = np.linspace(1, 0, ib)
    return x * e

# tick: one clock tick-tock pair (0.5 s apart), woody click
def click(f0=2200, d=0.04):
    t = T(d); return bp(noise(d), 1500, 6000) * np.exp(-t * 180) + 0.6 * np.sin(2 * np.pi * f0 * t) * np.exp(-t * 120)
b = np.zeros(int(1.0 * SR)); place(b, click(2400), 0.0); place(b, 0.8 * click(1800), 0.5); save('tick', b)
# coinspin: a coin flicked (ting), spinning shimmer, landing rattle
t = T(1.6); ting = sum(np.sin(2 * np.pi * f * t) * a for f, a in [(3200, 1), (4810, .5), (6400, .3)]) * np.exp(-t * 3)
spin = np.sin(2 * np.pi * 5200 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * (14 + 10 * t) * t)) * np.exp(-t * 1.5) * 0.25
rat = np.zeros_like(t)
for k in range(10): place(rat, (0.7 - 0.06 * k) * click(3000 + 300 * k, 0.03), 1.05 + 0.05 * k * (1 - 0.06 * k))
save('coinspin', ting * 0.7 + spin + rat * 0.6)
# trombone: tiny sad "wah wah wah waaah"
def horn(f, d, bend=0.0):
    t = T(d); ph = 2 * np.pi * np.cumsum(f * (1 + bend * t / d) * (1 + 0.012 * np.sin(2 * np.pi * 5.5 * t))) / SR
    x = sum(np.sin(k * ph) / k ** 1.1 for k in range(1, 9)); return fade(bp(x, 80, 3000), 0.03, 0.08)
b = np.zeros(int(2.2 * SR)); place(b, horn(311, 0.32), 0); place(b, horn(294, 0.32), 0.36); place(b, horn(277, 0.32), 0.72)
place(b, horn(262, 0.95, -0.06), 1.08); save('trombone', b)
# fizz: can opening (psst) + bubbles
t = T(1.4); psst = bp(noise(1.4), 3000, 11000) * np.exp(-t * 6) * np.clip(t / 0.01, 0, 1)
bub = np.zeros_like(t)
for k in range(60):
    tt = T(0.02); place(bub, 0.3 * np.sin(2 * np.pi * (1800 + 1800 * rng.random()) * tt) * np.exp(-tt * 300), 0.1 + 1.2 * rng.random())
save('fizz', psst + bub)
# shower: steady water hiss 2 s
t = T(2.0); save('shower', fade(bp(noise(2.0), 1200, 9000) * (0.8 + 0.2 * np.sin(2 * np.pi * 3 * t)), 0.15, 0.4))
# knock: three comic door knocks
def knk():
    t = T(0.12); return np.sin(2 * np.pi * 160 * t) * np.exp(-t * 45) + 0.5 * bp(noise(0.12), 200, 1800) * np.exp(-t * 60)
b = np.zeros(int(0.8 * SR))
for k, a in enumerate([0, 0.16, 0.32]): place(b, knk(), a)
save('knock', b)
# cheer: quiet stadium crowd swell 2.2 s
t = T(2.2); crowd = bp(noise(2.2), 300, 3500) * np.sin(np.pi * t / 2.2) ** 1.5
for k in range(14):
    d = 0.3 + 0.3 * rng.random(); tt = T(d); f = 500 + 500 * rng.random()
    place(crowd, 0.25 * fade(bp(np.sign(np.sin(2 * np.pi * f * tt)) + 0.4 * noise(d), 300, 3000) * np.exp(-tt * 3), 0.05, 0.1), 0.3 + 1.4 * rng.random())
save('cheer', crowd)
# hum: mysterious low drone 2.6 s
t = T(2.6); save('hum', fade(sum(np.sin(2 * np.pi * f * t + p) * a for f, a, p in [(55, 1, 0), (82.5, .5, 1), (110.4, .35, 2), (165, .15, .5)])
                              * (0.75 + 0.25 * np.sin(2 * np.pi * 0.7 * t)), 0.5, 0.8))
# pinball: bells + flipper clacks + win jingle
b = np.zeros(int(2.4 * SR))
def bell(f, d=0.35):
    t = T(d); return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * 2.76 * f * t)) * np.exp(-t * 9)
for k, a in enumerate([0, 0.18, 0.31, 0.52, 0.7, 0.83]): place(b, bell([1320, 1760, 1568, 2093, 1760, 2349][k]) * 0.6, a)
for a in [0.1, 0.45, 0.95]: place(b, click(900, 0.05), a)
for k, f in enumerate([1047, 1319, 1568, 2093]): place(b, bell(f, 0.5) * 0.7, 1.3 + k * 0.1)
save('pinball', b)
# chalk: scratchy writing strokes 1.2 s
t = T(1.2); env = np.zeros_like(t)
for a, d in [(0.0, 0.18), (0.25, 0.14), (0.45, 0.22), (0.75, 0.16), (0.98, 0.15)]: env += np.clip((t - a) / 0.02, 0, 1) * np.clip((a + d - t) / 0.03, 0, 1)
save('chalk', bp(noise(1.2), 2500, 9000) * env * (0.7 + 0.3 * np.sin(2 * np.pi * 40 * t)))
# clink: chalk dropping, two small bounces
b = np.zeros(int(0.7 * SR))
for a, g in [(0, 1), (0.16, 0.5), (0.27, 0.25)]: place(b, g * (click(4200, 0.05) + 0.6 * click(2900, 0.05)), a)
save('clink', b)
# snore: two soft snores (in-breath rasp, out-breath whistle)
b = np.zeros(int(3.0 * SR))
for a in (0, 1.5):
    t = T(0.8); rasp = bp(noise(0.8) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 32 * t))), 80, 900) * np.sin(np.pi * t / 0.8)
    t2 = T(0.5); wh = bp(noise(0.5), 600, 1600) * np.sin(np.pi * t2 / 0.5) * 0.4
    place(b, rasp, a); place(b, wh, a + 0.85)
save('snore', b)
# flash: camera shutter + flash pop
t = T(0.35); sh = click(1500, 0.03); fl = bp(noise(0.35), 2000, 10000) * np.exp(-t * 25) * 0.6
b = np.zeros(int(0.4 * SR)); place(b, sh, 0); place(b, fl, 0.03); place(b, 0.7 * click(1100, 0.03), 0.08); save('flash', b)
# bookthud: heavy book slam
t = T(0.6); save('bookthud', np.sin(2 * np.pi * (95 - 40 * t) * t) * np.exp(-t * 11) + 0.7 * bp(noise(0.6), 150, 2500) * np.exp(-t * 30))
print(sorted(os.listdir(OUT)))
