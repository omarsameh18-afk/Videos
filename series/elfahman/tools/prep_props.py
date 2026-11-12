# Key the magenta background of an episode's prop pictures (same keyer as prep_library.key_magenta).
# usage: python3 series/elfahman/tools/prep_props.py <episode-folder-under-public/elfahman> <name> [name...]
#   reads images/elfahman/raw/<name>.png, writes public/elfahman/<episode>/<name>.png + props.json (sizes)
import json, os, sys, numpy as np, cv2
from PIL import Image
ep, *names = sys.argv[1:]
R, OUT = 'images/elfahman/raw/', f'public/elfahman/{ep}/'
def key_magenta(n, out):
    a = np.array(Image.open(R + n + '.png').convert('RGB')).astype(np.float32)
    m = np.clip(((a[..., 0] + a[..., 2]) / 2 - a[..., 1] - 60) / 120, 0, 1)  # soft edge: alpha from "magentaness"
    n_, lab = cv2.connectedComponents((m > .5).astype(np.uint8), connectivity=4)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border))
    # enclosed magenta pockets (e.g. between an arm and the body)
    ids, cnt = np.unique(lab[m > .5], return_counts=True)
    bg |= np.isin(lab, [i for i, c in zip(ids, cnt) if i not in border and c > 30 and m[lab == i].mean() > .85])
    band = cv2.dilate(bg.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
    alpha = np.where(bg, 0, 1.0); alpha = np.where(band & ~bg, 1 - m, alpha)
    rgb = a.copy(); rgb[band] = np.minimum(rgb[band], rgb[band][:, [1]] + 40)  # de-spill pink fringe
    o = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    yy, xx = np.where(o[..., 3] > 10); o = o[max(yy.min() - 6, 0): yy.max() + 7, max(xx.min() - 6, 0): xx.max() + 7]
    Image.fromarray(o, 'RGBA').save(out); return o.shape[1], o.shape[0]
os.makedirs(OUT, exist_ok=True)
pm = {n: key_magenta(n, OUT + n + '.png') for n in names}
json.dump(pm, open(OUT + 'props.json', 'w')); print(pm)
