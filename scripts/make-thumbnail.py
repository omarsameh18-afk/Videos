#!/usr/bin/env python3
"""Compose a 1080x1920 Shorts thumbnail from an existing clip frame (zero generation credits).

usage: python3 scripts/make-thumbnail.py thumbnails/<id>.json
config:
  clip      assets/clips/<name>.mp4 (or a .png still)
  t         frame time in seconds (ignored for stills)
  scale     Max scale (source frame is 1072x1928, Max fills ~90% of it)
  x, y      where the scaled frame's top-left goes on the canvas
  lines     [{"text": "SKIP LEG DAY?", "size": 178, "color": "white"|"lime", "y": 200}, ...]
Writes thumbnails/<id>.png.

Rules (docs/REVIEW.md, THUMBNAILS): Max >= 55% of the frame, 2-4 huge words, white + lime #B6FF2E,
thick dark outline, text inside the middle 80% (y 192-1728), must promise what the first 2 s deliver.
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageFont

W, H = 1080, 1920
LIME = (182, 255, 46)
WHITE = (255, 255, 255)
INK = (10, 14, 30)
FONT = 'node_modules/@fontsource/anton/files/anton-latin-400-normal.woff'


def grab(clip, t):
    if clip.endswith('.png'):
        return Image.open(clip).convert('RGB')
    tmp = Path(tempfile.mkdtemp()) / 'f.png'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(t), '-i', clip, '-frames:v', '1', str(tmp)], check=True)
    return Image.open(tmp).convert('RGB')


def main(cfg_path):
    cfg = json.loads(Path(cfg_path).read_text())
    out = Path(cfg_path).with_suffix('.png')
    src = grab(cfg['clip'], cfg.get('t', 0))
    src = ImageEnhance.Contrast(ImageEnhance.Color(src).enhance(1.15)).enhance(1.08)

    s = cfg['scale']
    fw, fh = round(src.width * s), round(src.height * s)
    frame = src.resize((fw, fh), Image.LANCZOS)
    x0, y0 = cfg['x'], cfg['y']

    # Plate = un-darkened scene: wall colour, the frame, and its outermost background columns
    # stretched (blurred, cross-faded) to fill the sides, so it reads as one simple room.
    plate = Image.new('RGB', (W, H), src.getpixel((src.width // 2, 8)))
    strip_w = cfg.get('stripW', 16)
    top_fade = Image.new('L', (fw, fh), 255)
    ImageDraw.Draw(top_fade).rectangle((0, 0, fw, 40), fill=0)
    top_fade = top_fade.filter(ImageFilter.GaussianBlur(20))
    plate.paste(frame, (x0, y0), top_fade)
    blend = 80
    if x0 + fw < W:
        sw = W - (x0 + fw) + blend
        strip = frame.crop((fw - strip_w, 0, fw, fh)).resize((sw, fh), Image.LANCZOS).filter(ImageFilter.GaussianBlur(6))
        ramp = Image.eval(Image.linear_gradient('L').rotate(90).resize((sw, fh)), lambda v: min(255, v * sw // blend))
        plate.paste(strip, (x0 + fw - blend, y0), ImageChops.multiply(ramp, top_fade.resize((sw, fh))))
    if x0 > 0:
        sw = x0 + blend
        strip = frame.crop((0, 0, strip_w, fh)).resize((sw, fh), Image.LANCZOS).filter(ImageFilter.GaussianBlur(6))
        ramp = Image.eval(Image.linear_gradient('L').rotate(-90).resize((sw, fh)), lambda v: min(255, v * sw // blend))
        plate.paste(strip, (0, y0), ImageChops.multiply(ramp, top_fade.resize((sw, fh))))

    # Darken towards the edges and the top (text zone); keep Max un-darkened -> Max pops, text reads.
    shade = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(shade)
    top = cfg.get('topShadeTo', 720)
    for yy in range(top):
        d.line((0, yy, W, yy), fill=int(170 * (1 - yy / top) ** 1.6))
    vign = Image.new('L', (W, H), 0)
    ImageDraw.Draw(vign).ellipse((-260, 180, W + 260, H + 300), fill=255)
    vign = vign.filter(ImageFilter.GaussianBlur(160))
    shade = ImageChops.lighter(shade, Image.eval(vign, lambda v: int((255 - v) * 0.6)))
    dark = Image.composite(Image.new('RGB', (W, H), INK), plate, shade)
    keep = Image.new('L', (W, H), 0)
    ImageDraw.Draw(keep).ellipse(tuple(cfg.get('keep', (40, 380, 1040, 1900))), fill=255)
    keep = keep.filter(ImageFilter.GaussianBlur(70))
    canvas = Image.composite(plate, dark, keep)


    # Text: Anton, thick dark outline + hard drop shadow.
    for ln in cfg['lines']:
        font = ImageFont.truetype(FONT, ln['size'])
        color = LIME if ln.get('color') == 'lime' else WHITE
        stroke = ln.get('stroke', max(10, ln['size'] // 12))
        layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        dl = ImageDraw.Draw(layer)
        bbox = dl.textbbox((0, 0), ln['text'], font=font, stroke_width=stroke)
        tw = bbox[2] - bbox[0]
        tx = (W - tw) // 2 - bbox[0] + ln.get('dx', 0)
        ty = ln['y'] - bbox[1]
        sh = ln.get('shadow', stroke)
        dl.text((tx + sh, ty + sh), ln['text'], font=font, fill=INK, stroke_width=stroke, stroke_fill=INK)
        dl.text((tx, ty), ln['text'], font=font, fill=color, stroke_width=stroke, stroke_fill=INK)
        canvas = Image.alpha_composite(canvas.convert('RGBA'), layer).convert('RGB')
        print(f"  '{ln['text']}': x {tx + bbox[0]}-{tx + bbox[2]}, y {ln['y']}-{ln['y'] + bbox[3] - bbox[1]}")

    canvas.save(out)
    print(f'✓ {out} ({W}x{H}); Max frame {fw}x{fh} at ({x0},{y0})')


if __name__ == '__main__':
    main(sys.argv[1])
