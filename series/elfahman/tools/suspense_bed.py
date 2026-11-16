# Suspense music bed + soft hits, synthesized in code (free, no credits). Two stereo stems at their final mix level:
#   bed.wav  - a quiet low drone in D minor with a slow heartbeat pulse; in each drama pause everything drops away and
#              ONE low note holds; it resolves to D major on the closing line and is silent by the last frame (loop)
#   hits.wav - soft low hits on chosen words (the numbers, the reveals, the word after each drama pause)
# The bed is set N dB (default 20) under the voice by loudness (LUFS), and never above that by plain RMS either.
# usage: python3 series/elfahman/tools/suspense_bed.py <words.json> <voice.mp3> <out_dir> --end <video seconds>
#          --drama i,i,i (index of the word before each drama pause) --hits i,i,... --resolve <index of the first closing word>
#          [--under 20]
import argparse, json, os, re, subprocess, wave
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('words'); ap.add_argument('voice'); ap.add_argument('out')
ap.add_argument('--end', type=float, required=True)
ap.add_argument('--drama', default=''); ap.add_argument('--hits', default=''); ap.add_argument('--resolve', type=int, required=True)
ap.add_argument('--under', type=float, default=20.0)
A = ap.parse_args()
SR = 48000
W = json.load(open(A.words, encoding='utf-8'))
N = int(A.end * SR); t = np.arange(N) / SR
ints = lambda s: [int(x) for x in s.split(',') if x]
drama = [(W[i]['e'], W[i + 1]['s']) for i in ints(A.drama)]
hit_times = sorted([W[i]['s'] for i in ints(A.hits)] + [p1 for _, p1 in drama])
t_res = W[A.resolve]['s']; t_bell = W[A.resolve + 1]['s']

def lp(x, fc):   # one-pole low-pass (run twice for a softer top)
    a = 1 - np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); s = 0.0
    for i in range(len(x)): s += a * (x[i] - s); y[i] = s
    return y
def ramp(t0, t1): return np.clip((t - t0) / max(1e-6, t1 - t0), 0, 1)
def saw(f, ph=0.0, n=7): return sum(np.sin(2 * np.pi * f * k * t + ph * k) / k for k in range(1, n + 1))
rng = np.random.default_rng(5)

# envelopes: "hold" = 1 inside a drama pause (everything but the one low note drops away); "minor" fades out at the resolve
hold = np.zeros(N)
for p0, p1 in drama: hold = np.maximum(hold, ramp(p0, p0 + 0.18) * (1 - ramp(p1 - 0.02, p1 + 0.12)))
minor = 1 - ramp(t_res - 0.15, t_res + 0.35)
major = ramp(t_res - 0.05, t_res + 0.5)
slow = 0.82 + 0.18 * np.sin(2 * np.pi * 0.11 * t + 1.0)
swell = np.ones(N)
for h in hit_times: swell += 0.35 * np.exp(-np.clip(t - h, 0, None) * 1.6) * (t >= h)   # the bed breathes out after each hit

D1, D2, A2, D3, F3, Fs3, A3, D4, E5, F5 = 36.71, 73.42, 110.0, 146.83, 174.61, 185.0, 220.0, 293.66, 659.25, 698.46
# the one low note: D2 (+ a little D3 so it is still there on a phone speaker); it is the only thing left in a drama pause
note = np.sin(2 * np.pi * D2 * t) + 0.45 * np.sin(2 * np.pi * D3 * t + 0.4) + 0.3 * np.sin(2 * np.pi * D1 * t)
# pad: detuned low strings (D2, A2, D3 and the minor third F3), darker = low-passed
padL = saw(D2 * 0.997) * 0.9 + saw(A2 * 1.002, 0.7) * 0.45 + saw(D3 * 1.003, 1.3) * 0.5 + minor * saw(F3 * 0.998, 2.1) * 0.42 + major * saw(Fs3 * 0.999, 2.1) * 0.4 + major * saw(A3, 0.3) * 0.3
padR = saw(D2 * 1.003, 0.5) * 0.9 + saw(A2 * 0.998, 1.9) * 0.45 + saw(D3 * 0.997, 0.2) * 0.5 + minor * saw(F3 * 1.002, 0.9) * 0.42 + major * saw(Fs3 * 1.001, 0.9) * 0.4 + major * saw(A3 * 1.002, 1.1) * 0.3
padL, padR = lp(lp(padL, 520), 520), lp(lp(padR, 520), 520)
# tension: a faint high minor second (E5 + F5) with a slow tremolo; gone at the resolve
trem = 0.6 + 0.4 * np.sin(2 * np.pi * 5.1 * t)
tens = (np.sin(2 * np.pi * E5 * t) + 0.8 * np.sin(2 * np.pi * F5 * t + 1)) * trem * (0.5 + 0.5 * np.sin(2 * np.pi * 0.07 * t - 1.2)) * minor
# heartbeat: two soft low thumps every 1.25 s (stops in a drama pause and at the resolve)
beat = np.zeros(N)
bt = 0.6
while bt < t_res - 0.3:
    for off, g in ((0.0, 1.0), (0.24, 0.6)):
        i0 = int((bt + off) * SR); d = np.arange(int(0.3 * SR)) / SR
        th = np.sin(2 * np.pi * np.cumsum(58 * np.exp(-d * 9) + 44) / SR) * np.exp(-d * 13) * g
        if i0 + len(th) < N: beat[i0:i0 + len(th)] += th
    bt += 1.25
