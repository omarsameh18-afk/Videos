# Episode 13 variant of curious_bed.py: after the scratch the BRIGHT bed comes back at --dark (no minor section).
# Light "curious story" music bed + soft hits + record scratch, synthesized in code (free, no credits). From episode 06.
# Three stereo stems at their final mix level, plus episode sound effects:
#   bed.wav     - a light plucked marimba/pizzicato pattern over a soft pad (D major, a lydian lift = "curious").
#                 --dark <t>: from here it turns darker and cooler (B minor, lower, softer).
#                 --winter <t>: from here a slow cold pad + high shimmer (aurora), sparse bell notes.
#                 In each drama pause everything drops away and ONE low note holds. A record scratch (--scratch <t>) stops
#                 the bed dead; only the low note stays until the next section (--dark). It resolves to D major on the
#                 closing line (--resolve <word index>) and is silent by the last frame (loop).
#   hits.wav    - soft low hits on chosen words (+ the word after each drama pause)
#   scratch.wav - the record scratch itself (made from the bed's own audio, scrubbed back and forth), placed at --scratch
#   sfx/crack.wav, sfx/tick.wav - a glass crack and a clock tick (episode sounds)
# The bed is set N dB (default 20) under the voice by loudness (LUFS), and never above that by plain RMS either.
# usage: python3 series/elfahman/tools/curious_bed.py <words.json> <voice.mp3> <out_dir> --end <s> --drama i,i,i --hits i,...
#          --resolve i --scratch <s> --dark <s> --winter <s> [--under 20]
import argparse, json, os, re, subprocess, wave
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('words'); ap.add_argument('voice'); ap.add_argument('out')
ap.add_argument('--end', type=float, required=True)
ap.add_argument('--drama', default=''); ap.add_argument('--hits', default=''); ap.add_argument('--resolve', type=int, required=True)
ap.add_argument('--scratch', type=float, required=True); ap.add_argument('--dark', type=float, required=True); ap.add_argument('--winter', type=float, required=True)
ap.add_argument('--under', type=float, default=20.0)
A = ap.parse_args()
SR = 48000
W = json.load(open(A.words, encoding='utf-8'))
N = int(A.end * SR); t = np.arange(N) / SR
ints = lambda s: [int(x) for x in s.split(',') if x]
drama = [(W[i]['e'], W[i + 1]['s']) for i in ints(A.drama)]
hit_times = sorted([W[i]['s'] for i in ints(A.hits)] + [p1 for _, p1 in drama])
t_res = W[A.resolve]['s']; t_bell = W[A.resolve + 1]['s']
rng = np.random.default_rng(6)

def lp(x, fc):
    a = 1 - np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); s = 0.0
    for i in range(len(x)): s += a * (x[i] - s); y[i] = s
    return y
def ramp(t0, t1): return np.clip((t - t0) / max(1e-6, t1 - t0), 0, 1)
def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)

# ---------------------------------------------------------------- notes
L = np.zeros(N); R = np.zeros(N)
def add(t0, x, pan=0.0, g=1.0):
    i0 = int(t0 * SR); n = min(len(x), N - i0)
    if i0 < 0 or n <= 0: return
    L[i0:i0 + n] += x[:n] * g * (1 - pan) ; R[i0:i0 + n] += x[:n] * g * (1 + pan)
def marimba(f, dur=0.5, bright=1.0):
    d = np.arange(int(dur * SR)) / SR
    x = np.sin(2 * np.pi * f * d) * np.exp(-d * 7) + 0.25 * bright * np.sin(2 * np.pi * f * 3.93 * d) * np.exp(-d * 22) + 0.08 * bright * np.sin(2 * np.pi * f * 9.2 * d) * np.exp(-d * 40)
    return x * (1 - np.exp(-d * 900))
def pizz(f, dur=0.6):
    d = np.arange(int(dur * SR)) / SR
    x = sum(np.sin(2 * np.pi * f * k * d) / k ** 1.4 * np.exp(-d * (6 + 3 * k)) for k in range(1, 6))
    return x * (1 - np.exp(-d * 600))
