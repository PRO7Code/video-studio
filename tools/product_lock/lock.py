#!/usr/bin/env python3
"""Product / logo lock: keep the real product pixels after an AI environment change.

AI video-edit models re-render the whole frame, so text and logos drift. For a locked-off shot (tripod),
we paste the ORIGINAL product region back over the generated video with a feathered mask, then
colour-match it to the new scene's light so it sits in the new environment.

  lock.py check     ORIG GEN  --mask mask.json            # drift score of the product region (before locking)
  lock.py composite ORIG GEN  --mask mask.json --out OUT  [--match 0.6] [--feather 25]
  lock.py preview   VIDEO     --mask mask.json --out mask_preview.png   # draw the mask on a frame to verify

mask.json (normalised 0..1 coords, polygon; optional keyframes for slow camera moves):
  {"polygon": [[x,y],...]}            or
  {"keys": [{"t": 0.0, "polygon": [...]}, {"t": 4.8, "polygon": [...]}]}

Limits: hands or people passing IN FRONT of the product break a static mask (they would be cut off);
those frames need a tracked/segmented mask instead (see references/product-lock.md).
"""
import argparse, json, subprocess, sys
import numpy as np


def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=width,height,r_frame_rate", "-of", "json", path], capture_output=True, text=True).stdout
    s = json.loads(out)["streams"][0]
    n, d = s["r_frame_rate"].split("/")
    return s["width"], s["height"], float(n) / float(d)


def frames(path, w, h, fps):
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", path, "-vf", f"scale={w}:{h},fps={fps}", "-f", "rawvideo",
                          "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    size = w * h * 3
    while True:
        b = p.stdout.read(size)
        if len(b) < size:
            break
        yield np.frombuffer(b, np.uint8).reshape(h, w, 3)
    p.wait()


def poly_at(spec, t):
    if "polygon" in spec:
        return np.array(spec["polygon"], float)
    keys = spec["keys"]
    if t <= keys[0]["t"]:
        return np.array(keys[0]["polygon"], float)
    for a, b in zip(keys, keys[1:]):
        if a["t"] <= t <= b["t"]:
            u = (t - a["t"]) / max(1e-6, b["t"] - a["t"])
            return (1 - u) * np.array(a["polygon"], float) + u * np.array(b["polygon"], float)
    return np.array(keys[-1]["polygon"], float)


def raster(poly, w, h):
    """even-odd polygon fill, vectorised over rows"""
    pts = poly * [w, h]
    yy, xx = np.mgrid[0:h, 0:w]
    inside = np.zeros((h, w), bool)
    j = len(pts) - 1
    for i in range(len(pts)):
        xi, yi = pts[i]; xj, yj = pts[j]
        cond = ((yi > yy) != (yj > yy)) & (xx < (xj - xi) * (yy - yi) / (yj - yi + 1e-9) + xi)
        inside ^= cond
        j = i
    return inside.astype(np.float32)


def blur(m, r):
    if r <= 0:
        return m
    k = np.ones(r) / r
    m = np.apply_along_axis(lambda v: np.convolve(v, k, "same"), 1, m)
    return np.apply_along_axis(lambda v: np.convolve(v, k, "same"), 0, m)


