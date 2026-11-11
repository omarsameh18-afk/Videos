#!/bin/sh
# Final 4K vertical render (2160x3840, 60 fps). CPU render; uses the preinstalled headless Chromium (see remotion.config.ts).
set -e
cd "$(dirname "$0")/.."
npx remotion render src/index.ts Woodpecker out/woodpecker-4K.mp4 --scale=2 --image-format=jpeg --jpeg-quality=95 --crf=16 \
  --pixel-format=yuv420p --concurrency=4 --log=error