def bellnote(f, dur=2.5):
    d = np.arange(int(dur * SR)) / SR
    return (np.sin(2 * np.pi * f * d) + 0.4 * np.sin(2 * np.pi * f * 2.76 * d) * np.exp(-d * 2) + 0.2 * np.sin(2 * np.pi * f * 5.4 * d) * np.exp(-d * 5)) * np.exp(-d * 1.6) * (1 - np.exp(-d * 400))

BPM = 104.0; E8 = 60 / BPM / 2   # eighth note
# bright section: D major with a lydian lift (E/D), then Bm, G (2 bars each, 16 eighths)
BRIGHT = [(50, [62, 66, 69, 73, 74, 73, 69, 66]), (50, [64, 68, 71, 74, 76, 74, 71, 68]), (47, [62, 66, 71, 74, 71, 66, 62, 66]), (43, [62, 67, 71, 74, 79, 74, 71, 67])]
DARK = [(47, [59, 62, 66, 62, 59, 62, 66, 69]), (43, [59, 62, 67, 62, 59, 62, 67, 71]), (40, [55, 59, 64, 59, 55, 59, 64, 67]), (42, [54, 58, 61, 58, 54, 61, 64, 61])]
k = 0; tt = 0.25
while tt < t_res - 0.3:
    bar = int(k // 16); step = k % 16
    dark = False
    if tt >= A.winter: break
    if A.scratch <= tt < A.dark: tt += E8; k += 1; continue
    bass, pat = (DARK if dark else BRIGHT)[bar % 4]
    # curious rhythm: skip a few eighths so it never sounds like a metronome
    if step not in (3, 11, 14):
        n = pat[step % 8] - (12 if dark else 0)
        add(tt, marimba(mtof(n), 0.5, 0.6 if dark else 1.0), pan=0.25 * np.sin(k * 0.9), g=(0.55 if dark else 0.7) * (1.0 if step % 4 == 0 else 0.75))
    if step in (0, 8): add(tt, pizz(mtof(bass - 12 + (0 if step == 0 else 7))), g=0.9)
    if step == 6: add(tt, pizz(mtof(bass - 12 + 12)), g=0.45)
    tt += E8; k += 1
# winter: sparse high bell notes (B minor add9), slow
for i, tt in enumerate(np.arange(A.winter + 0.4, t_res - 0.4, 1.15)):
    add(tt, bellnote(mtof([83, 78, 81, 85, 86, 81][i % 6]), 2.4), pan=0.5 * np.sin(i * 1.7), g=0.22)

def saw(f, ph=0.0, n=6): return sum(np.sin(2 * np.pi * f * k * t + ph * k) / k for k in range(1, n + 1))
bright_env = np.clip((1 - ramp(A.scratch - 0.01, A.scratch + 0.02)) + ramp(A.dark - 0.05, A.dark + 0.3), 0, 1)
dark_env = 0 * t
win_env = ramp(A.winter - 0.2, A.winter + 1.2) * (1 - ramp(t_res - 0.2, t_res + 0.4))
maj_env = ramp(t_res - 0.05, t_res + 0.5)
# pads: bright = D major (D3 F#3 A3), dark = B minor lower, winter = cold open fifths + high shimmer
padB = lp(lp(saw(mtof(50)) * 0.6 + saw(mtof(54) * 1.002, 0.7) * 0.4 + saw(mtof(57) * 0.998, 1.3) * 0.4, 900), 900)
padD = lp(lp(saw(mtof(47)) * 0.6 + saw(mtof(50) * 1.002, 0.4) * 0.4 + saw(mtof(54) * 0.998, 1.1) * 0.35, 520), 520)
padW = lp(lp(saw(mtof(47) * 0.999) * 0.5 + saw(mtof(54) * 1.002, 0.9) * 0.45 + saw(mtof(61), 0.3) * 0.25, 700), 700)
shimmer = (np.sin(2 * np.pi * mtof(90) * t) + 0.7 * np.sin(2 * np.pi * mtof(97) * t + 1)) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.23 * t)) * (0.6 + 0.4 * np.sin(2 * np.pi * 5.3 * t))
padM = lp(lp(saw(mtof(50)) * 0.6 + saw(mtof(54), 0.5) * 0.45 + saw(mtof(57), 0.9) * 0.45 + saw(mtof(62), 0.2) * 0.3, 1100), 1100)
pad = 0.22 * padB * np.clip(bright_env, 0, 1) * (1 - maj_env) + 0.3 * padD * dark_env + 0.36 * padW * win_env + 0.03 * shimmer * win_env + 0.3 * padM * maj_env

