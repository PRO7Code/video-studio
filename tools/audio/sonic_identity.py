#!/usr/bin/env python3
"""STEP DECODE sonic identity — original, code-generated, licence-free (studio-owned).

One 4-note motif (D5 A5 F#5 D6 — "de-co-de-ED") is the brand: it opens the episode, the analysis card spells it
note by note (clue → rule → meaning) and the end logo plays it in full. Two variants share the structure:

  A "Warm Scholar"  felt piano + marimba + bell, breathy swells, heartbeat tension     (calm, premium, academic)
  B "Decode Tech"   synth pluck + sub pulse + digital scramble, filter-opening reveal  (modern, energetic)
  C "Decode Warm"   B's tech character up to and including the reveal, A's warm felt piano / pad / air for the
                    explanation and the resolve (tension → reward → calm learning)
  D "Scholar Reveal" A everywhere (owner's preference) + ONLY B's answer-reveal sound (owner round 3)

Dramaturgy (from the episode's real event times): logo → question swell → option notes rising → 3 s build
(ticks + accelerating pulse + riser) → intentional stop-down → strikes stepping UP in pitch → drone →
0.35 s silence → reveal (loudest moment) → brighter bed → motif spelled on the 3 analysis steps → end logo.

  .venv/bin/python -I tools/audio/sonic_identity.py --variant A --events events.json --out-dir out/A
writes: sfx.wav (events), bed.wav (music), mix.wav (stems mixed, -1.5 dBTP ceiling), cues.json, kit/*.wav
"""
import argparse, json, os, wave
import numpy as np

SR = 48000
MOTIF = [74, 81, 78, 86]
OPTION_NOTES = [62, 66, 69, 74, 76]
rng = np.random.default_rng(7)


def midi(m): return 440.0 * 2 ** ((m - 69) / 12)
def tt(d): return np.arange(int(d * SR)) / SR


def stereo(x, pan=0.0):
    pan = float(np.clip(pan, -1, 1))
    return np.stack([x * np.sqrt((1 - pan) / 2), x * np.sqrt((1 + pan) / 2)], 1)


class Track:
    def __init__(self, seconds):
        self.buf = np.zeros((int(seconds * SR) + SR, 2))
        self.log = []

    def add(self, sig, at, gain=1.0, pan=0.0, name=None):
        s = sig if sig.ndim == 2 else stereo(sig, pan)
        i = int(max(0, at) * SR)
        j = min(len(self.buf), i + len(s))
        if j > i:
            self.buf[i:j] += s[: j - i] * gain
        if name:
            self.log.append({"t": round(at, 3), "sound": name})


def fft_filter(x, lo=None, hi=None, tilt_db_per_oct=0.0, ref=1000.0):
    """static band-limit + spectral tilt (zero-phase), for shaping one sound"""
    n = len(x)
    X = np.fft.rfft(x, n * 2)
    f = np.fft.rfftfreq(n * 2, 1 / SR)
    g = np.ones_like(f)
    if lo: g *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1)) ** 4)
    if hi: g *= 1 / np.sqrt(1 + (f / hi) ** 4)
    if tilt_db_per_oct: g *= 10 ** (tilt_db_per_oct * np.log2(np.maximum(f, 20) / ref) / 20)
    return np.fft.irfft(X * g, n * 2)[:n]


def reverb(st, seconds=1.6, wet=0.25, predelay=0.012):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    out = st.copy()
    for c in range(2):
        ir = rng.standard_normal(n) * np.exp(-t / (seconds / 6.9))
        ir = fft_filter(ir, lo=180, hi=7000)
        ir[: int(predelay * SR)] = 0
        ir /= np.sqrt((ir ** 2).sum()) + 1e-9
        m = len(st) + n
        out_c = np.fft.irfft(np.fft.rfft(st[:, c], m) * np.fft.rfft(ir, m), m)[: len(st)]
        out[:, c] = st[:, c] + wet * out_c
    return out


