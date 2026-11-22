# Pop scan: frame-to-frame difference of a rendered video; flags spikes (unexpected jumps).
# usage: python3 scripts/popscan.py out/video.mp4 [threshold]
import subprocess, sys, numpy as np
path = sys.argv[1]; thr = float(sys.argv[2]) if len(sys.argv) > 2 else 3.0
w, h = 135, 240
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-vf', f'scale={w}:{h}', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True).stdout
f = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)
d = np.abs(np.diff(f, axis=0)).mean((1, 2))
med = np.median(d) + 1e-6
fps = 60
print(f'frames {len(f)}  median diff {med:.2f}')
for i in np.where(d > max(thr * med, 4.0))[0]:
    print(f'jump at {(i + 1) / fps:6.2f}s  frame {i + 1:5d}  diff {d[i]:.1f}')
first, last = f[0], f[-1]
print('first-vs-last frame mean diff', round(float(np.abs(first - last).mean()), 2))
