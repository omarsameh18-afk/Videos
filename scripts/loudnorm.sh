#!/bin/sh
# Loudness: two-pass EBU R128 normalisation of the finished mix to -14 LUFS (true peak <= -1.5 dBTP). The picture is copied untouched.
# usage: scripts/loudnorm.sh <in.mp4> <out.mp4> [target LUFS, default -14]
set -e
IN="$1"; OUT="$2"; I="${3:--14}"; TP=-1.5; LRA=11
M=$(ffmpeg -hide_banner -nostats -i "$IN" -vn -af "loudnorm=I=$I:TP=$TP:LRA=$LRA:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { printf '%s' "$M" | python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }
DUR=$(ffprobe -v error -select_streams v:0 -show_entries stream=duration -of default=nw=1:nk=1 "$IN" | head -1)   # audio is cut to the picture length
ffmpeg -hide_banner -loglevel error -y -i "$IN" -t "$DUR" -c:v copy \
  -af "loudnorm=I=$I:TP=$TP:LRA=$LRA:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true:print_format=summary,aresample=48000" \
  -c:a aac -b:a 192k -movflags +faststart "$OUT"
ffmpeg -hide_banner -nostats -i "$OUT" -vn -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|Peak:)" | tail -2
