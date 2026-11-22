# Word timing + lip-flap envelope for an episode (free; uses the ElevenLabs Scribe words.json of the voice take).
# usage: python3 series/elfahman/tools/timing.py <scribe_words.json> <script.txt> <voice.mp3> <out_words.json> <out_env.json> [check words...]
import json, subprocess, sys, numpy as np
sw_path, script_path, vo, out_words, out_env, *check = sys.argv[1:]
sw = json.load(open(sw_path)); sw = sw['words'] if isinstance(sw, dict) else sw
sw = [w for w in sw if w.get('type', 'word') == 'word']
script = open(script_path).read().split()
if len(sw) != len(script):
    sys.exit(f'word count differs: scribe {len(sw)} vs script {len(script)} - fix the script spacing or map by hand')
words = [{'w': s, 's': round(w['start'], 3), 'e': round(w['end'], 3)} for w, s in zip(sw, script)]
json.dump(words, open(out_words, 'w'), ensure_ascii=False, indent=0)
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', vo, '-ac', '1', '-ar', '48000', '-f', 's16le', '-'], capture_output=True).stdout
a = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
hop = 800  # 60 fps
rms = np.array([np.sqrt((a[i:i + hop] ** 2).mean()) for i in range(0, len(a) - hop, hop)])
lvl = np.clip((20 * np.log10(rms + 1e-6) + 45) / 30, 0, 1)
json.dump({'fps': 60, 'level': [round(float(x), 3) for x in lvl]}, open(out_env, 'w'))
print(f'{len(words)} words, {len(lvl)} frames ({len(a) / 48000:.2f} s)')
# onset check for the signature words: first frame where the level rises, searched from 0.3 s before the Scribe time
for i, w in enumerate(words):
    if any(c in w['w'] for c in check):
        f0 = int(max(0, w['s'] - 0.3) * 60); f1 = int((w['s'] + 0.3) * 60)
        rises = [j for j in range(max(f0, 4), f1) if lvl[j] > 0.3 and lvl[j - 4:j].max() < 0.2]  # rise after a quiet gap
        on = min(rises, key=lambda j: abs(j / 60 - w['s'])) if rises else int(w['s'] * 60)
        print(f"{w['w']}: scribe {w['s']:.2f}  audio onset {on / 60:.2f}")
