#!/usr/bin/env bash
# Render review stills of a Short at given frames into review/<id>/ and a labelled 6-wide grid (review/<id>/sheet.png).
# usage: scripts/review-frames.sh <id> <frame> [frame...]   (run `npm run render` first)
set -e
ID=$1; shift
rm -rf review/$ID; mkdir -p review/$ID
for f in "$@"; do
  npx remotion still src/index.ts Short review/$ID/f$(printf %04d $f).png --frame=$f --props=.cache/props/$ID.json >/dev/null 2>&1
done
python3 - "$ID" "$@" <<'PY'
import sys
from PIL import Image, ImageDraw
ID, frames = sys.argv[1], sys.argv[2:]
tw, th, cols = 360, 640, 6
rows = (len(frames) + cols - 1) // cols
sheet = Image.new('RGB', (cols * tw, rows * th), 'black')
for i, f in enumerate(frames):
    im = Image.open(f'review/{ID}/f{int(f):04d}.png').convert('RGB').resize((tw, th))
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 70, 30], fill='black'); d.text((6, 8), f, fill='white')
    sheet.paste(im, ((i % cols) * tw, (i // cols) * th))
sheet.save(f'review/{ID}/sheet.png')
PY
echo review/$ID/sheet.png