def tail(sig, extra):  # pad so reverb can ring out
    return np.concatenate([sig, np.zeros((int(extra * SR),) + sig.shape[1:])])


# ---------------------------------------------------------------- variant A: Warm Scholar
def felt_piano(m, d=1.6, vel=1.0):
    f0 = midi(m); t = tt(d); x = np.zeros_like(t)
    for k in range(1, 9):
        fk = f0 * k * np.sqrt(1 + 0.0004 * k * k)
        if fk > 9000: break
        x += (0.9 ** k) / k ** 0.6 * np.sin(2 * np.pi * fk * t) * np.exp(-t * (1.2 + 0.9 * k))
    x *= np.minimum(1, t / 0.006)
    x = fft_filter(x, lo=60, hi=3500 + 2500 * vel)  # felt = soft top end
    return x * vel


def marimba(m, d=0.9, vel=1.0):
    f0 = midi(m); t = tt(d)
    x = (np.sin(2 * np.pi * f0 * t) * np.exp(-t / 0.35) + 0.35 * np.sin(2 * np.pi * f0 * 3.93 * t) * np.exp(-t / 0.06)
         + 0.12 * np.sin(2 * np.pi * f0 * 9.2 * t) * np.exp(-t / 0.02))
    click = fft_filter(rng.standard_normal(len(t)) * np.exp(-t / 0.003), lo=1500, hi=6000) * 0.15
    return (x + click) * np.minimum(1, t / 0.002) * vel


def bell(m, d=2.5, vel=1.0):
    f0 = midi(m); t = tt(d); x = np.zeros_like(t)
    for r, a, dec in [(1, 1, 1.6), (2.0, 0.5, 0.9), (2.76, 0.35, 0.7), (5.4, 0.18, 0.35), (8.93, 0.08, 0.2)]:
        x += a * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t / dec)
    return x * np.minimum(1, t / 0.003) * vel


def breath_swell(d=0.45, lo=600, hi=5000):
    t = tt(d); n = rng.standard_normal(len(t))
    env = (t / d) ** 2.2 * np.exp(-np.maximum(0, t - d * 0.9) / 0.04)
    return fft_filter(n, lo=lo, hi=hi) * env


def soft_swell(d=0.45, notes=(62, 69, 74)):
    """tonal rising swell (no noise): replaces the breathy swells the owner heard as hiss"""
    t = tt(d); x = sum(np.sin(2 * np.pi * midi(m) * t + i) for i, m in enumerate(notes))
    env = (t / d) ** 2.0 * np.exp(-np.maximum(0, t - d * 0.9) / 0.05)
    return fft_filter(x * env, lo=150, hi=4000) / len(notes)


def woodblock(m=93, d=0.12):
    f0 = midi(m); t = tt(d)
    x = np.sin(2 * np.pi * f0 * t) * np.exp(-t / 0.025) + 0.5 * np.sin(2 * np.pi * f0 * 2.1 * t) * np.exp(-t / 0.012)
    return x * np.minimum(1, t / 0.001)


def heartbeat(d=0.18, f=62):
    t = tt(d)
    return np.sin(2 * np.pi * (f + 25 * np.exp(-t / 0.02)) * t) * np.exp(-t / 0.06) * np.minimum(1, t / 0.003)


def pad(notes, d, attack=0.6, release=0.8, bright=1800):
    t = tt(d); x = np.zeros_like(t)
    for m in notes:
        for det in (-0.004, 0.0, 0.004):
            x += np.sin(2 * np.pi * midi(m) * (1 + det) * t + rng.uniform(0, 6.28))
    env = np.minimum(1, t / attack) * np.minimum(1, np.maximum(0, (d - t) / release))
    return fft_filter(x * env, lo=80, hi=bright) / (3 * len(notes))


def pad_st(notes, d, attack=0.6, release=0.8, bright=1800):
    """stereo pad: independent voices per side → wide but mono-compatible"""
    return np.stack([pad(notes, d, attack, release, bright), pad(notes, d, attack, release, bright)], 1)


