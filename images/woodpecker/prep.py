import json, numpy as np, cv2
from PIL import Image
OUT = '../../public/woodpecker/'
def load(p): return np.array(Image.open(p).convert('RGBA'))
side = load('raw/bird_side.png'); H, W = side.shape[:2]
front = load('raw/bird_front_k.png')
front = cv2.resize(front, (W, H), interpolation=cv2.INTER_CUBIC)
# ECC align front -> side on the lower body (unchanged part)
def gray(a):
    g = cv2.cvtColor(a[..., :3], cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
    al = a[..., 3].astype(np.float32) / 255
    return g * al + (1 - al) * 0.6
mask = np.zeros((H, W), np.uint8); mask[int(H * .42):, :] = 255
warp = np.eye(2, 3, dtype=np.float32)
cc, warp = cv2.findTransformECC(gray(side), gray(front), warp, cv2.MOTION_AFFINE,
                                (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 300, 1e-6), mask, 5)
print('ecc', cc, warp.round(3).tolist())
front_al = cv2.warpAffine(front, warp, (W, H), flags=cv2.INTER_CUBIC + cv2.WARP_INVERSE_MAP,
                          borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
# common trim box
al = np.maximum(side[..., 3], front_al[..., 3]) > 10
ys, xs = np.where(al); x0, y0, x1, y1 = xs.min() - 12, ys.min() - 12, xs.max() + 13, ys.max() + 13
x0, y0 = max(x0, 0), max(y0, 0)
meta = {}
for name, a in [('bird_side', side), ('bird_front', front_al)]:
    c = a[y0:y1, x0:x1]; Image.fromarray(c, 'RGBA').save(OUT + name + '.png')
    meta[name] = {'w': c.shape[1], 'h': c.shape[0]}
s = side[y0:y1, x0:x1, 3] > 128; h, w = s.shape
# beak tip: rightmost opaque pixel in top 25%
top = s[: int(h * .25)]; ys_, xs_ = np.where(top); i = xs_.argmax(); meta['beak'] = [int(xs_[i]), int(ys_[i])]
# claws: rightmost points in the 35-55% band and 55-75% band
for k, (a_, b_) in {'claw1': (.33, .52), 'claw2': (.52, .72)}.items():
    band = s[int(h * a_): int(h * b_)]; ys_, xs_ = np.where(band); i = xs_.argmax()
    meta[k] = [int(xs_[i]), int(ys_[i] + h * a_)]
# head: largest inscribed disc in top 30%
ff = s[: int(h * .30)].astype(np.uint8)
dt = cv2.distanceTransform(ff, cv2.DIST_L2, 5); hy, hx = np.unravel_index(dt.argmax(), dt.shape)
meta['head'] = [int(hx), int(hy), float(dt[hy, hx])]
# tail tip: lowest opaque pixel
ys_, xs_ = np.where(s); i = ys_.argmax(); meta['tail'] = [int(xs_[i]), int(ys_[i])]
# eye: find the white eye disc near the head - darkest small blob is the pupil; approximate via the black pupil in head region
rgb = side[y0:y1, x0:x1, :3].astype(int)
for name in ['brain', 'hammer']:
    a = load(f'raw/{name}_k.png'); ys_, xs_ = np.where(a[..., 3] > 10)
    c = a[max(ys_.min() - 12, 0): ys_.max() + 13, max(xs_.min() - 12, 0): xs_.max() + 13]
    Image.fromarray(c, 'RGBA').save(OUT + name + '.png'); meta[name] = {'w': c.shape[1], 'h': c.shape[0]}
json.dump(meta, open('sprites.json', 'w'), indent=1); print(json.dumps(meta))
# QA: side with markers + front overlay
q = Image.fromarray(side[y0:y1, x0:x1]).convert('RGBA'); f = Image.fromarray(front_al[y0:y1, x0:x1]).convert('RGBA')
bg = Image.new('RGBA', q.size, (255, 140, 60, 255)); bg.alpha_composite(q)
bl = Image.blend(bg, Image.alpha_composite(Image.new('RGBA', q.size, (255, 140, 60, 255)), f), .5)
import PIL.ImageDraw as D; d = D.Draw(bl)
for k in ['beak', 'claw1', 'claw2', 'tail']:
    x, y = meta[k]; d.ellipse([x - 15, y - 15, x + 15, y + 15], outline=(0, 255, 0), width=6)
hx, hy, r = meta['head']; d.ellipse([hx - r, hy - r, hx + r, hy + r], outline=(0, 0, 255), width=6)
bl.convert('RGB').resize((w // 3, h // 3)).save('qa/marks.png')
