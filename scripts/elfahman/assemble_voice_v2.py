# v2 re-edit of the SAME #12 recording (voice/elfahman-12/raw/sNN.mp3, 1.0x, nothing stretched; silence only cut).
# Sentence gaps 0.37 s, every pause inside a sentence <= 0.15 s, hook + "استنى ده الغريب جاي!" in one go,
# mystery pause 0.8 s after "خالص؟", 0.4 s after the last word.
# Writes public/elfahman/sun/vo/vo.wav + voice/elfahman-12/timing_v2.json (sentences, kept pauses, per-sentence voiced runs).
import json, sys, subprocess, numpy as np
sys.path.insert(0, '/home/user/Videos/scripts/elfahman')
from analyze_voice import load, segments, SR
D = '/home/user/Videos/voice/elfahman-12'
lines = open('/home/user/Videos/scripts/elfahman/sun-lines.txt', encoding='utf8').read().strip().split('\n')
SENT, COMMA, INNER, HOOK_IN, MYST, TAIL = 0.305, 0.15, 0.06, 0.05, 0.76, 0.36
REL = float(sys.argv[1]) if len(sys.argv) > 1 else 30
ONE_GO = {0, 10}
out = []; timing = []; t = 0.0
for i in range(16):
    x = load(f'{D}/raw/s{i+1:02d}.mp3')
    s, e, sils = segments(x, rel=REL, min_sil=0.06)
    merged = []
    for a, b in sils:
        if merged and a - merged[-1][1] < 0.06: merged[-1] = (merged[-1][0], b)
        else: merged.append((a, b))
    s = max(0, s - 0.02); e = min(len(x) / SR, e + 0.05)
    pieces = []; cur = s; pauses = []
    import re
    ncomma = len(re.findall(r'[،…؟](?=\s)', lines[i]))
    commas = set(sorted(range(len(merged)), key=lambda k: -(merged[k][1] - merged[k][0]))[:ncomma])
    for k, (a, b) in enumerate(merged):
        d = b - a
        tgt = min(d, HOOK_IN if i in ONE_GO else COMMA if k in commas else INNER)
        ka, kb = a + tgt / 2, b - tgt / 2
        pieces.append(x[int(cur * SR):int(ka * SR)])
        at = t + sum(len(p) for p in pieces) / SR
        pauses.append(dict(at=round(at - tgt / 2, 3), dur=round(tgt, 3), orig=round(d, 3), comma=k in commas))
        cur = kb
    pieces.append(x[int(cur * SR):int(e * SR)])
    seg = np.concatenate(pieces)
    f = int(0.008 * SR); seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
    timing.append(dict(i=i + 1, text=lines[i], start=round(t, 3), end=round(t + len(seg) / SR, 3), pauses=pauses))
    out.append(seg); t += len(seg) / SR
    g = TAIL if i == 15 else MYST if i == 9 else SENT
    out.append(np.zeros(int(g * SR), np.float32)); t += g
vo = np.concatenate(out)
pcm = (np.clip(vo, -1, 1) * 32767).astype(np.int16).tobytes()
subprocess.run(['mkdir', '-p', '/home/user/Videos/public/elfahman/sun/vo'])
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-', '-ar', '48000',
                '/home/user/Videos/public/elfahman/sun/vo/vo.wav'], input=pcm, check=True)
json.dump(dict(duration=round(t, 3), sentences=timing), open(f'{D}/timing_v2.json', 'w'), ensure_ascii=False, indent=1)
words = sum(len(l.split()) for l in lines)
print(f'duration {t:.2f}s  words {words}  wps {words / t:.2f}')