def air(d, level=1.0):
    t = tt(d); env = np.minimum(1, t / 0.8) * np.minimum(1, (d - t) / 0.8).clip(0, 1)
    return np.stack([fft_filter(rng.standard_normal(len(t)), lo=7000, hi=15000) * env * level for _ in range(2)], 1)


def sub_thump(d=0.5, f=46):
    t = tt(d)
    return np.sin(2 * np.pi * (f + 40 * np.exp(-t / 0.03)) * t) * np.exp(-t / 0.18)


# ---------------------------------------------------------------- variant B: Decode Tech
def saw(m, d, harmonics=24, decay_scale=1.0, vel=1.0, detune=0.0):
    f0 = midi(m) * (1 + detune); t = tt(d); x = np.zeros_like(t)
    for k in range(1, harmonics + 1):
        if f0 * k > 12000: break
        x += np.sin(2 * np.pi * f0 * k * t) / k * np.exp(-t * decay_scale * (2 + 1.6 * k))
    return x * np.minimum(1, t / 0.002) * vel


def pluck(m, d=0.7, vel=1.0):
    return fft_filter(saw(m, d, 18, 1.0, vel) + 0.5 * saw(m + 12, d, 10, 1.6, vel), lo=120, hi=7000)


def ping(f=2100, d=0.09):
    t = tt(d)
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 1.5 * t)) * np.exp(-t / 0.018) * np.minimum(1, t / 0.0008)


def scramble(d=0.16, n=7):
    out = np.zeros(int(d * SR))
    for i in range(n):
        f = rng.uniform(700, 2600); L = int(rng.uniform(0.008, 0.02) * SR); s = int(rng.uniform(0, d - 0.025) * SR)
        t = np.arange(L) / SR
        b = np.sign(np.sin(2 * np.pi * f * t)) * np.exp(-t / 0.01) * 0.6
        out[s:s + L] += np.round(b * 6) / 6  # crushed
    return fft_filter(out, lo=400, hi=6500)


def down_blip(m=69, d=0.28):
    t = tt(d); f = midi(m) * 2 ** (-(t / d) * 0.4)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = (np.sin(ph) + 0.4 * np.sin(2 * ph) + 0.2 * np.sin(3 * ph)) * np.exp(-t / 0.09)
    return x * np.minimum(1, t / 0.002)


def sub_pulse(d, rate0=2.0, rate1=8.0, f=55):
    t = tt(d); rate = rate0 + (rate1 - rate0) * (t / d) ** 1.6
    gate = 0.5 + 0.5 * np.sign(np.sin(2 * np.pi * np.cumsum(rate) / SR))
    gate = np.convolve(gate, np.ones(240) / 240, "same")
    x = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2 * t)
    return x * gate * (0.4 + 0.6 * t / d)


def tonal_riser(d, m0=57, m1=69, bright=4000):
    t = tt(d); f = midi(m0) * 2 ** ((m1 - m0) / 12 * (t / d) ** 1.5)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum(np.sin(k * ph) / k for k in range(1, 7))
    return fft_filter(x, lo=150, hi=bright) * (t / d) ** 2


def supersaw_chord(notes, d=2.2, open_time=0.14):
    x = np.zeros(int(d * SR)); t = tt(d)
    for m in notes:
        for det in (-0.006, 0.0, 0.006):
            x += saw(m, d, 30, 0.12, 1.0, det)
    # "filter opening": blend from dark to bright over open_time
    dark = fft_filter(x, lo=80, hi=700); bright = fft_filter(x, lo=80, hi=9000)
    mix = np.minimum(1, t / open_time)
    return (dark * (1 - mix) + bright * mix) / (3 * len(notes)) * np.exp(-t / 1.4)


