"""Measure each pose's bounding box in Max canvas units (union over expressions) -> src/max/poseBounds.json.
Run: npm run measure-poses   (renders the PoseProbe composition, then reads the PNGs)."""
import glob, json, os, sys
import numpy as np
from PIL import Image

POSES = ['idle', 'pointing', 'flexing', 'armsCrossed', 'facepalm', 'thumbsUp', 'fingerUp', 'thinking']
N_EXPR = 6
OX, OY = 800, 400
d = sys.argv[1]
files = sorted(glob.glob(os.path.join(d, '*.png')))
assert len(files) == len(POSES) * N_EXPR, len(files)
out = {}
for i, f in enumerate(files):
    a = np.asarray(Image.open(f).convert('RGB')).astype(int)
    mask = (np.abs(a[:, :, 0] - 255) + a[:, :, 1] + np.abs(a[:, :, 2] - 255)) > 60
    ys, xs = np.nonzero(mask)
    b = [int(xs.min()) - OX, int(xs.max()) - OX, int(ys.min()) - OY, int(ys.max()) - OY]
    p = POSES[i // N_EXPR]
    o = out.setdefault(p, b)
    out[p] = [min(o[0], b[0]), max(o[1], b[1]), min(o[2], b[2]), max(o[3], b[3])]
res = {p: {'minX': v[0], 'maxX': v[1], 'minY': v[2], 'maxY': v[3]} for p, v in out.items()}
json.dump(res, open('src/max/poseBounds.json', 'w'), indent=1)
for p, v in res.items():
    print(f"{p:12s} x {v['minX']:5d}..{v['maxX']:4d}  y {v['minY']:5d}..{v['maxY']:4d}")
