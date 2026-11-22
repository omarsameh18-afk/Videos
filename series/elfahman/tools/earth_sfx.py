# Episode 11 sound effects, synthesized (0 credits): tyre/brake screech, wind gust, wave crash, stopwatch tick-tock loop.
# usage: python3 series/elfahman/tools/earth_sfx.py public/elfahman/earth/sfx
import sys, wave, numpy as np
out = sys.argv[1]; SR = 44100; rng = np.random.default_rng(11)
def save(n, y):
    y = y / (np.abs(y).max() + 1e-9) * 0.89
    with wave.open(f'{out}/{n}.wav', 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((y * 32767).astype(np.int16).tobytes())
def env(n, a, r):
    t = np.arange(n) / SR; return np.minimum(1, t / a) * np.exp(-np.maximum(0, t - a) / r)
def lp(x, k):  # one-pole low-pass, k in 0..1
    y = np.zeros_like(x); s = 0.0
    for i, v in enumerate(x): s += k * (v - s); y[i] = s
    return y
# screech: a squealing partial sweeping down 2600 -> 1500 Hz with fast vibrato + rough noise, 0.75 s
n = int(0.75 * SR); t = np.arange(n) / SR
f = 2600 - 1100 * (t / t[-1]) ** 0.7 + 60 * np.sin(2 * np.pi * 38 * t)
ph = 2 * np.pi * np.cumsum(f) / SR
sq = np.sin(ph) + 0.45 * np.sin(2 * ph + 0.3) + 0.2 * np.sin(3 * ph)
noise = rng.standard_normal(n); rough = noise - lp(noise, 0.25)
y = (sq * (0.75 + 0.25 * np.sin(2 * np.pi * 23 * t)) + 0.35 * rough) * env(n, 0.02, 0.45)
save('screech', y)
# wind gust: band-limited noise swelling and fading, 2.4 s
n = int(2.4 * SR); t = np.arange(n) / SR
x = lp(rng.standard_normal(n), 0.08); x = x - lp(x, 0.01)
g = np.sin(np.pi * t / t[-1]) ** 1.5 * (0.7 + 0.3 * np.sin(2 * np.pi * 0.9 * t))
save('wind', x * g)
# wave crash: low rumble burst + hiss tail, 1.6 s
n = int(1.6 * SR); t = np.arange(n) / SR
r = lp(rng.standard_normal(n), 0.02) * 6; h = rng.standard_normal(n) - lp(rng.standard_normal(n), 0.3)
save('crash', r * env(n, 0.03, 0.35) + 0.25 * h * env(n, 0.08, 0.6))
