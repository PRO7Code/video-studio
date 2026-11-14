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
# voice clean-up (owner heard hiss): the int8 model adds a fizzy top end and sharp sibilants.
# denoise → de-ess → low-pass above the speech band → soft gate between words. Measured: speech 6–16 kHz −15 dB, 1–4 kHz unchanged.
CLEAN = ("highpass=f=70,afftdn=nr=12:nf=-50:tn=1,deesser=i=0.5:m=0.5:f=0.5,lowpass=f=11500,"
         "agate=threshold=0.01:ratio=4:attack=4:release=140:range=0.1")


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


def phonemes_for(text, lang, overrides=None, rhotic_fix=True):
    """espeak G2P + fixes. The bundled espeak renders the en-US NURSE vowel non-rhotic (learn → lˈɜːn, bird → bˈɜːd);
    Kokoro's US convention is ɜɹ, so en-US gets ɜː → ɜɹ. Per-word overrides replace the automatic IPA of that word."""
    from kokoro_onnx.tokenizer import Tokenizer
    import re
    tk = Tokenizer()
    ph = tk.phonemize(text, lang)
    for word, ipa in (overrides or {}).items():
        auto = tk.phonemize(word, lang).strip(" .")
        if auto and auto in ph:
            ph = ph.replace(auto, ipa)
        else:
            print(f"warning: could not place override for '{word}' (auto '{auto}')", file=sys.stderr)
    if rhotic_fix and lang == "en-us":
        ph = re.sub(r"ɜː(?!ɹ)", "ɜɹ", ph)
    return ph


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("text"); ap.add_argument("out")
    ap.add_argument("--accent", choices=list(ACCENTS), default="en-US")
    ap.add_argument("--voice", default=None, help="default: af_heart (US) / bf_emma (GB)")
    ap.add_argument("--speed", type=float, default=0.95)
    ap.add_argument("--gain-db", type=float, default=0.0)
    ap.add_argument("--phoneme", action="append", default=[], metavar="WORD=IPA",
                    help="explicit pronunciation for a word (repeatable), e.g. learn=lˈɜɹn")
    ap.add_argument("--no-rhotic-fix", action="store_true", help="disable the en-US NURSE-vowel fix (diagnostics)")
    ap.add_argument("--print-phonemes", action="store_true")
    a = ap.parse_args()
    lang, prefix = ACCENTS[a.accent]
    voice = a.voice or ("af_heart" if a.accent == "en-US" else "bf_emma")
    if voice[0] != prefix:
        print(f"warning: voice {voice} is not a native {a.accent} voice", file=sys.stderr)
    from kokoro_onnx import Kokoro
    k = Kokoro(os.path.join(HOME, "model_quantized.onnx"), voices_npz([voice]))
    ph = phonemes_for(a.text, lang, dict(x.split("=", 1) for x in a.phoneme), rhotic_fix=not a.no_rhotic_fix)
    if a.print_phonemes:
        print("phonemes:", ph)
    samples, sr = k.create(ph, voice=voice, speed=a.speed, lang=lang, is_phonemes=True)
    import soundfile as sf
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as t:
        sf.write(t.name, samples, sr)
        raw = t.name
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af",
                    f"{CLEAN},loudnorm=I=-16:TP=-1.5:LRA=7,volume={a.gain_db}dB,apad=pad_dur=0.05", "-ar", "48000", "-ac", "2", a.out], check=True)
    os.remove(raw)
    print(f"{a.accent} {voice} speed={a.speed} → {a.out}")


if __name__ == "__main__":
    main()
