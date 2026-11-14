#!/usr/bin/env python3
"""Episode builder for StepDecode: voice-over (local Piper TTS, no cost) or --text-only, plus an optional music bed.

Reads the episode JSON's "vo" list, synthesises each line, loudness-normalises it, measures its length and writes a
*resolved* props file: voiceover.segments + timing overrides so every phase is long enough for its line.

  .venv/bin/python -I tools/audio/make_vo.py projects/lef-academy/step-decode/episodes/<slug>.json \
      --media-dir core/remotion/public/projects/lef/<slug> --out projects/lef-academy/step-decode/out/<slug>.props.json \
      [--music] [--voice ~/tools/piper/ar_JO-kareem-medium.onnx] [--speed 0.82]

"vo" items: {"phase": "hook|question|options|think|reveal|rule|outro", "text": "..."} or
            {"phase": "eliminate", "option": k, "text": "..."}   (k = k-th WRONG option, in order)
Write the text fully vocalised (tashkeel) and spell English words in Arabic letters for a clean pronunciation.
NOTE: the default Piper voice (ar_JO-kareem) has an unverified dataset licence → drafts only, not for publishing.
"""
import argparse, json, math, os, subprocess, sys

DEFAULTS = {"hook": 54, "question": 84, "options": 66, "think": 90, "reveal": 60, "rule": 270, "outro": 96}  # = stepDecodeTiming.ts (v3)
LEAD, TAIL = 6, {"hook": 18, "question": 24, "options": 12, "think": 12, "reveal": 14, "rule": 36, "outro": 30}
FPS = 30


def run(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, **kw)
    if r.returncode:
        sys.exit(f"failed: {' '.join(cmd[:3])}…\n{r.stderr.decode(errors='replace')[-600:]}")
    return r


def duration(path):
    return float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]).stdout)


def english_lines(ep, en):
    """English read-aloud lines from audio.en: stem (blank spoken as "blank"), options, full correct sentence"""
    import math as _m
    blank = ep["question"].get("blank", "___")
    stem = ep["question"]["stem"]
    answer = ep["options"][ep["correct"]]["text"]
    base = {"lang": "en", "accent": en.get("accent", "en-US"), "speaker": en.get("speaker", "af_heart"),
            "speed": en.get("speed", 0.92), "gain_db": 20 * _m.log10(max(0.05, en.get("volume", 1.0))), "phonemes": en.get("phonemes", {})}
    t = en.get("timing", {})
    out = []
    for what in en.get("read", ["stem", "answer"]):
        if what == "stem":
            out.append({**base, "phase": "question", "offset": t.get("stemOffset", 18), "stretch": "question" in en.get("stretch", ["question", "reveal"]),
                        "text": __import__("re").sub(r"\s*" + __import__("re").escape(blank) + r"\s*", ", blank, ", stem)})
        elif what == "options":
            out.append({**base, "phase": "options", "offset": t.get("optionsOffset", 10),
                        "text": ". ".join(f"{'ABCDE'[i]}: {o['text']}" for i, o in enumerate(ep["options"])) + "."})
        elif what == "answer":
            out.append({**base, "phase": "reveal", "offset": t.get("answerOffset", 14), "stretch": "reveal" in en.get("stretch", ["question", "reveal"]),
                        "text": stem.replace(blank, answer)})
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("episode"); ap.add_argument("--media-dir", required=True); ap.add_argument("--out", required=True)
    ap.add_argument("--voice", default=os.path.expanduser("~/tools/piper/ar_JO-kareem-medium.onnx"))
    ap.add_argument("--speed", type=float, default=0.82, help="Piper length scale (<1 = faster)")
    ap.add_argument("--music", action="store_true", help="also generate an original music bed (tools/audio/compose_bed.py)")
    ap.add_argument("--text-only", action="store_true", help="no voice: on-screen text carries the explanation (use when no approved voice exists)")
    a = ap.parse_args()
    ep = json.load(open(a.episode, encoding="utf-8"))
    vo = [] if a.text_only else ep.pop("vo", [])
    ep.pop("vo", None)
    if not vo and not a.text_only:
        sys.exit("episode has no \"vo\" list (use --text-only for an on-screen-text version)")
    os.makedirs(a.media_dir, exist_ok=True)
    public = os.path.join("core", "remotion", "public")
    rel = os.path.relpath(a.media_dir, public)
    segs, need, per_opt = [], {}, int(ep.get("perOption") or 48)
    en = (ep.get("audio") or {}).get("en") or {}
    if en.get("enabled"):
        vo = vo + english_lines(ep, en)
    for i, item in enumerate(vo):
        raw, wav = os.path.join(a.media_dir, f"vo{i:02d}_raw.wav"), os.path.join(a.media_dir, f"vo{i:02d}.wav")
        if item.get("lang") == "en":
            cmd = [sys.executable, "-I", os.path.join(os.path.dirname(__file__), "en_tts.py"), item["text"], wav,
                   "--accent", item["accent"], "--voice", item["speaker"], "--speed", str(item["speed"]),
                   "--gain-db", str(item.get("gain_db", 0))]
            for w, ipa in (item.get("phonemes") or {}).items():
                cmd += ["--phoneme", f"{w}={ipa}"]
            run(cmd)
        else:
            run([sys.executable, "-m", "piper", "-m", a.voice, "--length-scale", str(a.speed), "--sentence-silence", "0.1", "-f", raw],
                input=item["text"].encode("utf-8"))
            run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af", "highpass=f=80,loudnorm=I=-16:TP=-1.5:LRA=7,apad=pad_dur=0.05",
                 "-ar", "48000", "-ac", "2", wav])
            os.remove(raw)
        frames = math.ceil(duration(wav) * FPS)
        seg = {"src": f"{rel}/vo{i:02d}.wav", "phase": item["phase"], "frames": frames}
        if item["phase"] == "eliminate":
            seg["option"] = int(item["option"]); seg["offset"] = int(item.get("offset", 2))
            per_opt = max(per_opt, frames + seg["offset"] + 14)
        else:
            seg["offset"] = int(item.get("offset", LEAD))
            if item.get("lang"):
                seg["lang"] = item["lang"]
            if item.get("stretch", True):
                need[item["phase"]] = max(need.get(item["phase"], 0), seg["offset"] + frames + TAIL.get(item["phase"], 18))
        segs.append(seg)
        print(f"  vo{i:02d} {item.get('lang','ar')} {item['phase']:<9} {frames/FPS:5.2f}s  {item['text'][:48]}")
    timing = dict(ep.get("timing") or {})
    for ph, n in need.items():
        timing[ph] = max(DEFAULTS[ph], n, timing.get(ph, 0))
    ep["timing"] = timing
    ep["perOption"] = per_opt
    ep["voiceover"] = {"segments": segs, "volume": 1.0} if segs else None
    total = sum(timing.get(k, v) for k, v in DEFAULTS.items()) + (len(ep["options"]) - 1) * per_opt + 15
    if a.music:
        bed = os.path.join(a.media_dir, "bed.wav")
        run([sys.executable, "-I", os.path.join(os.path.dirname(__file__), "compose_bed.py"), bed, "--seconds", f"{total / FPS + 0.5:.2f}"])
        ep["music"] = {"src": f"{rel}/bed.wav", "volume": 0.55}
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    json.dump(ep, open(a.out, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"resolved props → {a.out}  (≈{total / FPS:.1f}s, perOption={per_opt}f)")


if __name__ == "__main__":
    main()