# ---------------------------------------------------------------- quiz-show tension (original; genre conventions only)
def string_ens(notes, d, attack=0.5, release=0.3, bright=2200, tremolo=0.0):
    """saw-ensemble 'strings': detuned voices per side, slow attack, optional tremolo"""
    t = tt(d)
    def side():
        x = np.zeros_like(t)
        for m in notes:
            for det in (-0.005, 0.0, 0.005):
                f0 = midi(m) * (1 + det + rng.uniform(-0.001, 0.001))
                for k in range(1, 14):
                    if f0 * k > 9000: break
                    x += np.sin(2 * np.pi * f0 * k * t + rng.uniform(0, 6.28)) / k
        return x
    env = np.minimum(1, t / attack) * np.minimum(1, np.maximum(0, (d - t) / release))
    trem = 1 - tremolo * 0.5 * (1 + np.sin(2 * np.pi * 9 * t))
    return np.stack([fft_filter(side() * env * trem, lo=70, hi=bright) for _ in range(2)], 1) / (3 * len(notes) * 4)


def timpani(f=55, d=0.9):
    t = tt(d)
    body = np.sin(2 * np.pi * (f + 18 * np.exp(-t / 0.05)) * t) * np.exp(-t / 0.35)
    skin = fft_filter(rng.standard_normal(len(t)) * np.exp(-t / 0.02), lo=80, hi=900) * 0.4
    return (body + skin) * np.minimum(1, t / 0.002)


def quiz_cue(sfx, bed, ev, th, q):
    """question sting → low tension drone under question/options → steady pulse + rising cluster in the countdown"""
    # sting when the question is asked: low timpani + minor string hit + sub
    sfx.add(stereo(timpani(46, 1.4), 0.0), q - 0.02, 0.75, name="quiz-sting")
    sfx.add(sub_thump(0.9, 38), q - 0.02, 0.55)
    sfx.add(reverb(tail(string_ens([50, 53, 57, 62], 1.4, 0.02, 1.0, 3000), 1.2), 2.2, 0.3), q, 0.55)
    # drone under question + options (minor, slightly dissonant), quiet; music bed stays out
    d1 = th["from"] - (q + 0.6)
    if d1 > 0.5:
        bed.add(string_ens([38, 45, 50, 51], d1 + 0.3, 0.8, 0.3, 1200), q + 0.6, 0.9, name=None)
    # countdown: steady 120-bpm pulse, rising tremolo cluster, ticks kept; hard stop at the end (stop-down)
    d = th["to"] - th["from"]
    for k in range(int(d / 0.5)):
        sfx.add(stereo(timpani(55 if k % 2 == 0 else 52, 0.45), 0.0), th["from"] + k * 0.5, 0.34 + 0.05 * k / max(1, d / 0.5))
    cl = string_ens([50, 51, 57, 62, 63], d, 0.6, 0.04, 3600, tremolo=0.8)
    cl *= np.linspace(0.35, 1.25, len(cl))[:, None]
    sfx.add(cl, th["from"], 0.7, name="quiz-tension")


# ---------------------------------------------------------------- build
def load_stereo(path, seconds):
    import subprocess
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vn", "-ac", "2", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True).stdout
    x = np.frombuffer(pcm, np.int16).astype(np.float64).reshape(-1, 2) / 32768
    out = np.zeros((int(seconds * SR), 2)); n = min(len(x), len(out)); out[:n] = x[:n]
    return out


def speech_gate(vo, attack=0.03, release=0.25, thresh_db=-42.0):
    """0..1 presence of speech from the voice stem (envelope follower), for sidechain ducking"""
    mono = np.abs(vo).mean(1)
    hop = 240
    env = np.sqrt(np.convolve(mono ** 2, np.ones(hop) / hop, "same"))[::hop]
    on = (20 * np.log10(env + 1e-9) > thresh_db).astype(float)
    g = np.zeros_like(on); a_c = np.exp(-hop / SR / attack); r_c = np.exp(-hop / SR / release)
    for i in range(1, len(on)):
        c = a_c if on[i] > g[i - 1] else r_c
        g[i] = c * g[i - 1] + (1 - c) * on[i]
    return np.repeat(g, hop)[: len(mono)]


