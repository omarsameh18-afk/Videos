# Light ambient bed for a "what if" timeline episode, synthesized in code (free, no credits). From episode 07.
# Two stereo stems at their final mix level:
#   bed.wav  - a soft warm pad (A minor add9 / F maj7 / C / G, slow) that thins out as time passes, while the world gets more
#              "empty/natural": wind rises from --wind, birds start at --birds and get busier; at night (--night a,b) the
#              birds stay quiet and a few crickets chirp. From --sig (on "استنى") everything drops to one held low note + wind
#              (the mystery); on --reveal (الأهرامات) a warm golden major chord swells; it resolves to C major on --resolve
#              (index of "الفهمان") and is silent by the last frame (loop).
#   hits.wav - a soft whoosh on every time chip (--chips t,t,...) and a soft low hit on --reveal.
# The bed is set N dB (default 20) under the voice by loudness (LUFS), and never above that by plain RMS either.
# usage: python3 series/elfahman/tools/ambient_bed.py <words.json> <voice.mp3> <out_dir> --end <s> --chips t,t,... --wind <s>
#          --birds <s> --night a,b --sig <s> --reveal <s> --resolve i [--under 20]
import argparse, json, os, re, subprocess, wave
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('words'); ap.add_argument('voice'); ap.add_argument('out')
ap.add_argument('--end', type=float, required=True)
ap.add_argument('--chips', required=True)
ap.add_argument('--wind', type=float, required=True); ap.add_argument('--birds', type=float, required=True)
ap.add_argument('--night', required=True); ap.add_argument('--sig', type=float, required=True); ap.add_argument('--reveal', type=float, required=True)
ap.add_argument('--resolve', type=int, required=True)
ap.add_argument('--under', type=float, default=20.0)
A = ap.parse_args()
SR = 48000
W = json.load(open(A.words, encoding='utf-8'))
N = int(A.end * SR); t = np.arange(N) / SR
chips = [float(x) for x in A.chips.split(',')]
n0, n1 = [float(x) for x in A.night.split(',')]
t_res = W[A.resolve]['s']; t_bell = W[A.resolve + 1]['s']
rng = np.random.default_rng(7)

def spec_filter(x, lo=None, hi=None):
    """zero-phase band filter in the frequency domain (smooth 1-octave skirts)"""
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR) + 1e-3; g = np.ones_like(f)
    if hi: g *= 1 / (1 + (f / hi) ** 4)
    if lo: g *= 1 / (1 + (lo / f) ** 4)
    return np.fft.irfft(X * g, len(x))
def ramp(t0, t1): return np.clip((t - t0) / max(1e-6, t1 - t0), 0, 1)
def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)
def saw(f, ph=0.0, n=6): return sum(np.sin(2 * np.pi * f * k * t + ph * k) / k for k in range(1, n + 1))

# ---------------------------------------------------------------- pad: slow chord changes with long cross-fades
CH = [[45, 52, 59, 60, 64], [41, 48, 55, 57, 64], [48, 55, 60, 64, 67], [43, 50, 55, 59, 62]]   # Am(add9) Fmaj7 C G
BAR = 4.0
pad = np.zeros(N)
for k, c in enumerate(CH):
    sig = sum(saw(mtof(m) * (1 + 0.0015 * (i - 2)), ph=i * 0.7) * (0.6 if i == 0 else 0.35) for i, m in enumerate(c))
    # this chord's share of the timeline: on during its bar of every 4-bar cycle, with 1 s cross-fades
    ph = ((t / BAR) - k) % len(CH)
    env = np.clip(np.where(ph < 1, np.minimum(1, ph * BAR / 1.0), 1 - (ph - 1) * BAR / 1.0), 0, 1)
    pad += sig * env
pad = spec_filter(pad, 70, 900)
thin = 1 - 0.65 * ramp(4, A.sig)                  # the city fades out of the music: the pad thins as time passes
# ---------------------------------------------------------------- wind: filtered noise with slow gusts, rising over time
wn = spec_filter(rng.normal(0, 1, N), 180, 900)
gust = 0.55 + 0.45 * np.sin(2 * np.pi * 0.11 * t + 1) * np.sin(2 * np.pi * 0.047 * t)
wind = wn * gust * (0.15 + 0.85 * ramp(A.wind, A.sig))
wind2 = spec_filter(rng.normal(0, 1, N), 250, 1300) * gust   # the desert: a stronger sandy wind in the mystery
# ---------------------------------------------------------------- birds and crickets
birds = np.zeros((N, 2))
def chirp(t0, f0, f1, dur, g, pan):
    d = np.arange(int(dur * SR)) / SR
    f = f0 + (f1 - f0) * (d / dur) ** 0.7
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * d / dur) ** 2 * g
    i0 = int(t0 * SR); n = min(len(x), N - i0)
    if n > 0: birds[i0:i0 + n, 0] += x[:n] * (1 - pan); birds[i0:i0 + n, 1] += x[:n] * (1 + pan)
tt = A.birds
while tt < A.sig - 0.5:
    dens = 0.3 + 0.7 * min(1, (tt - A.birds) / (A.sig - A.birds))
    if not (n0 - 0.2 < tt < n1):
        pan = rng.uniform(-0.7, 0.7); f0 = rng.uniform(2600, 4200); g = rng.uniform(0.5, 1)
        for j in range(rng.integers(2, 5)):   # a little phrase of 2-4 chirps
            chirp(tt + j * 0.11, f0 * rng.uniform(0.95, 1.05), f0 * rng.uniform(1.2, 1.6), 0.08, g, pan)
    tt += rng.uniform(0.5, 1.4) / dens