def ssim(a, b, win=8):
    """mean SSIM over win x win blocks (catches blur / lost lettering that a global SSIM hides)"""
    a = a.astype(np.float64); b = b.astype(np.float64)
    hh, ww = (a.shape[0] // win) * win, (a.shape[1] // win) * win
    A = a[:hh, :ww].reshape(hh // win, win, ww // win, win).transpose(0, 2, 1, 3).reshape(-1, win * win)
    B = b[:hh, :ww].reshape(hh // win, win, ww // win, win).transpose(0, 2, 1, 3).reshape(-1, win * win)
    c1, c2 = (0.01 * 255) ** 2, (0.03 * 255) ** 2
    ma, mb = A.mean(1), B.mean(1); va, vb = A.var(1), B.var(1)
    cov = ((A - ma[:, None]) * (B - mb[:, None])).mean(1)
    return float((((2 * ma * mb + c1) * (2 * cov + c2)) / ((ma ** 2 + mb ** 2 + c1) * (va + vb + c2))).mean())


def bbox(mask):
    ys, xs = np.where(mask > 0.5)
    return ys.min(), ys.max() + 1, xs.min(), xs.max() + 1


def cmd_check(a):
    w, h, fps = probe(a.orig)
    spec = json.load(open(a.mask))
    scores, cdiff = [], []
    for i, (fo, fg) in enumerate(zip(frames(a.orig, w, h, fps), frames(a.gen, w, h, fps))):
        m = raster(poly_at(spec, i / fps), w, h)
        y0, y1, x0, x1 = bbox(m)
        po, pg = fo[y0:y1, x0:x1].astype(np.float64), fg[y0:y1, x0:x1].astype(np.float64)
        scores.append(ssim(po.mean(2), pg.mean(2)))
        cdiff.append(float(np.abs(po.mean((0, 1)) - pg.mean((0, 1))).max()))
    s, c = np.array(scores), np.array(cdiff)
    # structure (shape/lettering) decides the verdict; colour shift is reported separately because
    # a deliberate relight is expected after an environment change
    verdict = "OK" if s.min() >= 0.80 else ("DRIFT" if s.min() >= 0.55 else "BROKEN")
    print(json.dumps({"frames": len(s), "ssim_mean": round(float(s.mean()), 3), "ssim_min": round(float(s.min()), 3),
                      "worst_frame": int(s.argmin()), "max_color_shift": round(float(c.max()), 1), "verdict": verdict}))


def match_color(src, ref_ring, strength):
    """shift src region's per-channel mean/std toward the new scene's light (ring around the product)"""
    out = src.astype(np.float32)
    for c in range(3):
        ms, ss = out[..., c].mean(), out[..., c].std() + 1e-6
        mr, sr = ref_ring[:, c].mean(), ref_ring[:, c].std() + 1e-6
        tgt = (out[..., c] - ms) * (1 + strength * (sr / ss - 1)) + ms + strength * (mr - ms) * 0.5
        out[..., c] = tgt
    return np.clip(out, 0, 255)


def cmd_composite(a):
    w, h, fps = probe(a.orig)
    spec = json.load(open(a.mask))
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w}x{h}", "-r", str(fps),
                            "-i", "-", "-i", a.gen, "-map", "0:v", "-map", "1:a?", "-c:v", "libx264", "-crf", "14", "-preset", "slow",
                            "-pix_fmt", "yuv420p", "-c:a", "copy", "-shortest", a.out], stdin=subprocess.PIPE)
    cache = None
    for i, (fo, fg) in enumerate(zip(frames(a.orig, w, h, fps), frames(a.gen, w, h, fps))):
        poly = poly_at(spec, i / fps)
        if cache is None or "keys" in spec:
            hard = raster(poly, w, h)
            soft = blur(hard, a.feather)[..., None]
            ring = (blur(hard, a.feather * 3) > 0.05) & (hard < 0.5)
            cache = (hard, soft, ring)
        hard, soft, ring = cache
        prod = match_color(fo, fg[ring], a.match) if a.match > 0 else fo
        out = fg * (1 - soft) + prod * soft
        enc.stdin.write(out.astype(np.uint8).tobytes())
    enc.stdin.close(); enc.wait()
    print(f"saved {a.out}")


def cmd_preview(a):
    w, h, fps = probe(a.video)
    f = next(frames(a.video, w, h, fps)).copy()
    m = raster(poly_at(json.load(open(a.mask)), 0), w, h)
    f[m > 0.5] = (f[m > 0.5] * 0.5 + np.array([46, 230, 197]) * 0.5).astype(np.uint8)
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w}x{h}", "-i", "-", a.out], stdin=subprocess.PIPE)
    p.communicate(f.tobytes())
    print(f"saved {a.out}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("check"); c.add_argument("orig"); c.add_argument("gen"); c.add_argument("--mask", required=True)
    k = sub.add_parser("composite"); k.add_argument("orig"); k.add_argument("gen"); k.add_argument("--mask", required=True)
    k.add_argument("--out", required=True); k.add_argument("--match", type=float, default=0.6); k.add_argument("--feather", type=int, default=25)
    p = sub.add_parser("preview"); p.add_argument("video"); p.add_argument("--mask", required=True); p.add_argument("--out", required=True)
    a = ap.parse_args()
    {"check": cmd_check, "composite": cmd_composite, "preview": cmd_preview}[a.cmd](a)


if __name__ == "__main__":
    main()
