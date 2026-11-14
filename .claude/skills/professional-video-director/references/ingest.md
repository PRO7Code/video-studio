# Ingest
- `ffprobe` every file (codec, rotation side data, fps, duration). Chromium cannot decode HEVC → transcode H.264.
- Fix rotation by looking at a contact sheet (`transpose=1/2`), not by trusting metadata.
- Normalise: `libx264 -crf 16 -preset slow -r 30`, audio `highpass=90,afftdn,loudnorm=I=-18`.
- Contact sheets: `fps=1.5,scale=-2:400,tile=6x2`. Look at them before choosing shots.
- Speech: `tools/audio/transcribe.py` (faster-whisper medium, Arabic). Low avg_logprob (< -0.8) or repeated text =
  hallucination → no captions.
