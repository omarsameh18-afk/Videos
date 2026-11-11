#!/bin/sh
# Final 4K vertical render (2160x3840, 60 fps). CPU render; uses the preinstalled headless Chromium (see remotion.config.ts).
# usage: scripts/render4k.sh [CompositionId] [output]   (defaults: Woodpecker out/woodpecker-4K.mp4)
set -e
cd "$(dirname "$0")/.."
COMP="${1:-Woodpecker}"; OUT="${2:-out/woodpecker-4K.mp4}"
npx remotion render src/index.ts "$COMP" "$OUT" --scale=2 --image-format=jpeg --jpeg-quality=95 --crf=16 \
  --pixel-format=yuv420p --concurrency=4 --log=error
