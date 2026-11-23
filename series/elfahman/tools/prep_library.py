# One-time library prep: key backgrounds, align poses to the hero, build mouth/blink overlay layers.
# usage (repo root): python3 series/elfahman/tools/prep_library.py
import json, os, subprocess, numpy as np, cv2
from PIL import Image
R = 'images/elfahman/raw/'; Q = 'images/elfahman/qa/'; OUT = 'public/elfahman/lib/'
os.makedirs(OUT, exist_ok=True)
KEY = os.path.join(os.path.dirname(__file__), 'key.py')
def key(n):
    subprocess.run(['python3', KEY, R + n + '.png', R + n + '_k.png'], check=True)
    return np.array(Image.open(R + n + '_k.png').convert('RGBA'))
def gray(a):
    g = cv2.cvtColor(a[..., :3], cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
    al = a[..., 3].astype(np.float32) / 255
    return g * al + (1 - al) * 0.6
def ecc(ref, mov, mask, mode=cv2.MOTION_AFFINE):
    w = np.eye(2, 3, dtype=np.float32)
    cc, w = cv2.findTransformECC(gray(ref), gray(mov), w, mode, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 400, 1e-6), mask, 5)
    return cc, w
def warp(a, w, shape):
    return cv2.warpAffine(a, w, (shape[1], shape[0]), flags=cv2.INTER_CUBIC + cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))

hero = key('hero'); H, W = hero.shape[:2]
POSES = ['talk_open', 'talk_half', 'explain', 'point_up', 'shocked', 'thinking', 'laughing', 'temple', 'worried', 'thumbs_up']
# body mask: hoodie pocket + waist (arms excluded), robust for every pose
body = np.zeros((H, W), np.uint8); body[int(H * .70):int(H * .93), int(W * .30):int(W * .70)] = 255
# face box (hero coords): find skin-ish head region from the alpha top part
FX0, FX1, FY0, FY1 = int(W * .33), int(W * .67), int(H * .13), int(H * .42)
face = np.zeros((H, W), np.uint8); face[FY0:FY1, FX0:FX1] = 255
al = {}
info = {}
for n in POSES:
    a = cv2.resize(key(n), (W, H), interpolation=cv2.INTER_CUBIC)
    cc, w = ecc(hero, a, body)
    a = warp(a, w, hero.shape)
    # refine on the face with a pure translation+scale (euclidean) so face overlays line up
    try: ccf, wf = ecc(hero, a, face, cv2.MOTION_AFFINE)
    except cv2.error: ccf, wf = 0.0, np.eye(2, 3, dtype=np.float32)
    al[n] = a; info[n] = {'body_cc': round(float(cc), 4), 'face_cc': round(float(ccf), 4), 'face_warp': wf.tolist()}
    print(n, info[n]['body_cc'], info[n]['face_cc'])
al['hero'] = hero; info['hero'] = {'face_warp': np.eye(2, 3).tolist()}

# ---- mouth patches (hero coords), from the talk poses aligned on the face
def face_aligned(n): return warp(al[n], np.array(info[n]['face_warp'], np.float32), hero.shape)
diff = np.zeros((H, W), np.float32)
for n in ['talk_open', 'talk_half']:
    d = np.abs(face_aligned(n)[..., :3].astype(np.float32) - hero[..., :3]).sum(2); diff = np.maximum(diff, d)
dm = np.zeros((H, W), np.uint8); sub = diff[FY0:FY1, FX0:FX1] > 90
dm[FY0:FY1, FX0:FX1] = sub
# keep the mouth area: lower half of the face box
dm[:int(FY0 + (FY1 - FY0) * .55)] = 0
dm = cv2.morphologyEx(dm, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
n_, lab, st, cen = cv2.connectedComponentsWithStats(dm)
k = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])
x, y, w_, h_ = st[k, :4]; mx, my = x + w_ / 2, y + h_ / 2
rx, ry = max(w_ * .62, 70), max(h_ * .75, 55)
yy, xx = np.mgrid[0:H, 0:W]
r = ((xx - mx) / rx) ** 2 + ((yy - my) / ry) ** 2
mmask = np.clip((1.25 - r) / 0.45, 0, 1)  # soft-edged ellipse
MB = [int(mx - rx * 1.2), int(my - ry * 1.2), int(mx + rx * 1.2), int(my + ry * 1.2)]
print('mouth', round(mx), round(my), round(rx), round(ry))
mouth = {}
for st_, n in [('half', 'talk_half'), ('open', 'talk_open')]:
    src = face_aligned(n); patch = src.copy(); patch[..., 3] = (mmask * src[..., 3]).astype(np.uint8)
    mouth[st_] = patch  # hero coords, full canvas

