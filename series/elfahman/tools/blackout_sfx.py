# Episode 17 sound effects, synthesized (0 credits): clunk (power going off), fizzle (bulb dies), click (wall switch), squeak (tap),
# sputter (tap coughs one drop), hum (electric hum), lowbatt (phone low-battery beep), tapscreen, deadbeep (cash machine), creak (freezer
# door), drip, crickets, clack (domino), chuckle (soft laughter), flip (calendar pages), crackle (telegraph sparks).
# usage: python3 series/elfahman/tools/blackout_sfx.py  -> public/elfahman/blackout/sfx/*.wav (48 kHz mono, peak -3 dBFS)
import os, wave, numpy as np
SR = 48000; OUT = 'public/elfahman/blackout/sfx/'; os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(17)
T = lambda d: np.arange(int(d * SR)) / SR
def save(n, x):
    x = x / (np.abs(x).max() + 1e-9) * 0.7
    with wave.open(OUT + n + '.wav', 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes())
def noise(d): return rng.standard_normal(int(d * SR))
def bp(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X[(f < lo) | (f > hi)] = 0; return np.fft.irfft(X, len(x))
def place(buf, x, at):
    i = int(at * SR); n = max(0, min(len(x), len(buf) - i)); buf[i:i + n] += x[:n]
def fade(x, a=0.01, b=0.05):
    n = len(x); e = np.ones(n); ia, ib = int(a * SR), int(b * SR)
    if ia: e[:ia] = np.linspace(0, 1, ia)
    if ib: e[-ib:] = np.linspace(1, 0, ib)
    return x * e

# clunk: a soft heavy relay "clunk" + the mains hum dropping away
t = T(0.6); thump = np.sin(2 * np.pi * (90 - 40 * t) * t) * np.exp(-t * 14)
click = bp(noise(0.6), 600, 3000) * np.exp(-t * 60) * 0.6
hum = (np.sin(2 * np.pi * 100 * t) + 0.4 * np.sin(2 * np.pi * 200 * t)) * np.exp(-t * 9) * 0.25
save('clunk', fade(thump + click + hum, 0.002, 0.1))
# fizzle: filament buzz with stutters, then a tiny tick
t = T(0.5); buzz = np.sign(np.sin(2 * np.pi * 120 * t)) * bp(noise(0.5), 800, 5000) * 0.4
gate = (np.sin(2 * np.pi * 23 * t) > 0) * np.exp(-t * 4)
b = buzz * gate; place(b, bp(noise(0.03), 2000, 8000) * np.exp(-T(0.03) * 150), 0.42); save('fizzle', fade(b, 0.002, 0.04))
# click: plastic wall switch
t = T(0.08); save('click', bp(noise(0.08), 1500, 9000) * np.exp(-t * 140) + 0.5 * np.sin(2 * np.pi * 3100 * t) * np.exp(-t * 200))
# squeak: tap handle squeak
t = T(0.35); f = 900 + 500 * np.sin(np.pi * t / 0.35); ph = 2 * np.pi * np.cumsum(f) / SR
save('squeak', fade(sum(np.sin(k * ph) / k for k in range(1, 6)) * (0.6 + 0.4 * np.sin(2 * np.pi * 30 * t)), 0.02, 0.08))
# sputter: air cough + one drop "plink" + dry hiss
b = np.zeros(int(1.4 * SR))
for k, at in enumerate([0.0, 0.12, 0.2, 0.34]):
    d = 0.09; tt = T(d); place(b, bp(noise(d), 200, 2500) * np.exp(-tt * 30) * (1 - 0.15 * k), at)
tt = T(0.25); place(b, np.sin(2 * np.pi * (1400 + 900 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 20) * 0.6, 0.62)
tt = T(0.5); place(b, bp(noise(0.5), 3000, 9000) * np.exp(-tt * 6) * 0.15, 0.8)
save('sputter', fade(b, 0.002, 0.1))
# hum: soft electric hum (mains + a little buzz), 2.4 s with fades
t = T(2.4); h = np.sin(2 * np.pi * 100 * t) + 0.5 * np.sin(2 * np.pi * 200 * t) + 0.2 * np.sin(2 * np.pi * 300 * t) + 0.1 * bp(noise(2.4), 2000, 6000)
save('hum', fade(h, 0.3, 0.6))
# lowbatt: two falling soft beeps
b = np.zeros(int(0.6 * SR))
for at, f in [(0, 1320), (0.2, 990)]:
    tt = T(0.14); place(b, fade(np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt), 0.005, 0.03), at)
save('lowbatt', b)
# tapscreen: three finger taps on glass
b = np.zeros(int(0.7 * SR))
for at in [0, 0.18, 0.36]: tt = T(0.05); place(b, bp(noise(0.05), 1000, 6000) * np.exp(-tt * 120), at)
save('tapscreen', b)
# deadbeep: a low dead "bonk" (machine error), then nothing
t = T(0.5); save('deadbeep', fade(np.sign(np.sin(2 * np.pi * 220 * t)) * 0.4 * np.exp(-t * 6) + np.sin(2 * np.pi * 110 * t) * np.exp(-t * 6), 0.005, 0.1))
# creak: freezer door creak
t = T(0.7); f = 160 + 60 * np.sin(2 * np.pi * 1.3 * t); ph = 2 * np.pi * np.cumsum(f) / SR
pulses = (np.sin(ph) > 0.92).astype(float)
save('creak', fade(bp(pulses + 0.05 * noise(0.7), 300, 3000), 0.05, 0.15))
# drip: 5 water drips over 2.5 s
b = np.zeros(int(2.6 * SR))
for k, at in enumerate([0, 0.55, 1.0, 1.6, 2.1]):
    tt = T(0.18); place(b, np.sin(2 * np.pi * (900 + 700 * np.exp(-tt * 40) + 60 * k) * tt) * np.exp(-tt * 25), at)
save('drip', b)
# crickets: chirps over 3 s
b = np.zeros(int(3.0 * SR))
for k in range(9):
    at = 0.1 + k * 0.32 + rng.uniform(0, 0.06); tt = T(0.12)
    env = (np.sin(2 * np.pi * 40 * tt) > 0) * np.exp(-tt * 10)
    place(b, np.sin(2 * np.pi * 4300 * tt) * env * (0.6 + 0.4 * rng.uniform()), at)
save('crickets', fade(b, 0.2, 0.5))
# clack: a domino slapped on wood
t = T(0.3); save('clack', fade(bp(noise(0.3), 700, 5000) * np.exp(-t * 50) + 0.7 * np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 70) + 0.5 * np.sin(2 * np.pi * 180 * t) * np.exp(-t * 25), 0.001, 0.05))
# chuckle: soft "ha-ha-ha" from a few voices (vowel formant bursts on a glottal buzz)
def ha(f0, d=0.13):
    tt = T(d); ph = 2 * np.pi * f0 * tt; src = sum(np.sin(k * ph) / k for k in range(1, 20))
    x = bp(src, 500, 900) + 0.6 * bp(src, 1000, 1400) + 0.15 * bp(noise(d), 1500, 4000)
    return fade(x * np.sin(np.pi * tt / d), 0.01, 0.02)
