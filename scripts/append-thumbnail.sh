#!/usr/bin/env bash
# Append thumbnails/<id>.png as the last 0.3 s of out/<id>.mp4 (silent tail, voice/music untouched),
# so the frame can be picked in the YouTube mobile "Edit thumbnail" frame picker.
# usage: bash scripts/append-thumbnail.sh <id>   -> out/<id>.mp4 (original kept as out/<id>.nothumb.mp4)
set -euo pipefail
id="$1"; png="thumbnails/$id.png"; src="out/$id.nothumb.mp4"; out="out/$id.mp4"
[ -f "$src" ] || mv "out/$id.mp4" "$src"
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$src")
ffmpeg -v error -y -i "$src" -loop 1 -framerate 30 -t 0.3 -i "$png" -filter_complex \
  "[1:v]scale=1080:1920,setsar=1,format=yuv420p,fps=30[t];[0:v]setsar=1,format=yuv420p[v];[v][t]concat=n=2:v=1:a=0[vo];[0:a]apad=whole_dur=$(echo "$dur + 0.3" | bc)[ao]" \
  -map "[vo]" -map "[ao]" -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -movflags +faststart "$out"
ffprobe -v error -show_entries stream=codec_name,pix_fmt,width,height,r_frame_rate:format=duration -of compact "$out"