# the one low note (D2 + a little D3) - the only thing left in a drama pause and after the scratch
D2 = mtof(38)
note = np.sin(2 * np.pi * D2 * t) + 0.45 * np.sin(2 * np.pi * 2 * D2 * t + 0.4) + 0.25 * np.sin(2 * np.pi * D2 / 2 * t)
hold = np.zeros(N)
for p0, p1 in drama: hold = np.maximum(hold, ramp(p0, p0 + 0.15) * (1 - ramp(p1 - 0.02, p1 + 0.1)))
after_scratch = ramp(A.scratch + 0.25, A.scratch + 0.6) * (1 - ramp(A.dark - 0.05, A.dark + 0.1))
hold = np.maximum(hold, after_scratch)
quiet = 1 - hold
# the scratch stops the bed dead (notes already ringing are cut too)
cut = 1 - ramp(A.scratch + 0.03, A.scratch + 0.06) * (1 - ramp(A.dark - 0.02, A.dark + 0.02))
# resolve: bell chord on the last word
bell = np.zeros(N)
for f, g, dly in ((mtof(78), 1.0, 0.0), (mtof(81), 0.7, 0.07), (mtof(86), 0.5, 0.14)):
    d = np.clip(t - t_bell - dly, 0, None); bell += g * np.sin(2 * np.pi * f * d) * np.exp(-d * 3.2) * (t >= t_bell + dly)
core = 0.42 * hold * note
Lb = core + quiet * cut * (0.55 * L + pad) + 0.14 * bell
Rb = core + quiet * cut * (0.55 * R + pad) + 0.14 * np.roll(bell, 300)
env = ramp(0, 0.2) * (1 - ramp(A.end - 0.42, A.end - 0.03))
bed = np.stack([Lb * env, Rb * env], 1)

# soft hits
hits = np.zeros((N, 2))
for h in hit_times:
    d = np.arange(int(1.5 * SR)) / SR
    boom = np.sin(2 * np.pi * np.cumsum(66 * np.exp(-d * 5) + 42) / SR) * np.exp(-d * 4.5)
    tone = (np.sin(2 * np.pi * mtof(50) * d) + 0.5 * np.sin(2 * np.pi * mtof(57) * d)) * np.exp(-d * 6) * (1 - np.exp(-d * 400))
    air = lp(rng.normal(0, 1, len(d)), 1000) * np.exp(-d * 10) * 0.45
    x = (boom + 0.5 * tone + air) * (1 - np.exp(-d * 250))
    i0 = int(h * SR); n = min(len(x), N - i0)
    if n > 0: hits[i0:i0 + n] += x[:n, None]

def lufs(path):
    out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS', out)[-1])
def rms_db(x): return 10 * np.log10((x ** 2).mean() + 1e-12)
def save(p, x, ch=2):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with wave.open(p, 'wb') as f:
        f.setnchannels(ch); f.setsampwidth(2); f.setframerate(SR); f.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
    return p

v = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', A.voice, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout, np.float32)
v_lufs, v_rms = lufs(A.voice), rms_db(v[np.abs(v) > 10 ** (-50 / 20)])
bed = bed / np.abs(bed).max() * 0.25
p = save(os.path.join(A.out, 'bed.wav'), bed)
g = (v_lufs - A.under) - lufs(p)
g = min(g, (v_rms - A.under) - rms_db(bed))
bed = bed * 10 ** (g / 20); p = save(os.path.join(A.out, 'bed.wav'), bed)
vpk = 20 * np.log10(np.abs(v).max())
hits = hits / np.abs(hits).max() * 10 ** ((vpk - 13) / 20)
save(os.path.join(A.out, 'hits.wav'), hits)