# resolve: a soft bell (F#5 + A5 + D6) on the last word
bell = np.zeros(N)
for f, g, dly in ((739.99, 1.0, 0.0), (880.0, 0.7, 0.07), (1174.66, 0.5, 0.14)):
    d = np.clip(t - t_bell - dly, 0, None); bell += g * np.sin(2 * np.pi * f * d) * np.exp(-d * 3.2) * (t >= t_bell + dly)

quiet = 1 - hold   # the rest of the bed during a drama pause
core = (0.5 + 0.25 * hold) * note * (0.9 + 0.1 * slow)
L = core + quiet * swell * slow * (0.5 * padL + 0.035 * tens) + quiet * 0.8 * beat * minor + 0.16 * bell
R = core + quiet * swell * slow * (0.5 * padR + 0.035 * np.roll(tens, 400)) + quiet * 0.8 * beat * minor + 0.16 * np.roll(bell, 300)
# in / out: starts with the picture (the loop cuts in), is silent by the last frame
env = ramp(0, 0.25) * (1 - ramp(A.end - 0.42, A.end - 0.03)) * (1 - 0.35 * ramp(t_res + 0.6, A.end))
bed = np.stack([L * env, R * env], 1)

# soft hits: a low boom + a muted low piano-like note + a breath of noise
hits = np.zeros((N, 2))
for h in hit_times:
    d = np.arange(int(1.6 * SR)) / SR
    boom = np.sin(2 * np.pi * np.cumsum(64 * np.exp(-d * 5) + 40) / SR) * np.exp(-d * 4.2)
    tone = (np.sin(2 * np.pi * D3 * d) + 0.5 * np.sin(2 * np.pi * A3 * d) + 0.25 * np.sin(2 * np.pi * D4 * d)) * np.exp(-d * 5.5) * (1 - np.exp(-d * 400))
    air = lp(rng.normal(0, 1, len(d)), 900) * np.exp(-d * 9) * 0.5
    x = (boom + 0.55 * tone + air) * (1 - np.exp(-d * 250))
    i0 = int(h * SR); n = min(len(x), N - i0)
    if n > 0: hits[i0:i0 + n, 0] += x[:n]; hits[i0:i0 + n, 1] += x[:n]

def lufs(path):
    out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS', out)[-1])
def rms_db(x): return 10 * np.log10((x ** 2).mean() + 1e-12)
def save(name, x):
    os.makedirs(A.out, exist_ok=True); p = os.path.join(A.out, name)
    with wave.open(p, 'wb') as f:
        f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
    return p

v = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', A.voice, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout, np.float32)
v_lufs, v_rms = lufs(A.voice), rms_db(v[np.abs(v) > 10 ** (-50 / 20)])   # RMS of the spoken parts only
bed = bed / np.abs(bed).max() * 0.25
p = save('bed.wav', bed)
g = (v_lufs - A.under) - lufs(p)                       # by loudness
g = min(g, (v_rms - A.under) - rms_db(bed))            # ...and never above -N dB by plain RMS either
bed = bed * 10 ** (g / 20); p = save('bed.wav', bed)
hits = hits / np.abs(hits).max() * 10 ** ((20 * np.log10(np.abs(v).max()) - 13) / 20)   # hit peaks 13 dB under the voice peaks
save('hits.wav', hits)
print(f'voice {v_lufs:.1f} LUFS (spoken RMS {v_rms:.1f} dB) | bed {lufs(p):.1f} LUFS (RMS {rms_db(bed):.1f} dB) -> bed is {v_lufs - lufs(p):.1f} LU / {v_rms - rms_db(bed):.1f} dB under the voice')
print(f'hits: {len(hit_times)} at ' + ', '.join(f'{h:.2f}' for h in hit_times) + f' | peak {20 * np.log10(np.abs(hits).max()):.1f} dBFS (voice peak {20 * np.log10(np.abs(v).max()):.1f})')
print(f'drama pauses: ' + ', '.join(f'{a:.2f}-{b:.2f}' for a, b in drama) + f' | resolve at {t_res:.2f}, bell at {t_bell:.2f}, silent by {A.end:.2f}')
