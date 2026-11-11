# key.py in.png out.png : flat background colour connected to the border -> transparent
import sys, numpy as np, cv2
from PIL import Image
im = np.array(Image.open(sys.argv[1]).convert('RGB')).astype(np.float32)
h, w, _ = im.shape
border = np.concatenate([im[0], im[-1], im[:, 0], im[:, -1]])
bgc = np.median(border, 0)
dist = np.sqrt(((im - bgc) ** 2).sum(2))
near = (dist < 60).astype(np.uint8)
# flood fill of `near` from all border pixels
n, lab = cv2.connectedComponents(near, connectivity=4)
bl = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
bg = np.isin(lab, list(bl))
alpha = np.where(bg, 0.0, 1.0)
# soften: 3px band around bg, alpha from colour distance to the background
band = cv2.dilate(bg.astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool) & ~bg
ink_d = 200.0
alpha[band] = np.clip(dist[band] / ink_d, 0, 1)
rgb = im.copy()
# un-blend edge pixels towards ink colour: c = (obs - (1-a)*bg)/a
a = alpha[..., None]
fix = band[..., None] & (a > 0.05)
rgb = np.where(fix, np.clip((im - (1 - a) * bgc) / np.maximum(a, 0.05), 0, 255), im)
out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
Image.fromarray(out, 'RGBA').save(sys.argv[2])
print(sys.argv[2], 'bg', bgc.round(), 'transparent', round(float(bg.mean()), 3))
