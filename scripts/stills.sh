#!/usr/bin/env bash
# Render character test stills: scripts/stills.sh OUTDIR "expr pose" ...
set -e
OUT=$1; shift
BROWSER=${REMOTION_BROWSER:-/opt/pw-browsers/chromium_headless_shell}
for spec in "$@"; do
  set -- $spec
  npx remotion still src/index.ts CharacterStill "$OUT/$1-$2.png" \
    --props="{\"expression\":\"$1\",\"pose\":\"$2\",\"label\":\"$1\"}" \
    --browser-executable="$BROWSER" --scale="${SCALE:-1}" >/dev/null
  echo "$OUT/$1-$2.png"
done
