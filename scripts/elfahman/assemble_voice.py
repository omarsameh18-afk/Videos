# Assemble per-sentence TTS clips into one VO with exact gaps (no time-stretch).
# Writes voice/elfahman-12/vo.wav + timing.json (sentence + phrase boundaries on the final timeline).
import json, sys, subprocess, numpy as np
sys.path.insert(0, '/home/user/Videos/scripts/elfahman')
from analyze_voice import load, segments, SR
D = '/home/user/Videos/voice/elfahman-12'
lines = open('/home/user/Videos/scripts/elfahman/sun-lines.txt', encoding='utf8').read().strip().split('\n')
HOOK_SET = {0, 10}            # said in one go
COMMA, ELLIPSIS, QMARK = 0.22, 0.35, 0.38
# per-sentence overrides: silence index (after merging) -> target seconds; others: >0.25 -> COMMA, else keep
OVR = {1: {1: ELLIPSIS}, 8: {0: 0.30}, 13: {1: ELLIPSIS}, 14: {2: 0.20, 3: QMARK}}
GAP_AFTER = {i: 0.42 for i in range(16)}
GAP_AFTER[9] = 0.80   # mystery pause after "خالص؟"
GAP_AFTER[10] = 0.40  # breath after "استنى ده الغريب جاي!"
TAIL = 0.40
out = []; timing = []; t = 0.0
for i in range(16):
    x = load(f'{D}/raw/s{i+1:02d}.mp3')
    s, e, sils = segments(x)
    merged = []
    for a, b in sils:
        if merged and a - merged[-1][1] < 0.05: merged[-1] = (merged[-1][0], b)
        else: merged.append((a, b))
    s = max(0, s - 0.03); e = min(len(x)/SR, e + 0.06)
    cuts = []  # (a,b,target)
    for k, (a, b) in enumerate(merged):
        d = b - a
        if i in HOOK_SET: tgt = min(d, 0.06)
        elif k in OVR.get(i, {}): tgt = min(d, OVR[i][k]) if OVR[i][k] < d else d
        elif d > 0.25: tgt = COMMA
        else: tgt = d
        cuts.append((a, b, tgt))
    pieces = []; cur = s; phrases = []; pt = t
    for a, b, tgt in cuts:
        keep_a = a + tgt/2; keep_b = b - tgt/2
        pieces.append(x[int(cur*SR):int(keep_a*SR)])
        dur_before = sum(len(p) for p in pieces)/SR
        phrases.append(dict(sil_start=round(t + dur_before - tgt/2, 3), sil_dur=round(tgt, 3), orig=round(b-a, 3)))
        cur = keep_b
    pieces.append(x[int(cur*SR):int(e*SR)])
    seg = np.concatenate(pieces)
    f = int(0.008*SR); seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
    timing.append(dict(i=i+1, text=lines[i], start=round(t, 3), end=round(t + len(seg)/SR, 3), pauses=phrases))
    out.append(seg); t += len(seg)/SR
    g = GAP_AFTER[i] if i < 15 else TAIL
    out.append(np.zeros(int(g*SR), np.float32)); t += g
vo = np.concatenate(out)
pcm = (np.clip(vo, -1, 1)*32767).astype(np.int16).tobytes()
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-', f'{D}/vo.wav'], input=pcm, check=True)
json.dump(dict(duration=round(t, 3), sentences=timing), open(f'{D}/timing.json', 'w'), ensure_ascii=False, indent=1)
words = sum(len(l.split()) for l in lines)
speech = sum(s['end']-s['start'] for s in timing)
gaps = [timing[k+1]['start']-timing[k]['end'] for k in range(15)]
print(f'duration {t:.2f}s words {words} wps(total) {words/t:.2f} wps(speech) {words/speech:.2f}')
print('sentence gaps', [round(g,2) for g in gaps], 'avg', round(np.mean([g for k,g in enumerate(gaps) if k!=9]),3))
print('inner pauses', [(s['i'], [p['sil_dur'] for p in s['pauses']]) for s in timing])