def build(variant, ev, out_dir, vo_path=None, think="default", bed_tension=False):
    T = ev["total"]
    sfx, bed = Track(T + 3), Track(T + 3)
    tens = bed if bed_tension else sfx  # tension layers (pulse/pad/drone) — on the bed when the template owns the event SFX
    th, el = ev["phases"]["think"], ev["phases"]["eliminate"]
    reveal, outro_logo = ev["reveal"], ev["outroLines"][1]
    A = variant in ("A", "D")        # warm vs tech for logo, question, options, think, strikes
    W = variant in ("A", "C", "D")   # warm explanation, post-reveal bed, resolve
    RA = variant == "A"              # reveal: warm chord (A) or B's filter-opening reveal (B, C, D)
    inst = felt_piano if A else pluck

    # 1 · opening logo (motif, fast) — sounds within 0.05 s
    logo = np.zeros(int(1.6 * SR))
    for i, m in enumerate(MOTIF):
        n = (marimba(m, 1.0, 0.9) if A else pluck(m, 0.9, 0.9))
        s = int(i * 0.085 * SR); logo[s:s + len(n)] += n[: len(logo) - s]
    logo_st = reverb(tail(stereo(logo, 0.0), 0.8), 1.4, 0.22 if A else 0.16)
    sfx.add(logo_st, 0.02, 0.55, name="logo-open")
    sfx.add(sub_thump(0.5, 44 if A else 40), 0.02, 0.5, name="sub")
    sfx.add(stereo(bell(86, 1.5, 0.25) if A else ping(2600, 0.2), 0.3), 0.36, 0.5)

    # 2 · question enters: swell into a 2-note fragment of the motif
    q = ev["questionIn"]
    sfx.add(stereo(soft_swell(0.42) if A else tonal_riser(0.4, 69, 81, 6000), 0.0), q - 0.42, 0.2 if A else 0.16, name="question-swell")
    for i, m in enumerate(MOTIF[:2]):
        sfx.add(reverb(tail(stereo(inst(m, 1.0, 0.55), -0.2 + 0.4 * i), 0.6), 1.2, 0.2), q + 0.02 + i * 0.11, 0.45)

    # 3 · options: one rising scale note each (tuned, quiet), panned across
    for i, at in enumerate(ev["optionIn"]):
        n = marimba(OPTION_NOTES[i], 0.6, 0.6) if A else pluck(OPTION_NOTES[i], 0.5, 0.6)
        sfx.add(stereo(n, -0.45 + 0.3 * i), at, 0.42, name=f"option-{i}")

    # 4 · think: ticks + accelerating pulse + riser, hard stop (intentional silence before the first strike)
    d = th["to"] - th["from"]
    for k, at in enumerate(ev["thinkTicks"]):
        sfx.add(stereo(woodblock(93 + 2 * k) if A else ping(2000 + 220 * k), 0.15 * (-1) ** k), at, 0.5, name="tick")
    if think == "quiz":
        quiz_cue(sfx, bed, ev, th, ev["questionIn"])
    elif A:
        beats, x = [], 0.0
        while x < d - 0.2:
            beats.append(x); x += 0.62 - 0.4 * (x / d)
        for b in beats:
            tens.add(heartbeat(), th["from"] + b, 0.55); tens.add(heartbeat(0.14, 58), th["from"] + b + 0.13, 0.35)
        tens.add(stereo(pad([57, 64, 69], d, 0.5, 0.05, 2600) * np.linspace(0.3, 1.2, int(d * SR)), 0.0), th["from"], 0.5, name="tension-pad")
    else:
        sfx.add(stereo(sub_pulse(d), 0.0), th["from"], 0.5, name="sub-pulse")
        sfx.add(stereo(tonal_riser(d, 57, 69), 0.0), th["from"], 0.18, name="riser")

    # 5 · eliminate: strikes step UP (tension builds toward the reveal); low drone under, cut 0.35 s before reveal
    for k, at in enumerate(ev["strike"]):
        if A:
            hit = marimba(69 + 2 * k, 0.7, 0.8) * 0.7 + marimba(66 + 2 * k, 0.7, 0.6) * 0.5
            sfx.add(stereo(hit, 0.1), at, 0.5, name=f"strike-{k}")
            sfx.add(heartbeat(0.2, 70), at, 0.4)
        else:
            sfx.add(stereo(scramble(), (-0.3, 0.3, 0.0)[k % 3]), at - 0.02, 0.42, name=f"strike-{k}")
            sfx.add(stereo(down_blip(69 + 2 * k), 0.0), at + 0.04, 0.38)
    drone_from, drone_to = el["from"] + 0.15, reveal - 0.35
    if drone_to > drone_from:
        dd = drone_to - drone_from
        dr = pad([38, 45, 50], dd, 0.4, 0.06, 900 if A else 600) if A else fft_filter(sub_pulse(dd, 3, 3, 49), hi=400)
        tens.add(stereo(dr, 0.0), drone_from, 0.55 if A else 0.35, name="drone")

    # 6 · reveal: the loudest moment
    if RA:
        chord = sum(felt_piano(m, 2.6, 0.9) for m in [50, 62, 66, 69, 76])
        rv = reverb(tail(stereo(chord, 0.0), 1.2), 2.0, 0.28)
        sfx.add(rv, reveal, 0.42, name="reveal")
        sfx.add(reverb(tail(stereo(bell(86, 2.4, 0.7), 0.25), 1.0), 2.0, 0.3), reveal + 0.02, 0.4)
        sfx.add(sub_thump(0.7, 42), reveal, 0.7)
    else:
        ch_l, ch_r = supersaw_chord([50, 62, 66, 69, 74, 76]), supersaw_chord([50, 62, 66, 69, 74, 76])
        sfx.add(reverb(tail(np.stack([ch_l, ch_r], 1), 0.8), 1.4, 0.24), reveal, 0.62, name="reveal")
        for i, m in enumerate([74, 78, 81, 86]):
            sfx.add(stereo(pluck(m, 0.4, 0.6), -0.4 + 0.27 * i), reveal + 0.05 + i * 0.06, 0.32)
        sfx.add(sub_thump(0.7, 38), reveal, 0.75)

    # 7 · analysis steps spell the motif (clue → rule → meaning)
    for i, at in enumerate(ev["ruleSteps"]):
        sfx.add(reverb(tail(stereo((felt_piano if W else pluck)(MOTIF[i], 1.2, 0.6), (-0.25, 0.25, 0.0)[i]), 0.8), 1.4, 0.24 if W else 0.22), at, 0.42, name=f"analysis-{i}")

    # 8 · end logo: full motif + resolve
    sfx.add(stereo(soft_swell(0.4, (57, 62, 69)) if W else tonal_riser(0.4, 62, 74, 5000), 0.0), ev["outroFrom"] - 0.4, 0.16, name="outro-swell")
    end = np.zeros(int(2.4 * SR))
    for i, m in enumerate(MOTIF):
        n = inst(m, 2.0, 0.8); s = int(i * 0.16 * SR); end[s:s + len(n)] += n[: len(end) - s]
    res = sum((felt_piano if W else pluck)(m, 2.2, 0.6) for m in [50, 62, 69])
    s = int(0.64 * SR); end[s:s + len(res)] += res[: len(end) - s] * 0.8
    sfx.add(reverb(tail(stereo(end, 0.0), 1.0), 1.8, 0.26), outro_logo, 0.3, name="end-logo")
    if not A:
        sfx.add(sub_thump(0.6, 40), outro_logo + 0.64, 0.28)

    # ------------------------------------------------ music bed with sections (follows the drama)
    prog = [[62, 66, 69], [59, 62, 66], [55, 59, 62], [57, 61, 64]]  # D Bm G A
    bar = 60 / 84 * 4
    t0, t_stop = 1.0, th["from"]
    def bed_chords(start, stop, level, bright, octave=0, warm=A):
        k, t = 0, start
        while t < stop - 0.2:
            ch = [m + octave for m in prog[k % 4]]; dur = min(bar, stop - t)
            if warm:
                for j, m in enumerate(ch + [ch[0] + 12]):  # broken felt-piano chord
                    bed.add(stereo(felt_piano(m, 1.8, 0.45), -0.3 + 0.2 * j), t + j * bar / 8, level * 0.5)
                bed.add(pad_st([m - 12 for m in ch], dur + 0.3, 0.4, 0.4, bright), t, level)
            else:
                for j in range(int(dur / (bar / 8))):
                    bed.add(stereo(fft_filter(saw(ch[0] - 24, 0.18, 12, 2.2, 0.7), hi=900), 0.0), t + j * bar / 8, level * 0.7)
                bed.add(pad_st(ch, dur + 0.3, 0.3, 0.4, bright), t, level * 0.9)
            k += 1; t += bar
    if think != "quiz":
        bed_chords(t0, t_stop - 0.1, 0.55, 1600)                   # question / options: present but calm
    bed_chords(reveal + 0.25, outro_logo + 0.3, 0.5 if variant == "C" else 0.62, 2600, 12 if W else 0, warm=W)  # after the reveal; C = calm, warm
    bed.add(pad_st([50, 57, 62, 66], 2.4, 0.3, 1.4, 2200), outro_logo + 0.4, 0.45)  # resolve under the logo
    # (no "air" noise layer: removed in round 4 — the owner heard it as hiss)

    # ------------------------------------------------ mix + write
    L = int((T + 0.05) * SR)
    s_st, b_st = sfx.buf[:L], bed.buf[:L]
    if vo_path:
        vo = load_stereo(vo_path, L / SR)
        g = speech_gate(vo)[:, None]
        s_st = s_st * (1 - 0.37 * g)        # ≈ −4 dB
        b_st = b_st * (1 - 0.65 * g)        # ≈ −9 dB
        mix = s_st + 0.85 * b_st + vo
        write(os.path.join(out_dir, "vo.wav"), vo)
    else:
        mix = s_st + 0.85 * b_st
    fade = np.minimum(1, (T - np.arange(L) / SR) / 0.6).clip(0, 1)[:, None]
    mix *= fade
    for name, x, norm in [("sfx", s_st, False), ("bed", b_st, False), ("mix", mix, True)]:
        y = x.copy()
        peak = np.abs(y).max() + 1e-9
        y = np.tanh(y / peak * 1.2) / np.tanh(1.2) * 0.84 if norm else y / max(1.0, peak / 0.84)
        write(os.path.join(out_dir, f"{name}.wav"), y)
    json.dump({"variant": variant, "events": sfx.log}, open(os.path.join(out_dir, "cues.json"), "w"), indent=1)
    # kit (individual elements, for the template later)
    kit = os.path.join(out_dir, "kit"); os.makedirs(kit, exist_ok=True)
    write(os.path.join(kit, "logo-open.wav"), logo_st / (np.abs(logo_st).max() + 1e-9) * 0.84)


def write(path, st):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(st, -1, 1) * 32767).astype(np.int16).tobytes())


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--variant", choices=["A", "B", "C", "D"], required=True)
    ap.add_argument("--vo", default=None, help="voice stem (wav/mp4 audio) to duck under and mix in")
    ap.add_argument("--think", choices=["default", "quiz"], default="default", help="quiz = original game-show tension cue")
    ap.add_argument("--bed-tension", action="store_true", help="put think tension + elimination drone on bed.wav (template plays the event SFX kit)")
    ap.add_argument("--events", required=True)
    ap.add_argument("--out-dir", required=True)
    a = ap.parse_args()
    build(a.variant, json.load(open(a.events)), a.out_dir, a.vo, a.think, a.bed_tension)
    print(f"variant {a.variant} → {a.out_dir}")
