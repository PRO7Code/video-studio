#!/usr/bin/env bash
# Two-pass loudness mastering for social delivery: audio → -16 LUFS / -1.5 dBTP, video stream copied untouched.
# usage: tools/audio/master.sh IN.mp4 OUT.mp4 [LUFS]
set -euo pipefail
IN="$1"; OUT="$2"; I="${3:--16}"
J=$(ffmpeg -hide_banner -i "$IN" -af "loudnorm=I=$I:TP=-1.5:LRA=11:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
g(){ echo "$J" | python3 -c "import sys,json;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i "$IN" -c:v copy -af "loudnorm=I=$I:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true" -ar 48000 -c:a aac -b:a 320k -movflags +faststart "$OUT"
ffmpeg -hide_banner -i "$OUT" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):"