b = np.zeros(int(1.6 * SR))
for v, (f0, off) in enumerate([(140, 0), (190, 0.06), (115, 0.12)]):
    for k in range(4): place(b, ha(f0 * (1 - 0.03 * k)) * (1 - 0.15 * k) * 0.7, off + k * 0.2)
save('chuckle', fade(b, 0.02, 0.2))
# flip: fast paper flutter, 1.8 s
b = np.zeros(int(1.9 * SR))
for k in range(26):
    at = k * 0.065; tt = T(0.05); place(b, bp(noise(0.05), 1500, 7000) * np.exp(-tt * 70) * (0.5 + 0.5 * rng.uniform()), at)
save('flip', fade(b, 0.005, 0.2))
# crackle: electric sparks
b = np.zeros(int(1.6 * SR))
for k in range(60):
    at = rng.uniform(0, 1.4); d = rng.uniform(0.004, 0.02); tt = T(d)
    place(b, bp(noise(d), 2000, 12000) * np.exp(-tt * 300) * rng.uniform(0.3, 1), at)
tt = T(1.6); b += np.sign(np.sin(2 * np.pi * 120 * tt)) * bp(noise(1.6), 300, 2000) * 0.05 * np.exp(-tt * 2)
save('crackle', fade(b, 0.002, 0.2))
print('ok', sorted(os.listdir(OUT)))
