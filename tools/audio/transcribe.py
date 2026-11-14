#!/usr/bin/env python3
"""Arabic-first transcript with confidence, to decide whether captions are honest.
usage: .venv/bin/python -I tools/audio/transcribe.py FILE [--model medium] [--lang ar]
Segments with avg_logprob < -0.8 or repeated text are flagged as unreliable (likely hallucination)."""
import argparse, subprocess, numpy as np
from faster_whisper import WhisperModel
ap = argparse.ArgumentParser(); ap.add_argument("file"); ap.add_argument("--model", default="medium"); ap.add_argument("--lang", default="ar")
a = ap.parse_args()
pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", a.file, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True).stdout
audio = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
m = WhisperModel(a.model, device="cpu", compute_type="int8")
segs, info = m.transcribe(audio, language=a.lang, word_timestamps=True, beam_size=5)
seen = set()
for s in segs:
    bad = s.avg_logprob < -0.8 or s.text.strip() in seen or s.no_speech_prob > 0.6
    seen.add(s.text.strip())
    print(f"[{s.start:6.2f}-{s.end:6.2f}] {'UNRELIABLE' if bad else 'ok        '} p={s.avg_logprob:.2f} {s.text.strip()}")
