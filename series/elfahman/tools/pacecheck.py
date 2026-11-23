# Pacing QA (from episode 11): measures every silence in the edited voice with ffmpeg silencedetect (-40 dB, >= 40 ms; two quiet
# runs split by a blip under 70 ms count as one gap) and matches each to the word boundary pace.py edited (its "at" time), so the
# report can list sentence / comma / mid / mystery gaps as heard. Prints a summary; --json writes every gap.
# usage: python3 series/elfahman/tools/pacecheck.py <vo.mp3> <scribe_words.pauses.json> [--json out.json]
import json, re, subprocess, sys
vo, pj = sys.argv[1:3]
o = subprocess.run(['ffmpeg', '-v', 'info', '-i', vo, '-af', 'silencedetect=n=-40dB:d=0.04', '-f', 'null', '-'], capture_output=True, text=True).stderr
ss = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', o)]; ee = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', o)]
runs = [[a, b] for a, b in zip(ss, ee)]
m = []
for r in runs:
    if m and r[0] - m[-1][1] < 0.07: m[-1][1] = r[1]
    else: m.append(r)
P = json.load(open(pj)); gaps = [g for g in P['gaps'] if 'at' in g]
speech_end = P['speech_end']
res = []
for g in gaps:
    c = g['at'] + g['len'] / 2
    best = min(m, key=lambda r: abs((r[0] + r[1]) / 2 - c)) if m else None
    meas = round(best[1] - best[0], 3) if best and best[0] - 0.08 <= c <= best[1] + 0.08 else 0.0
    res.append({**g, 'measured': meas, 'start': round(best[0], 3) if meas else None})
body = [r for r in m if 0.05 < r[0] < speech_end - 0.01]
def stat(k):
    v = [r['measured'] for r in res if r['kind'] == k and r['measured'] > 0]
    return (len(v), min(v), max(v), sum(v) / len(v)) if v else (0, 0, 0, 0)
for k in ('sentence', 'comma', 'mystery', 'straight'):
    n, a, b, avg = stat(k); print(f'{k:9s} n={n:2d}  {a:.2f}-{b:.2f}  avg {avg:.2f}')
mid = [r['measured'] for r in res if r['kind'] in ('mid', 'hook')]
print(f'mid/hook  max {max(mid) if mid else 0:.2f}')
myst = [r for r in res if r['kind'] == 'mystery']
nonm = [r[1] - r[0] for r in body if not any(x['start'] is not None and abs(x['start'] - r[0]) < 0.01 for x in myst)]
print(f'longest silence outside the mystery pause: {max(nonm):.2f} s; leading silence {m[0][0] if m and m[0][0] < 0.01 else 0:.2f}; end silence {P["length"] - speech_end:.2f}')
for r in res:
    if r['kind'] == 'sentence' and not 0.35 <= r['measured'] <= 0.5 or r['kind'] == 'comma' and not 0.15 <= r['measured'] <= 0.25:
        print('  OUT OF RANGE', r['b'], r['after'], r['kind'], r['measured'], 'len', r['len'])
if '--json' in sys.argv: json.dump(res, open(sys.argv[sys.argv.index('--json') + 1], 'w'), ensure_ascii=False, indent=1)
