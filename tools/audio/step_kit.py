#!/usr/bin/env python3
"""STEP DECODE sound kit for the template (core/remotion/public/sfx/step/*.wav) — original, studio-owned.
Built from the sonic-identity instruments the owner preferred (round 3: A "Warm Scholar" + B's reveal):
  hit · whoosh · pop1..5 · tick · tick-hi · strike · success · chime1..3 · tap · logo
  .venv/bin/python -I tools/audio/step_kit.py core/remotion/public/sfx/step
No noise beds, no hiss: whoosh is band-limited (≤ 3.5 kHz) and short."""
import importlib.util, os, sys
import numpy as np

here = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("si", os.path.join(here, "sonic_identity.py"))
si = importlib.util.module_from_spec(spec); spec.loader.exec_module(si)
SR, tt, st, rv, tail = si.SR, si.tt, si.stereo, si.reverb, si.tail


def norm(x, peak=0.7):
    x = x if x.ndim == 2 else st(x)
    return x / (np.abs(x).max() + 1e-9) * peak


def fit(sig, d):
    out = np.zeros(int(d * SR)); n = min(len(sig), len(out)); out[:n] = sig[:n]; return out


def kit(out):
    os.makedirs(out, exist_ok=True)
    w = lambda name, x: si.write(os.path.join(out, f"{name}.wav"), norm(x))
    # hit: opening — soft sub + first motif note + faint bell
    h = fit(si.sub_thump(0.7, 44), 1.2) * 0.8 + fit(si.marimba(si.MOTIF[0], 1.0, 0.8), 1.2) * 0.6 + fit(si.bell(si.MOTIF[3], 1.2, 0.2), 1.2) * 0.4
    w("hit", rv(tail(st(h), 0.5), 1.2, 0.18))
    # whoosh: short band-limited air + rising tone (transitions)
    t = tt(0.4); env = (t / 0.4) ** 1.6 * np.exp(-np.maximum(0, t - 0.3) / 0.035)
    air = si.fft_filter(si.rng.standard_normal(len(t)), lo=300, hi=3500) * env
    rise = si.soft_swell(0.4, (62, 69, 74)) * 0.8
    w("whoosh", np.stack([air * 0.8 + rise, air * 0.6 + rise], 1))
    # pops: rising marimba notes, one per option
    for i, m in enumerate(si.OPTION_NOTES[:5]):
        p = fit(si.marimba(m, 0.5, 0.9), 0.5)
        tb = tt(0.03); blip = np.sin(2 * np.pi * (1300 - 600 * tb / 0.03) * tb) * np.exp(-tb / 0.008) * 0.15
        p[: len(blip)] += blip
        w(f"pop{i + 1}", st(p, -0.3 + 0.15 * i))
    # ticks
    w("tick", si.woodblock(93)); w("tick-hi", fit(si.woodblock(98), 0.5) + fit(si.bell(98, 0.5, 0.15), 0.5) * 0.4)
    # strike: muted descending dyad + soft thud
    s = fit(si.marimba(66, 0.6, 0.8), 0.6) * 0.7 + fit(si.marimba(63, 0.6, 0.6), 0.6) * 0.5 + fit(si.heartbeat(0.2, 70), 0.6) * 0.6
    w("strike", s)
    # success: B's reveal (filter-opening chord + sparkle + sub) — the sound the owner chose
    ch = np.stack([si.supersaw_chord([50, 62, 66, 69, 74, 76]), si.supersaw_chord([50, 62, 66, 69, 74, 76])], 1) * 0.8
    for i, m in enumerate([74, 78, 81, 86]):
        pl = si.pluck(m, 0.4, 0.6); a = int((0.05 + i * 0.06) * SR); ch[a:a + len(pl)] += st(pl, -0.4 + 0.27 * i)[: len(ch) - a] * 0.4
    sub = si.sub_thump(0.7, 38); ch[: len(sub)] += st(sub) * 0.9
    w("success", rv(tail(ch, 0.6), 1.4, 0.2))
    # chimes: the motif spelled by the analysis steps (warm felt piano)
    for i in range(3):
        w(f"chime{i + 1}", rv(tail(st(si.felt_piano(si.MOTIF[i], 1.3, 0.7), (-0.2, 0.2, 0.0)[i]), 0.6), 1.3, 0.22))
    # tap: formula chips (very light)
    w("tap", fit(si.marimba(86, 0.25, 0.5), 0.25))
    # logo: full motif + warm resolve
    end = np.zeros(int(2.4 * SR))
    for i, m in enumerate(si.MOTIF):
        n = si.felt_piano(m, 2.0, 0.8); a = int(i * 0.16 * SR); end[a:a + len(n)] += n[: len(end) - a]
    res = sum(si.felt_piano(m, 2.0, 0.6) for m in [50, 62, 69]); a = int(0.64 * SR); end[a:a + len(res)] += res[: len(end) - a] * 0.8
    w("logo", rv(tail(st(end), 0.8), 1.6, 0.24))
    print(f"kit → {out}: {sorted(os.listdir(out))}")


if __name__ == "__main__":
    kit(sys.argv[1] if len(sys.argv) > 1 else "core/remotion/public/sfx/step")
