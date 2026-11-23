#!/bin/sh
# Final render: 1080x1920, 60 fps, H.264 + AAC. CPU render with the preinstalled headless Chromium (see remotion.config.ts).
# usage: scripts/render.sh [CompositionId] [output]   (defaults: Elfahman01Rabies out/elfahman-01-rabies.mp4)
set -e
cd "$(dirname "$0")/.."
COMP="${1:-Elfahman01Rabies}"; OUT="${2:-out/elfahman-01-rabies.mp4}"
npx remotion render src/index.ts "$COMP" "$OUT" --image-format=jpeg --jpeg-quality=95 --crf=17 \
  --pixel-format=yuv420p --concurrency=4 --audio-bitrate=192k --log=error
