import json, numpy as np, cv2
from PIL import Image
OUT = '../../public/woodpecker2/'
def load(p): return np.array(Image.open(p).convert('RGBA'))
def gray(a):
    g = cv2.cvtColor(a[..., :3], cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
    al = a[..., 3].astype(np.float32) / 255
    return g * al + (1 - al) * 0.6
hero = load('raw/hero_k.png'); H, W = hero.shape[:2]
poses = {'bird_side': hero}
mask = np.zeros((H, W), np.uint8); mask[int(H * .42):, :] = 255
for n in ['front', 'focused', 'worried']:
    a = load(f'raw/{n}_k.png'); a = cv2.resize(a, (W, H), interpolation=cv2.INTER_CUBIC)
    warp = np.eye(2, 3, dtype=np.float32)
    cc, warp = cv2.findTransformECC(gray(hero), gray(a), warp, cv2.MOTION_AFFINE,
                                    (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 300, 1e-6), mask, 5)
    print(n, 'ecc', round(cc, 4), warp.round(3).tolist())
    poses['bird_' + n] = cv2.warpAffine(a, warp, (W, H), flags=cv2.INTER_CUBIC + cv2.WARP_INVERSE_MAP,
                                        borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
al = np.zeros((H, W), bool)
for a in poses.values(): al |= a[..., 3] > 10
ys, xs = np.where(al); x0, y0 = max(xs.min() - 12, 0), max(ys.min() - 12, 0); x1, y1 = xs.max() + 13, ys.max() + 13
meta = {}
for n, a in poses.items():
    c = a[y0:y1, x0:x1]; Image.fromarray(c, 'RGBA').save(OUT + n + '.png'); meta[n] = {'w': c.shape[1], 'h': c.shape[0]}
s = hero[y0:y1, x0:x1, 3] > 128; h, w = s.shape
top = s[: int(h * .3)]; yy, xx = np.where(top); i = xx.argmax(); meta['beak'] = [int(xx[i]), int(yy[i])]
for k, (a_, b_) in {'claw1': (.33, .52), 'claw2': (.52, .72)}.items():
    band = s[int(h * a_): int(h * b_)]; yy, xx = np.where(band); i = xx.argmax(); meta[k] = [int(xx[i]), int(yy[i] + h * a_)]
ff = s[: int(h * .32)].astype(np.uint8); dt = cv2.distanceTransform(ff, cv2.DIST_L2, 5)
hy, hx = np.unravel_index(dt.argmax(), dt.shape); meta['head'] = [int(hx), int(hy), float(dt[hy, hx])]
# eye: the biggest white blob inside the head disc
rgb = hero[y0:y1, x0:x1, :3].astype(int)
white = ((rgb.min(2) > 235) & s).astype(np.uint8); white[int(h * .32):] = 0
n_, lab, st, cen = cv2.connectedComponentsWithStats(white)
k = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA]); meta['eye'] = [int(cen[k][0]), int(cen[k][1])]
for n in ['brain', 'hammer', 'pillow']:
    a = load(f'raw/{n}_k.png'); yy, xx = np.where(a[..., 3] > 10)
    c = a[max(yy.min() - 12, 0): yy.max() + 13, max(xx.min() - 12, 0): xx.max() + 13]
    Image.fromarray(c, 'RGBA').save(OUT + n + '.png'); meta[n] = {'w': c.shape[1], 'h': c.shape[0]}
# hammer: handle bottom, head centre
a = np.array(Image.open(OUT + 'hammer.png'))[..., 3] > 128; yy, xx = np.where(a); i = yy.argmax()
meta['hammer']['pivot'] = [int(xx[i]), int(yy[i])]; meta['hammer']['headTop'] = int(yy.min())
# trunk: keep the trunk columns only (between the outer outlines), full height
t = load('raw/trunk_k.png'); cols = np.where((t[..., 3] > 128).mean(0) > 0.95)[0]
c = t[:, cols.min(): cols.max() + 1]; Image.fromarray(c, 'RGBA').save(OUT + 'trunk.png'); meta['trunk'] = {'w': c.shape[1], 'h': c.shape[0]}
json.dump(meta, open('sprites.json', 'w'), indent=1); print(json.dumps(meta))
q = Image.fromarray(hero[y0:y1, x0:x1]).convert('RGBA'); bg = Image.new('RGBA', q.size, (255, 140, 60, 255)); bg.alpha_composite(q)
for n in ['bird_front', 'bird_focused', 'bird_worried']:
    o = Image.new('RGBA', q.size, (255, 140, 60, 255)); o.alpha_composite(Image.fromarray(poses[n][y0:y1, x0:x1]))
    bg = Image.blend(bg, o, 0.25)
import PIL.ImageDraw as D; d = D.Draw(bg)
for k in ['beak', 'claw1', 'claw2', 'eye']:
    x, y = meta[k]; d.ellipse([x - 18, y - 18, x + 18, y + 18], outline=(0, 255, 0), width=8)
hx, hy, r = meta['head']; d.ellipse([hx - r, hy - r, hx + r, hy + r], outline=(0, 0, 255), width=8)
bg.convert('RGB').resize((w // 4, h // 4)).save('qa/marks.png')
