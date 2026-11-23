# Split the study set into depth layers: back wall (desk area replaced by dark floor) + desk foreground (desk, mug, books).
import numpy as np, cv2
from PIL import Image
s = np.array(Image.open('images/elfahman/raw/set_study.png').convert('RGB')); H, W = s.shape[:2]
DESK = 1530
fg = np.zeros((H, W), np.uint8); fg[DESK:] = 255
fg[1486:DESK, 0:178] = 255      # coffee mug + saucer
fg[1436:DESK, 893:W] = 255      # stack of books
# keep only non-wall pixels inside the object boxes (wall is teal)
box = np.zeros((H, W), bool); box[1436:DESK] = True
teal = (s[..., 1].astype(int) - s[..., 0] > 18) & (s[..., 2].astype(int) - s[..., 0] > 10)
fg[box & teal] = 0
fg = cv2.GaussianBlur(fg, (3, 3), 0)
Image.fromarray(np.dstack([s, fg]), 'RGBA').save('public/elfahman/lib/set_fg.png')
bg = s.copy().astype(np.float32)
grad = np.linspace(0, 1, H - DESK + 40)[:, None, None]
floor = (np.array([58, 36, 24]) * (1 - grad) + np.array([30, 19, 14]) * grad)
bg[DESK - 40:] = floor[:, :, :] * np.ones((1, W, 1))
Image.fromarray(bg.astype(np.uint8)).save('public/elfahman/lib/set_bg.jpg', quality=92)
print('ok', W, H)
