# Synthesized glass-shatter SFX (royalty-free, generated): crack transient + bright pings + shard tinkle tail.
# usage: python3 scripts/make-glass-sfx.py  -> assets/audio/glass.wav
import numpy as np, wave
sr = 48000; dur = 1.1; n = int(sr * dur); t = np.arange(n) / sr
rng = np.random.default_rng(7)
out = np.zeros(n)
# crack: high-passed noise burst
noise = rng.standard_normal(n)
hp = np.diff(noise, prepend=0); hp = np.diff(hp, prepend=0)
out += 0.9 * hp / np.abs(hp).max() * np.exp(-t / 0.035)
# pings: many short high sines with random onsets
for k in range(38):
    on = rng.uniform(0, 0.55) ** 1.6
    f = rng.uniform(2400, 9000)
    dec = rng.uniform(0.02, 0.12)
    amp = rng.uniform(0.15, 0.5) * (1 - on)
    m = t >= on
    tt = t[m] - on
    out[m] += amp * np.sin(2 * np.pi * f * tt + rng.uniform(0, 6)) * np.exp(-tt / dec)
# tinkle tail: sparse clicks of filtered noise
for k in range(60):
    on = rng.uniform(0.08, 0.95); i = int(on * sr); L = int(0.012 * sr)
    if i + L < n: out[i:i + L] += rng.uniform(0.05, 0.2) * hp[i:i + L] / np.abs(hp).max() * np.exp(-np.arange(L) / (0.003 * sr))
out *= 0.89 / np.abs(out).max()
with wave.open('assets/audio/glass.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
    w.writeframes((out * 32767).astype('<i2').tobytes())
print('assets/audio/glass.wav')
