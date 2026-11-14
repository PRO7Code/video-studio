#!/usr/bin/env python3
"""Original, licence-free music bed for educational videos (warm pad + soft pluck + light pulse).
  python -I tools/audio/compose_bed.py out.wav --seconds 33 [--bpm 96] [--seed 3]
Sits under a voice-over: no impacts, gentle dynamics, fades in/out. Peak-normalised to -3 dBFS."""
import argparse, wave
import numpy as np

ap = argparse.ArgumentParser(); ap.add_argument("out"); ap.add_argument("--seconds", type=float, required=True)
ap.add_argument("--bpm", type=float, default=96); ap.add_argument("--seed", type=int, default=3)
a = ap.parse_args()
SR = 44100; N = int(a.seconds * SR); t = np.arange(N) / SR; beat = 60 / a.bpm
rng = np.random.default_rng(a.seed)
L = np.zeros(N); R = np.zeros(N)
midi = lambda m: 440 * 2 ** ((m - 69) / 12)
chords = [[60, 64, 67, 72], [55, 59, 62, 67], [57, 60, 64, 69], [53, 57, 60, 65]]  # C G Am F
bar = 4 * beat
# pad
for k in range(int(a.seconds / (2 * bar)) + 1):
    ch = chords[k % 4]; s0 = k * 2 * bar; n = int((2 * bar + 0.8) * SR); tt = np.arange(n) / SR
    env = np.minimum(1, tt / 0.8) * np.minimum(1, np.maximum(0, (2 * bar + 0.8 - tt) / 1.0))
    sig = sum(np.sin(2 * np.pi * midi(m - 12) * tt * (1 + d)) for m in ch for d in (-0.002, 0.002)) * env
    i = int(s0 * SR); j = min(N, i + n)
    if i < N:
        L[i:j] += sig[: j - i] * 0.035; R[i:j] += sig[: j - i] * 0.035
# soft pluck arpeggio (8ths)
for e in range(int(a.seconds / (beat / 2))):
    st = e * beat / 2; ch = chords[int(st // (2 * bar)) % 4]; m = ch[[0, 2, 1, 3][e % 4]]
    n = int(0.4 * SR); tt = np.arange(n) / SR
    sig = (np.sin(2 * np.pi * midi(m) * tt) + 0.25 * np.sin(2 * np.pi * midi(m) * 2 * tt)) * np.exp(-tt / 0.12)
    pan = 0.35 * np.sin(e * 0.9); i = int(st * SR); j = min(N, i + n)
    if i < N:
        L[i:j] += sig[: j - i] * 0.03 * (1 - pan); R[i:j] += sig[: j - i] * 0.03 * (1 + pan)
# light pulse (soft kick + shaker) after the first 2 bars
for b in range(int(2 * bar / beat), int(a.seconds / beat)):
    st = b * beat; n = int(0.25 * SR); tt = np.arange(n) / SR
    k = np.sin(2 * np.pi * (50 + 60 * np.exp(-tt / 0.03)) * tt) * np.exp(-tt / 0.09)
    i = int(st * SR); j = min(N, i + n)
    if i < N:
        L[i:j] += k[: j - i] * 0.12; R[i:j] += k[: j - i] * 0.12
    sh = np.diff(rng.standard_normal(int(0.05 * SR)), prepend=0) * np.exp(-np.arange(int(0.05 * SR)) / SR / 0.012)
    i2 = int((st + beat / 2) * SR); j2 = min(N, i2 + len(sh))
    if i2 < N:
        L[i2:j2] += sh[: j2 - i2] * 0.012; R[i2:j2] += sh[: j2 - i2] * 0.012
fade = np.minimum(1, t / 1.0) * np.minimum(1, np.maximum(0, (a.seconds - t) / 2.0))
L *= fade; R *= fade
peak = max(np.abs(L).max(), np.abs(R).max()) or 1
st = np.stack([L, R], 1) / peak * 0.7
with wave.open(a.out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype(np.int16).tobytes())
print(f"bed {a.seconds:.1f}s → {a.out}")