for tt in np.arange(n0 + 0.4, n1, 0.62):      # crickets at night
    for j in range(3): chirp(tt + j * 0.05, 4400, 4500, 0.035, 0.35, 0.4 * np.sin(tt))
# ---------------------------------------------------------------- the mystery: one held low note (A1 + A2) from "استنى"
A1 = mtof(33)
note = np.sin(2 * np.pi * A1 * t) + 0.5 * np.sin(2 * np.pi * 2 * A1 * t + 0.4) + 0.2 * np.sin(2 * np.pi * 3 * A1 * t)
mys = ramp(A.sig, A.sig + 0.08) * (1 - ramp(A.reveal - 0.03, A.reveal + 0.15))
# ---------------------------------------------------------------- golden reveal chord (A major) and the C major resolve
gold = np.zeros(N)
for m, g in ((57, 0.6), (61, 0.45), (64, 0.45), (69, 0.35), (73, 0.25), (45, 0.5)):
    gold += g * saw(mtof(m), ph=m * 0.1, n=4)
gold = spec_filter(gold, 80, 1600)
g_env = ramp(A.reveal - 0.02, A.reveal + 0.35) * (1 - 0.55 * ramp(A.reveal + 0.8, A.reveal + 2.5)) * (1 - ramp(t_res - 0.6, t_res))
maj = sum(g * saw(mtof(m), ph=m * 0.2, n=4) for m, g in ((48, 0.6), (55, 0.4), (60, 0.4), (64, 0.4), (67, 0.3)))
maj = spec_filter(maj, 70, 1200)
m_env = ramp(t_res - 0.1, t_res + 0.4)
bell = np.zeros(N)
for f, g, dly in ((mtof(76), 1.0, 0.0), (mtof(79), 0.7, 0.07), (mtof(84), 0.5, 0.14)):
    d = np.clip(t - t_bell - dly, 0, None); bell += g * np.sin(2 * np.pi * f * d) * np.exp(-d * 3.2) * (t >= t_bell + dly)

base = (1 - mys) * (1 - ramp(A.reveal - 0.03, A.reveal + 0.1) * (1 - ramp(t_res - 0.3, t_res + 0.3)))  # timeline section only
mono = (0.5 * pad * thin * base * (1 - m_env) + 0.22 * wind * (1 - m_env) * (1 - 0.6 * ramp(A.reveal, A.reveal + 1))
        + mys * (0.4 * note + 0.32 * wind2) + 0.45 * gold * g_env + 0.4 * maj * m_env + 0.12 * bell)
env = ramp(0, 0.15) * (1 - ramp(A.end - 0.42, A.end - 0.03))
Lb = (mono + 0.09 * birds[:, 0]) * env
Rb = (mono + 0.09 * birds[:, 1]) * env + 0.0
bed = np.stack([Lb, np.roll(Rb, 240)], 1)

# ---------------------------------------------------------------- hits: chip whooshes + one soft low hit on the reveal
hits = np.zeros((N, 2))
for c in chips:
    d = np.arange(int(0.6 * SR)) / SR; i0 = int((c - 0.18) * SR)
    nz = rng.normal(0, 1, len(d))
    sweep = np.concatenate([spec_filter(nz[k:k + 2400], 300 + 3000 * (k / len(d)), 1200 + 5000 * (k / len(d))) for k in range(0, len(d), 2400)])[:len(d)]
    x = sweep * np.sin(np.pi * np.clip(d / 0.5, 0, 1)) ** 2 * 0.5
    n = min(len(x), N - i0)
    if n > 0 and i0 >= 0: hits[i0:i0 + n, 0] += x[:n]; hits[i0:i0 + n, 1] += x[:n] * 0.85
d = np.arange(int(1.5 * SR)) / SR
boom = np.sin(2 * np.pi * np.cumsum(60 * np.exp(-d * 5) + 40) / SR) * np.exp(-d * 4) * (1 - np.exp(-d * 250))
i0 = int(A.reveal * SR); n = min(len(boom), N - i0); hits[i0:i0 + n] += boom[:n, None] * 1.4

def lufs(path):
    out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS', out)[-1])
def rms_db(x): return 10 * np.log10((x ** 2).mean() + 1e-12)
def save(p, x):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with wave.open(p, 'wb') as f:
        f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
    return p

v = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', A.voice, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout, np.float32)
v_lufs, v_rms = lufs(A.voice), rms_db(v[np.abs(v) > 10 ** (-50 / 20)])
bed = bed / np.abs(bed).max() * 0.25
p = save(os.path.join(A.out, 'bed.wav'), bed)
g = min((v_lufs - A.under) - lufs(p), (v_rms - A.under) - rms_db(bed))
bed = bed * 10 ** (g / 20); p = save(os.path.join(A.out, 'bed.wav'), bed)
vpk = 20 * np.log10(np.abs(v).max())
hits = hits / np.abs(hits).max() * 10 ** ((vpk - 14) / 20)
save(os.path.join(A.out, 'hits.wav'), hits)
print(f'voice {v_lufs:.1f} LUFS (spoken RMS {v_rms:.1f} dB) | bed {lufs(p):.1f} LUFS (RMS {rms_db(bed):.1f} dB) -> bed is {v_lufs - lufs(p):.1f} LU / {v_rms - rms_db(bed):.1f} dB under the voice')
print(f'chips: {len(chips)} whooshes | wind from {A.wind:.2f}, birds from {A.birds:.2f}, night {n0:.2f}-{n1:.2f}, mystery {A.sig:.2f}-{A.reveal:.2f}, resolve {t_res:.2f}, bell {t_bell:.2f}, silent by {A.end:.2f}')
