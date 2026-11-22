# Hook + ending check for a finished episode.
#  - voice: first sound, end of line 1 (the first pause of >= 0.2 s), end of the last word  -> measured on the voice track
#  - video: length, silence after the last word, and whether frame 1 already moves (frame 1 vs frame 2 difference)
# usage: python3 scripts/hookcheck.py <final.mp4> <voice.mp3> [voice offset in the video, s; default 0]
import subprocess, sys, numpy as np
video, voice = sys.argv[1:3]; off = float(sys.argv[3]) if len(sys.argv) > 3 else 0.0
SR = 44100
a = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', voice, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout, np.float32)
win, hop = int(0.010 * SR), int(0.0025 * SR)
n = (len(a) - win) // hop
db = np.array([10 * np.log10((a[i * hop:i * hop + win] ** 2).mean() + 1e-12) for i in range(n)])
loud = db > -40
first = int(np.argmax(loud)) * hop / SR
# end of line 1: start of the first quiet run of >= 0.2 s
i, hook_end = int(np.argmax(loud)), None
while i < n:
    if not loud[i]:
        j = i
        while j < n and not loud[j]: j += 1
        if (j - i) * hop / SR >= 0.2: hook_end = (i * hop + win) / SR; break
        i = j
    else: i += 1
last = (int(np.nonzero(loud)[0][-1]) * hop + win) / SR
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=duration', '-of', 'default=nw=1:nk=1', video], capture_output=True, text=True).stdout.split()[0])
w, h = 270, 480
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', video, '-frames:v', '3', '-vf', f'scale={w}:{h}', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True).stdout
f = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)
move = float(np.abs(f[1] - f[0]).mean())
print(f'voice starts at        {first + off:.3f} s  (frame {int((first + off) * 60) + 1})')
print(f'hook (line 1) ends at  {hook_end + off:.2f} s  {"OK (<= 3.0 s)" if hook_end + off <= 3.0 else "TOO LATE"}')
print(f'last word ends at      {last + off:.2f} s')
print(f'video length           {dur:.2f} s')
print(f'silence after last word {dur - last - off:.2f} s')
print(f'frame 1 -> 2 difference {move:.2f}  {"(moving)" if move > 0.15 else "(STILL)"}')
ok = hook_end + off <= 3.0 and first + off < 0.05 and move > 0.15
sys.exit(0 if ok else 1)
