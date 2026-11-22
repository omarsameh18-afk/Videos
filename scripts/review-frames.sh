#!/usr/bin/env bash
# Render review stills of a Short at given frames into review/<id>/ and a contact sheet.
# usage: scripts/review-frames.sh <id> <frame> [frame...]   (run `npm run render` first)
set -e
ID=$1; shift
mkdir -p review/$ID
for f in "$@"; do
  npx remotion still src/index.ts Short review/$ID/f$(printf %04d $f).png --frame=$f --props=.cache/props/$ID.json >/dev/null 2>&1
done
ls review/$ID/f*.png | head -8 > /tmp/review-list.txt
ffmpeg -v error -y $(sed 's/^/-i /' /tmp/review-list.txt) -filter_complex "$(n=$(wc -l < /tmp/review-list.txt); for i in $(seq 0 $((n-1))); do printf "[$i]scale=540:-1[s$i];"; done; for i in $(seq 0 $((n-1))); do printf "[s$i]"; done; echo "hstack=$n")" review/$ID/sheet.png
echo review/$ID/sheet.png
