"""Procedural sound-effects kit for the reel (all original, generated with code).
Usage: python tools/make_sfx.py public/sfx"""
import numpy as np, wave, sys, os
SR = 44100
rng = np.random.default_rng(11)
out = sys.argv[1]

def save(name, x, stereo=None):
    x = np.asarray(x, dtype=np.float64)
    if stereo is None:
        st = np.stack([x, x], 1)
    else:
        st = stereo
    peak = np.abs(st).max() or 1
    st = st / peak * 0.89
    with wave.open(os.path.join(out, name + ".wav"), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype(np.int16).tobytes())

def svf_bandpass(x, fc, q):
    """time-varying state-variable band-pass; fc may be an array"""
    fc = np.broadcast_to(fc, x.shape)
    low = band = 0.0
    y = np.empty_like(x)
    damp = 1.0 / q
    for i in range(len(x)):
        f = 2 * np.sin(np.pi * min(fc[i], SR / 6) / SR)
        high = x[i] - low - damp * band
        band += f * high
        low += f * band
        y[i] = band
    return y

def t(d): return np.arange(int(d * SR)) / SR

# whoosh: noise through a sweeping band-pass, swelling then fading, panning across
def whoosh(d, f0, f1, q=2.5, peak=0.55):
    tt = t(d); n = len(tt)
    fc = f0 * (f1 / f0) ** (tt / d)
    x = svf_bandpass(rng.standard_normal(n), fc, q)
    env = np.where(tt < peak * d, (tt / (peak * d)) ** 2, np.exp(-(tt - peak * d) / (0.18 * d)))
    x *= env
    pan = np.linspace(-0.7, 0.7, n)
    return x, np.stack([x * np.sqrt((1 - pan) / 2), x * np.sqrt((1 + pan) / 2)], 1)

x, st = whoosh(0.75, 250, 3200); save("whoosh", x, st)
x, st = whoosh(0.6, 400, 1800, q=1.6, peak=0.6); save("whoosh-soft", x * 0.8, st * 0.8)
x, st = whoosh(0.35, 900, 5000, q=2.0, peak=0.4); save("swish", x, st)

# pop: pitch-dropping sine blip with a tiny click
def pop(f0, f1, d=0.09):
    tt = t(d); f = f1 + (f0 - f1) * np.exp(-tt / 0.018)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.03)
    s[:40] += rng.standard_normal(40) * np.linspace(0.6, 0, 40)
    return s
save("pop", pop(1100, 380))
save("pop-low", pop(700, 220, 0.12))

# tick: short bright UI tick
tt = t(0.03); save("tick", svf_bandpass(rng.standard_normal(len(tt)), 3500, 6) * np.exp(-tt / 0.006))

# hit: soft sub impact with airy tail (for the AI Agent node / opening)
tt = t(1.2)
sub = np.sin(2 * np.pi * np.cumsum(42 + 90 * np.exp(-tt / 0.05)) / SR) * np.exp(-tt / 0.35)
air = svf_bandpass(rng.standard_normal(len(tt)), 1200, 0.8) * np.exp(-tt / 0.12) * 0.5
save("hit", sub + air)

# scan: gentle rising glide (highlight box drawing)
tt = t(0.7); f = 500 * (2200 / 500) ** (tt / 0.7)
s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / 0.7) ** 2 * (0.75 + 0.25 * np.sin(2 * np.pi * 18 * tt))
save("scan", s)

# key clicks: four variations of a mechanical keystroke
for k in range(4):
    tt = t(0.06)
    clack = svf_bandpass(rng.standard_normal(len(tt)), 2500 + 600 * k, 3) * np.exp(-tt / 0.008)
    thock = np.sin(2 * np.pi * (160 + 25 * k) * tt) * np.exp(-tt / 0.02) * 0.5
    save(f"key{k + 1}", clack + thock)
print("ok")