# record scratch: the bed's own last half second before the scratch, scrubbed forward-back-forward with a vinyl hiss
src = (bed[:, 0] + bed[:, 1]) / 2
s0 = int((A.scratch - 0.6) * SR); seg_ = src[s0:s0 + int(0.6 * SR)].copy()
seg_ = seg_ / (np.abs(seg_).max() + 1e-9) * 0.6 + 0.25 * lp(rng.normal(0, 1, len(seg_)), 3000)   # plus grit so it reads on a phone speaker
D = 0.42; d = np.arange(int(D * SR)) / SR
pos = 0.5 - 0.22 * np.sin(2 * np.pi * d / D * 1.5) * np.exp(-d * 1.2)          # seconds into the chunk: forward, back, forward
idx = np.clip(pos * SR, 0, len(seg_) - 2); i0 = idx.astype(int); fr = idx - i0
x = seg_[i0] * (1 - fr) + seg_[i0 + 1] * fr
speed = np.abs(np.gradient(pos, 1 / SR))
hiss = rng.normal(0, 1, len(d)); hiss = hiss - lp(hiss, 1800)
x = x * np.clip(speed * 2.5, 0, 1.2) + 0.35 * hiss * np.clip(speed, 0, 1)
x = x * (1 - np.exp(-d * 300)) * np.exp(-np.clip(d - 0.34, 0, None) * 30)
x = x / np.abs(x).max() * 10 ** ((vpk - 4) / 20)
save(os.path.join(A.out, 'scratch.wav'), np.stack([x, x], 1))

# episode sounds: glass crack + clock tick
sfx = os.path.join(os.path.dirname(A.out.rstrip('/')), 'sfx')
d = np.arange(int(0.5 * SR)) / SR; c = np.zeros(len(d))
for k2, (dt, g2) in enumerate(((0, 1.0), (0.018, 0.7), (0.04, 0.9), (0.075, 0.5), (0.11, 0.35))):
    i0 = int(dt * SR); n = len(d) - i0; e = np.arange(n) / SR
    burst = rng.normal(0, 1, n); burst = burst - lp(burst, 2500)
    ring = sum(np.sin(2 * np.pi * f * e) for f in (3100 + 400 * k2, 5200 - 300 * k2, 7400))
    c[i0:] += g2 * (burst * np.exp(-e * 60) + 0.15 * ring * np.exp(-e * 25))
save(os.path.join(sfx, 'crack.wav'), np.stack([c, c], 1) / np.abs(c).max() * 0.8)
d = np.arange(int(0.12 * SR)) / SR
tk = (np.sin(2 * np.pi * 2400 * d) * 0.6 + np.sin(2 * np.pi * 1300 * d)) * np.exp(-d * 90) + 0.4 * rng.normal(0, 1, len(d)) * np.exp(-d * 300)
save(os.path.join(sfx, 'tick.wav'), np.stack([tk, tk], 1) / np.abs(tk).max() * 0.7)

print(f'voice {v_lufs:.1f} LUFS (spoken RMS {v_rms:.1f} dB) | bed {lufs(p):.1f} LUFS (RMS {rms_db(bed):.1f} dB) -> bed is {v_lufs - lufs(p):.1f} LU / {v_rms - rms_db(bed):.1f} dB under the voice')
print(f'hits: {len(hit_times)} at ' + ', '.join(f'{h:.2f}' for h in hit_times))
print(f'drama pauses: ' + ', '.join(f'{a:.2f}-{b:.2f}' for a, b in drama) + f' | scratch {A.scratch:.2f}, dark {A.dark:.2f}, winter {A.winter:.2f}, resolve {t_res:.2f}, bell {t_bell:.2f}, silent by {A.end:.2f}')
