#!/usr/bin/env python3
"""English voice (en-US / en-GB) with Kokoro-82M (Apache-2.0 weights) via kokoro-onnx. Local, free, CPU.

  .venv/bin/python -I tools/audio/en_tts.py "If I had more time, I would learn Spanish." out.wav \
      --accent en-US --voice af_heart --speed 0.95 [--gain-db 0]

Voices (grades from the model card): en-US af_heart (A), af_bella (A-), am_michael (C+);
en-GB bf_emma (B-), bm_george (C). Files live in ~/tools/kokoro (model_quantized.onnx + <voice>.bin), not in git.
Output: 48 kHz stereo WAV, loudness-normalised to -16 LUFS (true peak -1.5) so it mixes evenly with the Arabic VO.
"""
import argparse, os, subprocess, sys, tempfile
import numpy as np

HOME = os.path.expanduser(os.environ.get("KOKORO_HOME", "~/tools/kokoro"))
ACCENTS = {"en-US": ("en-us", "a"), "en-GB": ("en-gb", "b")}


def voices_npz(names):
    path = os.path.join(HOME, "voices.npz")
    have = {}
    if os.path.exists(path):
        have = dict(np.load(path))
    missing = [n for n in names if n not in have]
    for n in missing:
        f = os.path.join(HOME, f"{n}.bin")
        if not os.path.exists(f):
            sys.exit(f"voice {n} not downloaded ({f}); see scripts/bootstrap.sh --with-kokoro")
        have[n] = np.fromfile(f, dtype=np.float32).reshape(-1, 1, 256)
    if missing:
        np.savez(path, **have)
    return path


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("text"); ap.add_argument("out")
    ap.add_argument("--accent", choices=list(ACCENTS), default="en-US")
    ap.add_argument("--voice", default=None, help="default: af_heart (US) / bf_emma (GB)")
    ap.add_argument("--speed", type=float, default=0.95)
    ap.add_argument("--gain-db", type=float, default=0.0)
    a = ap.parse_args()
    lang, prefix = ACCENTS[a.accent]
    voice = a.voice or ("af_heart" if a.accent == "en-US" else "bf_emma")
    if voice[0] != prefix:
        print(f"warning: voice {voice} is not a native {a.accent} voice", file=sys.stderr)
    from kokoro_onnx import Kokoro
    k = Kokoro(os.path.join(HOME, "model_quantized.onnx"), voices_npz([voice]))
    samples, sr = k.create(a.text, voice=voice, speed=a.speed, lang=lang)
    import soundfile as sf
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as t:
        sf.write(t.name, samples, sr)
        raw = t.name
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af",
                    f"highpass=f=70,loudnorm=I=-16:TP=-1.5:LRA=7,volume={a.gain_db}dB,apad=pad_dur=0.05", "-ar", "48000", "-ac", "2", a.out], check=True)
    os.remove(raw)
    print(f"{a.accent} {voice} speed={a.speed} → {a.out}")


if __name__ == "__main__":
    main()