# ---- eyes: measured once on the hero (cropped-canvas px, see qa/eyes_grid.png): centre x, y, half-width, half-height, tilt deg
HERO_EYES_CROP = [(580, 337, 47, 27, 4), (746, 322, 46, 27, -6)]
CROP0 = None  # filled after the crop box is known (needed to convert to full-canvas coords)
def lids(n, which=(0, 1), wink=False):
    """eyelid layer: skin fill over the eye + a dark lash line. Eyes come from the hero, mapped by the pose's face warp."""
    a = al[n]; w = np.array(info[n]['face_warp'], np.float32)
    lay = np.zeros_like(a)
    for i in which:
        cx, cy, hw, hh, tilt = HERO_EYES_CROP[i]; cx += CROP0[0]; cy += CROP0[1]
        px, py = w @ np.array([cx, cy, 1.0])  # hero -> pose coords
        sc = float(np.sqrt(abs(np.linalg.det(w[:, :2]))))
        hw, hh = hw * sc, hh * sc
        sk = np.median(a[int(py + hh * 1.9) - 4:int(py + hh * 1.9) + 4, int(px) - 8:int(px) + 8, :3].reshape(-1, 3), 0)
        m = np.zeros((H, W), np.uint8)
        cv2.ellipse(m, (int(px), int(py)), (int(hw * 1.12), int(hh * 1.32)), tilt, 0, 360, 255, -1, cv2.LINE_AA)
        lay[..., :3][m > 0] = sk.astype(np.uint8); lay[..., 3] = np.maximum(lay[..., 3], m)
        ink = (45, 28, 22, 255); th = max(7, int(hh * .34))
        if wink:   # happy closed eye: arc bowing upward
            cv2.ellipse(lay, (int(px), int(py + hh * .55)), (int(hw * .95), int(hh * .85)), tilt, 200, 340, ink, th, cv2.LINE_AA)
        else:      # closed lid: soft arc bowing downward + short lashes at the outer corner
            cv2.ellipse(lay, (int(px), int(py - hh * .15)), (int(hw * 1.0), int(hh * .6)), tilt, 10, 170, ink, th, cv2.LINE_AA)
    return lay

# ---- assemble: base poses + overlays, crop all to one common box
TALKABLE = ['hero', 'explain', 'point_up', 'thinking', 'temple', 'thumbs_up', 'worried']
BLINKABLE = ['hero', 'explain', 'point_up', 'thinking', 'temple', 'thumbs_up', 'worried']
layers = {}
for n in ['hero'] + POSES: layers[n] = al[n]
for n in TALKABLE:
    winv = cv2.invertAffineTransform(np.array(info[n]['face_warp'], np.float32))
    for s, p in mouth.items():
        # mouth patch lives in hero face coords -> pose coords
        layers[f'{n}__mouth_{s}'] = cv2.warpAffine(p, np.array(info[n]['face_warp'], np.float32), (W, H), flags=cv2.INTER_CUBIC + cv2.WARP_INVERSE_MAP, borderValue=(0, 0, 0, 0)) if n != 'hero' else p
# common crop over the base poses
u = np.zeros((H, W), bool)
for n in ['hero'] + POSES: u |= al[n][..., 3] > 10
ys, xs = np.where(u); x0, y0 = max(xs.min() - 8, 0), max(ys.min() - 8, 0); x1, y1 = min(xs.max() + 9, W), min(ys.max() + 9, H)
CROP0 = (int(x0), int(y0))
for n in BLINKABLE: layers[f'{n}__blink'] = lids(n)
layers['temple__wink'] = lids('temple', which=(1,), wink=True)
meta = {'canvas': [int(x1 - x0), int(y1 - y0)], 'layers': {}, 'info': info}
for n, a in layers.items():
    c = a[y0:y1, x0:x1]
    if '__' in n:  # overlays: tight crop + offset
        yy_, xx_ = np.where(c[..., 3] > 3)
        if len(xx_) == 0: continue
        bx0, by0, bx1, by1 = xx_.min(), yy_.min(), xx_.max() + 1, yy_.max() + 1
        Image.fromarray(c[by0:by1, bx0:bx1], 'RGBA').save(OUT + n + '.png')
        meta['layers'][n] = {'x': int(bx0), 'y': int(by0), 'w': int(bx1 - bx0), 'h': int(by1 - by0)}
    else:
        Image.fromarray(c, 'RGBA').save(OUT + n + '.png'); meta['layers'][n] = {'x': 0, 'y': 0, 'w': int(c.shape[1]), 'h': int(c.shape[0])}
meta['hero_eyes'] = HERO_EYES_CROP; meta['crop0'] = CROP0
meta['mouth'] = [round(mx - x0), round(my - y0)]
meta['head'] = [int((FX0 + FX1) / 2 - x0), int(FY0 + (FY1 - FY0) * .45 - y0)]
json.dump(meta, open(OUT + 'character.json', 'w'), indent=1)
print('canvas', meta['canvas'], 'crop0', CROP0)

# ---- props + set
def key_magenta(n, out):
    a = np.array(Image.open(R + n + '.png').convert('RGB')).astype(np.float32)
    mag = (a[..., 0] > 150) & (a[..., 2] > 150) & (a[..., 1] < 110)
    # soft edge: alpha from "magentaness"
    m = np.clip(((a[..., 0] + a[..., 2]) / 2 - a[..., 1] - 60) / 120, 0, 1)
    n_, lab = cv2.connectedComponents((m > .5).astype(np.uint8), connectivity=4)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border))
    band = cv2.dilate(bg.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
    alpha = np.where(bg, 0, 1.0); alpha = np.where(band & ~bg, 1 - m, alpha)
    rgb = a.copy(); rgb[band] = np.minimum(rgb[band], rgb[band][:, [1]] + 40)  # de-spill pink fringe
    o = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    yy_, xx_ = np.where(o[..., 3] > 10); o = o[max(yy_.min() - 6, 0): yy_.max() + 7, max(xx_.min() - 6, 0): xx_.max() + 7]
    Image.fromarray(o, 'RGBA').save(out); return o.shape[1], o.shape[0]
os.makedirs('public/elfahman/rabies', exist_ok=True)
pm = {}
for n in ['glass', 'virus', 'brain']: pm[n] = key_magenta(n, f'public/elfahman/rabies/{n}.png')
json.dump(pm, open('public/elfahman/rabies/props.json', 'w'))
s = Image.open(R + 'set_study.png').convert('RGB'); s.save(OUT + 'set_study.jpg', quality=92); print('set', s.size, 'props', pm)
