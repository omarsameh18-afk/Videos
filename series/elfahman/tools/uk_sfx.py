# Episode 15 sound effects, synthesized (0 credits): shing, trot, hooves (+ wheel creak), whip, drumroll, march, honk, puff.
# usage: python3 series/elfahman/tools/uk_sfx.py  -> public/elfahman/ukleft/sfx/*.wav (48 kHz mono, peak -3 dBFS)
import os, wave, numpy as np
SR = 48000; OUT = 'public/elfahman/ukleft/sfx/'; os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(15)
T = lambda d: np.arange(int(d * SR)) / SR
def save(n, x):
    x = x / (np.abs(x).max() + 1e-9) * 0.7
    with wave.open(OUT + n + '.wav', 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes())
def noise(d): return rng.standard_normal(int(d * SR))
def bp(x, lo, hi):  # crude FFT band-pass
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X[(f < lo) | (f > hi)] = 0; return np.fft.irfft(X, len(x))
def clop(d=0.09, f0=900):
    t = T(d); return bp(noise(d), 300, 2500) * np.exp(-t * 60) + 0.6 * np.sin(2 * np.pi * f0 * t) * np.exp(-t * 80)
def place(buf, x, at):
    i = int(at * SR); buf[i:i + len(x)] += x[:len(buf) - i]
# shing: metallic ring with a sliding scrape
t = T(1.0); ring = sum(np.sin(2 * np.pi * f * t) * a for f, a in [(2630, 1), (3950, .6), (5270, .4), (7100, .25)]) * np.exp(-t * 4)
scrape = bp(noise(1.0), 3000, 9000) * np.exp(-((t - 0.12) / 0.1) ** 2)
save('shing', ring * np.clip(t / 0.15, 0, 1) + 0.8 * scrape)
# trot: two-beat clip-clop for 2 s
b = np.zeros(int(2.2 * SR))
for k in range(8): place(b, clop(f0=850 + 120 * (k % 2)), k * 0.26); place(b, 0.7 * clop(f0=760), k * 0.26 + 0.09)
save('trot', b)
# hooves (team of 4, busier) + wheel creak
b = np.zeros(int(2.6 * SR))
for k in range(16): place(b, (0.6 + 0.4 * rng.random()) * clop(f0=700 + 300 * rng.random()), k * 0.14 + 0.03 * rng.random())
t = T(2.6); creak = np.sin(2 * np.pi * (180 + 60 * np.sin(2 * np.pi * 0.8 * t)) * t) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.8 * t)) ** 4
save('hooves', b + 0.35 * bp(creak + 0.3 * noise(2.6) * creak, 150, 1800))
# whip crack: whoosh then a sharp crack
t = T(0.5); wh = bp(noise(0.5), 800, 5000) * np.exp(-((t - 0.15) / 0.07) ** 2) * 0.5
cr = np.zeros_like(t); i = int(0.22 * SR); n = int(0.03 * SR); cr[i:i + n] = noise(0.03)[:n] * np.exp(-np.arange(n) / SR * 200) * 2.5
save('whip', wh + cr)
# drum roll -> hit (1.4 s)
t = T(1.6); b = np.zeros_like(t)
for k in range(int(1.2 / 0.045)):
    tt = T(0.06); place(b, (0.35 + 0.45 * k / 26) * bp(noise(0.06), 200, 4000) * np.exp(-tt * 70), k * 0.045)
tt = T(0.4); place(b, 1.2 * (np.sin(2 * np.pi * 90 * tt) * np.exp(-tt * 9) + 0.5 * bp(noise(0.4), 200, 6000) * np.exp(-tt * 14)), 1.2)
save('drumroll', b)
# march: boots + snare, 2.4 s
b = np.zeros(int(2.6 * SR))
for k in range(10):
    tt = T(0.12); place(b, 0.8 * bp(noise(0.12), 80, 900) * np.exp(-tt * 40), k * 0.24)
    if k % 2 == 0: place(b, 0.5 * bp(noise(0.12), 1500, 7000) * np.exp(-tt * 35), k * 0.24 + 0.01)
save('march', b)
# honk: two cartoon car horns
t = T(0.35); h1 = np.sign(np.sin(2 * np.pi * 400 * t)) * 0.4 + np.sin(2 * np.pi * 500 * t) * 0.6
env = np.clip(t / 0.02, 0, 1) * np.clip((0.35 - t) / 0.05, 0, 1)
b = np.zeros(int(1.1 * SR)); place(b, bp(h1 * env, 200, 3000), 0); t2 = T(0.45)
h2 = np.sign(np.sin(2 * np.pi * 330 * t2)) * 0.4 + np.sin(2 * np.pi * 415 * t2) * 0.6
place(b, bp(h2 * np.clip(t2 / 0.02, 0, 1) * np.clip((0.45 - t2) / 0.05, 0, 1), 200, 3000), 0.45); save('honk', b)
# comic puff: soft low thump + airy burst
t = T(0.7); save('puff', np.sin(2 * np.pi * (120 - 60 * t) * t) * np.exp(-t * 10) + 0.8 * bp(noise(0.7), 300, 4000) * np.exp(-t * 7) * np.clip(t / 0.02, 0, 1))
print(sorted(os.listdir(OUT)))
