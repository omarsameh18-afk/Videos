# key_checker.py in.png out.png : remove a painted fake-transparency checkerboard (or any light neutral background)
# connected to the border; the black outline stops the fill. Edge pixels get alpha from their luminance.
import sys, numpy as np, cv2
from PIL import Image
im = np.array(Image.open(sys.argv[1]).convert('RGB')).astype(np.float32)
lum = im.mean(2); sat = im.max(2) - im.min(2)
near = ((sat < 22) & (lum > 185)).astype(np.uint8)
n, lab = cv2.connectedComponents(near, connectivity=4)
bl = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
bg = np.isin(lab, list(bl))
bg = cv2.morphologyEx(bg.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)).astype(bool)
alpha = np.where(bg, 0.0, 1.0)
band = cv2.dilate(bg.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool) & ~bg
bgl = 238.0
a_band = np.clip((bgl - lum) / (bgl - 25), 0, 1)
alpha[band] = np.maximum(a_band[band], (sat[band] > 40).astype(float))
rgb = np.where(band[..., None] & (sat[..., None] < 40), np.minimum(im, 30), im)
out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
Image.fromarray(out, 'RGBA').save(sys.argv[2])
print(sys.argv[2], 'bg frac', round(float(bg.mean()), 3))
